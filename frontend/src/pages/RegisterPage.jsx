import { useContext, useState } from "react";
import { MdSchool, MdArrowForward, MdArrowBack } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const inp = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none text-sm text-slate-800 bg-white transition placeholder:text-slate-400";
const lbl = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";
const DEPTS = [{ v:"CS",l:"Computer Science"},{ v:"IT",l:"Information Technology"},{ v:"EE",l:"Electrical Eng."},{ v:"ME",l:"Mechanical Eng."},{ v:"CE",l:"Civil Eng."}];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:"", email:"", password:"", confirmPassword:"", role:"STUDENT", dept:"", semester:"1", section:"A", rollNo:"", mobileNumber:"", employeeId:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const nextStep = () => {
    setError("");
    if (!form.name.trim() || form.name.trim().length < 2) return setError("Full name is required");
    if (!form.email.includes("@")) return setError("Valid email required");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword) return setError("Passwords don't match");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); 
    if (!form.dept) return setError("Department is required");
    if (form.role === "STUDENT" && !form.rollNo.trim()) return setError("Roll number required");
    if (form.role === "STUDENT" && form.mobileNumber.length < 10) return setError("Valid mobile required");
    if (form.role === "FACULTY" && !form.employeeId.trim()) return setError("Employee ID required");
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role: form.role, dept: form.dept };
      if (form.role === "STUDENT") { payload.semester = parseInt(form.semester); payload.section = form.section; payload.rollNo = form.rollNo; payload.mobileNumber = form.mobileNumber; }
      if (form.role === "FACULTY") { payload.employeeId = form.employeeId; payload.mobileNumber = form.mobileNumber; }
      const res = await register(payload);
      if (res.success) navigate(res.user?.role === "STUDENT" ? "/student/dashboard" : res.user?.role === "FACULTY" ? "/faculty/dashboard" : "/admin/dashboard", { replace: true });
      else setError(res.error || "Registration failed");
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <MdSchool size={19} className="text-white" />
          </div>
          <span className="font-extrabold text-slate-900 text-lg">Smart Campus</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Step bar */}
          <div className="flex border-b border-slate-100">
            {["Account Info", "Profile Details"].map((label, i) => {
              const s = i + 1;
              return (
                <div key={s} className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-semibold transition ${step === s ? "text-indigo-600 border-b-2 border-indigo-600" : step > s ? "text-emerald-600" : "text-slate-400"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s ? "bg-indigo-600 text-white" : step > s ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {step > s ? "✓" : s}
                  </div>
                  {label}
                </div>
              );
            })}
          </div>

          <div className="p-7">
            <h1 className="text-xl font-bold text-slate-900 mb-1">{step === 1 ? "Create your account" : "Complete your profile"}</h1>
            <p className="text-slate-500 text-sm mb-6">{step === 1 ? "Set up your login credentials" : "We need a few more details"}</p>

            {error && <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{error}</div>}

            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <label className={lbl}>Full Name</label>
                  <input className={inp} placeholder="Your full name" value={form.name} onChange={set("name")} />
                </div>
                <div>
                  <label className={lbl}>Email Address</label>
                  <input type="email" className={inp} placeholder="you@university.edu" value={form.email} onChange={set("email")} />
                </div>
                <div>
                  <label className={lbl}>I am a</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["STUDENT","FACULTY"].map(r => (
                      <button key={r} type="button" onClick={() => setForm(p => ({ ...p, role: r }))}
                        className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition ${form.role === r ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        {r === "STUDENT" ? "Student" : "Faculty"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lbl}>Password</label>
                  <input type="password" className={inp} placeholder="Min. 6 characters" value={form.password} onChange={set("password")} />
                </div>
                <div>
                  <label className={lbl}>Confirm Password</label>
                  <input type="password" className={inp} placeholder="Re-enter password" value={form.confirmPassword} onChange={set("confirmPassword")} />
                </div>
                <button type="button" onClick={nextStep}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition text-sm">
                  Continue <MdArrowForward size={16} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={lbl}>Department</label>
                  <select className={inp} value={form.dept} onChange={set("dept")} required>
                    <option value="">Select department…</option>
                    {DEPTS.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
                  </select>
                </div>
                {form.role === "STUDENT" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Semester</label>
                        <select className={inp} value={form.semester} onChange={set("semester")}>
                          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Section</label>
                        <select className={inp} value={form.section} onChange={set("section")}>
                          {["A","B","C","D"].map(s => <option key={s} value={s}>Section {s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Roll Number</label>
                      <input className={inp} placeholder="e.g. CS2021001" value={form.rollNo} onChange={set("rollNo")} required />
                    </div>
                    <div>
                      <label className={lbl}>Mobile Number</label>
                      <input type="tel" className={inp} placeholder="10-digit number" value={form.mobileNumber} onChange={set("mobileNumber")} required />
                    </div>
                  </>
                )}
                {form.role === "FACULTY" && (
                  <>
                    <div>
                      <label className={lbl}>Employee ID</label>
                      <input className={inp} placeholder="Faculty employee ID" value={form.employeeId} onChange={set("employeeId")} required />
                    </div>
                    <div>
                      <label className={lbl}>Mobile Number</label>
                      <input type="tel" className={inp} placeholder="Mobile number" value={form.mobileNumber} onChange={set("mobileNumber")} />
                    </div>
                  </>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setStep(1); setError(""); }}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition">
                    <MdArrowBack size={15} /> Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition text-sm disabled:opacity-50">
                    {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <>Create Account <MdArrowForward size={15} /></>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
