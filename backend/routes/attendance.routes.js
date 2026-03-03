import { Router } from "express";
import { markAttendance, startSession } from "../controllers/attendance.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/start", requireAuth, requireRole("FACULTY", "ADMIN"), startSession);
router.post("/mark", requireAuth, requireRole("STUDENT"), markAttendance);

export default router;