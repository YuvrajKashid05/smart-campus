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

router.get("/",          requireAuth, getAllTimetables);
router.get("/my",        requireAuth, getStudentTimetable);
router.get("/faculty/my",requireAuth, requireRole("FACULTY", "ADMIN"), getFacultyOwnTimetable);

router.post(  "/",     requireAuth, requireRole("FACULTY", "ADMIN"), createTimetable);
router.put(   "/:id",  requireAuth, requireRole("FACULTY", "ADMIN"), updateTimetable);
router.delete("/:id",  requireAuth, requireRole("FACULTY", "ADMIN"), deleteTimetable);

export default router;
