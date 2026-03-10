import { z } from "zod";
import Notice from "../models/notice.model.js";

const createSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  body: z.string().min(5, "Body must be at least 5 characters"),
  audience: z.enum(["ALL", "STUDENT", "FACULTY"]).optional(),
});

export async function createNotice(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues });
    }

    const { title, body, audience = "ALL" } = parsed.data;

    const notice = await Notice.create({
      title,
      body,
      audience,
      createdBy: req.user._id,
    });

    return res.status(201).json({ ok: true, notice });
  } catch (err) {
    console.error("CREATE NOTICE ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function listNotices(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const role = req.user.role;

    const allowedAudiences =
      role === "STUDENT"
        ? ["ALL", "STUDENT"]
        : role === "FACULTY"
        ? ["ALL", "FACULTY"]
        : ["ALL", "STUDENT", "FACULTY"];

    const notices = await Notice.find({
      audience: { $in: allowedAudiences },
    })
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ ok: true, notices });
  } catch (err) {
    console.error("LIST NOTICES ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function getNoticeById(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const notice = await Notice.findById(req.params.id).populate(
      "createdBy",
      "name role"
    );

    if (!notice) {
      return res.status(404).json({ ok: false, error: "Notice not found" });
    }

    const role = req.user.role;
    const allowedAudiences =
      role === "STUDENT"
        ? ["ALL", "STUDENT"]
        : role === "FACULTY"
        ? ["ALL", "FACULTY"]
        : ["ALL", "STUDENT", "FACULTY"];

    if (!allowedAudiences.includes(notice.audience)) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    return res.json({ ok: true, notice });
  } catch (err) {
    console.error("GET NOTICE ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function updateNotice(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ ok: false, error: "Notice not found" });
    }

    if (
      req.user.role !== "ADMIN" &&
      notice.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues });
    }

    notice.title = parsed.data.title;
    notice.body = parsed.data.body;
    notice.audience = parsed.data.audience ?? notice.audience;

    await notice.save();

    return res.json({ ok: true, notice });
  } catch (err) {
    console.error("UPDATE NOTICE ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function deleteNotice(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ ok: false, error: "Notice not found" });
    }

    if (
      req.user.role !== "ADMIN" &&
      notice.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    await notice.deleteOne();

    return res.json({ ok: true, message: "Notice deleted successfully" });
  } catch (err) {
    console.error("DELETE NOTICE ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}