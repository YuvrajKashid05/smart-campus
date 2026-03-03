import { Router } from "express";
import { createNotice, listNotices } from "../controllers/notice.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listNotices);
router.post("/", requireAuth, requireRole("ADMIN", "FACULTY"), createNotice);

export default router;