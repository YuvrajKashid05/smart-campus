import ai from "../config/gemini.js";
import Announcement from "../models/announcement.model.js";
import AttendanceRecord from "../models/attendanceRecord.model.js";
import AttendanceSession from "../models/attendanceSession.model.js";
import Complaint from "../models/complaint.model.js";
import Notice from "../models/notice.model.js";
import User from "../models/user.model.js";

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
  return result?.text || result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ── 1. AI Notice Generator ────────────────────────────────────────────
export async function generateNotice(req, res) {
  try {
    if (!requireKey(res)) return;
    const { topic, audience = "ALL" } = req.body;
    if (!topic?.trim()) return res.status(400).json({ ok: false, error: "Topic is required" });

    const prompt = `You are a college administrative officer. Write a professional, formal college notice.
Topic: "${topic}"
Target audience: ${audience}
Requirements:
- Start directly with the notice content (no "Notice:" heading)
- Keep it under 120 words
- Use formal language
- Include relevant details based on the topic
- End with appropriate closing
Write only the notice body text, nothing else.`;

    const text = await gemini(prompt);
    return res.json({ ok: true, text: text.trim() });
  } catch (err) {
    console.error("GENERATE NOTICE ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message || "Failed to generate notice" });
  }
}

// ── 2. AI Announcement Generator ─────────────────────────────────────
export async function generateAnnouncement(req, res) {
  try {
    if (!requireKey(res)) return;
    const { topic, audience = "ALL", dept = "" } = req.body;
    if (!topic?.trim()) return res.status(400).json({ ok: false, error: "Topic is required" });

    const prompt = `You are a college faculty member writing an announcement.
Topic: "${topic}"
Target audience: ${audience}${dept ? `, Department: ${dept}` : ""}
Requirements:
- Write an engaging, clear announcement
- Under 100 words
- Friendly but professional tone
- Include a call to action if relevant
Write only the announcement text, nothing else.`;

    const text = await gemini(prompt);
    return res.json({ ok: true, text: text.trim() });
  } catch (err) {
    console.error("GENERATE ANNOUNCEMENT ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message || "Failed to generate announcement" });
  }
}

// ── 3. AI Complaint Auto-Analyzer ────────────────────────────────────
export async function analyzeComplaint(req, res) {
  try {
    if (!requireKey(res)) return;
    const { message, category } = req.body;
    if (!message?.trim()) return res.status(400).json({ ok: false, error: "Complaint message required" });

    const prompt = `Analyze this college campus complaint and respond ONLY with valid JSON (no markdown, no explanation):
Category: ${category || "OTHER"}
Complaint: "${message}"

Respond with exactly this JSON structure:
{
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "estimatedDays": <number 1-14>,
  "department": "IT department" | "Facility management" | "Academic office" | "Administration",
  "suggestedResponse": "<a professional 2-3 sentence response to the student>",
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
        suggestedResponse: "Thank you for your complaint. We have received your concern and will look into it promptly.",
        tags: [category || "general"]
      };
    }
    return res.json({ ok: true, analysis });
  } catch (err) {
    console.error("ANALYZE COMPLAINT ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message || "Failed to analyze complaint" });
  }
}

// ── 4. AI Attendance Risk Predictor ──────────────────────────────────
export async function attendanceRiskReport(req, res) {
  try {
    if (!requireKey(res)) return;
    if (req.user.role !== "FACULTY" && req.user.role !== "ADMIN") {
      return res.status(403).json({ ok: false, error: "Faculty/Admin only" });
    }

    const { dept, semester, section } = req.query;
    const filter = { role: "STUDENT" };
    if (dept) filter.dept = dept.toUpperCase();
    if (semester) filter.semester = parseInt(semester);
    if (section) filter.section = section.toUpperCase();

    const students = await User.find(filter).select("_id name rollNo dept semester section").limit(40);
    if (!students.length) return res.json({ ok: true, report: [], summary: "No students found." });

    // Get attendance counts per student
    const studentStats = await Promise.all(students.map(async (s) => {
      const totalSessions = await AttendanceSession.countDocuments({
        ...(dept ? { dept: dept.toUpperCase() } : {}),
        ...(semester ? { semester: parseInt(semester) } : {}),
      });
      const attended = await AttendanceRecord.countDocuments({ student: s._id });
      const pct = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
      return { name: s.name, rollNo: s.rollNo, attended, total: totalSessions, pct };
    }));

    const prompt = `You are an academic advisor. Analyze these student attendance statistics and provide a risk assessment.
Data: ${JSON.stringify(studentStats)}
Threshold: 75% is minimum required attendance.

Respond ONLY with valid JSON (no markdown):
{
  "highRisk": [{"name":"...","rollNo":"...","pct":0,"reason":"..."}],
  "mediumRisk": [{"name":"...","rollNo":"...","pct":0,"reason":"..."}],
  "summary": "<2-3 sentence overall assessment>",
  "recommendation": "<actionable recommendation for faculty>"
}`;

    const raw = await gemini(prompt);
    let report;
    try {
      report = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      report = { highRisk: studentStats.filter(s => s.pct < 75), mediumRisk: studentStats.filter(s => s.pct >= 75 && s.pct < 85), summary: "Could not generate AI analysis.", recommendation: "Review students below 75% attendance." };
    }
    return res.json({ ok: true, report, raw: studentStats });
  } catch (err) {
    console.error("RISK REPORT ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message || "Failed to generate risk report" });
  }
}

// ── 5. AI Weekly Campus Report (Admin) ───────────────────────────────
export async function weeklyReport(req, res) {
  try {
    if (!requireKey(res)) return;
    if (req.user.role !== "ADMIN") return res.status(403).json({ ok: false, error: "Admin only" });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalStudents, totalFaculty, newComplaints, openComplaints,
           resolvedComplaints, newNotices, newAnnouncements, newSessions] = await Promise.all([
      User.countDocuments({ role: "STUDENT" }),
      User.countDocuments({ role: "FACULTY" }),
      Complaint.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Complaint.countDocuments({ status: "OPEN" }),
      Complaint.countDocuments({ status: "RESOLVED", updatedAt: { $gte: sevenDaysAgo } }),
      Notice.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Announcement.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      AttendanceSession.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    const stats = {
      period: "Last 7 days",
      totalStudents, totalFaculty,
      complaints: { new: newComplaints, open: openComplaints, resolved: resolvedComplaints },
      content: { newNotices, newAnnouncements },
      attendance: { sessionsHeld: newSessions },
    };

    const prompt = `You are a college administrator. Write a concise weekly campus health report.
Data: ${JSON.stringify(stats)}

Write a professional executive summary in 3-4 short paragraphs covering:
1. Overall campus activity this week
2. Complaint status and resolution health
3. Communication activity (notices/announcements)
4. One key recommendation

Keep it professional and actionable. Under 200 words.`;

    const summary = await gemini(prompt);
    return res.json({ ok: true, stats, summary: summary.trim() });
  } catch (err) {
    console.error("WEEKLY REPORT ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message || "Failed to generate report" });
  }
}

// ── 6. Study Help ──────────────────────────────────────────────────────
export async function studyHelp(req, res) {
  try {
    if (!requireKey(res)) return;
    const { question, subject } = req.body;
    if (!question?.trim()) return res.status(400).json({ ok: false, error: "Question is required" });

    const prompt = `You are a helpful academic tutor for college students.
${subject ? `Subject context: ${subject}` : ""}
Student question: "${question}"

Answer clearly and concisely. Use bullet points or numbered steps where helpful.
Keep the answer educational and easy to understand for a college student.
Maximum 200 words.`;

    const answer = await gemini(prompt);
    return res.json({ ok: true, answer: answer.trim() });
  } catch (err) {
    console.error("STUDY HELP ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message || "Failed to get study help" });
  }
}

// ── Legacy ask endpoint ───────────────────────────────────────────────
export async function ask(req, res) {
  const { question } = req.body;
  if (!question?.trim()) return res.status(400).json({ ok: false, error: "Question required" });
  try {
    if (!requireKey(res)) return;
    const answer = await gemini(`Answer this campus-related question briefly: "${question}"`);
    return res.json({ ok: true, answer });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
