import ai from "../config/gemini.js";
import Announcement from "../models/announcement.model.js";
import AttendanceRecord from "../models/attendanceRecord.model.js";
import Complaint from "../models/complaint.model.js";
import Notice from "../models/notice.model.js";
import Timetable from "../models/timetable.model.js";
import User from "../models/user.model.js";

function detectIntent(message = "") {
  const t = message.toLowerCase();
  if (t.includes("attendance")) return "attendance";
  if (t.includes("timetable") || t.includes("schedule") || t.includes("class") || t.includes("lecture")) return "timetable";
  if (t.includes("notice")) return "notices";
  if (t.includes("announcement")) return "announcements";
  if (t.includes("complaint")) return "complaints";
  if (t.includes("profile") || t.includes("my detail") || t.includes("my info")) return "profile";
  if (t.includes("defaulter")) return "defaulters";
  if (t.includes("student list") || t.includes("all users") || t.includes("user list")) return "users";
  return "general";
}

async function buildContext(user, intent) {
  const role = user.role;

  if (intent === "profile") {
    return {
      type: "profile",
      data: {
        name: user.name, email: user.email, role: user.role,
        mobile: user.mobileNumber, dept: user.dept,
        semester: user.semester, section: user.section,
        rollNo: user.rollNo, employeeId: user.employeeId,
        isActive: user.isActive,
      },
    };
  }

  if (intent === "attendance") {
    if (role === "STUDENT") {
      const records = await AttendanceRecord.find({ student: user._id })
        .populate("session", "course dept section semester createdAt")
        .sort({ markedAt: -1 })
        .limit(20);
      return {
        type: "attendance",
        data: {
          totalMarked: records.length,
          records: records.map(r => ({
            course: r.session?.course || "",
            dept: r.session?.dept || "",
            markedAt: r.markedAt,
          })),
        },
      };
    }
    return { type: "attendance", data: "Only personal attendance available." };
  }

  if (intent === "timetable") {
    if (role === "STUDENT") {
      const timetables = await Timetable.find({
        dept: user.dept, semester: user.semester, section: user.section,
      }).populate("faculty", "name").sort({ day: 1, startTime: 1 });
      return {
        type: "timetable",
        data: timetables.map(t => ({
          day: t.day, title: t.title, subject: t.subject,
          room: t.room, startTime: t.startTime, endTime: t.endTime,
          faculty: t.faculty?.name || "",
        })),
      };
    }
    if (role === "FACULTY") {
      const timetables = await Timetable.find({ faculty: user._id })
        .sort({ day: 1, startTime: 1 });
      return {
        type: "timetable",
        data: timetables.map(t => ({
          day: t.day, title: t.title, dept: t.dept,
          semester: t.semester, section: t.section,
          room: t.room, startTime: t.startTime, endTime: t.endTime,
        })),
      };
    }
    const timetables = await Timetable.find({}).limit(30).sort({ day: 1, startTime: 1 });
    return { type: "timetable", data: timetables };
  }

  if (intent === "notices") {
    const notices = await Notice.find({})
      .sort({ createdAt: -1 }).limit(10).populate("createdBy", "name");
    return {
      type: "notices",
      data: notices.map(n => ({
        title: n.title, body: n.body, audience: n.audience,
        createdAt: n.createdAt, by: n.createdBy?.name || "",
      })),
    };
  }

  if (intent === "announcements") {
    const items = await Announcement.find({})
      .sort({ createdAt: -1 }).limit(10).populate("createdBy", "name");
    return {
      type: "announcements",
      data: items.map(a => ({
        title: a.title, message: a.message, audience: a.audience,
        dept: a.dept, semester: a.semester, section: a.section,
        createdAt: a.createdAt, by: a.createdBy?.name || "",
      })),
    };
  }

  if (intent === "complaints") {
    if (role === "STUDENT") {
      const complaints = await Complaint.find({ createdBy: user._id })
        .sort({ createdAt: -1 }).limit(10);
      return {
        type: "complaints",
        data: complaints.map(c => ({
          category: c.category, message: c.message,
          status: c.status, createdAt: c.createdAt,
        })),
      };
    }
    if (role === "ADMIN") {
      const complaints = await Complaint.find({})
        .sort({ createdAt: -1 }).limit(15)
        .populate("createdBy", "name role dept");
      return { type: "complaints", data: complaints };
    }
    return { type: "complaints", data: "No complaint access for your role." };
  }

  if (intent === "users") {
    if (role !== "ADMIN" && role !== "FACULTY") {
      return { type: "users", data: "You do not have permission to access user lists." };
    }
    const users = await User.find({})
      .select("name email role dept semester section isActive").limit(20);
    return { type: "users", data: users };
  }

  return {
    type: "general",
    data: "Answer general study/campus questions briefly and safely.",
  };
}

export async function chatWithCampusBot(req, res) {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ ok: false, error: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        ok: false,
        error: "AI is not configured. Add GEMINI_API_KEY to your .env file.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const intent = detectIntent(message);
    const context = await buildContext(user, intent);

    const prompt = `You are Smart Campus AI Assistant — a helpful, friendly academic assistant.

Rules:
1. Answer ONLY using the provided campus context when campus data is available.
2. Never reveal confidential or unauthorized information.
3. If the user asks for restricted data, clearly refuse.
4. For general study questions with no campus data needed, answer briefly.
5. Keep answers concise, clear and role-appropriate.
6. Format nicely — use bullet points or short paragraphs where helpful.

User Role: ${user.role}
User Name: ${user.name}
Detected Intent: ${intent}
User Message: ${message}

Campus Context:
${JSON.stringify(context, null, 2)}`;

    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
    });

    // @google/genai v1.x — response.text is a direct string property
    const answer = result?.text || result?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I could not generate an answer.";

    return res.json({ ok: true, intent, contextType: context.type, answer });
  } catch (error) {
    console.error("CHATBOT ERROR:", error?.message || error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Failed to get chatbot response",
    });
  }
}
