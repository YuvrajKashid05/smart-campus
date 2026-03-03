// controllers/auth.js
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/user.model.js";
import { signToken } from "../utils/jwt.js";

/* -------------------- ZOD VALIDATION -------------------- */
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),

  role: z.enum(["STUDENT", "FACULTY", "ADMIN"]).default("STUDENT"),
  dept: z.string().optional(),
  rollNo: z.string().optional(),
  employeeId: z.string().optional()
});

// Login validation
const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(1, "Password is required")
});

/* -------------------- REGISTER -------------------- */
export async function register(req, res) {
  try {

    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        ok: false,
        error: result.error.flatten()
      });
    }

    const { name, email, password, role, dept, rollNo, employeeId } = result.data;

    const already = await User.findOne({ email });
    if (already) {
      return res.status(409).json({ ok: false, error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);


    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      dept: dept ?? "",
      rollNo: rollNo ?? "",
      employeeId: employeeId ?? ""
    });

    const token = signToken({ sub: user._id.toString(), role: user.role });

    return res.status(201).json({
      ok: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

/* -------------------- LOGIN -------------------- */
export async function login(req, res) {
  try {
    
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        ok: false,
        error: result.error.flatten()
      });
    }

    const { email, password } = result.data;

    const user = await User.findOne({ email });

    if (!user || user.isActive === false) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const token = signToken({ sub: user._id.toString(), role: user.role });

    return res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}