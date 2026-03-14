import { z } from "zod";
import AttendanceRecord from "../models/attendanceRecord.model.js";
import AttendanceSession from "../models/attendanceSession.model.js";
import User from "../models/user.model.js";
import { randomToken } from "../utils/random.js";

const startSchema = z.object({
  course: z.string().min(2, "Course name required"),
  dept: z.string().optional(),
  section: z.string().optional(),
  semester: z.number().int().min(0).max(8).optional(),
  year: z.number().int().min(1).max(6).optional(),
  ttlMinutes: z.number().int().min(1).max(120).optional(),
});

const markSchema = z.object({
  qrToken: z.string().min(6, "Invalid QR token"),
});

function normalizeSessionPayload(session) {
  if (!session) return session;
  const plain = typeof session.toObject === "function" ? session.toObject() : session;
  return {
    ...plain,
    token: plain.qrToken,
  };
}

export async function startSession(req, res) {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const parsed = startSchema.safeParse({
      ...req.body,
      semester: req.body.semester !== undefined && req.body.semester !== "" ? Number(req.body.semester) : undefined,
      year: req.body.year !== undefined && req.body.year !== "" ? Number(req.body.year) : undefined,
      ttlMinutes: req.body.ttlMinutes !== undefined && req.body.ttlMinutes !== "" ? Number(req.body.ttlMinutes) : undefined,
    });

    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues?.[0]?.message || "Invalid input" });
    }

    const {
      course,
      dept = "",
      section = "",
      semester = 0,
      year = 1,
      ttlMinutes = 10,
    } = parsed.data;

    const qrToken = randomToken(16);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const session = await AttendanceSession.create({
      course: course.trim(),
      dept: dept.trim().toUpperCase(),
      section: section.trim().toUpperCase(),
      semester,
      year,
      startedBy: req.user._id,
      qrToken,
      expiresAt,
    });

    return res.status(201).json({
      ok: true,
      session: normalizeSessionPayload(session),
    });
  } catch (err) {
    console.error("START SESSION ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function markAttendance(req, res) {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const parsed = markSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues?.[0]?.message || "Invalid QR token" });
    }

    const { qrToken } = parsed.data;
    const session = await AttendanceSession.findOne({ qrToken: qrToken.trim() });

    if (!session) {
      return res.status(404).json({ ok: false, error: "Invalid QR code. Session not found." });
    }

    if (session.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ ok: false, error: "QR code has expired. Ask your teacher to generate a new one." });
    }

    const student = req.user;
    const studentDept = (student.dept || "").trim().toUpperCase();
    const studentSection = (student.section || "").trim().toUpperCase();
    const studentSemester = Number(student.semester || 0);

    if (session.dept && session.dept !== studentDept) {
      return res.status(403).json({ ok: false, error: `Access denied. This attendance is for ${session.dept} department only.` });
    }

    if (session.section && session.section !== studentSection) {
      return res.status(403).json({ ok: false, error: `Access denied. This attendance is for Section ${session.section} only.` });
    }

    if (session.semester && session.semester > 0 && session.semester !== studentSemester) {
      return res.status(403).json({ ok: false, error: `Access denied. This attendance is for Semester ${session.semester} only.` });
    }

    try {
      await AttendanceRecord.create({ session: session._id, student: student._id });
      return res.json({ ok: true, marked: true, sessionId: session._id });
    } catch {
      return res.json({ ok: true, alreadyMarked: true, sessionId: session._id });
    }
  } catch (err) {
    console.error("MARK ATTENDANCE ERROR:", err);
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

    if (req.user.role !== "ADMIN" && String(session.startedBy) !== String(req.user._id)) {
      return res.status(403).json({ ok: false, error: "You can only mark attendance in your own sessions" });
    }

    const student = await User.findById(studentId).select("name rollNo role");
    if (!student) {
      return res.status(404).json({ ok: false, error: "Student not found" });
    }

    if (student.role !== "STUDENT") {
      return res.status(400).json({ ok: false, error: "User is not a student" });
    }

    try {
      await AttendanceRecord.create({ session: session._id, student: studentId });
      return res.json({ ok: true, marked: true, student });
    } catch {
      return res.json({ ok: true, alreadyMarked: true, student });
    }
  } catch (err) {
    console.error("MANUAL MARK ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function getMyAttendanceSummary(req, res) {
  try {
    const student = req.user;
    const dept = (student.dept || "").trim().toUpperCase();
    const section = (student.section || "").trim().toUpperCase();
    const semester = Number(student.semester || 0);

    const allSessions = await AttendanceSession.find({
      $and: [
        { $or: [{ dept: "" }, { dept: { $exists: false } }, { dept }] },
        { $or: [{ section: "" }, { section: { $exists: false } }, { section }] },
        { $or: [{ semester: 0 }, { semester: { $exists: false } }, { semester }] },
      ],
    })
      .select("_id course dept section semester createdAt")
      .sort({ createdAt: -1 });

    if (allSessions.length === 0) {
      return res.json({ ok: true, summary: [], totalSessions: 0, totalPresent: 0, overallPercentage: 0 });
    }

    const sessionIds = allSessions.map((session) => session._id);
    const markedRecords = await AttendanceRecord.find({
      student: student._id,
      session: { $in: sessionIds },
    }).select("session createdAt");

    const markedSessionIds = new Set(markedRecords.map((record) => String(record.session)));
    const courseMap = {};

    allSessions.forEach((session) => {
      const course = session.course;
      if (!courseMap[course]) {
        courseMap[course] = {
          course,
          dept: session.dept,
          totalClasses: 0,
          attended: 0,
          sessions: [],
        };
      }

      courseMap[course].totalClasses += 1;
      const present = markedSessionIds.has(String(session._id));
      if (present) courseMap[course].attended += 1;

      courseMap[course].sessions.push({
        date: session.createdAt,
        present,
        sessionId: session._id,
      });
    });

    const summary = Object.values(courseMap).map((item) => ({
      ...item,
      percentage: item.totalClasses > 0 ? Math.round((item.attended / item.totalClasses) * 100) : 0,
      sessions: item.sessions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10),
    }));

    const totalSessions = allSessions.length;
    const totalPresent = markedSessionIds.size;
    const overallPercentage = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

    return res.json({ ok: true, summary, totalSessions, totalPresent, overallPercentage });
  } catch (err) {
    console.error("MY ATTENDANCE SUMMARY ERROR:", err);
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
      const start = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const end = new Date(parseInt(year, 10), parseInt(month, 10), 1);
      sessionFilter.createdAt = { $gte: start, $lt: end };
    } else if (year) {
      const start = new Date(parseInt(year, 10), 0, 1);
      const end = new Date(parseInt(year, 10) + 1, 0, 1);
      sessionFilter.createdAt = { $gte: start, $lt: end };
    }

    const sessions = await AttendanceSession.find(sessionFilter);
    if (sessions.length === 0) {
      return res.json({ ok: true, defaulters: [], totalSessions: 0, threshold: parseInt(threshold, 10) });
    }

    const sessionIds = sessions.map((session) => session._id);
    const studentFilter = { role: "STUDENT" };

    if (dept) studentFilter.dept = dept.trim().toUpperCase();
    if (section) studentFilter.section = section.trim().toUpperCase();
    if (semester) studentFilter.semester = parseInt(semester, 10);

    const students = await User.find(studentFilter).select("name rollNo email dept section semester mobileNumber");
    const records = await AttendanceRecord.find({ session: { $in: sessionIds } }).select("student session");

    const attendanceMap = {};
    records.forEach((record) => {
      const studentId = String(record.student);
      if (!attendanceMap[studentId]) attendanceMap[studentId] = new Set();
      attendanceMap[studentId].add(String(record.session));
    });

    const thresholdNum = parseInt(threshold, 10);
    const defaulters = students
      .map((student) => {
        const attended = attendanceMap[String(student._id)]?.size || 0;
        const percentage = sessions.length > 0 ? Math.round((attended / sessions.length) * 100) : 0;
        return {
          student,
          attended,
          totalSessions: sessions.length,
          percentage,
          shortfall: Math.max(0, thresholdNum - percentage),
        };
      })
      .filter((row) => row.percentage < thresholdNum)
      .sort((a, b) => a.percentage - b.percentage);

    return res.json({ ok: true, defaulters, totalSessions: sessions.length, threshold: thresholdNum });
  } catch (err) {
    console.error("DEFAULTERS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function getMySessions(req, res) {
  try {
    const sessions = await AttendanceSession.find({ startedBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ ok: true, sessions: sessions.map(normalizeSessionPayload) });
  } catch (err) {
    console.error("GET SESSIONS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function getSessionRecords(req, res) {
  try {
    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ ok: false, error: "Session not found" });
    }

    if (req.user.role !== "ADMIN" && String(session.startedBy) !== String(req.user._id)) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const records = await AttendanceRecord.find({ session: session._id })
      .populate("student", "name rollNo dept semester section email")
      .sort({ createdAt: 1 });

    return res.json({ ok: true, records, session: normalizeSessionPayload(session) });
  } catch (err) {
    console.error("GET SESSION RECORDS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
