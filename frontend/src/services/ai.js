import api from "./api";

// ── AI Notice Generator ──────────────────────────────────────────────
export const generateNotice = (topic, audience) =>
  api
    .post("/ai/generate-notice", { topic, audience })
    .then((r) => r.data);

// ── AI Announcement Generator ────────────────────────────────────────
export const generateAnnouncement = (topic, audience, dept) =>
  api
    .post("/ai/generate-announcement", { topic, audience, dept })
    .then((r) => r.data);

// ── Complaint Analyzer ───────────────────────────────────────────────
export const analyzeComplaint = (message, category) =>
  api
    .post("/ai/analyze-complaint", { message, category })
    .then((r) => r.data);

// ── Attendance Risk Predictor ────────────────────────────────────────
export const getAttendanceRisk = (params) =>
  api
    .get("/ai/attendance-risk", { params })
    .then((r) => r.data);

// ── Weekly Campus Report ─────────────────────────────────────────────
export const getWeeklyReport = () =>
  api
    .get("/ai/weekly-report")
    .then((r) => r.data);

// ── Study Help ───────────────────────────────────────────────────────
export const getStudyHelp = (question, subject) =>
  api
    .post("/ai/study-help", { question, subject })
    .then((r) => r.data);