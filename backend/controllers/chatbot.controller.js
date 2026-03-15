import ai from "../config/gemini.js";
import Announcement from "../models/announcement.model.js";
import AttendanceRecord from "../models/attendanceRecord.model.js";
import Complaint from "../models/complaint.model.js";
import Notice from "../models/notice.model.js";
import Timetable from "../models/timetable.model.js";
import User from "../models/user.model.js";

function detectIntent(message = "") {
  const t = message.toLowerCase();
  if (t.includes("attendance") || t.includes("present") || t.includes("absent")) return "attendance";
  if (t.includes("timetable") || t.includes("schedule") || t.includes("class") || t.includes("lecture") || t.includes("today")) return "timetable";
  if (t.includes("notice")) return "notices";
  if (t.includes("announcement")) return "announcements";
  if (t.includes("complaint")) return "complaints";
  if (t.includes("profile") || t.includes("my detail") || t.includes("my info") || t.includes("who am i")) return "profile";
  if (t.includes("defaulter")) return "defaulters";
  if (t.includes("explain") || t.includes("what is") || t.includes("how does") || t.includes("help me understand") || t.includes("teach") || t.includes("study")) return "study_help";
  return "general";
}

async function buildContext(user, intent) {
  const role = user.role;

  if (intent === "profile") {
    return { type: "profile", data: { name: user.name, email: user.email, role: user.role, mobile: user.mobileNumber, dept: user.dept, semester: user.semester, section: user.section, rollNo: user.rollNo, employeeId: user.employeeId } };
  }

  if (intent === "attendance") {
    if (role === "STUDENT") {
      const records = await AttendanceRecord.find({ student: user._id }).populate("session", "course dept section semester createdAt").sort({ markedAt: -1 }).limit(20);
      return { type: "attendance", data: { totalMarked: records.length, records: records.map(r => ({ course: r.session?.course || "", dept: r.session?.dept || "", markedAt: r.markedAt })) } };
    }
    return { type: "attendance", data: "Only personal attendance available." };
  }

  if (intent === "timetable") {
    if (role === "STUDENT") {
      const timetables = await Timetable.find({ dept: user.dept, semester: user.semester, section: user.section }).populate("faculty", "name").sort({ day: 1, startTime: 1 });
      return { type: "timetable", data: timetables.map(t => ({ day: t.day, title: t.title, subject: t.subject, room: t.room, startTime: t.startTime, endTime: t.endTime, faculty: t.faculty?.name || "" })) };
    }
    if (role === "FACULTY") {
      const timetables = await Timetable.find({ faculty: user._id }).sort({ day: 1, startTime: 1 });
      return { type: "timetable", data: timetables.map(t => ({ day: t.day, title: t.title, dept: t.dept, semester: t.semester, section: t.section, room: t.room, startTime: t.startTime, endTime: t.endTime })) };
    }
    const timetables = await Timetable.find({}).limit(30).sort({ day: 1, startTime: 1 });
    return { type: "timetable", data: timetables };
  }

  if (intent === "notices") {
    const notices = await Notice.find({}).sort({ createdAt: -1 }).limit(10).populate("createdBy", "name");
    return { type: "notices", data: notices.map(n => ({ title: n.title, body: n.body, audience: n.audience, createdAt: n.createdAt, by: n.createdBy?.name || "" })) };
  }

  if (intent === "announcements") {
    const items = await Announcement.find({}).sort({ createdAt: -1 }).limit(10).populate("createdBy", "name");
    return { type: "announcements", data: items.map(a => ({ title: a.title, message: a.message, audience: a.audience, dept: a.dept, createdAt: a.createdAt, by: a.createdBy?.name || "" })) };
  }

  if (intent === "complaints") {
    if (role === "STUDENT") {
      const complaints = await Complaint.find({ createdBy: user._id }).sort({ createdAt: -1 }).limit(10);
      return { type: "complaints", data: complaints.map(c => ({ category: c.category, message: c.message, status: c.status, createdAt: c.createdAt })) };
    }
    if (role === "ADMIN") {
      const complaints = await Complaint.find({}).sort({ createdAt: -1 }).limit(15).populate("createdBy", "name role dept");
      return { type: "complaints", data: complaints };
    }
    return { type: "complaints", data: "No complaint access for your role." };
  }

  if (intent === "study_help") {
    // Get student's subjects for context
    if (role === "STUDENT") {
      const timetables = await Timetable.find({ dept: user.dept, semester: user.semester, section: user.section }).distinct("title");
      return { type: "study_help", data: { subjects: timetables, dept: user.dept, semester: user.semester } };
    }
    return { type: "study_help", data: "General academic assistant mode." };
  }

  return { type: "general", data: "Answer general study/campus questions briefly and safely." };
}

export async function chatWithCampusBot(req, res) {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ ok: false, error: "Message is required" });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ ok: false, error: "AI not configured. Add GEMINI_API_KEY to .env" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const intent = detectIntent(message);
    const context = await buildContext(user, intent);

    // Build multi-turn conversation
    const systemPrompt = `You are Smart Campus AI — a helpful, friendly academic assistant for a college campus management system.
Rules:
1. Use the provided campus context when answering campus-related questions.
2. Never reveal unauthorized or confidential information.
3. For study questions, be a helpful tutor — explain clearly with examples.
4. Keep answers concise and well-formatted (use bullet points where helpful).
5. Remember the conversation history to give contextual follow-up answers.
User: ${user.name} | Role: ${user.role} | Dept: ${user.dept || "N/A"}
Intent: ${intent}
Campus Data: ${JSON.stringify(context)}`;

    // Multi-turn: combine history + new message
    const conversationHistory = history.slice(-8).map(h => `${h.role === "user" ? "User" : "Assistant"}: ${h.text}`).join("\n");
    const fullPrompt = conversationHistory
      ? `${systemPrompt}\n\nConversation so far:\n${conversationHistory}\n\nUser: ${message}\nAssistant:`
      : `${systemPrompt}\n\nUser: ${message}\nAssistant:`;

    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: fullPrompt,
    });

    const answer = result?.text || result?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I could not generate an answer.";
    return res.json({ ok: true, intent, contextType: context.type, answer });
  } catch (error) {
    console.error("CHATBOT ERROR:", error?.message || error);
    return res.status(500).json({ ok: false, error: error?.message || "Failed to get chatbot response" });
  }
}
