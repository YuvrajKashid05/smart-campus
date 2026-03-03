import User from "../models/user.model.js";

export async function me(req, res) {
  return res.json({ ok: true, user: req.user });
}

export async function listUsers(req, res) {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 }).limit(200);
  return res.json({ ok: true, users });
}