import { Router } from "express";
import {
    getDefaulters, getFraudReport, getFraudSummary,
    getMyAttendanceSummary, getMySessions, getSessionRecords,
    manualMarkAttendance,
    markAttendance,
    startSession,
} from "../controllers/attendance.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { attendanceLimiter, qrLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

// Faculty / Admin
router.post("/start", requireAuth, requireRole("FACULTY","ADMIN"), qrLimiter, startSession);
router.get( "/sessions", requireAuth, requireRole("FACULTY","ADMIN"), getMySessions);
router.get( "/sessions/:sessionId/records", requireAuth, requireRole("FACULTY","ADMIN"), getSessionRecords);
router.post("/sessions/:sessionId/manual-mark", requireAuth, requireRole("FACULTY","ADMIN"), manualMarkAttendance);
router.get( "/defaulters", requireAuth, requireRole("FACULTY","ADMIN"), getDefaulters);
router.get( "/sessions/:sessionId/fraud-report",requireAuth, requireRole("FACULTY","ADMIN"), getFraudReport);
router.get( "/fraud-summary", requireAuth, requireRole("FACULTY","ADMIN"), getFraudSummary);

// Student
router.post("/mark",       requireAuth, requireRole("STUDENT"), attendanceLimiter, markAttendance);
router.get( "/my-summary", requireAuth, requireRole("STUDENT"), getMyAttendanceSummary);

export default router;
