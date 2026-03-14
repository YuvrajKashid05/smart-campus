import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  MdCheckCircle,
  MdContentCopy,
  MdQrCode2,
  MdStop,
  MdTimer,
} from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as attendanceService from "../../services/attendance";
import { Alert, BTN_PRIMARY, INPUT, PAGE, SELECT } from "../../ui";

const LABEL =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600";
const DURATIONS = [5, 10, 15, 20, 30, 45, 60];

export default function GenerateQRAttendance() {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    course: "",
    dept: user?.dept || "",
    section: user?.section || "",
    semester: user?.semester ? String(user.semester) : "",
    ttlMinutes: "15",
  });
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (user?.dept || user?.section || user?.semester) {
      setForm((prev) => ({
        ...prev,
        dept: prev.dept || user?.dept || "",
        section: prev.section || user?.section || "",
        semester:
          prev.semester || (user?.semester ? String(user.semester) : ""),
      }));
    }
  }, [user]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const token = useMemo(
    () => session?.qrToken || session?.token || session?._id || "",
    [session],
  );

  const qrPayload = useMemo(
    () =>
      token
        ? {
            qrToken: token,
            token,
            sessionId: session?._id,
            course: form.course.trim(),
            dept: form.dept.trim().toUpperCase(),
            section: form.section.trim().toUpperCase(),
            semester: form.semester ? Number(form.semester) : 0,
          }
        : null,
    [token, session, form],
  );

  const qrUrl = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
        JSON.stringify(qrPayload),
      )}`
    : null;

  const startTimer = (totalSeconds) => {
    clearInterval(intervalRef.current);
    setSessionDuration(totalSeconds);
    setTimeLeft(totalSeconds);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalRef.current);
          setSession(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStart = async (e) => {
    e.preventDefault();
    setCopied(false);

    if (!form.course.trim() || !form.dept.trim()) {
      setError("Course and department are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const ttlMinutes = Number.parseInt(form.ttlMinutes, 10) || 15;
      const semester = form.semester ? Number.parseInt(form.semester, 10) : 0;

      const res = await attendanceService.startSession({
        course: form.course.trim(),
        dept: form.dept.trim().toUpperCase(),
        section: form.section.trim().toUpperCase(),
        semester,
        ttlMinutes,
      });

      if (!res?.ok || !res?.session) {
        throw new Error(res?.error || "Failed to start session.");
      }

      setSession(res.session);
      startTimer(ttlMinutes * 60);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to start session.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    clearInterval(intervalRef.current);
    setSession(null);
    setTimeLeft(null);
    setSessionDuration(0);
  };

  const handleCopyToken = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const mins = timeLeft != null ? Math.floor(timeLeft / 60) : 0;
  const secs = timeLeft != null ? timeLeft % 60 : 0;
  const pct =
    timeLeft != null && sessionDuration > 0
      ? (timeLeft / sessionDuration) * 100
      : 0;
  const urgent = timeLeft != null && timeLeft < 60;

  return (
    <div className={`${PAGE} fade-up`}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Generate QR Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a live attendance session. Students can scan the QR or paste
            the token manually.
          </p>
        </div>

        {error && (
          <div className="mb-5">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-base font-semibold text-slate-900">
              {session ? "Session running" : "Start new session"}
            </h2>

            {session ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <MdCheckCircle
                    size={20}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                  <div>
                    <p className="font-semibold text-emerald-800">
                      Attendance session is live
                    </p>
                    <p className="mt-1 text-sm text-emerald-700">
                      {form.course} · {form.dept}
                      {form.section ? ` · Section ${form.section}` : ""}
                      {form.semester ? ` · Semester ${form.semester}` : ""}
                    </p>
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-5 ${urgent ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"}`}
                >
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <MdTimer size={15} />
                    Time remaining
                  </div>
                  <p
                    className={`font-mono text-4xl font-extrabold ${urgent ? "text-red-600" : "text-slate-900"}`}
                  >
                    {String(mins).padStart(2, "0")}:
                    {String(secs).padStart(2, "0")}
                  </p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all ${urgent ? "bg-red-500" : "bg-emerald-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Session token
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyToken}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <MdContentCopy size={14} />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 font-mono text-sm text-slate-800 ring-1 ring-slate-200">
                    {token || "Token not available"}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    If scanning fails, students can paste this token on the Mark
                    Attendance page.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStop}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-600"
                >
                  <MdStop size={16} />
                  Stop Session
                </button>
              </div>
            ) : (
              <form onSubmit={handleStart} className="space-y-4">
                <div>
                  <label className={LABEL}>Course / Subject *</label>
                  <input
                    value={form.course}
                    onChange={(e) => setField("course", e.target.value)}
                    placeholder="e.g. Data Structures"
                    className={INPUT}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={LABEL}>Department *</label>
                    <input
                      value={form.dept}
                      onChange={(e) =>
                        setField("dept", e.target.value.toUpperCase())
                      }
                      placeholder="CS"
                      className={INPUT}
                      required
                    />
                  </div>

                  <div>
                    <label className={LABEL}>Section</label>
                    <input
                      value={form.section}
                      onChange={(e) =>
                        setField("section", e.target.value.toUpperCase())
                      }
                      placeholder="A"
                      className={INPUT}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={LABEL}>Semester</label>
                    <select
                      value={form.semester}
                      onChange={(e) => setField("semester", e.target.value)}
                      className={SELECT}
                    >
                      <option value="">All semesters</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={LABEL}>Duration</label>
                    <div className="flex flex-wrap gap-2">
                      {DURATIONS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setField("ttlMinutes", String(d))}
                          className={`rounded-xl border-2 px-3 py-1.5 text-sm font-semibold transition ${
                            form.ttlMinutes === String(d)
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`${BTN_PRIMARY} w-full justify-center py-3`}
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Starting…
                    </>
                  ) : (
                    <>
                      <MdQrCode2 size={17} />
                      Generate QR Code
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {session && qrUrl ? (
              <div className="text-center">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Show this QR to students
                </p>
                <div className="inline-flex rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <img
                    src={qrUrl}
                    alt="Attendance QR Code"
                    className="h-72 w-72 object-contain"
                  />
                </div>
                <p className="mt-4 text-lg font-bold text-slate-900">
                  {form.course}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {[
                    form.dept,
                    form.section && `Section ${form.section}`,
                    form.semester && `Semester ${form.semester}`,
                  ]
                    .filter(Boolean)
                    .map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
                <p
                  className={`mt-4 text-sm font-semibold ${urgent ? "text-red-600" : "text-emerald-600"}`}
                >
                  {urgent ? "⚠ Session expiring soon" : "● Session active"}
                </p>
              </div>
            ) : (
              <div className="flex min-h-105 flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                  <MdQrCode2 size={42} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">
                  QR code will appear here
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Fill the form and start a session.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
