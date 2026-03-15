import { Router } from "express";
import {
    createAnnouncement,
    deleteAnnouncement,
    getAnnouncementById,
    listAnnouncements,
    updateAnnouncement
} from "../controllers/announcement.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();
//Students Routes
router.get("/", requireAuth, listAnnouncements);
router.get("/:id", requireAuth, getAnnouncementById);

//Faculty + Admin Routes
router.post("/",requireAuth,requireRole("FACULTY", "ADMIN"),createAnnouncement);
router.put("/:id", requireAuth, requireRole("FACULTY", "ADMIN"), updateAnnouncement);
router.delete("/:id",requireAuth,requireRole("FACULTY", "ADMIN"),deleteAnnouncement);

export default router;