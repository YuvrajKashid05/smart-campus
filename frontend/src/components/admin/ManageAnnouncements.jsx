import { useEffect, useState } from "react";
import { MdCampaign, MdSearch, MdDelete, MdPerson } from "react-icons/md";
import * as announcementsService from "../../services/announcements";
import { PAGE, Loading, SectionCard, Alert, Empty } from "../../ui";
export default function ManageAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const load = () => { setLoading(true); announcementsService.getAnnouncements().then(d=>setItems(d?.announcements||[])).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(load,[]);
  const flash=(m,t="success")=>{ if(t==="success"){setSuccess(m);setTimeout(()=>setSuccess(""),3000);}else{setError(m);setTimeout(()=>setError(""),4000);} };
  const handleDelete = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    setDeletingId(id);
    try { await announcementsService.deleteAnnouncement(id); flash("Deleted!"); setItems(p=>p.filter(a=>a._id!==id)); }
    catch { flash("Failed.","error"); } finally { setDeletingId(null); }
  };
  const filtered = items.filter(a=>!search||a.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className={PAGE+" fade-up"}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div><h1 className="text-2xl font-bold text-slate-900">Manage Announcements</h1><p className="text-slate-500 text-sm mt-0.5">{items.length} announcements</p></div>
          <div className="relative"><MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none bg-white w-44"/></div>
        </div>
        {error&&<div className="mb-4"><Alert type="error">{error}</Alert></div>}
        {success&&<div className="mb-4"><Alert type="success">{success}</Alert></div>}
        <SectionCard>
          {loading?<div className="p-10 flex justify-center"><div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin"/></div>
          :filtered.length===0?<Empty icon={MdCampaign} title="No announcements"/>
          :<div className="divide-y divide-slate-50">
            {filtered.map(a=>(
              <div key={a._id} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <p className="font-semibold text-slate-900 text-sm">{a.title}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">{a.audience}</span>
                    {a.dept&&a.dept!=="ALL"&&<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{a.dept}</span>}
                    {a.semester&&<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Sem {a.semester}</span>}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{a.message}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400"><span className="flex items-center gap-1"><MdPerson size={11}/>{a.createdBy?.name||"—"}</span><span>{new Date(a.createdAt).toLocaleDateString()}</span></div>
                </div>
                <button onClick={()=>handleDelete(a._id)} disabled={deletingId===a._id} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition shrink-0">
                  {deletingId===a._id?<div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-red-500 animate-spin"/>:<MdDelete size={16}/>}
                </button>
              </div>
            ))}
          </div>}
        </SectionCard>
      </div>
    </div>
  );
}
