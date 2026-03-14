import { useContext, useEffect, useState } from "react";
import { MdCalendarMonth, MdCheck, MdClose, MdDelete, MdEdit } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as timetableService from "../../services/timetable";
import { PAGE, INPUT, SELECT, BTN_PRIMARY, BTN_GHOST, Alert, SectionCard, Empty } from "../../ui";

const DAYS = [{ v:"MON",l:"Monday" },{ v:"TUE",l:"Tuesday" },{ v:"WED",l:"Wednesday" },{ v:"THU",l:"Thursday" },{ v:"FRI",l:"Friday" }];
const LABEL = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";
const DAY_COLOR = { MON:"bg-blue-50 text-blue-700", TUE:"bg-violet-50 text-violet-700", WED:"bg-emerald-50 text-emerald-700", THU:"bg-amber-50 text-amber-700", FRI:"bg-red-50 text-red-700" };

export default function CreateTimetable() {
  const { user } = useContext(AuthContext);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ dept:user?.dept||"", semester:"1", section:user?.section||"A", day:"MON", slotType:"LECTURE", title:"", subject:"", room:"", startTime:"09:00", endTime:"10:00" });
  const [filterDay, setFilterDay] = useState("ALL");
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!form.dept || !form.semester || !form.section) return;
    setLoading(true);
    timetableService.getTimetableByClass(form.dept, form.semester, form.section)
      .then(d => setSlots(d?.timetables || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [form.dept, form.semester, form.section]);

  const flash = (m, t="success") => { if(t==="success"){setSuccess(m);setTimeout(()=>setSuccess(""),3000);}else{setError(m);setTimeout(()=>setError(""),4000);} };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.dept || !form.title) { flash("Department and title are required.", "error"); return; }
    setSaving(true);
    try {
      const payload = { ...form, semester: parseInt(form.semester) };
      if (editId) { await timetableService.updateTimetable(editId, payload); flash("Slot updated!"); setEditId(null); }
      else { await timetableService.createTimetable(payload); flash("Slot added!"); }
      setForm(p => ({ ...p, title:"", subject:"", room:"", startTime:"09:00", endTime:"10:00" }));
      load();
    } catch(err) { flash(err.response?.data?.error || "Failed.", "error"); }
    finally { setSaving(false); }
  };

  const handleEdit = (s) => {
    setEditId(s._id);
    setForm({ dept:s.dept, semester:String(s.semester), section:s.section, day:s.day, slotType:s.slotType, title:s.title, subject:s.subject||"", room:s.room||"", startTime:s.startTime, endTime:s.endTime });
    window.scrollTo({ top:0, behavior:"smooth" });
  };
  const handleDelete = async (id) => {
    if (!confirm("Delete this slot?")) return;
    try { await timetableService.deleteTimetable(id); flash("Deleted!"); load(); }
    catch { flash("Failed.", "error"); }
  };

  const displayed = filterDay === "ALL" ? slots : slots.filter(s => s.day === filterDay);

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Manage Timetable</h1>
          <p className="text-slate-500 text-sm mt-0.5">Create and edit class schedule slots</p>
        </div>
        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
        {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}

        <div className="grid lg:grid-cols-5 gap-5">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-semibold text-slate-900 text-sm mb-4">{editId ? "Edit slot" : "Add new slot"}</h2>
              <form onSubmit={handleSave} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div><label className={LABEL}>Dept</label><input value={form.dept} onChange={e => set("dept", e.target.value.toUpperCase())} placeholder="CS" className={INPUT} required /></div>
                  <div><label className={LABEL}>Sem</label>
                    <select value={form.semester} onChange={e => set("semester", e.target.value)} className={SELECT}>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label className={LABEL}>Sec</label><input value={form.section} onChange={e => set("section", e.target.value.toUpperCase())} placeholder="A" className={INPUT} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={LABEL}>Day</label>
                    <select value={form.day} onChange={e => set("day", e.target.value)} className={SELECT}>
                      {DAYS.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
                    </select>
                  </div>
                  <div><label className={LABEL}>Type</label>
                    <select value={form.slotType} onChange={e => set("slotType", e.target.value)} className={SELECT}>
                      <option value="LECTURE">Lecture</option>
                      <option value="BREAK">Break</option>
                    </select>
                  </div>
                </div>
                <div><label className={LABEL}>Title *</label><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Data Structures" className={INPUT} required /></div>
                {form.slotType === "LECTURE" && (
                  <>
                    <div><label className={LABEL}>Subject code <span className="normal-case font-normal text-slate-400">(opt)</span></label><input value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="CS301" className={INPUT} /></div>
                    <div><label className={LABEL}>Room <span className="normal-case font-normal text-slate-400">(opt)</span></label><input value={form.room} onChange={e => set("room", e.target.value)} placeholder="B-204" className={INPUT} /></div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={LABEL}>Start</label><input type="time" value={form.startTime} onChange={e => set("startTime", e.target.value)} className={INPUT} required /></div>
                  <div><label className={LABEL}>End</label><input type="time" value={form.endTime} onChange={e => set("endTime", e.target.value)} className={INPUT} required /></div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving} className={BTN_PRIMARY + " flex-1 justify-center"}>
                    {saving ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <><MdCheck size={15} />{editId ? "Update" : "Add Slot"}</>}
                  </button>
                  {editId && <button type="button" onClick={() => setEditId(null)} className={BTN_GHOST}><MdClose size={15} /></button>}
                </div>
              </form>
            </div>
          </div>

          {/* Slots list */}
          <div className="lg:col-span-3">
            <SectionCard
              title={`${form.dept || "?"} · Sem ${form.semester} · Sec ${form.section}`}
              action={
                <div className="flex gap-1 flex-wrap">
                  <button onClick={() => setFilterDay("ALL")} className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${filterDay === "ALL" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>All</button>
                  {DAYS.map(d => (
                    <button key={d.v} onClick={() => setFilterDay(d.v)} className={`text-xs px-2 py-1 rounded-lg font-semibold transition ${filterDay === d.v ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>{d.v}</button>
                  ))}
                </div>
              }
            >
              {loading ? <div className="p-8 flex justify-center"><div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" /></div>
              : displayed.length === 0 ? <Empty icon={MdCalendarMonth} title="No slots yet" sub="Add one using the form." />
              : <div className="divide-y divide-slate-50">
                  {displayed.map(s => (
                    <div key={s._id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${DAY_COLOR[s.day] || "bg-slate-100 text-slate-600"}`}>{s.day}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{s.title}</p>
                        <p className="text-xs text-slate-500">{s.startTime}–{s.endTime}{s.room ? ` · ${s.room}` : ""}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => handleEdit(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"><MdEdit size={14} /></button>
                        <button onClick={() => handleDelete(s._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"><MdDelete size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>}
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
