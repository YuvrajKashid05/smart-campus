import { Router } from "express";
import { chatWithCampusBot } from "../controllers/chatbot.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/chat", requireAuth, chatWithCampusBot);

export default router;