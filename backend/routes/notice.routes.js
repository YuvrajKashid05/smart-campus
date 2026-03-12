import { Router } from "express";
import { createNotice, deleteNotice, listNotices, updateNotice } from "../controllers/notice.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listNotices);
router.post("/", requireAuth, requireRole("ADMIN", "FACULTY"), createNotice);
router.delete("/:id", requireAuth, requireRole("FACULTY", "ADMIN"), deleteNotice);
router.put("/:id", requireAuth, requireRole("FACULTY", "ADMIN"), updateNotice);

export default router;