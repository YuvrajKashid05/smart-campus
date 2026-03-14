import ai from "../config/gemini.js";

import Announcement from "../models/announcement.model.js";
import AttendanceRecord from "../models/attendanceRecord.model.js";
import Complaint from "../models/complaint.model.js";
import Notice from "../models/notice.model.js";
import Timetable from "../models/timetable.model.js";
import User from "../models/user.model.js";

function detectIntent(message) {
  const text = message.toLowerCase();

  if (text.includes("attendance")) return "attendance";
  if (text.includes("timetable") || text.includes("class") || text.includes("schedule")) return "timetable";
  if (text.includes("notice")) return "notices";
  if (text.includes("announcement")) return "announcements";
  if (text.includes("complaint")) return "complaints";
  if (text.includes("profile") || text.includes("my details")) return "profile";
  if (text.includes("defaulter")) return "defaulters";
  if (text.includes("all users") || text.includes("student list") || text.includes("users")) return "users";

  return "general";
}

async function buildSafeContext(user, intent) {
  const role = user.role;

  if (intent === "profile") {
    return {
      type: "profile",
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        mobileNumber: user.mobileNumber,
        dept: user.dept,
        semester: user.semester,
        section: user.section,
        rollNo: user.rollNo,
        employeeId: user.employeeId,
        isActive: user.isActive,
      },
    };
  }

  if (intent === "attendance") {
    if (role === "STUDENT") {
      const records = await AttendanceRecord.find({ student: user._id })
        .populate("session", "course dept section semester year createdAt")
        .sort({ markedAt: -1 })
        .limit(20);

      return {
        type: "attendance",
        data: {
          totalMarked: records.length,
          recentRecords: records.map((r) => ({
            course: r.session?.course || "",
            dept: r.session?.dept || "",
            section: r.session?.section || "",
            semester: r.session?.semester || null,
            year: r.session?.year || null,
            markedAt: r.markedAt,
          })),
        },
      };
    }

    return {
      type: "attendance",
      data: "Only personal attendance answers are enabled in this version.",
    };
  }

  if (intent === "timetable") {
    if (role === "STUDENT") {
      const timetables = await Timetable.find({
        dept: user.dept,
        semester: user.semester,
        section: user.section,
      })
        .populate("faculty", "name email")
        .sort({ day: 1, startTime: 1 });

      return {
        type: "timetable",
        data: timetables.map((t) => ({
          day: t.day,
          slotType: t.slotType,
          title: t.title,
          subject: t.subject,
          room: t.room,
          startTime: t.startTime,
          endTime: t.endTime,
          faculty: t.faculty?.name || "",
        })),
      };
    }

    const timetables = await Timetable.find({})
      .populate("faculty", "name email")
      .sort({ day: 1, startTime: 1 })
      .limit(25);

    return {
      type: "timetable",
      data: timetables.map((t) => ({
        dept: t.dept,
        semester: t.semester,
        section: t.section,
        day: t.day,
        title: t.title,
        subject: t.subject,
        room: t.room,
        startTime: t.startTime,
        endTime: t.endTime,
      })),
    };
  }

  if (intent === "notices") {
    const notices = await Notice.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("createdBy", "name role");

    return {
      type: "notices",
      data: notices.map((n) => ({
        title: n.title,
        body: n.body,
        audience: n.audience,
        createdAt: n.createdAt,
        createdBy: n.createdBy?.name || "",
      })),
    };
  }

  if (intent === "announcements") {
    const announcements = await Announcement.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("createdBy", "name role");

    return {
      type: "announcements",
      data: announcements.map((a) => ({
        title: a.title,
        message: a.message,
        audience: a.audience,
        dept: a.dept,
        semester: a.semester,
        section: a.section,
        createdAt: a.createdAt,
        createdBy: a.createdBy?.name || "",
      })),
    };
  }

  if (intent === "complaints") {
    if (role === "STUDENT") {
      const complaints = await Complaint.find({ createdBy: user._id })
        .sort({ createdAt: -1 })
        .limit(10);

      return {
        type: "complaints",
        data: complaints.map((c) => ({
          category: c.category,
          message: c.message,
          status: c.status,
          createdAt: c.createdAt,
        })),
      };
    }

    return {
      type: "complaints",
      data: "Only personal complaint answers are enabled in this version.",
    };
  }

  if (intent === "users") {
    if (role !== "ADMIN" && role !== "FACULTY") {
      return {
        type: "users",
        data: "You do not have permission to access user lists.",
      };
    }

    const users = await User.find({})
      .select("name email role dept semester section isActive")
      .limit(20);

    return {
      type: "users",
      data: users,
    };
  }

  return {
    type: "general",
    data: "If the user asks general study help, answer briefly and safely. Do not reveal confidential campus data.",
  };
}

export async function chatWithCampusBot(req, res) {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ ok: false, error: "Message is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const intent = detectIntent(message);
    const context = await buildSafeContext(user, intent);

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: `
You are Smart Campus AI Assistant.

Rules:
1. Answer only from the provided campus context whenever campus data is available.
2. Never reveal confidential or unauthorized information.
3. If the user asks for restricted data, clearly refuse.
4. If the question is general study-related and no campus data is needed, answer briefly and safely.
5. Keep answers short, clear, and role-appropriate.

User role: ${user.role}
Detected intent: ${intent}
User message: ${message}

Campus context:
${JSON.stringify(context, null, 2)}
`,
    });

    return res.json({
      ok: true,
      intent,
      contextType: context.type,
      answer: response.text,
    });
  } catch (error) {
    console.error("CHATBOT ERROR:", error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Failed to get chatbot response",
    });
  }
}