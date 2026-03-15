import { z } from "zod";
import ai from "../config/gemini.js";
import AttendanceRecord from "../models/attendanceRecord.model.js";
import AttendanceSession from "../models/attendanceSession.model.js";
import User from "../models/user.model.js";
import { randomToken } from "../utils/random.js";

// ── Haversine distance in meters ───//
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const r = d => (d * Math.PI) / 180;
  const dLat = r(lat2 - lat1), dLng = r(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(r(lat1))*Math.cos(r(lat2))*Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function normalizeSession(s) {
  if (!s) return s;
  const p = typeof s.toObject === "function" ? s.toObject() : s;
  return { ...p, token: p.qrToken };
}

const startSchema = z.object({
  course:      z.string().min(2, "Course name required"),
  dept:        z.string().optional(),
  section:     z.string().optional(),
  semester:    z.number().int().min(0).max(8).optional(),
  year:        z.number().int().min(1).max(6).optional(),
  ttlMinutes:  z.number().int().min(1).max(120).optional(),
  classroomLat:         z.number().optional(),
  classroomLng:         z.number().optional(),
  classroomRadiusMeters:z.number().min(10).max(5000).optional(),
  classroomLabel:       z.string().optional(),
  locationCheckEnabled: z.boolean().optional(),
});

const markSchema = z.object({
  qrToken:           z.string().min(6, "Invalid QR token"),
  lat:               z.number().optional(),
  lng:               z.number().optional(),
  deviceFingerprint: z.string().optional(),
  deviceInfo:        z.string().optional(),
});

// ── Start Session ──//
export async function startSession(req, res) {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    const parsed = startSchema.safeParse({
      ...req.body,
      semester:    req.body.semester    != null && req.body.semester    !== "" ? Number(req.body.semester)    : undefined,
      year:        req.body.year        != null && req.body.year        !== "" ? Number(req.body.year)        : undefined,
      ttlMinutes:  req.body.ttlMinutes  != null                                ? Number(req.body.ttlMinutes)  : undefined,
      classroomLat:          req.body.classroomLat != null ? Number(req.body.classroomLat) : undefined,
      classroomLng:          req.body.classroomLng != null ? Number(req.body.classroomLng) : undefined,
      classroomRadiusMeters: req.body.classroomRadiusMeters != null ? Number(req.body.classroomRadiusMeters) : undefined,
    });
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues?.[0]?.message || "Invalid input" });

    const { course, dept="", section="", semester=0, year=1, ttlMinutes=10,
      classroomLat, classroomLng, classroomRadiusMeters=100, classroomLabel="", locationCheckEnabled=false } = parsed.data;
    const hasGPS = classroomLat != null && classroomLng != null;

    const session = await AttendanceSession.create({
      course: course.trim(),
      dept: dept.trim().toUpperCase(),
      section: section.trim().toUpperCase(),
      semester, year,
      startedBy: req.user._id,
      qrToken: randomToken(16),
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
      classroomLocation: hasGPS
        ? { lat: classroomLat, lng: classroomLng, radiusMeters: classroomRadiusMeters, label: classroomLabel }
        : { lat: null, lng: null, radiusMeters: 100, label: "" },
      locationCheckEnabled: hasGPS ? locationCheckEnabled : false,
    });
    return res.status(201).json({ ok: true, session: normalizeSession(session) });
  } catch (err) {
    console.error("START SESSION ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

// ── Mark Attendance ──//
export async function markAttendance(req, res) {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    const parsed = markSchema.safeParse({
      ...req.body,
      lat: req.body.lat != null ? Number(req.body.lat) : undefined,
      lng: req.body.lng != null ? Number(req.body.lng) : undefined,
    });
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues?.[0]?.message || "Invalid token" });

    const { qrToken, lat, lng, deviceFingerprint, deviceInfo } = parsed.data;
    const session = await AttendanceSession.findOne({ qrToken: qrToken.trim() });
    if (!session) return res.status(404).json({ ok: false, error: "Invalid QR code. Session not found." });
    if (session.expiresAt < Date.now()) return res.status(410).json({ ok: false, error: "QR code expired. Ask your teacher to generate a new one." });

    const student = req.user;
    if (session.dept    && session.dept    !== student.dept?.toUpperCase())   return res.status(403).json({ ok: false, error: `This attendance is for ${session.dept} only.` });
    if (session.section && session.section !== student.section?.toUpperCase()) return res.status(403).json({ ok: false, error: `This attendance is for Section ${session.section} only.` });
    if (session.semester && session.semester > 0 && session.semester !== Number(student.semester)) return res.status(403).json({ ok: false, error: `This attendance is for Semester ${session.semester} only.` });

    // ── GPS check ──//
    let distanceMeters = null, locationFlagged = false, flagReason = "";
    const hasStudentGPS   = lat != null && lng != null;
    const hasClassroomGPS = session.classroomLocation?.lat != null && session.classroomLocation?.lng != null;

    if (hasClassroomGPS && hasStudentGPS) {
      distanceMeters = haversineMeters(session.classroomLocation.lat, session.classroomLocation.lng, lat, lng);
      const radius   = session.classroomLocation.radiusMeters || 100;
      if (distanceMeters > radius) {
        locationFlagged = true;
        flagReason = `Student was ${distanceMeters}m from classroom (allowed: ${radius}m)`;
      }
    } else if (session.locationCheckEnabled && !hasStudentGPS) {
      locationFlagged = true;
      flagReason = "Location check enabled but student did not share GPS";
    }

    // ── Device fingerprint / proxy check ──//
    let proxyFlagged = false;
    if (deviceFingerprint) {
      // Check if same fingerprint already used by a DIFFERENT student in this session
      const sameDevice = await AttendanceRecord.findOne({
        session: session._id,
        deviceFingerprint,
        student: { $ne: student._id },
      }).populate("student", "name rollNo");

      if (sameDevice) {
        proxyFlagged = true;
        const existingStudent = sameDevice.student?.name || "another student";
        if (!flagReason) flagReason = "";
        flagReason += `${flagReason ? " | " : ""}Same device used by ${existingStudent} — possible proxy attendance`;
        locationFlagged = true; // surface in fraud report
      }
    }

    try {
      await AttendanceRecord.create({
        session: session._id,
        student: student._id,
        studentLocation: hasStudentGPS ? { lat, lng } : { lat: null, lng: null },
        distanceMeters,
        locationFlagged: locationFlagged || proxyFlagged,
        flagReason,
        deviceFingerprint: deviceFingerprint || null,
        deviceInfo: deviceInfo || null,
        proxyFlagged,
      });

      return res.json({ ok: true, marked: true, sessionId: session._id, locationFlagged, proxyFlagged, distanceMeters, flagReason });
    } catch {
      return res.json({ ok: true, alreadyMarked: true, sessionId: session._id });
    }
  } catch (err) {
    console.error("MARK ATTENDANCE ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

// ── AI Fraud Report for a session ──//
export async function getFraudReport(req, res) {
  try {
    const { sessionId } = req.params;
    const session = await AttendanceSession.findById(sessionId);
    if (!session) return res.status(404).json({ ok: false, error: "Session not found" });
    if (req.user.role !== "ADMIN" && String(session.startedBy) !== String(req.user._id))
      return res.status(403).json({ ok: false, error: "Forbidden" });

    const records = await AttendanceRecord.find({ session: sessionId })
      .populate("student", "name rollNo dept section semester")
      .sort({ markedAt: 1 });

    const flagged = records.filter(r => r.locationFlagged || r.proxyFlagged);
    const total   = records.length;

    // Rapid-marking detection (2 students within 2 seconds)
    const rapidPairs = [];
    for (let i = 0; i < records.length - 1; i++) {
      const diff = Math.abs(new Date(records[i+1].markedAt) - new Date(records[i].markedAt));
      if (diff < 2000) {
        rapidPairs.push(`${records[i].student?.name} & ${records[i+1].student?.name} (${diff}ms apart)`);
      }
    }

    // Device fingerprint duplicates
    const fpMap = {};
    records.forEach(r => {
      if (!r.deviceFingerprint) return;
      if (!fpMap[r.deviceFingerprint]) fpMap[r.deviceFingerprint] = [];
      fpMap[r.deviceFingerprint].push(r.student?.name || "?");
    });
    const deviceDuplicates = Object.entries(fpMap)
      .filter(([, names]) => names.length > 1)
      .map(([fp, names]) => `Device ${fp.slice(0,8)}… used by: ${names.join(", ")}`);

    if (flagged.length === 0 && rapidPairs.length === 0 && deviceDuplicates.length === 0) {
      return res.json({
        ok: true, total, flaggedCount: 0, rapidPairs: [], deviceDuplicates: [], flagged: [],
        aiAnalysis: "✅ No suspicious activity detected. All students marked attendance within the classroom and no proxy patterns found.",
      });
    }

    const aiEnabled = !!process.env.GEMINI_API_KEY;
    let aiAnalysis = "AI analysis unavailable — GEMINI_API_KEY not set.";

    if (aiEnabled) {
      const flaggedData = flagged.map(r => ({
        student:        r.student?.name,
        rollNo:         r.student?.rollNo,
        distanceMeters: r.distanceMeters,
        reason:         r.flagReason,
        proxyFlagged:   r.proxyFlagged,
        deviceInfo:     r.deviceInfo,
        markedAt:       new Date(r.markedAt).toLocaleTimeString(),
      }));

      const prompt = `You are an academic integrity officer analyzing attendance fraud for a college class.

Session: ${session.course} | ${session.dept} Sem ${session.semester} Sec ${session.section}
Date: ${new Date(session.createdAt).toDateString()}
Total attendance marks: ${total}
Location-flagged records: ${flagged.filter(r=>r.locationFlagged).length}
Proxy-flagged records: ${flagged.filter(r=>r.proxyFlagged).length}
${rapidPairs.length > 0 ? `Rapid marking (< 2 sec apart): ${rapidPairs.join(" | ")}` : ""}
${deviceDuplicates.length > 0 ? `Same device, multiple students: ${deviceDuplicates.join(" | ")}` : ""}

Flagged records:
${JSON.stringify(flaggedData, null, 2)}

Provide a professional fraud analysis:
1. Overall risk level: LOW / MEDIUM / HIGH
2. For each flagged student — what likely happened (hostel, proxy, shared phone)
3. Which are most suspicious and why
4. Concrete recommendation (warn / investigate / dismiss)

Keep it factual, concise and actionable.`;

      try {
        const result = await ai.models.generateContent({
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
          contents: prompt,
        });
        aiAnalysis = result?.text || result?.candidates?.[0]?.content?.parts?.[0]?.text || "AI returned no response.";
      } catch (err) {
        aiAnalysis = `AI analysis error: ${err.message}`;
      }
    }

    return res.json({
      ok: true, total, flaggedCount: flagged.length,
      rapidPairs, deviceDuplicates,
      flagged: flagged.map(r => ({
        student:        r.student,
        distanceMeters: r.distanceMeters,
        flagReason:     r.flagReason,
        proxyFlagged:   r.proxyFlagged,
        locationFlagged:r.locationFlagged,
        deviceInfo:     r.deviceInfo,
        markedAt:       r.markedAt,
        studentLocation:r.studentLocation,
      })),
      aiAnalysis,
    });
  } catch (err) {
    console.error("FRAUD REPORT ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

// ── Fraud summary (all sessions for faculty) ──//
export async function getFraudSummary(req, res) {
  try {
    const sessions = await AttendanceSession.find({ startedBy: req.user._id })
      .sort({ createdAt: -1 }).limit(30).select("_id course dept section createdAt");

    const summary = await Promise.all(sessions.map(async s => {
      const total   = await AttendanceRecord.countDocuments({ session: s._id });
      const flagged = await AttendanceRecord.countDocuments({ session: s._id, locationFlagged: true });
      const proxy   = await AttendanceRecord.countDocuments({ session: s._id, proxyFlagged: true });
      return { sessionId: s._id, course: s.course, dept: s.dept, section: s.section, date: s.createdAt, total, flagged, proxy };
    }));

    return res.json({ ok: true, summary });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

// ── Remaining existing endpoints ──//
export async function manualMarkAttendance(req, res) {
  try {
    const { sessionId } = req.params;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ ok: false, error: "studentId is required" });
    const session = await AttendanceSession.findById(sessionId);
    if (!session) return res.status(404).json({ ok: false, error: "Session not found" });
    if (req.user.role !== "ADMIN" && String(session.startedBy) !== String(req.user._id))
      return res.status(403).json({ ok: false, error: "Forbidden" });
    const student = await User.findById(studentId).select("name rollNo role");
    if (!student) return res.status(404).json({ ok: false, error: "Student not found" });
    if (student.role !== "STUDENT") return res.status(400).json({ ok: false, error: "Not a student" });
    try {
      await AttendanceRecord.create({ session: session._id, student: studentId });
      return res.json({ ok: true, marked: true, student });
    } catch { return res.json({ ok: true, alreadyMarked: true, student }); }
  } catch (err) { return res.status(500).json({ ok: false, error: "Server error" }); }
}

export async function getMyAttendanceSummary(req, res) {
  try {
    const { dept, section, semester } = req.user;
    const d = (dept    || "").toUpperCase();
    const sc= (section || "").toUpperCase();
    const sm= Number(semester || 0);
    const allSessions = await AttendanceSession.find({
      $and: [
        { $or: [{ dept: "" }, { dept: { $exists: false } }, { dept: d }] },
        { $or: [{ section: "" }, { section: { $exists: false } }, { section: sc }] },
        { $or: [{ semester: 0 }, { semester: { $exists: false } }, { semester: sm }] },
      ],
    }).select("_id course dept createdAt").sort({ createdAt: -1 });
    if (!allSessions.length) return res.json({ ok: true, summary: [], totalSessions: 0, totalPresent: 0, overallPercentage: 0 });
    const sessionIds = allSessions.map(s => s._id);
    const marked = await AttendanceRecord.find({ student: req.user._id, session: { $in: sessionIds } }).select("session");
    const markedSet = new Set(marked.map(r => String(r.session)));
    const courseMap = {};
    allSessions.forEach(s => {
      if (!courseMap[s.course]) courseMap[s.course] = { course: s.course, dept: s.dept, totalClasses: 0, attended: 0, sessions: [] };
      courseMap[s.course].totalClasses++;
      const present = markedSet.has(String(s._id));
      if (present) courseMap[s.course].attended++;
      courseMap[s.course].sessions.push({ date: s.createdAt, present, sessionId: s._id });
    });
    const summary = Object.values(courseMap).map(item => ({
      ...item,
      percentage: item.totalClasses > 0 ? Math.round((item.attended / item.totalClasses) * 100) : 0,
      sessions: item.sessions.sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,10),
    }));
    return res.json({ ok: true, summary, totalSessions: allSessions.length, totalPresent: markedSet.size, overallPercentage: allSessions.length > 0 ? Math.round((markedSet.size/allSessions.length)*100) : 0 });
  } catch (err) { return res.status(500).json({ ok: false, error: "Server error" }); }
}

export async function getDefaulters(req, res) {
  try {
    const { dept, section, semester, threshold = 75, month, year } = req.query;
    const sf = { startedBy: req.user._id };
    if (dept)    sf.dept    = dept.trim().toUpperCase();
    if (section) sf.section = section.trim().toUpperCase();
    if (semester) sf.semester = parseInt(semester, 10);
    if (month && year) sf.createdAt = { $gte: new Date(+year, +month-1, 1), $lt: new Date(+year, +month, 1) };
    else if (year) sf.createdAt = { $gte: new Date(+year,0,1), $lt: new Date(+year+1,0,1) };
    const sessions = await AttendanceSession.find(sf);
    if (!sessions.length) return res.json({ ok: true, defaulters: [], totalSessions: 0, threshold: +threshold });
    const sids = sessions.map(s => s._id);
    const uf = { role: "STUDENT" };
    if (dept)    uf.dept    = dept.trim().toUpperCase();
    if (section) uf.section = section.trim().toUpperCase();
    if (semester) uf.semester = parseInt(semester, 10);
    const students = await User.find(uf).select("name rollNo email dept section semester mobileNumber");
    const records  = await AttendanceRecord.find({ session: { $in: sids } }).select("student session");
    const aMap = {};
    records.forEach(r => { const id = String(r.student); if (!aMap[id]) aMap[id] = new Set(); aMap[id].add(String(r.session)); });
    const t = +threshold;
    const defaulters = students.map(s => {
      const attended = aMap[String(s._id)]?.size || 0;
      const pct = sessions.length > 0 ? Math.round((attended/sessions.length)*100) : 0;
      return { student: s, attended, totalSessions: sessions.length, percentage: pct, shortfall: Math.max(0, t-pct) };
    }).filter(r => r.percentage < t).sort((a,b) => a.percentage - b.percentage);
    return res.json({ ok: true, defaulters, totalSessions: sessions.length, threshold: t });
  } catch (err) { return res.status(500).json({ ok: false, error: "Server error" }); }
}

export async function getMySessions(req, res) {
  try {
    const sessions = await AttendanceSession.find({ startedBy: req.user._id }).sort({ createdAt: -1 }).limit(100);
    return res.json({ ok: true, sessions: sessions.map(normalizeSession) });
  } catch (err) { return res.status(500).json({ ok: false, error: "Server error" }); }
}

export async function getSessionRecords(req, res) {
  try {
    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ ok: false, error: "Session not found" });
    if (req.user.role !== "ADMIN" && String(session.startedBy) !== String(req.user._id))
      return res.status(403).json({ ok: false, error: "Forbidden" });
    const records = await AttendanceRecord.find({ session: session._id })
      .populate("student", "name rollNo dept semester section email")
      .sort({ createdAt: 1 });
    return res.json({ ok: true, records, session: normalizeSession(session) });
  } catch (err) { return res.status(500).json({ ok: false, error: "Server error" }); }
}
