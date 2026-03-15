import { z } from "zod";
import ai from "../config/gemini.js";
import Complaint from "../models/complaint.model.js";

const createSchema = z.object({
  category: z.enum(["IT","FACILITY","ACADEMIC","OTHER"]).optional(),
  message: z.string().min(5, "Message must be at least 5 characters"),
});
const updateStatusSchema = z.object({ status: z.enum(["OPEN","IN_PROGRESS","RESOLVED"]) });

async function getAIAnalysis(message, category) {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const prompt = `Analyze this campus complaint. Respond ONLY with valid JSON (no markdown):
    Category: ${category}
    Complaint: "${message}"
    {"priority":"HIGH"|"MEDIUM"|"LOW","estimatedDays":<1-14>,"department":"<dept>","suggestedResponse":"<2 sentences>","tags":["<tag>"]}`;

    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
    });
    
    const raw = (result?.text || "").replace(/```json|```/g, "").trim();

    return JSON.parse(raw);

  } catch { return null; }
}

export async function createComplaint(req, res) {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    const parsed = createSchema.safeParse(req.body);

    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
    const { category = "OTHER", message } = parsed.data;

    // AI analysis (non-blocking — runs in background, saved if available)
    const aiAnalysis = await getAIAnalysis(message, category);

    const complaint = await Complaint.create({
      category, message,
      createdBy: req.user._id,
      aiPriority: aiAnalysis?.priority || null,
      aiEstimatedDays: aiAnalysis?.estimatedDays || null,
      aiDepartment: aiAnalysis?.department || null,
      aiSuggestedResponse: aiAnalysis?.suggestedResponse || null,
      aiTags: aiAnalysis?.tags || [],
    });

    return res.status(201).json({ ok: true, complaint, aiAnalysis });

  } catch (err) {
    console.error("CREATE COMPLAINT ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function myComplaints(req, res) {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    const complaints = await Complaint.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).limit(100);
    return res.json({ ok: true, complaints });
  } catch (err) { return res.status(500).json({ ok: false, error: "Server error" }); }
}

export async function allComplaints(req, res) {
  try {
    if (!req.user || req.user.role !== "ADMIN") return res.status(403).json({ ok: false, error: "Forbidden" });
    const complaints = await Complaint.find()
      .populate("createdBy", "name role dept")
      .populate("assignedTo", "name role")
      .sort({ createdAt: -1 }).limit(200);
    
    return res.json({ ok: true, complaints });

  } catch (err) { return res.status(500).json({ ok: false, error: "Server error" }); }
}

export async function getComplaintById(req, res) {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("createdBy", "name role dept").populate("assignedTo", "name role");
    
    if (!complaint) return res.status(404).json({ ok: false, error: "Complaint not found" });

    if (req.user.role !== "ADMIN" && complaint.createdBy._id.toString() !== req.user._id.toString())
      return res.status(403).json({ ok: false, error: "Forbidden" });

    return res.json({ ok: true, complaint });

  } catch (err) { return res.status(500).json({ ok: false, error: "Server error" }); }
}

export async function updateComplaintStatus(req, res) {
  try {
    if (!req.user || req.user.role !== "ADMIN") return res.status(403).json({ ok: false, error: "Forbidden" });
    const parsed = updateStatusSchema.safeParse(req.body);

    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id, { status: parsed.data.status }, { new: true }
    ).populate("createdBy", "name role dept");

    if (!complaint) return res.status(404).json({ ok: false, error: "Complaint not found" });
    return res.json({ ok: true, complaint });

  } catch (err) { return res.status(500).json({ ok: false, error: "Server error" }); }
}
