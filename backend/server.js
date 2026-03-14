import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import connectDB from "./config/db.js";

// routes
import aiRoutes from "./routes/ai.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import authRoutes from "./routes/auth.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import noticeRoutes from "./routes/notice.routes.js";
import timetableRoutes from "./routes/timetable.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();

// middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "1mb" }));

// test route
app.get("/", (req, res) => {
  res.send("Smart Campus API running 🚀");
});

// routes mount
app.use("/api/ai", chatbotRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/ai", aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Route not found" });
});

const PORT = process.env.PORT || 5000;

// Start server ONLY after DB connects
connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ DB connected`);
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err?.message || err);
    process.exit(1);
  });

