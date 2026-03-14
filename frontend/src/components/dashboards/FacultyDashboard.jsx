import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdBarChart, MdCalendarMonth, MdCampaign, MdDescription, MdGroup, MdQrCode2, MdSchedule, MdWarning } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as attendanceService from "../../services/attendance";
import * as noticeService from "../../services/notices";

export default function FacultyDashboard() {
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    Promise.allSettled([attendanceService.getMySessions(), noticeService.getNotices()])
      .then(([sr, nr]) => {
        if(sr.status==="fulfilled") setSessions(sr.value?.sessions||[]);
        if(nr.status==="fulfilled") setNotices((nr.value?.notices||[]).slice(0,4));
      }).finally(()=>setLoading(false));
  },[]);

  const h=new Date().getHours();
  const greet=h<12?"Good morning":h<17?"Good afternoon":"Good evening";
  const active=sessions.filter(s=>new Date(s.expiresAt)>new Date()).length;

  const quickLinks = [
    { to:"/faculty/qr-attendance",     icon:MdQrCode2,        label:"Generate QR",       color:"#6366f1",bg:"#eef2ff" },
    { to:"/faculty/attendance-report", icon:MdBarChart,       label:"Attendance Report", color:"#8b5cf6",bg:"#f5f3ff" },
    { to:"/faculty/defaulters",        icon:MdWarning,        label:"Defaulter List",    color:"#f59e0b",bg:"#fffbeb" },
    { to:"/faculty/student-records",   icon:MdGroup,          label:"Student Records",   color:"#10b981",bg:"#ecfdf5" },
    { to:"/faculty/timetable",         icon:MdCalendarMonth,  label:"Timetable",         color:"#06b6d4",bg:"#ecfeff" },
    { to:"/faculty/notice",            icon:MdDescription,    label:"Create Notice",     color:"#ef4444",bg:"#fef2f2" },
    { to:"/faculty/announcement",      icon:MdCampaign,       label:"Announcement",      color:"#ec4899",bg:"#fdf2f8" },
  ];

  return (
    <div className="p-4 sm:p-6 pt-14 lg:pt-6 min-h-screen bg-slate-50 fade-up">
      {/* Welcome */}
      <div className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden" style={{ background:"linear-gradient(135deg,#059669,#10b981)" }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage:"linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)",backgroundSize:"30px 30px" }}/>
        <p className="text-emerald-100 text-xs font-semibold">{greet} 👋</p>
        <h1 className="text-xl font-extrabold mt-0.5">Prof. {user?.name}</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          {[user?.dept, user?.employeeId&&`ID: ${user.employeeId}`].filter(Boolean).map((t,i)=><span key={i} className="text-xs bg-white/15 text-emerald-100 px-3 py-1 rounded-full font-medium">{t}</span>)}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { l:"Total Sessions", v:sessions.length, c:"#6366f1" },
          { l:"Active Now",     v:active,          c:"#10b981" },
          { l:"Notices",        v:notices.length,  c:"#f59e0b" },
          { l:"Dept",           v:user?.dept||"—", c:"#8b5cf6" },
        ].map(s=>(
          <div key={s.l} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4" style={{ borderLeft:`3px solid ${s.c}` }}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{s.l}</p>
            <p className="text-2xl font-extrabold mt-1" style={{ color:s.c }}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Quick actions */}
        <div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-bold text-slate-900 text-sm mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {quickLinks.map(l=>{
                const Icon=l.icon;
                return <Link key={l.to} to={l.to} className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition" style={{ background:l.bg }}><Icon size={16} style={{ color:l.color }}/><span className="text-sm font-semibold" style={{ color:l.color }}>{l.label}</span></Link>;
              })}
            </div>
          </div>
        </div>

        {/* Sessions + notices */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2"><MdSchedule size={17} className="text-indigo-500"/><h2 className="font-bold text-slate-900 text-sm">Recent Sessions</h2></div>
              <Link to="/faculty/attendance-report" className="text-xs text-indigo-600 font-semibold hover:underline">View all →</Link>
            </div>
            {loading?<div className="p-6 flex justify-center"><div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin"/></div>
            :sessions.slice(0,5).length===0?<p className="p-8 text-center text-slate-400 text-sm">No sessions yet. Generate a QR to start.</p>
            :<div className="divide-y divide-slate-50">
              {sessions.slice(0,5).map(s=>{
                const expired=new Date(s.expiresAt)<new Date();
                return (
                  <div key={s._id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${expired?"bg-slate-200":"bg-emerald-500 animate-pulse"}`}/>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{s.course}</p>
                      <p className="text-xs text-slate-500">{s.dept}{s.section?` · Sec ${s.section}`:""} · {new Date(s.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${expired?"bg-slate-100 text-slate-500":"bg-emerald-50 text-emerald-700"}`}>{expired?"Ended":"Active"}</span>
                  </div>
                );
              })}
            </div>}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2"><MdDescription size={17} className="text-amber-500"/><h2 className="font-bold text-slate-900 text-sm">Recent Notices</h2></div>
              <Link to="/faculty/notice" className="text-xs text-amber-600 font-semibold hover:underline">Create →</Link>
            </div>
            {loading?<div className="p-6 flex justify-center"><div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-amber-500 animate-spin"/></div>
            :notices.length===0?<p className="p-6 text-center text-slate-400 text-sm">No notices yet.</p>
            :<div className="divide-y divide-slate-50">
              {notices.map((n,i)=>(
                <div key={n._id||i} className="px-5 py-3.5">
                  <p className="font-semibold text-slate-900 text-sm">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString()} · {n.audience}</p>
                </div>
              ))}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
