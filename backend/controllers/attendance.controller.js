import { z } from "zod";
import ai from "../config/gemini.js";
import AttendanceRecord from "../models/attendanceRecord.model.js";
import AttendanceSession from "../models/attendanceSession.model.js";
import User from "../models/user.model.js";
import { randomToken } from "../utils/random.js";

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const r = (d) => (d * Math.PI) / 180;
  const dLat = r(lat2 - lat1);
  const dLng = r(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r(lat1)) *
      Math.cos(r(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function normalizeSession(session) {
  if (!session) return session;
  const plain = typeof session.toObject === "function" ? session.toObject() : session;
  return { ...plain, token: plain.qrToken };
}

const startSchema = z.object({
  course: z.string().min(2, "Course name required"),
  dept: z.string().optional(),
  section: z.string().optional(),
  semester: z.number().int().min(0).max(8).optional(),
  year: z.number().int().min(1).max(6).optional(),
  ttlMinutes: z.number().int().min(1).max(120).optional(),
  classroomLat: z.number().optional(),
  classroomLng: z.number().optional(),
  classroomRadiusMeters: z.number().min(10).max(5000).optional(),
  classroomLabel: z.string().optional(),
  locationCheckEnabled: z.boolean().optional(),
});

const markSchema = z.object({
  qrToken: z.string().min(6, "Invalid QR token"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  accuracy: z.number().optional(),
  deviceFingerprint: z.string().optional(),
  deviceInfo: z.string().optional(),
});

export async function startSession(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const parsed = startSchema.safeParse({
      ...req.body,
      semester:
        req.body.semester != null && req.body.semester !== ""
          ? Number(req.body.semester)
          : undefined,
      year:
        req.body.year != null && req.body.year !== ""
          ? Number(req.body.year)
          : undefined,
      ttlMinutes:
        req.body.ttlMinutes != null
          ? Number(req.body.ttlMinutes)
          : undefined,
      classroomLat:
        req.body.classroomLat != null
          ? Number(req.body.classroomLat)
          : undefined,
      classroomLng:
        req.body.classroomLng != null
          ? Number(req.body.classroomLng)
          : undefined,
      classroomRadiusMeters:
        req.body.classroomRadiusMeters != null
          ? Number(req.body.classroomRadiusMeters)
          : undefined,
    });

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues?.[0]?.message || "Invalid input",
      });
    }

    const {
      course,
      dept = "",
      section = "",
      semester = 0,
      year = 1,
      ttlMinutes = 10,
      classroomLat,
      classroomLng,
      classroomRadiusMeters = 100,
      classroomLabel = "",
      locationCheckEnabled = false,
    } = parsed.data;

    const hasGPS = classroomLat != null && classroomLng != null;

    const session = await AttendanceSession.create({
      course: course.trim(),
      dept: dept.trim().toUpperCase(),
      section: section.trim().toUpperCase(),
      semester,
      year,
      startedBy: req.user._id,
      qrToken: randomToken(16),
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
      classroomLocation: hasGPS
        ? {
            lat: classroomLat,
            lng: classroomLng,
            radiusMeters: classroomRadiusMeters,
            label: classroomLabel,
          }
        : {
            lat: null,
            lng: null,
            radiusMeters: 100,
            label: "",
          },
      locationCheckEnabled: hasGPS ? locationCheckEnabled : false,
    });

    return res.status(201).json({
      ok: true,
      session: normalizeSession(session),
    });
  } catch (err) {
    console.error("START SESSION ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function markAttendance(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const parsed = markSchema.safeParse({
      ...req.body,
      lat: req.body.lat != null ? Number(req.body.lat) : undefined,
      lng: req.body.lng != null ? Number(req.body.lng) : undefined,
      accuracy: req.body.accuracy != null ? Number(req.body.accuracy) : undefined,
    });

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues?.[0]?.message || "Invalid token",
      });
    }

    const {
      qrToken,
      lat,
      lng,
      accuracy,
      deviceFingerprint,
      deviceInfo,
    } = parsed.data;

    const session = await AttendanceSession.findOne({ qrToken: qrToken.trim() });

    if (!session) {
      return res.status(404).json({
        ok: false,
        error: "Invalid QR code. Session not found.",
      });
    }

    if (session.expiresAt < new Date()) {
      return res.status(410).json({
        ok: false,
        error: "QR code expired. Ask your teacher to generate a new one.",
      });
    }

    const student = req.user;

    if (
      session.dept &&
      session.dept !== student.dept?.toUpperCase()
    ) {
      return res.status(403).json({
        ok: false,
        error: `This attendance is for ${session.dept} only.`,
      });
    }

    if (
      session.section &&
      session.section !== student.section?.toUpperCase()
    ) {
      return res.status(403).json({
        ok: false,
        error: `This attendance is for Section ${session.section} only.`,
      });
    }

    if (
      session.semester &&
      session.semester > 0 &&
      session.semester !== Number(student.semester)
    ) {
      return res.status(403).json({
        ok: false,
        error: `This attendance is for Semester ${session.semester} only.`,
      });
    }

    const hasStudentGPS = lat != null && lng != null;
    const hasClassroomGPS =
      session.classroomLocation?.lat != null &&
      session.classroomLocation?.lng != null;

    let distanceMeters = null;
    let locationFlagged = false;
    let flagReason = "";

    if (session.locationCheckEnabled) {
      if (!hasStudentGPS) {
        return res.status(403).json({
          ok: false,
          error: "Location is required for this attendance session.",
        });
      }

      // allow weak GPS but compensate using accuracy
      const radius = session.classroomLocation?.radiusMeters || 80;

// effective allowed range
      const allowedDistance = radius + (accuracy || 0);

        if (distanceMeters > allowedDistance) {
          return res.status(403).json({
            ok: false,
            error: `You are outside classroom range`
          });
        }
      if (hasClassroomGPS) {
        distanceMeters = haversineMeters(
          session.classroomLocation.lat,
          session.classroomLocation.lng,
          lat,
          lng
        );

        const radius = session.classroomLocation.radiusMeters || 100;

        if (distanceMeters > radius) {
          return res.status(403).json({
            ok: false,
            error: `You are outside the classroom range (${distanceMeters}m away, limit ${radius}m).`,
          });
        }
      }
    }

    let proxyFlagged = false;

    if (deviceFingerprint) {
      const sameDevice = await AttendanceRecord.findOne({
        session: session._id,
        deviceFingerprint,
        student: { $ne: student._id },
      }).populate("student", "name rollNo");

      if (sameDevice) {
        proxyFlagged = true;
        const existingStudent = sameDevice.student?.name || "another student";
        flagReason = `Same device used by ${existingStudent} — possible proxy attendance`;
        locationFlagged = true;
      }
    }

    try {
      await AttendanceRecord.create({
        session: session._id,
        student: student._id,
        studentLocation: hasStudentGPS
          ? { lat, lng }
          : { lat: null, lng: null },
        distanceMeters,
        locationFlagged,
        flagReason,
        deviceFingerprint: deviceFingerprint || null,
        deviceInfo: deviceInfo || null,
        proxyFlagged,
      });

      return res.json({
        ok: true,
        marked: true,
        sessionId: session._id,
        locationFlagged,
        proxyFlagged,
        distanceMeters,
        flagReason,
      });
    } catch {
      return res.json({
        ok: true,
        alreadyMarked: true,
        sessionId: session._id,
      });
    }
  } catch (err) {
    console.error("MARK ATTENDANCE ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function getFraudReport(req, res) {
  try {
    const { sessionId } = req.params;
    const session = await AttendanceSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ ok: false, error: "Session not found" });
    }

    if (
      req.user.role !== "ADMIN" &&
      String(session.startedBy) !== String(req.user._id)
    ) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const records = await AttendanceRecord.find({ session: sessionId })
      .populate("student", "name rollNo dept section semester")
      .sort({ markedAt: 1 });

    const flagged = records.filter(
      (record) => record.locationFlagged || record.proxyFlagged
    );
    const total = records.length;

    const rapidPairs = [];
    for (let i = 0; i < records.length - 1; i++) {
      const diff = Math.abs(
        new Date(records[i + 1].markedAt) - new Date(records[i].markedAt)
      );
      if (diff < 2000) {
        rapidPairs.push(
          `${records[i].student?.name} & ${records[i + 1].student?.name} (${diff}ms apart)`
        );
      }
    }

    const fingerprintMap = {};
    records.forEach((record) => {
      if (!record.deviceFingerprint) return;
      if (!fingerprintMap[record.deviceFingerprint]) {
        fingerprintMap[record.deviceFingerprint] = [];
      }
      fingerprintMap[record.deviceFingerprint].push(
        record.student?.name || "Unknown"
      );
    });

    const deviceDuplicates = Object.entries(fingerprintMap)
      .filter(([, names]) => names.length > 1)
      .map(
        ([fingerprint, names]) =>
          `Device ${fingerprint.slice(0, 8)}… used by: ${names.join(", ")}`
      );

    if (
      flagged.length === 0 &&
      rapidPairs.length === 0 &&
      deviceDuplicates.length === 0
    ) {
      return res.json({
        ok: true,
        total,
        flaggedCount: 0,
        rapidPairs: [],
        deviceDuplicates: [],
        flagged: [],
        aiAnalysis: "Risk: LOW\nReason: No suspicious attendance pattern found.\nAction: No action needed.",
      });
    }

    let aiAnalysis = "Risk: REVIEW\nReason: Suspicious attendance pattern found.\nAction: Check flagged records manually.";

    if (process.env.GEMINI_API_KEY) {
      const flaggedData = flagged.map((record) => ({
        student: record.student?.name,
        rollNo: record.student?.rollNo,
        distanceMeters: record.distanceMeters,
        reason: record.flagReason,
        proxyFlagged: record.proxyFlagged,
        deviceInfo: record.deviceInfo,
        markedAt: new Date(record.markedAt).toLocaleTimeString(),
      }));

      const prompt = `You are a campus attendance fraud reviewer.

Return a very short report in plain text with exactly this format:

Risk: LOW | MEDIUM | HIGH
Top Cases:
- student name — short reason
- student name — short reason
Action: one short action line

Session: ${session.course}
Department: ${session.dept}
Semester: ${session.semester}
Section: ${session.section}
Total Marks: ${total}
Rapid Marks: ${rapidPairs.length ? rapidPairs.join(" | ") : "none"}
Shared Devices: ${deviceDuplicates.length ? deviceDuplicates.join(" | ") : "none"}

Flagged Data:
${JSON.stringify(flaggedData, null, 2)}

Keep the answer factual, minimal, and under 120 words.`;

      try {
        const result = await ai.models.generateContent({
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
          contents: prompt,
        });

        aiAnalysis =
          result?.text ||
          result?.candidates?.[0]?.content?.parts?.[0]?.text ||
          aiAnalysis;
      } catch (err) {
        aiAnalysis = `Risk: REVIEW\nReason: AI analysis failed.\nAction: ${err.message}`;
      }
    }

    return res.json({
      ok: true,
      total,
      flaggedCount: flagged.length,
      rapidPairs,
      deviceDuplicates,
      flagged: flagged.map((record) => ({
        student: record.student,
        distanceMeters: record.distanceMeters,
        flagReason: record.flagReason,
        proxyFlagged: record.proxyFlagged,
        locationFlagged: record.locationFlagged,
        deviceInfo: record.deviceInfo,
        markedAt: record.markedAt,
        studentLocation: record.studentLocation,
      })),
      aiAnalysis,
    });
  } catch (err) {
    console.error("FRAUD REPORT ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function getFraudSummary(req, res) {
  try {
    const sessions = await AttendanceSession.find({ startedBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("_id course dept section createdAt");

    const summary = await Promise.all(
      sessions.map(async (session) => {
        const total = await AttendanceRecord.countDocuments({
          session: session._id,
        });
        const flagged = await AttendanceRecord.countDocuments({
          session: session._id,
          locationFlagged: true,
        });
        const proxy = await AttendanceRecord.countDocuments({
          session: session._id,
          proxyFlagged: true,
        });

        return {
          sessionId: session._id,
          course: session.course,
          dept: session.dept,
          section: session.section,
          date: session.createdAt,
          total,
          flagged,
          proxy,
        };
      })
    );

    return res.json({ ok: true, summary });
  } catch {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function manualMarkAttendance(req, res) {
  try {
    const { sessionId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ ok: false, error: "studentId is required" });
    }

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ ok: false, error: "Session not found" });
    }

    if (
      req.user.role !== "ADMIN" &&
      String(session.startedBy) !== String(req.user._id)
    ) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const student = await User.findById(studentId).select("name rollNo role");
    if (!student) {
      return res.status(404).json({ ok: false, error: "Student not found" });
    }

    if (student.role !== "STUDENT") {
      return res.status(400).json({ ok: false, error: "Not a student" });
    }

    try {
      await AttendanceRecord.create({
        session: session._id,
        student: studentId,
      });

      return res.json({ ok: true, marked: true, student });
    } catch {
      return res.json({ ok: true, alreadyMarked: true, student });
    }
  } catch {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function getMyAttendanceSummary(req, res) {
  try {
    const { dept, section, semester } = req.user;
    const normalizedDept = (dept || "").toUpperCase();
    const normalizedSection = (section || "").toUpperCase();
    const normalizedSemester = Number(semester || 0);

    const allSessions = await AttendanceSession.find({
      $and: [
        {
          $or: [
            { dept: "" },
            { dept: { $exists: false } },
            { dept: normalizedDept },
          ],
        },
        {
          $or: [
            { section: "" },
            { section: { $exists: false } },
            { section: normalizedSection },
          ],
        },
        {
          $or: [
            { semester: 0 },
            { semester: { $exists: false } },
            { semester: normalizedSemester },
          ],
        },
      ],
    })
      .select("_id course dept createdAt")
      .sort({ createdAt: -1 });

    if (!allSessions.length) {
      return res.json({
        ok: true,
        summary: [],
        totalSessions: 0,
        totalPresent: 0,
        overallPercentage: 0,
      });
    }

    const sessionIds = allSessions.map((session) => session._id);

    const marked = await AttendanceRecord.find({
      student: req.user._id,
      session: { $in: sessionIds },
    }).select("session");

    const markedSet = new Set(marked.map((record) => String(record.session)));

    const courseMap = {};
    allSessions.forEach((session) => {
      if (!courseMap[session.course]) {
        courseMap[session.course] = {
          course: session.course,
          dept: session.dept,
          totalClasses: 0,
          attended: 0,
          sessions: [],
        };
      }

      courseMap[session.course].totalClasses += 1;

      const present = markedSet.has(String(session._id));
      if (present) courseMap[session.course].attended += 1;

      courseMap[session.course].sessions.push({
        date: session.createdAt,
        present,
        sessionId: session._id,
      });
    });

    const summary = Object.values(courseMap).map((item) => ({
      ...item,
      percentage:
        item.totalClasses > 0
          ? Math.round((item.attended / item.totalClasses) * 100)
          : 0,
      sessions: item.sessions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10),
    }));

    return res.json({
      ok: true,
      summary,
      totalSessions: allSessions.length,
      totalPresent: markedSet.size,
      overallPercentage:
        allSessions.length > 0
          ? Math.round((markedSet.size / allSessions.length) * 100)
          : 0,
    });
  } catch {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function getDefaulters(req, res) {
  try {
    const { dept, section, semester, threshold = 75, month, year } = req.query;
    const sessionFilter = { startedBy: req.user._id };

    if (dept) sessionFilter.dept = dept.trim().toUpperCase();
    if (section) sessionFilter.section = section.trim().toUpperCase();
    if (semester) sessionFilter.semester = parseInt(semester, 10);

    if (month && year) {
      sessionFilter.createdAt = {
        $gte: new Date(+year, +month - 1, 1),
        $lt: new Date(+year, +month, 1),
      };
    } else if (year) {
      sessionFilter.createdAt = {
        $gte: new Date(+year, 0, 1),
        $lt: new Date(+year + 1, 0, 1),
      };
    }

    const sessions = await AttendanceSession.find(sessionFilter);

    if (!sessions.length) {
      return res.json({
        ok: true,
        defaulters: [],
        totalSessions: 0,
        threshold: +threshold,
      });
    }

    const sessionIds = sessions.map((session) => session._id);

    const userFilter = { role: "STUDENT" };
    if (dept) userFilter.dept = dept.trim().toUpperCase();
    if (section) userFilter.section = section.trim().toUpperCase();
    if (semester) userFilter.semester = parseInt(semester, 10);

    const students = await User.find(userFilter).select(
      "name rollNo email dept section semester mobileNumber"
    );

    const records = await AttendanceRecord.find({
      session: { $in: sessionIds },
    }).select("student session");

    const attendanceMap = {};
    records.forEach((record) => {
      const id = String(record.student);
      if (!attendanceMap[id]) attendanceMap[id] = new Set();
      attendanceMap[id].add(String(record.session));
    });

    const numericThreshold = +threshold;

    const defaulters = students
      .map((student) => {
        const attended = attendanceMap[String(student._id)]?.size || 0;
        const percentage =
          sessions.length > 0
            ? Math.round((attended / sessions.length) * 100)
            : 0;

        return {
          student,
          attended,
          totalSessions: sessions.length,
          percentage,
          shortfall: Math.max(0, numericThreshold - percentage),
        };
      })
      .filter((row) => row.percentage < numericThreshold)
      .sort((a, b) => a.percentage - b.percentage);

    return res.json({
      ok: true,
      defaulters,
      totalSessions: sessions.length,
      threshold: numericThreshold,
    });
  } catch {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function getMySessions(req, res) {
  try {
    const sessions = await AttendanceSession.find({ startedBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      ok: true,
      sessions: sessions.map(normalizeSession),
    });
  } catch {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function getSessionRecords(req, res) {
  try {
    const session = await AttendanceSession.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ ok: false, error: "Session not found" });
    }

    if (
      req.user.role !== "ADMIN" &&
      String(session.startedBy) !== String(req.user._id)
    ) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const records = await AttendanceRecord.find({ session: session._id })
      .populate("student", "name rollNo dept semester section email")
      .sort({ createdAt: 1 });

    return res.json({
      ok: true,
      records,
      session: normalizeSession(session),
    });
  } catch {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}