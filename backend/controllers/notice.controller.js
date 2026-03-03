import { z } from "zod";
import Notice from "../models/notice.model.js";

/* -------------------- Validation -------------------- */

const createSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  body: z.string().min(5, "Body must be at least 5 characters"),
  audience: z.enum(["ALL", "STUDENT", "FACULTY"]).optional()
});

/* -------------------- CREATE NOTICE (ADMIN / FACULTY) -------------------- */

export async function createNotice(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues
      });
    }

    const { title, body, audience = "ALL" } = parsed.data;

    const notice = await Notice.create({
      title,
      body,
      audience,
      createdBy: req.user._id
    });

    return res.status(201).json({ ok: true, notice });
  } catch (err) {
    console.error("CREATE NOTICE ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

/* -------------------- LIST NOTICES (ROLE-BASED) -------------------- */

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
        : ["ALL", "STUDENT", "FACULTY"]; // ADMIN

    const notices = await Notice.find({ audience: { $in: allowedAudiences } })
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ ok: true, notices });
  } catch (err) {
    console.error("LIST NOTICES ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}