import { Router } from "express";
import { allComplaints, createComplaint, getComplaintById, myComplaints, updateComplaintStatus } from "../controllers/complaint.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, createComplaint);
router.get("/mine", requireAuth, myComplaints);
router.get("/", requireAuth, requireRole("ADMIN"), allComplaints);
router.get("/:id", requireAuth, getComplaintById);
router.put("/:id/status", requireAuth, requireRole("ADMIN"), updateComplaintStatus);

export default router;
