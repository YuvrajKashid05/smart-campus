import { Router } from "express";
import {
    createNotice, deleteNotice, getNoticeById,
    listNotices, updateNotice,
} from "../controllers/notice.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listNotices);
router.get("/:id", requireAuth, getNoticeById);             
router.post("/", requireAuth, requireRole("ADMIN","FACULTY"), createNotice);
router.put("/:id", requireAuth, requireRole("FACULTY","ADMIN"), updateNotice);
router.delete("/:id", requireAuth, requireRole("FACULTY","ADMIN"), deleteNotice);

export default router;
