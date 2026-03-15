import { useContext, useState } from "react";
import { MdAutoAwesome, MdRefresh, MdWarning } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import { getAttendanceRisk } from "../../services/ai";
import { Alert, INPUT, PAGE, SectionCard } from "../../ui";

const LABEL = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";

export default function AIRiskReport() {
  const { user } = useContext(AuthContext);
  const [filters, setFilters] = useState({ dept: user?.dept || "", semester: "", section: "" });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  const fetch = async (e) => {
    e?.preventDefault();
    if (!filters.dept) { setError("Department is required."); return; }
    setLoading(true); setError(""); setReport(null);
    try {
      const res = await getAttendanceRisk(filters);
      if (res.ok) setReport(res);
      else setError(res.error || "Failed to generate report");
    } catch (err) { setError(err.response?.data?.error || "Failed to generate AI risk report"); }
    finally { setLoading(false); }
  };

  const RiskCard = ({ students, level, color, bg }) => (
    students?.length > 0 ? (
      <div className={`rounded-2xl border p-4 ${bg}`}>
        <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${color}`}>{level} Risk ({students.length})</p>
        <div className="space-y-2">
          {students.map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2.5 border border-slate-100">
              <div>
                <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                <p className="text-xs text-slate-400">{s.rollNo} · {s.reason || "Below threshold"}</p>
              </div>
              <span className={`text-sm font-extrabold shrink-0 ${s.pct < 75 ? "text-red-600" : "text-amber-600"}`}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    ) : null
  );

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <MdAutoAwesome size={22} className="text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">AI Attendance Risk Report</h1>
          </div>
          <p className="text-slate-500 text-sm">AI predicts which students are at risk of becoming defaulters</p>
        </div>

        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
          <form onSubmit={fetch} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className={LABEL}>Department *</label>
              <input value={filters.dept} onChange={e => set("dept", e.target.value.toUpperCase())} placeholder="CS" className={INPUT + " w-24"} required />
            </div>
            <div>
              <label className={LABEL}>Semester</label>
              <select value={filters.semester} onChange={e => set("semester", e.target.value)} className={INPUT + " w-36"}>
                <option value="">All</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Section</label>
              <input value={filters.section} onChange={e => set("section", e.target.value.toUpperCase())} placeholder="A" className={INPUT + " w-24"} />
            </div>
            <button type="submit" disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50 transition">
              {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <MdAutoAwesome size={16} />}
              {loading ? "Analyzing…" : "Generate AI Report"}
            </button>
          </form>
        </div>

        {report && (
          <div className="space-y-4">
            {/* AI Summary */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
              <p className="text-xs font-bold text-indigo-700 mb-2 flex items-center gap-1.5"><MdAutoAwesome size={14} />AI Summary</p>
              <p className="text-sm text-slate-700 leading-relaxed">{report.report?.summary}</p>
              {report.report?.recommendation && (
                <div className="mt-3 p-3 rounded-xl bg-white border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-600 mb-1">Recommendation</p>
                  <p className="text-xs text-slate-700">{report.report.recommendation}</p>
                </div>
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <RiskCard students={report.report?.highRisk}   level="High"   color="text-red-600"   bg="bg-red-50 border-red-200" />
              <RiskCard students={report.report?.mediumRisk} level="Medium" color="text-amber-600" bg="bg-amber-50 border-amber-200" />
            </div>

            {(!report.report?.highRisk?.length && !report.report?.mediumRisk?.length) && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MdAutoAwesome size={28} className="text-emerald-600" />
                </div>
                <p className="font-semibold text-slate-700">All students look good! 🎉</p>
                <p className="text-slate-400 text-sm mt-1">No high or medium risk students detected.</p>
              </div>
            )}

            {/* Raw data */}
            {report.raw?.length > 0 && (
              <SectionCard title="All Students — Attendance Stats">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100">
                      {["Student","Attended","Total","Attendance"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {report.raw.map((s, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">{s.name}<br/><span className="text-xs text-slate-400 font-normal">{s.rollNo}</span></td>
                          <td className="px-4 py-3 text-slate-700">{s.attended}</td>
                          <td className="px-4 py-3 text-slate-700">{s.total}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full max-w-20">
                                <div className="h-full rounded-full" style={{ width:`${s.pct}%`, backgroundColor: s.pct<75?"#ef4444":s.pct<85?"#f59e0b":"#10b981" }}/>
                              </div>
                              <span className="text-xs font-bold" style={{ color: s.pct<75?"#ef4444":s.pct<85?"#f59e0b":"#10b981" }}>{s.pct}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
