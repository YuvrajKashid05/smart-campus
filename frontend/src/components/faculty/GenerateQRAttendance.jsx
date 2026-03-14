import { useContext, useEffect, useRef, useState } from "react";
import { MdCheckCircle, MdQrCode2, MdStop } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as attendanceService from "../../services/attendance";
import { Alert, BTN_PRIMARY, INPUT, PAGE, SELECT } from "../../ui";

const LABEL =
  "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";
const DURATIONS = [5, 10, 15, 20, 30, 45, 60];

export default function GenerateQRAttendance() {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    course: "",
    dept: user?.dept || "",
    section: "",
    semester: "",
    ttlMinutes: "15",
  });
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleStart = async (e) => {
    e.preventDefault();
    if (!form.course.trim() || !form.dept.trim()) {
      setError("Course and department are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await attendanceService.startSession({
        course: form.course,
        dept: form.dept,
        section: form.section,
        semester: form.semester ? parseInt(form.semester) : 0,
        ttlMinutes: parseInt(form.ttlMinutes),
      });
      if (res.ok) {
        setSession(res.session);
        let secs = parseInt(form.ttlMinutes) * 60;
        setTimeLeft(secs);
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          secs--;
          setTimeLeft(secs);
          if (secs <= 0) {
            clearInterval(intervalRef.current);
            setSession(null);
            setTimeLeft(null);
          }
        }, 1000);
      } else setError(res.error || "Failed to start session.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    clearInterval(intervalRef.current);
    setSession(null);
    setTimeLeft(null);
  };

  const mins = timeLeft != null ? Math.floor(timeLeft / 60) : 0;
  const secs = timeLeft != null ? timeLeft % 60 : 0;
  const pct =
    timeLeft != null ? (timeLeft / (parseInt(form.ttlMinutes) * 60)) * 100 : 0;
  const urgent = timeLeft != null && timeLeft < 60;

  const qrUrl = session
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(JSON.stringify({ token: session.qrToken || session.token || session._id, course: form.course, dept: form.dept }))}`
    : null;

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Generate QR Attendance
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Start a session and display the QR code for students to scan
          </p>
        </div>
        {error && (
          <div className="mb-5">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 text-sm mb-5">
              {session ? "Session active" : "New session"}
            </h2>
            {session ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <MdCheckCircle
                    size={20}
                    className="text-emerald-500 shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-emerald-800 text-sm">
                      Session active!
                    </p>
                    <p className="text-xs text-emerald-700">
                      {form.course} · {form.dept}
                      {form.section ? ` · Sec ${form.section}` : ""}
                      {form.semester ? ` · Sem ${form.semester}` : ""}
                    </p>
                  </div>
                </div>
                {/* Timer */}
                <div
                  className={`rounded-2xl p-5 ${urgent ? "bg-red-50" : "bg-slate-50"}`}
                >
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Time remaining
                  </p>
                  <p
                    className={`text-4xl font-extrabold font-mono ${urgent ? "text-red-600" : "text-slate-900"}`}
                  >
                    {String(mins).padStart(2, "0")}:
                    {String(secs).padStart(2, "0")}
                  </p>
                  <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${urgent ? "bg-red-500" : "bg-emerald-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleStop}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition text-sm"
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
                    onChange={(e) => set("course", e.target.value)}
                    placeholder="e.g. Data Structures"
                    className={INPUT}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Department *</label>
                    <input
                      value={form.dept}
                      onChange={(e) =>
                        set("dept", e.target.value.toUpperCase())
                      }
                      placeholder="CS"
                      className={INPUT}
                      required
                    />
                  </div>
                  <div>
                    <label className={LABEL}>
                      Section{" "}
                      <span className="text-slate-400 normal-case font-normal">
                        (opt)
                      </span>
                    </label>
                    <input
                      value={form.section}
                      onChange={(e) =>
                        set("section", e.target.value.toUpperCase())
                      }
                      placeholder="A"
                      className={INPUT}
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>
                    Semester{" "}
                    <span className="text-slate-400 normal-case font-normal">
                      (opt)
                    </span>
                  </label>
                  <select
                    value={form.semester}
                    onChange={(e) => set("semester", e.target.value)}
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
                        onClick={() => set("ttlMinutes", String(d))}
                        className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition ${form.ttlMinutes === String(d) ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-100 text-slate-600 hover:border-slate-200"}`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={BTN_PRIMARY + " w-full justify-center py-3"}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
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

          {/* QR display */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center">
            {session && qrUrl ? (
              <div className="text-center w-full">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Show this to students
                </p>
                <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 inline-block shadow-lg mb-4">
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    className="w-64 h-64 object-contain"
                  />
                </div>
                <p className="font-bold text-slate-900">{form.course}</p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {[
                    form.dept,
                    form.section && `Sec ${form.section}`,
                    form.semester && `Sem ${form.semester}`,
                  ]
                    .filter(Boolean)
                    .map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
                <p
                  className={`mt-4 text-sm font-semibold ${urgent ? "text-red-600" : "text-emerald-600"}`}
                >
                  {urgent ? "⚠ Expiring soon!" : "● Session active"}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto mb-4">
                  <MdQrCode2 size={40} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium text-sm">
                  QR code will appear here
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Fill the form and start a session
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
