import { useEffect, useState } from "react";
import { MdBarChart, MdRefresh, MdCheckCircle, MdWarning, MdInfo } from "react-icons/md";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import * as attendanceService from "../../services/attendance";
import { PAGE, Loading, Alert } from "../../ui";

const THRESHOLD = 75;
const getColor = (p) => p >= 85 ? "#10b981" : p >= THRESHOLD ? "#f59e0b" : "#ef4444";

export default function MyAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await attendanceService.getMyAttendanceSummary();
      if (res.ok) setData(res); else setError(res.error||"Failed.");
    } catch(err) { setError(err.response?.data?.error||"Failed to load."); }
    finally { setLoading(false); }
  };
  useEffect(load, []);

  if (loading) return <div className={PAGE}><Loading/></div>;

  const overall = data?.overallPercentage ?? 0;
  const total = data?.totalSessions ?? 0;
  const present = data?.totalPresent ?? 0;
  const summary = data?.summary ?? [];
  const absent = total - present;

  return (
    <div className={PAGE+" fade-up"}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-slate-900">My Attendance</h1><p className="text-slate-500 text-sm mt-0.5">Subject-wise breakdown and statistics</p></div>
          <button onClick={load} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"><MdRefresh size={15}/>Refresh</button>
        </div>

        {error && <div className="mb-5"><Alert type="error">{error}</Alert></div>}

        {total === 0 && !error ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center">
            <MdBarChart size={48} className="text-slate-200 mx-auto mb-3"/>
            <p className="text-slate-500 font-medium">No attendance data yet</p>
            <p className="text-slate-400 text-xs mt-1">Data will appear once your faculty starts QR sessions</p>
          </div>
        ) : (
          <>
            {/* Status banner */}
            {overall < THRESHOLD && (
              <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <MdWarning size={20} className="text-red-500 shrink-0 mt-0.5"/>
                <div>
                  <p className="font-bold text-red-800 text-sm">Attendance below {THRESHOLD}% — Defaulter Risk</p>
                  <p className="text-red-700 text-xs mt-0.5">
                    You need <strong>{Math.max(0, Math.ceil(((THRESHOLD * total) - (present * 100)) / (100 - THRESHOLD)))}</strong> more consecutive classes to reach {THRESHOLD}%.
                  </p>
                </div>
              </div>
            )}
            {overall >= THRESHOLD && overall < 85 && (
              <div className="mb-5 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <MdInfo size={18} className="text-amber-500 shrink-0"/>
                <p className="text-amber-800 text-sm">Attendance is safe at <strong>{overall}%</strong> — keep attending regularly to stay above {THRESHOLD}%.</p>
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { l:"Overall", v:`${overall}%`, color:getColor(overall), bg:"bg-white" },
                { l:"Total Classes", v:total, color:"#6366f1", bg:"bg-white" },
                { l:"Present", v:present, color:"#10b981", bg:"bg-white" },
                { l:"Absent", v:absent, color:"#ef4444", bg:"bg-white" },
              ].map(c=>(
                <div key={c.l} className={`${c.bg} rounded-2xl border border-slate-100 shadow-sm p-4`} style={{ borderLeft:`3px solid ${c.color}` }}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.l}</p>
                  <p className="text-2xl font-extrabold mt-1" style={{ color:c.color }}>{c.v}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-5 mb-6">
              {/* Donut */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="font-semibold text-slate-900 text-sm mb-4">Overall Attendance</p>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={[{ name:"Present",value:present },{ name:"Absent",value:absent }]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                        <Cell fill={getColor(overall)}/>
                        <Cell fill="#f1f5f9"/>
                      </Pie>
                      <Tooltip formatter={(v)=>[`${v} classes`,""]}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-3xl font-extrabold" style={{ color:getColor(overall) }}>{overall}%</p>
                    <p className="text-xs text-slate-400 mt-0.5">Overall</p>
                  </div>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {[{ c:getColor(overall), l:"Present", v:present },{ c:"#f1f5f9", l:"Absent", v:absent }].map(i=>(
                    <div key={i.l} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor:i.c, border:i.c==="#f1f5f9"?"1px solid #e2e8f0":"none" }}/>
                      {i.l}: {i.v}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar chart */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="font-semibold text-slate-900 text-sm mb-4">Subject-wise %</p>
                {summary.length === 0 ? <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data</div> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={summary.map(s=>({ name:s.course.length>12?s.course.slice(0,12)+"…":s.course, pct:s.percentage, full:s.course, a:s.attended, t:s.totalClasses }))} margin={{ bottom:35, left:-15 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="name" tick={{ fontSize:10 }} angle={-30} textAnchor="end"/>
                      <YAxis domain={[0,100]} tick={{ fontSize:10 }} unit="%"/>
                      <Tooltip formatter={(v,_,p)=>[`${v}% (${p.payload.a}/${p.payload.t})`, p.payload.full]}/>
                      <Bar dataKey="pct" radius={[4,4,0,0]}>{summary.map((_,i)=><Cell key={i} fill={getColor(_.percentage)}/>)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Subject cards */}
            <h2 className="text-base font-bold text-slate-900 mb-3">Subject Breakdown</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.map(s=>{
                const color = getColor(s.percentage);
                const label = s.percentage>=85?{ t:"Good",c:"bg-emerald-50 text-emerald-700" } : s.percentage>=THRESHOLD?{ t:"Safe",c:"bg-amber-50 text-amber-700" } : { t:"At Risk",c:"bg-red-50 text-red-600" };
                return (
                  <div key={s.course} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5" style={{ borderTop:`3px solid ${color}` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{s.course}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.dept}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 ${label.c}`}>{label.t}</span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">{s.attended} / {s.totalClasses}</span><span className="font-bold" style={{ color }}>{s.percentage}%</span></div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width:`${s.percentage}%`, backgroundColor:color }}/>
                      </div>
                      {/* 75% marker */}
                      <div className="relative h-2 -mt-2">
                        <div className="absolute w-0.5 h-3 -mt-0.5 rounded" style={{ left:"75%", backgroundColor:"#ef4444", opacity:0.5 }}/>
                      </div>
                    </div>
                    {s.sessions?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1.5">Recent</p>
                        <div className="flex gap-1 flex-wrap">
                          {s.sessions.slice(0,8).map((sess,i)=>(
                            <span key={i} title={new Date(sess.date).toLocaleDateString()}
                              className={`w-5 h-5 rounded-full flex items-center justify-center ${sess.present?"bg-emerald-100 text-emerald-600":"bg-red-50 text-red-400"}`}>
                              {sess.present?<MdCheckCircle size={13}/>:<span className="text-[10px] font-bold">✕</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-5 flex flex-wrap gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-xs text-slate-600">
              {[{ c:"#10b981",l:"≥ 85% — Good" },{ c:"#f59e0b",l:"75–84% — Safe" },{ c:"#ef4444",l:"< 75% — At Risk" }].map(i=>(
                <div key={i.l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor:i.c }}/>{i.l}</div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
