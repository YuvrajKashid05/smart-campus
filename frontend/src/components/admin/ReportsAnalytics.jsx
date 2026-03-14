import { useEffect, useState } from "react";
import { MdAnalytics, MdRefresh, MdGroup, MdMessage } from "react-icons/md";
import * as usersService from "../../services/users";
import * as complaintsService from "../../services/complaints";
import { PAGE, Loading, SectionCard } from "../../ui";

export default function ReportsAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [ur, cr] = await Promise.allSettled([usersService.getAllUsers(), complaintsService.getComplaints()]);
    const users = ur.status==="fulfilled" ? ur.value?.users||[] : [];
    const complaints = cr.status==="fulfilled" ? cr.value?.data||[] : [];
    const deptCount = {};
    users.filter(u=>u.role==="STUDENT").forEach(u=>{ if(u.dept) deptCount[u.dept]=(deptCount[u.dept]||0)+1; });
    setData({ users, complaints, deptCount });
    setLoading(false);
  };
  useEffect(load,[]);

  if (loading) return <div className={PAGE}><Loading/></div>;

  const { users, complaints, deptCount } = data;
  const students = users.filter(u=>u.role==="STUDENT");
  const faculty = users.filter(u=>u.role==="FACULTY");
  const catCount = {};
  complaints.forEach(c=>{ catCount[c.category]=(catCount[c.category]||0)+1; });
  const maxDept = Math.max(...Object.values(deptCount), 1);
  const maxCat = Math.max(...Object.values(catCount), 1);

  return (
    <div className={PAGE+" fade-up"}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1><p className="text-slate-500 text-sm mt-0.5">System-wide statistics</p></div>
          <button onClick={load} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"><MdRefresh size={15}/>Refresh</button>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { l:"Total Users",   v:users.length,      c:"bg-indigo-600" },
            { l:"Students",      v:students.length,   c:"bg-blue-500" },
            { l:"Faculty",       v:faculty.length,    c:"bg-emerald-500" },
            { l:"Complaints",    v:complaints.length, c:"bg-amber-500" },
          ].map(s=>(
            <div key={s.l} className={`${s.c} rounded-2xl p-5 text-white`}>
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">{s.l}</p>
              <p className="text-3xl font-extrabold mt-1">{s.v}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Dept breakdown */}
          <SectionCard title="Students by Department">
            <div className="p-5 space-y-3">
              {Object.entries(deptCount).sort((a,b)=>b[1]-a[1]).map(([dept, count])=>(
                <div key={dept} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 w-8 shrink-0">{dept}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width:`${Math.round(count/maxDept*100)}%` }}/>
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-8 text-right shrink-0">{count}</span>
                </div>
              ))}
              {Object.keys(deptCount).length===0&&<p className="text-sm text-slate-400 text-center py-4">No data</p>}
            </div>
          </SectionCard>

          {/* Complaints by category */}
          <SectionCard title="Complaints by Category">
            <div className="p-5 space-y-3">
              {Object.entries(catCount).sort((a,b)=>b[1]-a[1]).map(([cat, count])=>(
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 w-20 shrink-0 truncate">{cat}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width:`${Math.round(count/maxCat*100)}%` }}/>
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-6 text-right shrink-0">{count}</span>
                </div>
              ))}
              {Object.keys(catCount).length===0&&<p className="text-sm text-slate-400 text-center py-4">No complaints</p>}
            </div>
          </SectionCard>

          {/* Complaint status */}
          <SectionCard title="Complaint Status Breakdown">
            <div className="p-5 grid grid-cols-3 gap-3">
              {["OPEN","IN_PROGRESS","RESOLVED"].map(s=>{
                const count = complaints.filter(c=>c.status===s).length;
                const colors = { OPEN:"text-amber-600 bg-amber-50", IN_PROGRESS:"text-blue-600 bg-blue-50", RESOLVED:"text-emerald-600 bg-emerald-50" };
                return (
                  <div key={s} className={`rounded-xl p-3 text-center ${colors[s]}`}>
                    <p className="text-2xl font-extrabold">{count}</p>
                    <p className="text-xs font-semibold mt-0.5">{s.replace("_"," ")}</p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* User activity */}
          <SectionCard title="User Overview">
            <div className="p-5 space-y-2">
              {[
                { l:"Active accounts",   v:users.filter(u=>u.isActive!==false).length, total:users.length },
                { l:"Inactive accounts", v:users.filter(u=>u.isActive===false).length, total:users.length },
              ].map(r=>(
                <div key={r.l} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-36 shrink-0">{r.l}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width:`${r.total?Math.round(r.v/r.total*100):0}%` }}/>
                  </div>
                  <span className="text-xs font-bold text-slate-700 shrink-0">{r.v}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
