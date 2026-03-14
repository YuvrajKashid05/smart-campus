import { useEffect, useState } from "react";
import { MdBarChart, MdSearch, MdPersonAdd, MdRefresh, MdCheckCircle, MdClose, MdPerson } from "react-icons/md";
import * as attendanceService from "../../services/attendance";
import * as usersService from "../../services/users";
import { PAGE, INPUT, BTN_PRIMARY, BTN_GHOST, Loading, SectionCard, Alert, Empty } from "../../ui";

export default function AttendanceReport() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showManual, setShowManual] = useState(false);
  const [students, setStudents] = useState([]);
  const [studSearch, setStudSearch] = useState("");
  const [markingId, setMarkingId] = useState(null);

  const load = async () => {
    setLoading(true); setError("");
    try { const d = await attendanceService.getMySessions(); if (d?.ok) setSessions(d.sessions||[]); else setError(d?.error||"Failed."); }
    catch(err){ setError(err.response?.data?.error||err.message||"Failed to load sessions."); }
    finally { setLoading(false); }
  };
  useEffect(load,[]);

  const flash=(m,t="success")=>{ if(t==="success"){setSuccess(m);setTimeout(()=>setSuccess(""),3000);}else{setError(m);setTimeout(()=>setError(""),4000);} };

  const viewSession = async (s) => {
    setSelected(s); setShowManual(false); setStudSearch(""); setRecLoading(true);
    try { const d = await attendanceService.getSessionRecords(s._id); setRecords(d?.records||[]); }
    catch { setRecords([]); } finally { setRecLoading(false); }
  };

  const openManual = async () => {
    setShowManual(true);
    if (students.length > 0) return;
    try {
      const d = await usersService.getAllUsers({ role:"STUDENT", dept:selected?.dept });
      setStudents((d?.users||[]).filter(u=>u.role==="STUDENT" && (!selected?.dept || u.dept===selected.dept)));
    } catch {}
  };

  const handleMark = async (studentId) => {
    setMarkingId(studentId);
    try {
      const res = await attendanceService.manualMarkStudent(selected._id, studentId);
      if (res.ok) {
        flash("Marked present!");
        const d = await attendanceService.getSessionRecords(selected._id);
        setRecords(d?.records||[]);
      } else flash(res.error||"Failed.","error");
    } catch(err){ flash(err.response?.data?.error||"Failed.","error"); }
    finally { setMarkingId(null); }
  };

  const markedIds = new Set(records.map(r=>r.student?._id||r.student?.toString()));
  const filtStudents = students.filter(s => !studSearch || s.name.toLowerCase().includes(studSearch.toLowerCase()) || s.rollNo?.toLowerCase().includes(studSearch.toLowerCase()));

  return (
    <div className={PAGE+" fade-up"}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-slate-900">Attendance Report</h1><p className="text-slate-500 text-sm mt-0.5">View sessions and manually mark students</p></div>
          <button onClick={load} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"><MdRefresh size={15}/>Refresh</button>
        </div>

        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
        {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}

        {loading ? <Loading/> : (
          <div className="grid lg:grid-cols-5 gap-5">
            {/* Sessions list */}
            <div className="lg:col-span-2">
              <SectionCard title={`Sessions (${sessions.length})`}>
                {sessions.length===0 ? <Empty icon={MdBarChart} title="No sessions yet"/>
                :<div className="divide-y divide-slate-50 max-h-[70vh] overflow-y-auto">
                  {sessions.map(s=>{
                    const expired = new Date(s.expiresAt)<new Date();
                    const active = selected?._id===s._id;
                    return (
                      <button key={s._id} onClick={()=>viewSession(s)} className={`w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition ${active?"bg-indigo-50":""}`}>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${expired?"bg-slate-300":"bg-emerald-500 animate-pulse"}`}/>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm truncate ${active?"text-indigo-700":"text-slate-900"}`}>{s.course}</p>
                          <p className="text-xs text-slate-500">{s.dept}{s.section?` · ${s.section}`:""} · {new Date(s.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${expired?"bg-slate-100 text-slate-500":"bg-emerald-50 text-emerald-700"}`}>
                          {expired?"Ended":"Live"}
                        </span>
                      </button>
                    );
                  })}
                </div>}
              </SectionCard>
            </div>

            {/* Records panel */}
            <div className="lg:col-span-3">
              {!selected ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-48 flex items-center justify-center">
                  <div className="text-center"><MdBarChart size={40} className="text-slate-200 mx-auto mb-2"/><p className="text-slate-400 text-sm">Select a session to view records</p></div>
                </div>
              ) : (
                <SectionCard
                  title={<span>{selected.course} <span className="text-slate-400 font-normal">· {records.length} present</span></span>}
                  action={<button onClick={openManual} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"><MdPersonAdd size={14}/>Manual Mark</button>}
                >
                  {recLoading ? <div className="p-8 flex justify-center"><div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin"/></div>
                  : !showManual ? (
                    <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
                      {records.length===0 ? <Empty icon={MdPerson} title="No attendance yet"/> :
                        records.map((r,i)=>(
                          <div key={r._id||i} className="flex items-center gap-3 px-4 py-3">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                              {r.student?.name?.charAt(0)?.toUpperCase()||"?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 text-sm truncate">{r.student?.name||"Unknown"}</p>
                              <p className="text-xs text-slate-400">{r.student?.rollNo||""} · {new Date(r.markedAt||r.createdAt).toLocaleTimeString()}</p>
                            </div>
                            <MdCheckCircle size={16} className="text-emerald-500 shrink-0"/>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative flex-1"><MdSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={studSearch} onChange={e=>setStudSearch(e.target.value)} placeholder="Search students…" className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none bg-white"/></div>
                        <button onClick={()=>setShowManual(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><MdClose size={16}/></button>
                      </div>
                      <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                        {filtStudents.map(s=>{
                          const present = markedIds.has(s._id);
                          return (
                            <div key={s._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition">
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                {s.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-slate-900 truncate">{s.name}</p><p className="text-xs text-slate-400">{s.rollNo}</p></div>
                              {present ? <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1"><MdCheckCircle size={12}/>Present</span>
                              : <button onClick={()=>handleMark(s._id)} disabled={markingId===s._id} className="text-xs font-semibold bg-indigo-600 text-white px-3 py-1 rounded-full hover:bg-indigo-700 transition disabled:opacity-50">
                                  {markingId===s._id?<div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"/>:"Mark"}
                                </button>}
                            </div>
                          );
                        })}
                        {filtStudents.length===0&&<p className="text-slate-400 text-sm text-center py-4">No students found.</p>}
                      </div>
                    </div>
                  )}
                </SectionCard>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
