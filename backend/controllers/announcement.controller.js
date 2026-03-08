import { z } from "zod";
import Announcement from "../models/announcement.model.js";

const announcementSchema = z.object({
  title: z.string().min(3),
  message: z.string().min(5),
  audience: z.enum(["ALL", "STUDENT", "FACULTY"]).optional(),
  dept: z.string().optional(),
  semester: z.number().min(1).max(8).optional(),
  section: z.string().optional()
});

export async function createAnnouncement(req, res) {
  try {
    const parsed = announcementSchema.safeParse({
      ...req.body,
      semester: req.body.semester ? Number(req.body.semester) : undefined,
      dept: req.body.dept?.trim().toUpperCase(),
      section: req.body.section?.trim().toUpperCase()
    });

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.flatten()
      });
    }

    const announcement = await Announcement.create({
      title: parsed.data.title.trim(),
      message: parsed.data.message.trim(),
      audience: parsed.data.audience || "ALL",
      dept: parsed.data.dept || "ALL",
      semester: parsed.data.semester,
      section: parsed.data.section || "",
      createdBy: req.user._id
    });

    return res.status(201).json({
      ok: true,
      announcement
    });
  } catch (err) {
    console.error("CREATE ANNOUNCEMENT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
}

export async function listAnnouncements(req, res) {
  try {
    const { dept, semester, section } = req.query;
    const role = req.user.role;

    const allowedAudiences =
      role === "STUDENT"
        ? ["ALL", "STUDENT"]
        : role === "FACULTY"
        ? ["ALL", "FACULTY"]
        : ["ALL", "STUDENT", "FACULTY"];

    const query = {
      audience: { $in: allowedAudiences }
    };

    const andConditions = [];

    if (dept) {
      andConditions.push({
        $or: [{ dept: "ALL" }, { dept: dept.trim().toUpperCase() }]
      });
    }

    if (semester) {
      andConditions.push({
        $or: [{ semester: { $exists: false } }, { semester: Number(semester) }]
      });
    }

    if (section) {
      andConditions.push({
        $or: [{ section: "" }, { section: section.trim().toUpperCase() }]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const announcements = await Announcement.find(query)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.json({
      ok: true,
      announcements
    });
  } catch (err) {
    console.error("LIST ANNOUNCEMENTS ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
}

export async function getAnnouncementById(req, res) {
  try {
    const announcement = await Announcement.findById(req.params.id).populate(
      "createdBy",
      "name email role"
    );

    if (!announcement) {
      return res.status(404).json({
        ok: false,
        error: "Announcement not found"
      });
    }

    return res.json({
      ok: true,
      announcement
    });
  } catch (err) {
    console.error("GET ANNOUNCEMENT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
}

export async function updateAnnouncement(req, res) {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        ok: false,
        error: "Announcement not found"
      });
    }

    if (
      req.user.role !== "ADMIN" &&
      announcement.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden"
      });
    }

    const parsed = announcementSchema.safeParse({
      ...req.body,
      semester: req.body.semester ? Number(req.body.semester) : undefined,
      dept: req.body.dept?.trim().toUpperCase(),
      section: req.body.section?.trim().toUpperCase()
    });

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.flatten()
      });
    }

    Object.assign(announcement, {
      title: parsed.data.title.trim(),
      message: parsed.data.message.trim(),
      audience: parsed.data.audience || announcement.audience,
      dept: parsed.data.dept || "ALL",
      semester: parsed.data.semester,
      section: parsed.data.section || ""
    });

    await announcement.save();

    return res.json({
      ok: true,
      announcement
    });
  } catch (err) {
    console.error("UPDATE ANNOUNCEMENT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
}

export async function deleteAnnouncement(req, res) {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        ok: false,
        error: "Announcement not found"
      });
    }

    if (
      req.user.role !== "ADMIN" &&
      announcement.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden"
      });
    }

    await announcement.deleteOne();

    return res.json({
      ok: true,
      message: "Announcement deleted successfully"
    });
  } catch (err) {
    console.error("DELETE ANNOUNCEMENT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
}