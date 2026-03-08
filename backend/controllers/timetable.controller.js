import { z } from "zod";
import Timetable from "../models/timetable.model.js";

const timetableSchema = z.object({
  dept: z.string().min(2),
  semester: z.number().min(1).max(8),
  section: z.string().min(1),
  day: z.enum(["MON", "TUE", "WED", "THU", "FRI"]),
  slotType: z.enum(["LECTURE", "BREAK"]),
  title: z.string().min(2),
  subject: z.string().optional(),
  room: z.string().optional(),
  startTime: z.string().min(4),
  endTime: z.string().min(4)
});

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export async function createTimetableSlot(req, res) {
  try {
    const parsed = timetableSchema.safeParse({
      ...req.body,
      semester: Number(req.body.semester),
      dept: req.body.dept?.trim().toUpperCase(),
      section: req.body.section?.trim().toUpperCase()
    });

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.flatten()
      });
    }

    if (timeToMinutes(parsed.data.startTime) >= timeToMinutes(parsed.data.endTime)) {
      return res.status(400).json({
        ok: false,
        error: "Start time must be before end time"
      });
    }

    const exists = await Timetable.findOne({
      dept: parsed.data.dept,
      semester: parsed.data.semester,
      section: parsed.data.section,
      day: parsed.data.day,
      startTime: parsed.data.startTime
    });

    if (exists) {
      return res.status(409).json({
        ok: false,
        error: "This slot already exists for this class"
      });
    }

    const timetable = await Timetable.create({
      dept: parsed.data.dept,
      semester: parsed.data.semester,
      section: parsed.data.section,
      day: parsed.data.day,
      slotType: parsed.data.slotType,
      title: parsed.data.title.trim(),
      subject: parsed.data.slotType === "BREAK" ? "" : parsed.data.subject?.trim() || "",
      room: parsed.data.room?.trim() || "",
      faculty: parsed.data.slotType === "BREAK" ? null : req.user._id,
      createdBy: req.user._id,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime
    });

    return res.status(201).json({
      ok: true,
      timetable
    });
  } catch (err) {
    console.error("CREATE TIMETABLE SLOT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
}

export async function listTimetableSlots(req, res) {
  try {
    const { dept, semester, section, day } = req.query;

    const filter = {};

    if (dept) filter.dept = dept.trim().toUpperCase();
    if (semester) filter.semester = Number(semester);
    if (section) filter.section = section.trim().toUpperCase();
    if (day) filter.day = day;

    const timetables = await Timetable.find(filter)
      .populate("faculty", "name email role")
      .sort({ day: 1, startTime: 1 });

    return res.json({
      ok: true,
      timetables
    });
  } catch (err) {
    console.error("LIST TIMETABLE SLOTS ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
}

export async function getMyTimetable(req, res) {
  try {
    if (!req.user?.dept || !req.user?.semester || !req.user?.section) {
      return res.status(400).json({
        ok: false,
        error: "Student profile is incomplete"
      });
    }

    const timetables = await Timetable.find({
      dept: req.user.dept,
      semester: req.user.semester,
      section: req.user.section
    })
      .populate("faculty", "name email role")
      .sort({ day: 1, startTime: 1 });

    return res.json({
      ok: true,
      timetables
    });
  } catch (err) {
    console.error("MY TIMETABLE ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
}

export async function getTimetableSlotById(req, res) {
  try {
    const timetable = await Timetable.findById(req.params.id).populate(
      "faculty",
      "name email role"
    );

    if (!timetable) {
      return res.status(404).json({
        ok: false,
        error: "Timetable slot not found"
      });
    }

    return res.json({
      ok: true,
      timetable
    });
  } catch (err) {
    console.error("GET TIMETABLE SLOT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
}

export async function updateTimetableSlot(req, res) {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        ok: false,
        error: "Timetable slot not found"
      });
    }

    if (
      req.user.role !== "ADMIN" &&
      timetable.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden"
      });
    }

    const parsed = timetableSchema.safeParse({
      ...req.body,
      semester: Number(req.body.semester),
      dept: req.body.dept?.trim().toUpperCase(),
      section: req.body.section?.trim().toUpperCase()
    });

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.flatten()
      });
    }

    if (timeToMinutes(parsed.data.startTime) >= timeToMinutes(parsed.data.endTime)) {
      return res.status(400).json({
        ok: false,
        error: "Start time must be before end time"
      });
    }

    const duplicate = await Timetable.findOne({
      _id: { $ne: req.params.id },
      dept: parsed.data.dept,
      semester: parsed.data.semester,
      section: parsed.data.section,
      day: parsed.data.day,
      startTime: parsed.data.startTime
    });

    if (duplicate) {
      return res.status(409).json({
        ok: false,
        error: "Another slot already exists at this time"
      });
    }

    Object.assign(timetable, {
      dept: parsed.data.dept,
      semester: parsed.data.semester,
      section: parsed.data.section,
      day: parsed.data.day,
      slotType: parsed.data.slotType,
      title: parsed.data.title.trim(),
      subject: parsed.data.slotType === "BREAK" ? "" : parsed.data.subject?.trim() || "",
      room: parsed.data.room?.trim() || "",
      faculty: parsed.data.slotType === "BREAK" ? null : timetable.faculty || req.user._id,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime
    });

    await timetable.save();

    return res.json({
      ok: true,
      timetable
    });
  } catch (err) {
    console.error("UPDATE TIMETABLE SLOT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
}

export async function deleteTimetableSlot(req, res) {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        ok: false,
        error: "Timetable slot not found"
      });
    }

    if (
      req.user.role !== "ADMIN" &&
      timetable.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden"
      });
    }

    await timetable.deleteOne();

    return res.json({
      ok: true,
      message: "Timetable slot deleted successfully"
    });
  } catch (err) {
    console.error("DELETE TIMETABLE SLOT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
}