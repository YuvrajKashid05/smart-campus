import Timetable from "../models/timetable.model.js";

const normalizeDay = (day = "") => {
  const map = {
    MONDAY: "MON",
    TUESDAY: "TUE",
    WEDNESDAY: "WED",
    THURSDAY: "THU",
    FRIDAY: "FRI",
    MON: "MON",
    TUE: "TUE",
    WED: "WED",
    THU: "THU",
    FRI: "FRI",
  };

  return map[String(day).trim().toUpperCase()] || "MON";
};

const toMinutes = (time = "") => {
  const [h = "0", m = "0"] = String(time).split(":");
  return Number(h) * 60 + Number(m);
};

export async function createTimetable(req, res) {
  try {
    const {
      dept,
      semester,
      section,
      day,
      slotType,
      title,
      subject,
      room,
      startTime,
      endTime,
    } = req.body;

    if (!dept || !semester || !section || !day || !title || !startTime || !endTime) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    if (toMinutes(endTime) <= toMinutes(startTime)) {
      return res.status(400).json({ ok: false, error: "End time must be after start time" });
    }

    const payload = {
      dept: String(dept).trim().toUpperCase(),
      semester: Number(semester),
      section: String(section).trim().toUpperCase(),
      day: normalizeDay(day),
      slotType: slotType || "LECTURE",
      title: String(title).trim(),
      subject: slotType === "BREAK" ? "" : String(subject || "").trim(),
      room: String(room || "").trim(),
      startTime,
      endTime,
      createdBy: req.user._id,
    };

    if (payload.slotType === "LECTURE" && req.user.role === "FACULTY") {
      payload.faculty = req.user._id;
    } else {
      payload.faculty = null;
    }

    const slot = await Timetable.create(payload);

    const saved = await Timetable.findById(slot._id)
      .populate("faculty", "name email")
      .populate("createdBy", "name email role");

    return res.status(201).json({
      ok: true,
      timetable: saved,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || "Failed to create timetable" });
  }
}

export async function getAllTimetables(req, res) {
  try {
    const { dept, semester, section } = req.query;

    const filter = {};
    if (dept) filter.dept = String(dept).trim().toUpperCase();
    if (semester) filter.semester = Number(semester);
    if (section) filter.section = String(section).trim().toUpperCase();

    const timetables = await Timetable.find(filter)
      .sort({ day: 1, startTime: 1 })
      .populate("faculty", "name email")
      .populate("createdBy", "name email role");

    return res.json({ ok: true, timetables });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || "Failed to fetch timetables" });
  }
}

export async function getStudentTimetable(req, res) {
  try {
    const dept = req.user?.dept;
    const semester = req.user?.semester;
    const section = req.user?.section;

    if (!dept || !semester || !section) {
      return res.status(400).json({
        ok: false,
        error: "Student profile missing dept, semester or section",
      });
    }

    const timetables = await Timetable.find({
      dept: String(dept).trim().toUpperCase(),
      semester: Number(semester),
      section: String(section).trim().toUpperCase(),
    })
      .sort({ day: 1, startTime: 1 })
      .populate("faculty", "name email")
      .populate("createdBy", "name email role");

    return res.json({ ok: true, timetables });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || "Failed to fetch student timetable" });
  }
}

export async function getFacultyOwnTimetable(req, res) {
  try {
    const timetables = await Timetable.find({
      faculty: req.user._id,
    })
      .sort({ day: 1, startTime: 1 })
      .populate("faculty", "name email")
      .populate("createdBy", "name email role");

    return res.json({ ok: true, timetables });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || "Failed to fetch faculty timetable" });
  }
}

export async function updateTimetable(req, res) {
  try {
    const { id } = req.params;
    const existing = await Timetable.findById(id);

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Timetable slot not found" });
    }

    if (
      req.user.role === "FACULTY" &&
      existing.faculty &&
      String(existing.faculty) !== String(req.user._id)
    ) {
      return res.status(403).json({ ok: false, error: "You can only update your own slots" });
    }

    const payload = { ...req.body };

    if (payload.day) payload.day = normalizeDay(payload.day);
    if (payload.dept) payload.dept = String(payload.dept).trim().toUpperCase();
    if (payload.section) payload.section = String(payload.section).trim().toUpperCase();
    if (payload.semester) payload.semester = Number(payload.semester);

    const startTime = payload.startTime || existing.startTime;
    const endTime = payload.endTime || existing.endTime;

    if (toMinutes(endTime) <= toMinutes(startTime)) {
      return res.status(400).json({ ok: false, error: "End time must be after start time" });
    }

    if ((payload.slotType || existing.slotType) === "BREAK") {
      payload.subject = "";
      payload.faculty = null;
    } else if (req.user.role === "FACULTY") {
      payload.faculty = req.user._id;
    }

    const updated = await Timetable.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    })
      .populate("faculty", "name email")
      .populate("createdBy", "name email role");

    return res.json({ ok: true, timetable: updated });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || "Failed to update timetable" });
  }
}

export async function deleteTimetable(req, res) {
  try {
    const { id } = req.params;
    const existing = await Timetable.findById(id);

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Timetable slot not found" });
    }

    if (
      req.user.role === "FACULTY" &&
      existing.faculty &&
      String(existing.faculty) !== String(req.user._id)
    ) {
      return res.status(403).json({ ok: false, error: "You can only delete your own slots" });
    }

    await Timetable.findByIdAndDelete(id);

    return res.json({ ok: true, message: "Timetable slot deleted successfully" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || "Failed to delete timetable" });
  }
}