import { useContext, useEffect, useState } from "react";
import { MdDescription, MdAdd, MdEdit, MdDelete, MdCheck, MdClose } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as noticesService from "../../services/notices";
import { PAGE, INPUT, BTN_PRIMARY, BTN_GHOST, Alert, SectionCard, Empty } from "../../ui";

const AUD = [{ v:"ALL",l:"Everyone" },{ v:"STUDENT",l:"Students only" },{ v:"FACULTY",l:"Faculty only" }];
const AUD_COLOR = { ALL:"bg-blue-50 text-blue-700", STUDENT:"bg-indigo-50 text-indigo-700", FACULTY:"bg-emerald-50 text-emerald-700" };
const LABEL = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";

export default function CreateNotice() {
  const { user } = useContext(AuthContext);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title:"", body:"", audience:"ALL" });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const load = () => { setLoading(true); noticesService.getNotices().then(d => setNotices(d?.notices || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(load, []);
  const flash = (m, t="success") => { if(t==="success"){setSuccess(m);setTimeout(()=>setSuccess(""),3000);}else{setError(m);setTimeout(()=>setError(""),4000);} };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { flash("Title and body are required.", "error"); return; }
    setSaving(true);
    try {
      if (editId) { await noticesService.updateNotice(editId, form); flash("Notice updated!"); setEditId(null); }
      else { await noticesService.createNotice(form); flash("Notice published!"); }
      setForm({ title:"", body:"", audience:"ALL" }); load();
    } catch(err) { flash(err.response?.data?.error || "Failed to save.", "error"); }
    finally { setSaving(false); }
  };

  const handleEdit = (n) => { setEditId(n._id); setForm({ title:n.title, body:n.body, audience:n.audience }); window.scrollTo({top:0,behavior:"smooth"}); };
  const handleDelete = async (id) => {
    if (!confirm("Delete this notice?")) return;
    setDeletingId(id);
    try { await noticesService.deleteNotice(id); flash("Deleted!"); load(); }
    catch { flash("Failed.", "error"); } finally { setDeletingId(null); }
  };

  const myNotices = notices.filter(n => n.createdBy?._id === user?._id || n.createdBy?.toString() === user?._id);

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{editId ? "Edit Notice" : "Create Notice"}</h1>
          <p className="text-slate-500 text-sm mt-0.5">Post important notices for students and faculty</p>
        </div>
        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
        {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-900 text-sm mb-4">{editId ? "Edit notice" : "New notice"}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className={LABEL}>Title</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Notice title" className={INPUT} required />
            </div>
            <div>
              <label className={LABEL}>Audience</label>
              <div className="flex gap-2">
                {AUD.map(a => (
                  <button key={a.v} type="button" onClick={() => set("audience", a.v)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition ${form.audience === a.v ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-100 text-slate-600 hover:border-slate-200"}`}>
                    {a.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>Content</label>
              <textarea value={form.body} onChange={e => set("body", e.target.value)} rows={4} placeholder="Write the notice content here…" required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none text-sm text-slate-800 bg-white transition resize-none placeholder:text-slate-400" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>
                {saving ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <><MdCheck size={15} />{editId ? "Update" : "Publish"}</>}
              </button>
              {editId && <button type="button" onClick={() => { setEditId(null); setForm({ title:"",body:"",audience:"ALL" }); }} className={BTN_GHOST}><MdClose size={15} />Cancel</button>}
            </div>
          </form>
        </div>

        <SectionCard title={`My Notices (${myNotices.length})`}>
          {loading ? <div className="p-8 flex justify-center"><div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" /></div>
          : myNotices.length === 0 ? <div className="py-10 text-center text-sm text-slate-400">No notices created yet.</div>
          : <div className="divide-y divide-slate-50">
              {myNotices.map(n => (
                <div key={n._id} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-slate-900 text-sm truncate">{n.title}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${AUD_COLOR[n.audience] || ""}`}>{n.audience}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{n.body}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleEdit(n)} className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"><MdEdit size={15} /></button>
                    <button onClick={() => handleDelete(n._id)} disabled={deletingId === n._id} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                      {deletingId === n._id ? <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 border-t-red-500 animate-spin" /> : <MdDelete size={15} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>}
        </SectionCard>
      </div>
    </div>
  );
}
