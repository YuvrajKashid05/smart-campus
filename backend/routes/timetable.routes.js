import { Router } from "express";
import {
    createTimetableSlot,
    deleteTimetableSlot,
    getMyTimetable,
    getTimetableSlotById,
    listTimetableSlots,
    updateTimetableSlot
} from "../controllers/timetable.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listTimetableSlots);
router.get("/my", requireAuth, getMyTimetable);
router.get("/:id", requireAuth, getTimetableSlotById);

router.post( "/", requireAuth, requireRole("FACULTY", "ADMIN"), createTimetableSlot);

router.put("/:id", requireAuth, requireRole("FACULTY", "ADMIN"), updateTimetableSlot);

router.delete("/:id", requireAuth, requireRole("FACULTY", "ADMIN"), deleteTimetableSlot);

export default router;