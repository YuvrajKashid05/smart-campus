import { Router } from "express";
import { deleteUserByAdmin, listUsers, me, updateStudentByAdminOrFaculty } from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

//Students Routes
router.get("/me", requireAuth, me);

//Faculty + Admin routes
router.get("/", requireAuth, requireRole("ADMIN", "FACULTY"), listUsers);
router.put("/students/:id", requireAuth, requireRole("ADMIN", "FACULTY"), updateStudentByAdminOrFaculty);
router.delete("/:id", requireAuth, requireRole("ADMIN"), deleteUserByAdmin);

export default router;
