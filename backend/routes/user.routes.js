import { Router } from "express";
import { listUsers, me } from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/me", requireAuth, me);
router.get("/", requireAuth, requireRole("ADMIN"), listUsers);

export default router;