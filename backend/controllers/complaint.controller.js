import { z } from "zod";
import Complaint from "../models/complaint.model.js";

const createSchema = z.object({
  category: z.enum(["IT", "FACILITY", "ACADEMIC", "OTHER"]).optional(),
  message: z.string().min(5, "Message must be at least 5 characters")
});

const updateStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"])
});

export async function createComplaint(req, res) {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
    const { category = "OTHER", message } = parsed.data;
    const complaint = await Complaint.create({ category, message, createdBy: req.user._id });
    return res.status(201).json({ ok: true, complaint });
  } catch (err) {
    console.error("CREATE COMPLAINT ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function myComplaints(req, res) {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    const complaints = await Complaint.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 }).limit(100);
    return res.json({ ok: true, complaints });
  } catch (err) {
    console.error("MY COMPLAINTS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function allComplaints(req, res) {
  try {
    if (!req.user || req.user.role !== "ADMIN")
      return res.status(403).json({ ok: false, error: "Forbidden" });
    const complaints = await Complaint.find()
      .populate("createdBy", "name role dept")
      .populate("assignedTo", "name role")
      .sort({ createdAt: -1 }).limit(200);
    return res.json({ ok: true, complaints });
  } catch (err) {
    console.error("ALL COMPLAINTS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function getComplaintById(req, res) {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("createdBy", "name role dept")
      .populate("assignedTo", "name role");
    if (!complaint) return res.status(404).json({ ok: false, error: "Complaint not found" });
    // Only owner or admin can view
    if (req.user.role !== "ADMIN" && complaint.createdBy._id.toString() !== req.user._id.toString())
      return res.status(403).json({ ok: false, error: "Forbidden" });
    return res.json({ ok: true, complaint });
  } catch (err) {
    console.error("GET COMPLAINT ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function updateComplaintStatus(req, res) {
  try {
    if (!req.user || req.user.role !== "ADMIN")
      return res.status(403).json({ ok: false, error: "Forbidden" });
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: parsed.data.status },
      { new: true }
    ).populate("createdBy", "name role dept");
    if (!complaint) return res.status(404).json({ ok: false, error: "Complaint not found" });
    return res.json({ ok: true, complaint });
  } catch (err) {
    console.error("UPDATE COMPLAINT STATUS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
