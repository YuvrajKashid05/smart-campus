import { Router } from "express";
import { login, logout, me, register, updateProfile } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

//Auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);
router.put("/profile", requireAuth, updateProfile);

export default router;
