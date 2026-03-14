import { useEffect, useState } from "react";
import { MdMessage, MdSearch, MdRefresh, MdPerson } from "react-icons/md";
import * as complaintsService from "../../services/complaints";
import { PAGE, SELECT, Loading, SectionCard, Alert, Empty } from "../../ui";

const STATUS = {
  OPEN:       { cls:"bg-amber-50 text-amber-700 border-amber-200", label:"Open" },
  IN_PROGRESS:{ cls:"bg-blue-50 text-blue-700 border-blue-200",   label:"In Progress" },
  RESOLVED:   { cls:"bg-emerald-50 text-emerald-700 border-emerald-200", label:"Resolved" },
};
const CAT_COLOR = { ACADEMIC:"bg-blue-50 text-blue-700", IT:"bg-violet-50 text-violet-700", FACILITY:"bg-teal-50 text-teal-700", OTHER:"bg-slate-100 text-slate-600" };

export default function ViewComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCat, setFilterCat] = useState("ALL");
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = () => { setLoading(true); complaintsService.getComplaints().then(d=>setComplaints(d?.data||[])).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(load,[]);
  const flash=(m,t="success")=>{ if(t==="success"){setSuccess(m);setTimeout(()=>setSuccess(""),3000);}else{setError(m);setTimeout(()=>setError(""),4000);} };

  const handleStatus = async (id, status) => {
    setUpdatingId(id);
    try { await complaintsService.updateComplaintStatus(id, status); flash("Status updated!"); setComplaints(p=>p.map(c=>c._id===id?{...c,status}:c)); }
    catch { flash("Failed to update.","error"); } finally { setUpdatingId(null); }
  };

  const filtered = complaints.filter(c => {
    if (filterStatus!=="ALL" && c.status!==filterStatus) return false;
    if (filterCat!=="ALL" && c.category!==filterCat) return false;
    if (search && !c.message.toLowerCase().includes(search.toLowerCase()) && !c.createdBy?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = { OPEN:complaints.filter(c=>c.status==="OPEN").length, IN_PROGRESS:complaints.filter(c=>c.status==="IN_PROGRESS").length, RESOLVED:complaints.filter(c=>c.status==="RESOLVED").length };

  return (
    <div className={PAGE+" fade-up"}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">Complaints</h1><p className="text-slate-500 text-sm mt-0.5">{complaints.length} total complaints</p></div>
        {error&&<div className="mb-4"><Alert type="error">{error}</Alert></div>}
        {success&&<div className="mb-4"><Alert type="success">{success}</Alert></div>}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[{ l:"Open", v:counts.OPEN, c:"text-amber-600 bg-amber-50" },{ l:"In Progress", v:counts.IN_PROGRESS, c:"text-blue-600 bg-blue-50" },{ l:"Resolved", v:counts.RESOLVED, c:"text-emerald-600 bg-emerald-50" }].map(c=>(
            <div key={c.l} className={`rounded-2xl p-4 ${c.c.split(" ")[1]}`}>
              <p className="text-xs font-semibold text-slate-500">{c.l}</p>
              <p className={`text-2xl font-bold mt-0.5 ${c.c.split(" ")[0]}`}>{c.v}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative"><MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none bg-white w-44"/></div>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-indigo-500">
            <option value="ALL">All Status</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option>
          </select>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-indigo-500">
            <option value="ALL">All Categories</option><option value="ACADEMIC">Academic</option><option value="IT">IT</option><option value="FACILITY">Facility</option><option value="OTHER">Other</option>
          </select>
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"><MdRefresh size={15}/>Refresh</button>
        </div>

        <SectionCard>
          {loading?<div className="p-10 flex justify-center"><div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin"/></div>
          :filtered.length===0?<Empty icon={MdMessage} title="No complaints found"/>
          :<div className="divide-y divide-slate-50">
            {filtered.map(c=>(
              <div key={c._id} className="p-4 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS[c.status]?.cls||""}`}>{STATUS[c.status]?.label||c.status}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CAT_COLOR[c.category]||""}`}>{c.category}</span>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed">{c.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MdPerson size={11}/>{c.createdBy?.name||"Anonymous"} ({c.createdBy?.role||""})</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <select value={c.status} onChange={e=>handleStatus(c._id, e.target.value)}
                      disabled={updatingId===c._id}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:border-indigo-500 outline-none disabled:opacity-50 cursor-pointer">
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>}
        </SectionCard>
      </div>
    </div>
  );
}
