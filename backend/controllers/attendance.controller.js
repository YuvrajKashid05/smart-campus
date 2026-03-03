import { z } from "zod";
import AttendanceRecord from "../models/attendanceRecord.model.js";
import AttendanceSession from "../models/attendanceSession.model.js";
import { randomToken } from "../utils/random.js";

/* -------------------- Validation -------------------- */

const startSchema = z.object({
  course: z.string().min(2, "Course name required"),
  dept: z.string().optional(),
  year: z.number().int().min(1).max(6).optional(),
  ttlMinutes: z.number().int().min(1).max(120).optional()
});

const markSchema = z.object({
  qrToken: z.string().min(10, "Invalid QR token")
});

/* -------------------- Start Attendance -------------------- */

export async function startSession(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const parsed = startSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues
      });
    }

    const {
      course,
      dept = "",
      year = 1,
      ttlMinutes = 10
    } = parsed.data;

    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const session = await AttendanceSession.create({
      course,
      dept,
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

/* -------------------- Mark Attendance -------------------- */

export async function markAttendance(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const parsed = markSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues
      });
    }

    const { qrToken } = parsed.data;

    const session = await AttendanceSession.findOne({ qrToken });
    if (!session) {
      return res.status(404).json({ ok: false, error: "Invalid session" });
    }

    if (session.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ ok: false, error: "Session expired" });
    }

    try {
      await AttendanceRecord.create({
        session: session._id,
        student: req.user._id
      });

      return res.json({ ok: true, marked: true });
    } catch {
      return res.json({ ok: true, alreadyMarked: true });
    }
  } catch (err) {
    console.error("MARK ATTENDANCE ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}