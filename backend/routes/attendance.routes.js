import { Router } from "express";
import {
    getDefaulters,
    getMyAttendanceSummary,
    getMySessions,
    getSessionRecords,
    manualMarkAttendance,
    markAttendance,
    startSession
} from "../controllers/attendance.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Faculty / Admin
router.post("/start",requireAuth, requireRole("FACULTY", "ADMIN"), startSession);
router.get("/sessions",requireAuth, requireRole("FACULTY", "ADMIN"), getMySessions);
router.get("/sessions/:sessionId/records", requireAuth, requireRole("FACULTY", "ADMIN"), getSessionRecords);
router.post("/sessions/:sessionId/manual-mark", requireAuth, requireRole("FACULTY", "ADMIN"), manualMarkAttendance);
router.get("/defaulters", requireAuth, requireRole("FACULTY", "ADMIN"), getDefaulters);

// Student
router.post("/mark",        requireAuth, requireRole("STUDENT"), markAttendance);
router.get("/my-summary",   requireAuth, requireRole("STUDENT"), getMyAttendanceSummary);

export default router;
