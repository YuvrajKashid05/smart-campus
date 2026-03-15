import dotenv from "dotenv";
dotenv.config(); // MUST be first

import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import connectDB from "./config/db.js";
import {
  aiLimiter,
  attendanceLimiter,
  authLimiter,
  complaintLimiter,
  globalLimiter
} from "./middlewares/rateLimiter.js";

import aiRoutes from "./routes/ai.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import authRoutes from "./routes/auth.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import noticeRoutes from "./routes/notice.routes.js";
import timetableRoutes from "./routes/timetable.routes.js";
import userRoutes from "./routes/user.routes.js";

const app  = express();
const PROD = process.env.NODE_ENV === "production";

// ── Security headers ──────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ── Request logging ───────────────────────────────────────────────────
app.use(morgan(PROD ? "combined" : "dev"));

// ── CORS ──────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",").map(v => v.trim()).filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ── Body parser ───────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));

// ── Global rate limit (all routes) ───────────────────────────────────
app.use(globalLimiter);

// ── Health check ──────────────────────────────────────────────────────
app.get("/", (_req, res) => res.json({ ok: true, message: "Smart Campus API 🚀", env: process.env.NODE_ENV || "development" }));

// ── Routes with targeted limits ───────────────────────────────────────
app.use("/api/auth",authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/complaints", complaintLimiter, complaintRoutes);
app.use("/api/attendance", attendanceLimiter, attendanceRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/chatbot", aiLimiter, chatbotRoutes);

//404 Handler
app.use((req, res) => {
  res.status(404).json({ ok: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

//Global error handling
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = PROD ? "Internal server error" : (err.message || "Internal server error");
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message || err);
  res.status(status).json({ ok: false, error: message });
});

//Start
const PORT = process.env.PORT || 5000;
try {
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () => {
    console.log("✅ DB connected");
    console.log(`🚀 Server → http://localhost:${PORT}`);
    console.log(`🔒 Rate limiting → active`);
    console.log(`🛡️  Helmet security → active`);
    console.log(`🤖 Gemini → ${process.env.GEMINI_API_KEY ? "✅ Key loaded" : "❌ GEMINI_API_KEY missing"}`);
  });
} catch (err) {
  console.error("❌ DB error:", err?.message || err);
  process.exit(1);
}
