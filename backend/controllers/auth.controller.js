import bcrypt from "bcryptjs";
import * as z from "zod";
import User from "../models/user.model.js";
import { signToken } from "../utils/jwt.js";

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeUpper = (value) => normalizeText(value).toUpperCase();
const normalizeLower = (value) => normalizeText(value).toLowerCase();

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  mobileNumber: user.mobileNumber,
  dept: user.dept,
  section: user.section,
  semester: user.semester,
  rollNo: user.rollNo,
  employeeId: user.employeeId,
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Full name must be at least 2 characters"),

    // Zod 4 style: avoid z.string().email()
    email: z.string().trim().pipe(z.email("Invalid email")),

    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["STUDENT", "FACULTY", "ADMIN"]).default("STUDENT"),

    mobileNumber: z.string().trim().optional(),
    dept: z.string().trim().optional(),
    section: z.string().trim().optional(),
    semester: z.coerce.number().int().min(1).max(8).optional(),
    rollNo: z.string().trim().optional(),
    employeeId: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "STUDENT") {
      if (!data.mobileNumber || data.mobileNumber.length < 10) {
        ctx.addIssue({
          code: "custom",
          path: ["mobileNumber"],
          message: "Mobile number is required for students",
        });
      }

      if (!data.dept || data.dept.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["dept"],
          message: "Department is required for students",
        });
      }

      if (!data.section || data.section.length < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["section"],
          message: "Section is required for students",
        });
      }

      if (data.semester == null) {
        ctx.addIssue({
          code: "custom",
          path: ["semester"],
          message: "Semester is required for students",
        });
      }

      if (!data.rollNo || data.rollNo.length < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["rollNo"],
          message: "Roll number is required for students",
        });
      }
    }

    if (data.role === "FACULTY" && (!data.employeeId || data.employeeId.length < 1)) {
      ctx.addIssue({
        code: "custom",
        path: ["employeeId"],
        message: "Employee ID is required for faculty",
      });
    }
  });

const loginSchema = z.object({
  // Zod 4 style: avoid z.string().email()
  email: z.string().trim().pipe(z.email("Invalid email")),
  password: z.string().min(1, "Password is required"),
});

export async function register(req, res) {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: z.treeifyError(parsed.error), // Zod 4 replacement for .flatten()
      });
    }

    const data = parsed.data;

    const normalizedEmail = normalizeLower(data.email);
    const normalizedDept = normalizeUpper(data.dept);
    const normalizedSection = normalizeUpper(data.section);
    const normalizedRollNo = normalizeUpper(data.rollNo);
    const normalizedEmployeeId = normalizeUpper(data.employeeId);

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        ok: false,
        error: "Email already registered",
      });
    }

    if (data.role === "STUDENT") {
      const existingRoll = await User.findOne({
        role: "STUDENT",
        dept: normalizedDept,
        section: normalizedSection,
        rollNo: normalizedRollNo,
      });

      if (existingRoll) {
        return res.status(409).json({
          ok: false,
          error: "Roll number already exists in this department and section",
        });
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await User.create({
      name: normalizeText(data.name),
      email: normalizedEmail,
      passwordHash,
      role: data.role,
      mobileNumber: normalizeText(data.mobileNumber),
      dept: normalizedDept,
      section: normalizedSection,
      semester: data.semester,
      rollNo: normalizedRollNo,
      employeeId: normalizedEmployeeId,
    });

    const token = signToken({
      sub: user._id.toString(),
      role: user.role,
    });

    return res.status(201).json({
      ok: true,
      token,
      user: buildUserResponse(user),
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    if (err?.code === 11000) {
      return res.status(409).json({
        ok: false,
        error: "Duplicate user data found",
      });
    }

    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
}

export async function login(req, res) {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: z.treeifyError(parsed.error), // Zod 4 replacement
      });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = normalizeLower(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.isActive === false) {
      return res.status(401).json({
        ok: false,
        error: "Invalid credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        ok: false,
        error: "Invalid credentials",
      });
    }

    const token = signToken({
      sub: user._id.toString(),
      role: user.role,
    });

    return res.status(200).json({
      ok: true,
      token,
      user: buildUserResponse(user),
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
}