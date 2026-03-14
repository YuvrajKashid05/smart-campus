import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdAnalytics, MdCampaign, MdCheckCircle, MdDescription, MdGroup, MdMessage, MdPersonAdd, MdSchool, MdSettings, MdWarning } from "react-icons/md";
import * as usersService from "../../services/users";
import * as complaintsService from "../../services/complaints";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students:0,faculty:0,complaints:0,open:0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [openComplaints, setOpenComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const ROLE_BADGE = { STUDENT:"bg-blue-50 text-blue-700",FACULTY:"bg-emerald-50 text-emerald-700",ADMIN:"bg-violet-50 text-violet-700" };
  const STATUS_BADGE = { OPEN:"bg-amber-50 text-amber-700",IN_PROGRESS:"bg-blue-50 text-blue-700",RESOLVED:"bg-emerald-50 text-emerald-700" };

  useEffect(()=>{
    Promise.allSettled([usersService.getAllUsers(), complaintsService.getComplaints()]).then(([ur,cr])=>{
      if(ur.status==="fulfilled"){ const u=ur.value?.users||[]; setStats(s=>({...s,students:u.filter(x=>x.role==="STUDENT").length,faculty:u.filter(x=>x.role==="FACULTY").length})); setRecentUsers(u.slice(0,5)); }
      if(cr.status==="fulfilled"){ const c=cr.value?.data||[]; setStats(s=>({...s,complaints:c.length,open:c.filter(x=>x.status==="OPEN").length})); setOpenComplaints(c.filter(x=>x.status==="OPEN").slice(0,4)); }
    }).finally(()=>setLoading(false));
  },[]);

  const quickLinks = [
    { to:"/admin/users",         icon:MdGroup,        label:"Manage Users",       color:"#6366f1",bg:"#eef2ff" },
    { to:"/admin/complaints",    icon:MdMessage,      label:"Complaints",         color:"#ef4444",bg:"#fef2f2" },
    { to:"/admin/notices",       icon:MdDescription,  label:"Notices",            color:"#f59e0b",bg:"#fffbeb" },
    { to:"/admin/announcements", icon:MdCampaign,     label:"Announcements",      color:"#8b5cf6",bg:"#f5f3ff" },
    { to:"/admin/reports",       icon:MdAnalytics,    label:"Reports",            color:"#10b981",bg:"#ecfdf5" },
    { to:"/admin/settings",      icon:MdSettings,     label:"Settings",           color:"#6b7280",bg:"#f9fafb" },
  ];

  return (
    <div className="p-4 sm:p-6 pt-14 lg:pt-6 min-h-screen bg-slate-50 fade-up">
      <div className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden" style={{ background:"linear-gradient(135deg,#7c3aed,#8b5cf6)" }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage:"linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)",backgroundSize:"30px 30px" }}/>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center"><MdSchool size={22}/></div>
          <div><h1 className="text-xl font-extrabold">Admin Dashboard</h1><p className="text-violet-200 text-xs mt-0.5">Smart Campus Management</p></div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { l:"Students",      v:stats.students,   c:"#6366f1" },
          { l:"Faculty",       v:stats.faculty,    c:"#10b981" },
          { l:"Complaints",    v:stats.complaints, c:"#f59e0b" },
          { l:"Open Issues",   v:stats.open,       c:"#ef4444" },
        ].map(s=>(
          <div key={s.l} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4" style={{ borderLeft:`3px solid ${s.c}` }}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{s.l}</p>
            <p className="text-2xl font-extrabold mt-1" style={{ color:s.c }}>{loading?"—":s.v}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-bold text-slate-900 text-sm mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {quickLinks.map(l=>{const Icon=l.icon; return <Link key={l.to} to={l.to} className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition" style={{ background:l.bg }}><Icon size={16} style={{ color:l.color }}/><span className="text-sm font-semibold" style={{ color:l.color }}>{l.label}</span></Link>;})}</div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          {/* Recent users */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2"><MdPersonAdd size={17} className="text-indigo-500"/><h2 className="font-bold text-slate-900 text-sm">Recent Users</h2></div>
              <Link to="/admin/users" className="text-xs text-indigo-600 font-semibold hover:underline">Manage →</Link>
            </div>
            {loading?<div className="p-6 flex justify-center"><div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin"/></div>
            :<div className="divide-y divide-slate-50">
              {recentUsers.map((u,i)=>(
                <div key={u._id||i} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background:u.role==="STUDENT"?"#6366f1":u.role==="FACULTY"?"#10b981":"#8b5cf6" }}>{u.name?.charAt(0)?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-slate-900 text-sm truncate">{u.name}</p><p className="text-xs text-slate-400 truncate">{u.email}</p></div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ROLE_BADGE[u.role]||""}`}>{u.role}</span>
                </div>
              ))}
            </div>}
          </div>

          {/* Open complaints */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2"><MdMessage size={17} className="text-red-500"/><h2 className="font-bold text-slate-900 text-sm">Open Complaints</h2></div>
              <Link to="/admin/complaints" className="text-xs text-red-500 font-semibold hover:underline">Resolve →</Link>
            </div>
            {loading?<div className="p-6 flex justify-center"><div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-red-500 animate-spin"/></div>
            :openComplaints.length===0?<div className="py-10 text-center"><MdCheckCircle size={32} className="text-emerald-300 mx-auto mb-2"/><p className="text-slate-400 text-sm">No open complaints 🎉</p></div>
            :<div className="divide-y divide-slate-50">
              {openComplaints.map((c,i)=>(
                <div key={c._id||i} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0"><p className="text-sm text-slate-800 font-medium line-clamp-1">{c.message}</p><p className="text-xs text-slate-400 mt-0.5">{c.createdBy?.name} · {c.category} · {new Date(c.createdAt).toLocaleDateString()}</p></div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[c.status]||""}`}>{c.status}</span>
                </div>
              ))}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
