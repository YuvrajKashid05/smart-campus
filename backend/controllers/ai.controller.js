import ai from "../config/gemini.js";
import Announcement from "../models/announcement.model.js";
import AttendanceRecord from "../models/attendanceRecord.model.js";
import AttendanceSession from "../models/attendanceSession.model.js";
import Complaint from "../models/complaint.model.js";
import Notice from "../models/notice.model.js";
import User from "../models/user.model.js";

//input sanitization
function sanitizeAIInput(str = "", maxLen = 500) {
  if (typeof str !== "string") return "";
  return str
    .slice(0, maxLen)
    .replace(
      /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
      "[removed]"
    )
    .replace(/system\s*prompt/gi, "[removed]")
    .replace(/you\s+are\s+now/gi, "[removed]")
    .replace(/jailbreak/gi, "[removed]")
    .trim();
}

//reuire gemini key
function requireKey(res) {
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ ok: false, error: "GEMINI_API_KEY not set in .env" });
    return false;
  }
  return true;
}

async function gemini(prompt) {
  const result = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: prompt,
  });

  return (
    result?.text ||
    result?.candidates?.[0]?.content?.parts?.[0]?.text ||
    ""
  );
}

//generate notice
export async function generateNotice(req, res) {
  try {
    if (!requireKey(res)) return;

    const { audience = "ALL" } = req.body;
    const topic = sanitizeAIInput(req.body.topic);

    if (!topic) {
      return res.status(400).json({ ok: false, error: "Topic is required" });
    }

    const prompt = `You are a college administrative officer. Write a professional, formal college notice.
Topic: "${topic}"
Target audience: ${audience}

Rules:
- Start directly with the notice content
- Keep it under 120 words
- Use formal language
- End with a suitable closing

Write only the notice body.`;

    const text = await gemini(prompt);
    return res.json({ ok: true, text: text.trim() });
  } catch (err) {
    console.error("GENERATE NOTICE ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to generate notice",
    });
  }
}

//generate annoucement
export async function generateAnnouncement(req, res) {
  try {
    if (!requireKey(res)) return;

    const { audience = "ALL", dept = "" } = req.body;
    const topic = sanitizeAIInput(req.body.topic);

    if (!topic) {
      return res.status(400).json({ ok: false, error: "Topic is required" });
    }

    const prompt = `You are a college faculty member writing an announcement.
Topic: "${topic}"
Target audience: ${audience}${dept ? `, Department: ${dept}` : ""}

Rules:
- Keep it under 100 words
- Friendly but professional
- Clear and direct
- Add a call to action only if needed

Write only the announcement text.`;

    const text = await gemini(prompt);
    return res.json({ ok: true, text: text.trim() });
  } catch (err) {
    console.error("GENERATE ANNOUNCEMENT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to generate announcement",
    });
  }
}

//analyze complain
export async function analyzeComplaint(req, res) {
  try {
    if (!requireKey(res)) return;

    const { category } = req.body;
    const message = sanitizeAIInput(req.body.message, 1000);

    if (!message) {
      return res.status(400).json({
        ok: false,
        error: "Complaint message required",
      });
    }

    const prompt = `Analyze this college campus complaint and respond ONLY with valid JSON.
Category: ${category || "OTHER"}
Complaint: "${message}"

Respond with exactly:
{
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "estimatedDays": <number 1-14>,
  "department": "IT department" | "Facility management" | "Academic office" | "Administration",
  "suggestedResponse": "<short professional reply>",
  "tags": ["<tag1>", "<tag2>"]
}`;

    const raw = await gemini(prompt);

    let analysis;
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = {
        priority: "MEDIUM",
        estimatedDays: 5,
        department: "Administration",
        suggestedResponse:
          "Thank you for your complaint. We have received your concern and will review it shortly.",
        tags: [category || "general"],
      };
    }

    return res.json({ ok: true, analysis });
  } catch (err) {
    console.error("ANALYZE COMPLAINT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to analyze complaint",
    });
  }
}

//attendance report
export async function attendanceRiskReport(req, res) {
  try {
    if (!requireKey(res)) return;

    if (req.user.role !== "FACULTY" && req.user.role !== "ADMIN") {
      return res.status(403).json({ ok: false, error: "Faculty/Admin only" });
    }

    const { dept, semester, section } = req.query;

    const filter = { role: "STUDENT" };
    if (dept) filter.dept = dept.toUpperCase();
    if (semester) filter.semester = parseInt(semester, 10);
    if (section) filter.section = section.toUpperCase();

    const students = await User.find(filter)
      .select("_id name rollNo dept semester section")
      .limit(40);

    if (!students.length) {
      return res.json({ ok: true, report: [], summary: "No students found." });
    }

    const totalSessionFilter = {};
    if (dept) totalSessionFilter.dept = dept.toUpperCase();
    if (semester) totalSessionFilter.semester = parseInt(semester, 10);
    if (section) totalSessionFilter.section = section.toUpperCase();

    const totalSessions = await AttendanceSession.countDocuments(totalSessionFilter);

    const studentStats = await Promise.all(
      students.map(async (student) => {
        const attended = await AttendanceRecord.countDocuments({
          student: student._id,
        });

        const pct =
          totalSessions > 0
            ? Math.round((attended / totalSessions) * 100)
            : 0;

        return {
          name: student.name,
          rollNo: student.rollNo,
          attended,
          total: totalSessions,
          pct,
        };
      })
    );

    const prompt = `You are a university attendance analytics assistant.

Goal:
Find defaulters and return only compact JSON.

Rules:
- Below 75% = highRisk
- 75% to 84% = mediumRisk
- 85% and above = safe, do not include
- reason must be short
- summary must be one short sentence
- recommendation must be one short sentence

Return ONLY valid JSON in this exact shape:
{
  "highRisk": [{"name":"", "rollNo":"", "pct":0, "reason":""}],
  "mediumRisk": [{"name":"", "rollNo":"", "pct":0, "reason":""}],
  "summary": "",
  "recommendation": ""
}

Data:
${JSON.stringify(studentStats)}`;

    const raw = await gemini(prompt);

    let report;
    try {
      report = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      report = {
        highRisk: studentStats
          .filter((student) => student.pct < 75)
          .map((student) => ({
            name: student.name,
            rollNo: student.rollNo,
            pct: student.pct,
            reason: "Below minimum attendance",
          })),
        mediumRisk: studentStats
          .filter((student) => student.pct >= 75 && student.pct < 85)
          .map((student) => ({
            name: student.name,
            rollNo: student.rollNo,
            pct: student.pct,
            reason: "Near attendance threshold",
          })),
        summary: "Some students are below or close to the minimum attendance limit.",
        recommendation: "Contact high-risk students and monitor medium-risk students.",
      };
    }

    return res.json({ ok: true, report, raw: studentStats });
  } catch (err) {
    console.error("RISK REPORT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to generate risk report",
    });
  }
}

//weekly report
export async function weeklyReport(req, res) {
  try {
    if (!requireKey(res)) return;

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ ok: false, error: "Admin only" });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalStudents,
      totalFaculty,
      newComplaints,
      openComplaints,
      resolvedComplaints,
      newNotices,
      newAnnouncements,
      newSessions,
    ] = await Promise.all([
      User.countDocuments({ role: "STUDENT" }),
      User.countDocuments({ role: "FACULTY" }),
      Complaint.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Complaint.countDocuments({ status: "OPEN" }),
      Complaint.countDocuments({
        status: "RESOLVED",
        updatedAt: { $gte: sevenDaysAgo },
      }),
      Notice.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Announcement.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      AttendanceSession.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    const stats = {
      period: "Last 7 days",
      totalStudents,
      totalFaculty,
      complaints: {
        new: newComplaints,
        open: openComplaints,
        resolved: resolvedComplaints,
      },
      content: {
        newNotices,
        newAnnouncements,
      },
      attendance: {
        sessionsHeld: newSessions,
      },
    };

    const prompt = `You are a college administrator. Write a concise weekly campus report.
Data: ${JSON.stringify(stats)}

Write 3-4 short paragraphs covering:
1. Overall campus activity
2. Complaint status
3. Notices and announcements
4. One recommendation

Keep it under 200 words.`;

    const summary = await gemini(prompt);

    return res.json({
      ok: true,
      stats,
      summary: summary.trim(),
    });
  } catch (err) {
    console.error("WEEKLY REPORT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to generate report",
    });
  }
}

//stude helo (chatbot)
export async function studyHelp(req, res) {
  try {
    if (!requireKey(res)) return;

    const subject = sanitizeAIInput(req.body.subject || "", 100);
    const question = sanitizeAIInput(req.body.question);

    if (!question) {
      return res.status(400).json({ ok: false, error: "Question is required" });
    }

    const prompt = `You are a helpful academic tutor for college students.
${subject ? `Subject: ${subject}` : ""}
Question: "${question}"

Answer clearly and concisely.
Use bullet points only if needed.
Keep the answer under 200 words.`;

    const answer = await gemini(prompt);
    return res.json({ ok: true, answer: answer.trim() });
  } catch (err) {
    console.error("STUDY HELP ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to get study help",
    });
  }
}

//ask to Gemini
export async function ask(req, res) {
  try {
    if (!requireKey(res)) return;

    const question = sanitizeAIInput(req.body.question);
    if (!question) {
      return res.status(400).json({ ok: false, error: "Question is required" });
    }

    const answer = await gemini(question);
    return res.json({ ok: true, answer: answer.trim() });
  } catch (err) {
    console.error("ASK ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to get answer",
    });
  }
}