import { Router } from "express";
import {
  listUsers,
  me,
  updateStudentByAdminOrFaculty
} from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/me", requireAuth, me);
router.get("/", requireAuth, requireRole("ADMIN","FACULTY"), listUsers);

router.put("/students/:id", requireAuth, requireRole("ADMIN", "FACULTY"), updateStudentByAdminOrFaculty);

export default router;