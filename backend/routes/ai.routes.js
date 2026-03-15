import { Router } from "express";
import {
    analyzeComplaint,
    ask,
    attendanceRiskReport,
    generateAnnouncement,
    generateNotice,
    studyHelp,
    weeklyReport,
} from "../controllers/ai.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Notice & Announcement generators (Faculty + Admin)
router.post("/generate-notice", requireAuth, requireRole("FACULTY","ADMIN"), generateNotice);
router.post("/generate-announcement",  requireAuth, requireRole("FACULTY","ADMIN"), generateAnnouncement);

// Complaint analyzer (any authenticated user — called on submit)
router.post("/analyze-complaint", requireAuth, analyzeComplaint);

// Attendance risk predictor (Faculty + Admin)
router.get("/attendance-risk", requireAuth, requireRole("FACULTY","ADMIN"), attendanceRiskReport);

// Weekly campus report (Admin only)
router.get("/weekly-report",  requireAuth, requireRole("ADMIN"), weeklyReport);

// Study help (Students)
router.post("/study-help", requireAuth, studyHelp);

// Legacy
router.post("/ask", requireAuth, ask);

export default router;
