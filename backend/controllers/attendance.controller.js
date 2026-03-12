import { z } from "zod";
import AttendanceRecord from "../models/attendanceRecord.model.js";
import AttendanceSession from "../models/attendanceSession.model.js";
import User from "../models/user.model.js";
import { randomToken } from "../utils/random.js";

/* ───────────── Validation ───────────── */

const startSchema = z.object({
  course: z.string().min(2, "Course name required"),
  dept: z.string().optional(),
  section: z.string().optional(),
  semester: z.number().int().min(0).max(8).optional(),
  year: z.number().int().min(1).max(6).optional(),
  ttlMinutes: z.number().int().min(1).max(120).optional()
});

const markSchema = z.object({
  qrToken: z.string().min(10, "Invalid QR token")
});

/* ───────────── Start Attendance Session ───────────── */

export async function startSession(req, res) {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const parsed = startSchema.safeParse({
      ...req.body,
      semester: req.body.semester !== undefined && req.body.semester !== ""
        ? Number(req.body.semester) : undefined
    });
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });

    const { course, dept = "", section = "", semester = 0, year = 1, ttlMinutes = 10 } = parsed.data;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const session = await AttendanceSession.create({
      course,
      dept: dept.trim().toUpperCase(),
      section: section.trim().toUpperCase(),
      semester,
      year,
      startedBy: req.user._id,
      qrToken: randomToken(16),
      expiresAt
    });

    return res.status(201).json({ ok: true, session });
  } catch (err) {
    console.error("START SESSION ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

/* ───────────── Mark Attendance ───────────── */

export async function markAttendance(req, res) {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const parsed = markSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });

    const { qrToken } = parsed.data;
    const session = await AttendanceSession.findOne({ qrToken });
    if (!session) return res.status(404).json({ ok: false, error: "Invalid QR code. Session not found." });
    if (session.expiresAt.getTime() < Date.now()) return res.status(410).json({ ok: false, error: "QR code has expired. Ask your teacher to generate a new one." });

    const student = req.user;

    // Department check
    if (session.dept && session.dept !== "") {
      const studentDept = (student.dept || "").trim().toUpperCase();
      if (studentDept !== session.dept) {
        return res.status(403).json({ ok: false, error: `Access denied. This attendance is for ${session.dept} department only. You are in ${studentDept || "unknown"} department.` });
      }
    }

    // Section check
    if (session.section && session.section !== "") {
      const studentSection = (student.section || "").trim().toUpperCase();
      if (studentSection !== session.section) {
        return res.status(403).json({ ok: false, error: `Access denied. This attendance is for Section ${session.section} only. You are in Section ${studentSection || "unknown"}.` });
      }
    }

    // Semester check
    if (session.semester && session.semester > 0) {
      if ((student.semester || 0) !== session.semester) {
        return res.status(403).json({ ok: false, error: `Access denied. This attendance is for Semester ${session.semester} only. You are in Semester ${student.semester || "unknown"}.` });
      }
    }

    try {
      await AttendanceRecord.create({ session: session._id, student: student._id });
      return res.json({ ok: true, marked: true });
    } catch {
      return res.json({ ok: true, alreadyMarked: true });
    }
  } catch (err) {
    console.error("MARK ATTENDANCE ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

/* ───────────── Student: My Attendance Summary ───────────── */

export async function getMyAttendanceSummary(req, res) {
  try {
    const student = req.user;

    // All sessions this student was eligible for (matching dept/section/semester)
    const eligibleQuery = {
      $or: [{ dept: "" }, { dept: { $exists: false } }, { dept: student.dept?.toUpperCase() || "" }]
    };

    // Be precise: sessions for student's dept
    const allSessions = await AttendanceSession.find({
      $and: [
        // Dept matches or session has no dept restriction
        {
          $or: [
            { dept: "" },
            { dept: { $exists: false } },
            { dept: student.dept?.trim().toUpperCase() }
          ]
        },
        // Section matches or session has no section restriction
        {
          $or: [
            { section: "" },
            { section: { $exists: false } },
            { section: student.section?.trim().toUpperCase() }
          ]
        },
        // Semester matches or session has no semester restriction
        {
          $or: [
            { semester: 0 },
            { semester: { $exists: false } },
            { semester: student.semester }
          ]
        }
      ]
    }).select("_id course dept section semester createdAt");

    if (allSessions.length === 0) {
      return res.json({ ok: true, summary: [], totalSessions: 0, totalPresent: 0, overallPercentage: 0 });
    }

    const sessionIds = allSessions.map(s => s._id);

    // Which sessions did the student mark?
    const markedRecords = await AttendanceRecord.find({
      student: student._id,
      session: { $in: sessionIds }
    }).select("session createdAt");

    const markedSessionIds = new Set(markedRecords.map(r => String(r.session)));

    // Group by course
    const courseMap = {};
    allSessions.forEach(session => {
      const course = session.course;
      if (!courseMap[course]) {
        courseMap[course] = { course, dept: session.dept, totalClasses: 0, attended: 0, sessions: [] };
      }
      courseMap[course].totalClasses++;
      const present = markedSessionIds.has(String(session._id));
      if (present) courseMap[course].attended++;
      courseMap[course].sessions.push({
        date: session.createdAt,
        present,
        sessionId: session._id
      });
    });

    const summary = Object.values(courseMap).map(c => ({
      ...c,
      percentage: Math.round((c.attended / c.totalClasses) * 100),
      sessions: c.sessions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10) // last 10
    }));

    const totalSessions = allSessions.length;
    const totalPresent = markedRecords.length;
    const overallPercentage = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

    return res.json({ ok: true, summary, totalSessions, totalPresent, overallPercentage });
  } catch (err) {
    console.error("MY ATTENDANCE SUMMARY ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

/* ───────────── Faculty: Defaulter List ───────────── */

export async function getDefaulters(req, res) {
  try {
    const { dept, section, semester, threshold = 75, month, year } = req.query;

    // Build session filter
    const sessionFilter = { startedBy: req.user._id };
    if (dept) sessionFilter.dept = dept.trim().toUpperCase();
    if (section) sessionFilter.section = section.trim().toUpperCase();
    if (semester) sessionFilter.semester = parseInt(semester);

    // Month filter on sessions
    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 1);
      sessionFilter.createdAt = { $gte: start, $lt: end };
    } else if (year) {
      const start = new Date(parseInt(year), 0, 1);
      const end = new Date(parseInt(year) + 1, 0, 1);
      sessionFilter.createdAt = { $gte: start, $lt: end };
    }

    const sessions = await AttendanceSession.find(sessionFilter);
    if (sessions.length === 0) {
      return res.json({ ok: true, defaulters: [], totalSessions: 0, threshold: parseInt(threshold) });
    }

    const sessionIds = sessions.map(s => s._id);

    // Find all eligible students
    const studentFilter = { role: "STUDENT" };
    if (dept) studentFilter.dept = dept.trim().toUpperCase();
    if (section) studentFilter.section = section.trim().toUpperCase();
    if (semester) studentFilter.semester = parseInt(semester);

    const students = await User.find(studentFilter).select("name rollNo email dept section semester mobileNumber");

    // For each student count attendance
    const records = await AttendanceRecord.find({ session: { $in: sessionIds } }).select("student session");

    const attendanceMap = {};
    records.forEach(r => {
      const sid = String(r.student);
      if (!attendanceMap[sid]) attendanceMap[sid] = new Set();
      attendanceMap[sid].add(String(r.session));
    });

    const thresholdNum = parseInt(threshold);
    const defaulters = [];

    students.forEach(student => {
      const attended = attendanceMap[String(student._id)]?.size || 0;
      const percentage = sessions.length > 0 ? Math.round((attended / sessions.length) * 100) : 0;
      if (percentage < thresholdNum) {
        defaulters.push({
          student: {
            _id: student._id,
            name: student.name,
            rollNo: student.rollNo,
            email: student.email,
            dept: student.dept,
            section: student.section,
            semester: student.semester,
            mobileNumber: student.mobileNumber
          },
          attended,
          totalSessions: sessions.length,
          percentage,
          shortfall: thresholdNum - percentage
        });
      }
    });

    defaulters.sort((a, b) => a.percentage - b.percentage);

    return res.json({ ok: true, defaulters, totalSessions: sessions.length, threshold: thresholdNum });
  } catch (err) {
    console.error("DEFAULTERS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

/* ───────────── Get My Sessions (Faculty) ───────────── */

export async function getMySessions(req, res) {
  try {
    const sessions = await AttendanceSession.find({ startedBy: req.user._id })
      .sort({ createdAt: -1 }).limit(100);
    return res.json({ ok: true, sessions });
  } catch (err) {
    console.error("GET SESSIONS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

/* ───────────── Get Session Records ───────────── */

export async function getSessionRecords(req, res) {
  try {
    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ ok: false, error: "Session not found" });

    if (req.user.role !== "ADMIN" && String(session.startedBy) !== String(req.user._id)) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const records = await AttendanceRecord.find({ session: session._id })
      .populate("student", "name rollNo dept semester section email")
      .sort({ createdAt: 1 });

    return res.json({ ok: true, records });
  } catch (err) {
    console.error("GET SESSION RECORDS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
