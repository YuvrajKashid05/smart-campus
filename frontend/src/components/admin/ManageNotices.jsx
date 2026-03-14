import { useEffect, useState } from "react";
import { MdDescription, MdSearch, MdDelete, MdPerson } from "react-icons/md";
import * as noticesService from "../../services/notices";
import { PAGE, Loading, SectionCard, Alert, Empty } from "../../ui";
const AUD_COLOR = { ALL:"bg-blue-50 text-blue-700", STUDENT:"bg-indigo-50 text-indigo-700", FACULTY:"bg-emerald-50 text-emerald-700" };
export default function ManageNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const load = () => { setLoading(true); noticesService.getNotices().then(d=>setNotices(d?.notices||[])).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(load,[]);
  const flash=(m,t="success")=>{ if(t==="success"){setSuccess(m);setTimeout(()=>setSuccess(""),3000);}else{setError(m);setTimeout(()=>setError(""),4000);} };
  const handleDelete = async (id) => {
    if (!confirm("Delete this notice?")) return;
    setDeletingId(id);
    try { await noticesService.deleteNotice(id); flash("Deleted!"); setNotices(p=>p.filter(n=>n._id!==id)); }
    catch { flash("Failed.","error"); } finally { setDeletingId(null); }
  };
  const filtered = notices.filter(n=>!search||n.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className={PAGE+" fade-up"}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div><h1 className="text-2xl font-bold text-slate-900">Manage Notices</h1><p className="text-slate-500 text-sm mt-0.5">{notices.length} notices</p></div>
          <div className="relative"><MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none bg-white w-44"/></div>
        </div>
        {error&&<div className="mb-4"><Alert type="error">{error}</Alert></div>}
        {success&&<div className="mb-4"><Alert type="success">{success}</Alert></div>}
        <SectionCard>
          {loading?<div className="p-10 flex justify-center"><div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin"/></div>
          :filtered.length===0?<Empty icon={MdDescription} title="No notices found"/>
          :<div className="divide-y divide-slate-50">
            {filtered.map(n=>(
              <div key={n._id} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><p className="font-semibold text-slate-900 text-sm">{n.title}</p><span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${AUD_COLOR[n.audience]||""}`}>{n.audience}</span></div>
                  <p className="text-xs text-slate-500 line-clamp-2">{n.body}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><MdPerson size={11}/>{n.createdBy?.name||"—"}</span>
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button onClick={()=>handleDelete(n._id)} disabled={deletingId===n._id} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition shrink-0">
                  {deletingId===n._id?<div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-red-500 animate-spin"/>:<MdDelete size={16}/>}
                </button>
              </div>
            ))}
          </div>}
        </SectionCard>
      </div>
    </div>
  );
}
