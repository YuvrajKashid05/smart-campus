import dotenv from "dotenv";
dotenv.config(); // MUST be first — before any import reads process.env

import cors from "cors";
import express from "express";
import connectDB from "./config/db.js";
import aiRoutes from "./routes/ai.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import authRoutes from "./routes/auth.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import noticeRoutes from "./routes/notice.routes.js";
import timetableRoutes from "./routes/timetable.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",").map(v => v.trim()).filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => res.send("Smart Campus API 🚀"));
app.use("/api/auth",          authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/notices",       noticeRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/complaints",    complaintRoutes);
app.use("/api/attendance",    attendanceRoutes);
app.use("/api/timetables",    timetableRoutes);
app.use("/api/ai",            aiRoutes);
app.use("/api/chatbot",       chatbotRoutes);

app.use((req, res) => res.status(404).json({ ok: false, error: `Route not found: ${req.method} ${req.originalUrl}` }));

const PORT = process.env.PORT || 5000;
try {
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () => {
    console.log("✅ DB connected");
    console.log(`🚀 Server → http://localhost:${PORT}`);
    console.log(`🤖 Gemini → ${process.env.GEMINI_API_KEY ? "✅ Key loaded" : "❌ GEMINI_API_KEY missing in .env"}`);
  });
} catch (err) {
  console.error("❌ DB error:", err?.message || err);
  process.exit(1);
}
