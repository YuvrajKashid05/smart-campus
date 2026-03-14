import express from "express";
import {
    createTimetable,
    deleteTimetable,
    getAllTimetables,
    getFacultyOwnTimetable,
    getStudentTimetable,
    updateTimetable,
} from "../controllers/timetable.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, getAllTimetables);
router.get("/my", requireAuth, getStudentTimetable);
router.get("/faculty/my", requireAuth, requireRole("faculty", "admin"), getFacultyOwnTimetable);

router.post("/", requireAuth, requireRole("faculty", "admin"), createTimetable);
router.put("/:id", requireAuth, requireRole("faculty", "admin"), updateTimetable);
router.delete("/:id", requireAuth, requireRole("faculty", "admin"), deleteTimetable);

export default router;