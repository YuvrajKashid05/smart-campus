import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  MdCheckCircle,
  MdContentCopy,
  MdLocationOff,
  MdLocationOn,
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

  // Location state
  const [classroomLat, setClassroomLat] = useState(null);
  const [classroomLng, setClassroomLng] = useState(null);
  const [classroomLabel, setClassroomLabel] = useState("");
  const [radiusMeters, setRadiusMeters] = useState(100);
  const [locationCheckEnabled, setLocationCheckEnabled] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  const intervalRef = useRef(null);
  useEffect(() => () => clearInterval(intervalRef.current), []);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

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
          }
        : null,
    [token, session, form],
  );
  const qrUrl = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(JSON.stringify(qrPayload))}`
    : null;

  // ── Capture faculty's current location as classroom ────────────────
  const captureLocation = () => {
    setGpsError("");
    setGpsLoading(true);
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setClassroomLat(pos.coords.latitude);
        setClassroomLng(pos.coords.longitude);
        setGpsLoading(false);
      },
      (err) => {
        setGpsError("Could not get location: " + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const clearLocation = () => {
    setClassroomLat(null);
    setClassroomLng(null);
    setLocationCheckEnabled(false);
    setGpsError("");
  };

  const startTimer = (secs) => {
    clearInterval(intervalRef.current);
    setSessionDuration(secs);
    setTimeLeft(secs);
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
      const ttlMinutes = parseInt(form.ttlMinutes, 10) || 15;
      const res = await attendanceService.startSession({
        course: form.course.trim(),
        dept: form.dept.trim().toUpperCase(),
        section: form.section.trim().toUpperCase(),
        semester: form.semester ? parseInt(form.semester, 10) : 0,
        ttlMinutes,
        classroomLat,
        classroomLng,
        classroomRadiusMeters: radiusMeters,
        classroomLabel,
        locationCheckEnabled: classroomLat != null && locationCheckEnabled,
      });
      if (!res?.ok || !res?.session)
        throw new Error(res?.error || "Failed to start session.");
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
    } catch {}
  };

  const mins = timeLeft != null ? Math.floor(timeLeft / 60) : 0;
  const secs = timeLeft != null ? timeLeft % 60 : 0;
  const pct =
    timeLeft != null && sessionDuration > 0
      ? (timeLeft / sessionDuration) * 100
      : 0;
  const urgent = timeLeft != null && timeLeft < 60;
  const hasLocation = classroomLat != null && classroomLng != null;

  return (
    <div className={`${PAGE} fade-up`}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Generate QR Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a live session. Set your classroom location to enable AI
            fraud detection.
          </p>
        </div>

        {error && (
          <div className="mb-5">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left: form */}
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
                      {form.section ? ` · Sec ${form.section}` : ""}
                      {form.semester ? ` · Sem ${form.semester}` : ""}
                    </p>
                    {hasLocation && (
                      <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                        <MdLocationOn size={13} />
                        Location fraud detection:{" "}
                        {locationCheckEnabled ? "ACTIVE" : "passive logging"}
                        {" · "}
                        {radiusMeters}m radius
                      </p>
                    )}
                  </div>
                </div>

                {/* Timer */}
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

                {/* Token */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Session token
                    </p>
                    <button
                      onClick={handleCopyToken}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <MdContentCopy size={14} />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 font-mono text-sm text-slate-800 ring-1 ring-slate-200 break-all">
                    {token}
                  </div>
                </div>

                <button
                  onClick={handleStop}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 transition"
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Semester</label>
                    <select
                      value={form.semester}
                      onChange={(e) => setField("semester", e.target.value)}
                      className={SELECT}
                    >
                      <option value="">All</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Duration</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DURATIONS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setField("ttlMinutes", String(d))}
                          className={`rounded-xl border-2 px-2.5 py-1.5 text-xs font-semibold transition ${form.ttlMinutes === String(d) ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                        >
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Location Section ────────────────────────────── */}
                <div className="rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50 to-blue-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                        <MdLocationOn size={14} />
                        Classroom Location (AI Fraud Detection)
                      </p>
                      <p className="text-[11px] text-indigo-600 mt-0.5">
                        Set your GPS so AI can flag students who mark from
                        outside the classroom
                      </p>
                    </div>
                  </div>

                  {!hasLocation ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={captureLocation}
                        disabled={gpsLoading}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
                      >
                        {gpsLoading ? (
                          <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        ) : (
                          <MdLocationOn size={16} />
                        )}
                        {gpsLoading
                          ? "Getting your location…"
                          : "📍 Set My Location as Classroom"}
                      </button>
                      {gpsError && (
                        <p className="text-xs text-red-600">{gpsError}</p>
                      )}
                      <p className="text-[11px] text-indigo-500 text-center">
                        Optional — works without it, but no fraud detection
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-indigo-200">
                        <MdCheckCircle
                          size={16}
                          className="text-emerald-500 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-700">
                            Location captured!
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {classroomLat?.toFixed(5)},{" "}
                            {classroomLng?.toFixed(5)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={clearLocation}
                          className="text-slate-400 hover:text-red-500 transition shrink-0"
                        >
                          <MdLocationOff size={16} />
                        </button>
                      </div>

                      <div>
                        <label className={LABEL}>
                          Room label{" "}
                          <span className="normal-case font-normal text-slate-400">
                            (optional)
                          </span>
                        </label>
                        <input
                          value={classroomLabel}
                          onChange={(e) => setClassroomLabel(e.target.value)}
                          placeholder="e.g. Block B, Room 204"
                          className={INPUT}
                        />
                      </div>

                      <div>
                        <label className={LABEL}>
                          Allowed radius:{" "}
                          <span className="text-indigo-600">
                            {radiusMeters}m
                          </span>
                        </label>
                        <input
                          type="range"
                          min="30"
                          max="500"
                          step="10"
                          value={radiusMeters}
                          onChange={(e) =>
                            setRadiusMeters(parseInt(e.target.value))
                          }
                          className="w-full accent-indigo-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>30m (strict)</span>
                          <span>500m (lenient)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-indigo-100">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            Block attendance if outside radius
                          </p>
                          <p className="text-[11px] text-slate-500">
                            OFF = log only &nbsp;·&nbsp; ON = flag + warn
                            student
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLocationCheckEnabled((p) => !p)}
                          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${locationCheckEnabled ? "bg-indigo-600" : "bg-slate-200"}`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${locationCheckEnabled ? "left-6" : "left-1"}`}
                          />
                        </button>
                      </div>
                    </div>
                  )}
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

          {/* Right: QR display */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {session && qrUrl ? (
              <div className="text-center">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Show this QR to students
                </p>
                <div className="inline-flex rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <img
                    src={qrUrl}
                    alt="Attendance QR"
                    className="h-72 w-72 object-contain"
                  />
                </div>
                <p className="mt-4 text-lg font-bold text-slate-900">
                  {form.course}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {[
                    form.dept,
                    form.section && `Sec ${form.section}`,
                    form.semester && `Sem ${form.semester}`,
                    hasLocation && `📍 ${radiusMeters}m radius`,
                    locationCheckEnabled && "🔒 Strict mode",
                  ]
                    .filter(Boolean)
                    .map((tag, i) => (
                      <span
                        key={i}
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
              <div className="flex min-h-96 flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                  <MdQrCode2 size={42} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">
                  QR code will appear here
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Fill the form and start a session.
                </p>
                {hasLocation && (
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                    <MdLocationOn size={14} />
                    Location set — fraud detection ready
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
