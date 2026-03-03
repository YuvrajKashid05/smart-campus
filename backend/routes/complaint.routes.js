import { Router } from "express";
import { allComplaints, createComplaint, myComplaints } from "../controllers/complaint.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, createComplaint);
router.get("/mine", requireAuth, myComplaints);
router.get("/", requireAuth, requireRole("ADMIN"), allComplaints);

export default router;