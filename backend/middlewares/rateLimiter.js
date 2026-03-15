import rateLimit from "express-rate-limit";

// ── Helper: standard JSON response for rate limit hits ────────────────
const handler = (req, res) =>
  res.status(429).json({
    ok: false,
    error: "Too many requests. Please slow down and try again.",
    retryAfter: Math.ceil(req.rateLimit?.resetTime / 1000) || 60,
  });

// ── 1. Global limiter — every route ───────────────────────────────────
// 200 requests per IP per 15 minutes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  message: handler,
});

// ── 2. Auth limiter — login / register ────────────────────────────────
// 10 attempts per IP per 15 minutes (brute-force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skipSuccessfulRequests: true, // only count failed attempts
});

// ── 3. AI / Chatbot limiter ───────────────────────────────────────────
// 30 AI calls per IP per 10 minutes (Gemini API is expensive)
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// ── 4. QR generation limiter (faculty) ───────────────────────────────
// 60 sessions per IP per hour (prevents session spam)
export const qrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// ── 5. Attendance marking limiter (students) ─────────────────────────
// 20 marks per IP per 10 minutes (prevents rapid re-scan loops)
export const attendanceLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// ── 6. Complaint submit limiter ───────────────────────────────────────
// 5 complaints per IP per hour (prevents spam)
export const complaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
