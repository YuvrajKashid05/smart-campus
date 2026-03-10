import { z } from "zod";
import User from "../models/user.model.js";

const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  mobileNumber: z.string().min(10).optional(),
  dept: z.string().min(2).optional(),
  section: z.string().min(1).optional(),
  semester: z.number().min(1).max(8).optional(),
  rollNo: z.string().min(1).optional(),
  isActive: z.boolean().optional()
});

export async function me(req, res) {
  return res.json({ ok: true, user: req.user });
}

export async function listUsers(req, res) {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 }).limit(500);
    return res.json({ ok: true, users });
  } catch (err) {
    console.error("LIST USERS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function updateStudentByAdminOrFaculty(req, res) {
  try {
    const body = req.body || {};
    const parsed = updateStudentSchema.safeParse({
      ...body,
      semester: body.semester !== undefined && body.semester !== "" ? Number(body.semester) : undefined
    });
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ ok: false, error: "Student not found" });
    if (student.role !== "STUDENT")
      return res.status(400).json({ ok: false, error: "Only student info can be updated from this route" });

    const nextDept = parsed.data.dept !== undefined ? parsed.data.dept.trim().toUpperCase() : student.dept;
    const nextSection = parsed.data.section !== undefined ? parsed.data.section.trim().toUpperCase() : student.section;
    const nextRollNo = parsed.data.rollNo !== undefined ? parsed.data.rollNo.trim().toUpperCase() : student.rollNo;

    if (nextRollNo) {
      const duplicate = await User.findOne({
        _id: { $ne: student._id }, role: "STUDENT",
        dept: nextDept, section: nextSection, rollNo: nextRollNo
      });
      if (duplicate) return res.status(409).json({ ok: false, error: "Roll number already exists in this department and section" });
    }

    if (parsed.data.name !== undefined) student.name = parsed.data.name.trim();
    if (parsed.data.mobileNumber !== undefined) student.mobileNumber = parsed.data.mobileNumber.trim();
    if (parsed.data.dept !== undefined) student.dept = parsed.data.dept.trim().toUpperCase();
    if (parsed.data.section !== undefined) student.section = parsed.data.section.trim().toUpperCase();
    if (parsed.data.semester !== undefined) student.semester = parsed.data.semester;
    if (parsed.data.rollNo !== undefined) student.rollNo = parsed.data.rollNo.trim().toUpperCase();
    if (parsed.data.isActive !== undefined) student.isActive = parsed.data.isActive;

    await student.save();
    return res.json({
      ok: true, message: "Student updated successfully",
      student: { id: student._id, name: student.name, email: student.email, role: student.role,
        mobileNumber: student.mobileNumber, dept: student.dept, section: student.section,
        semester: student.semester, rollNo: student.rollNo, isActive: student.isActive }
    });
  } catch (err) {
    console.error("UPDATE STUDENT ERROR:", err);
    if (err?.code === 11000) return res.status(409).json({ ok: false, error: "Duplicate student data found" });
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export async function deleteUserByAdmin(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });
    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString())
      return res.status(400).json({ ok: false, error: "Cannot delete your own account" });
    await user.deleteOne();
    return res.json({ ok: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
