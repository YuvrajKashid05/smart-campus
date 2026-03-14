import { useContext, useState } from "react";
import { MdSchool, MdVisibility, MdVisibilityOff, MdArrowForward } from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        const from = location.state?.from?.pathname;
        const def = res.user?.role === "STUDENT" ? "/student/dashboard" : res.user?.role === "FACULTY" ? "/faculty/dashboard" : "/admin/dashboard";
        navigate(from || def, { replace: true });
      } else setError(res.error || "Invalid credentials");
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const inp = "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none text-sm text-slate-800 bg-white transition placeholder:text-slate-400";

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(150deg,#0f172a 0%,#1e1b4b 100%)" }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-24 left-12 w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(#6366f1,transparent 70%)" }} />
        <div className="relative flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <MdSchool size={17} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">Smart Campus</span>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Your campus,<br />always connected.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Attendance, timetables, notices and complaints — all in one place.
          </p>
          <div className="mt-8 space-y-3">
            {["Instant QR-based attendance", "Live class timetables", "Attendance analytics & alerts"].map((t, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-slate-600 text-xs">© {new Date().getFullYear()} Smart Campus</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <MdSchool size={17} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">Smart Campus</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-8">Sign in to your account</p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@university.edu" className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Your password" className={inp + " pr-11"} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showPw ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition text-sm disabled:opacity-50 mt-2">
              {loading
                ? <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                : <>Sign In <MdArrowForward size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
