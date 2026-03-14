import { useEffect, useState } from "react";
import { MdCampaign, MdSearch, MdClose, MdPerson, MdCalendarToday } from "react-icons/md";
import * as announcementsService from "../../services/announcements";
import { PAGE, Loading, Empty } from "../../ui";

const AUD_COLOR = { ALL:"bg-violet-50 text-violet-700", STUDENT:"bg-indigo-50 text-indigo-700", FACULTY:"bg-emerald-50 text-emerald-700" };

export default function ViewAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    announcementsService.getAnnouncements()
      .then(d => setItems(d?.announcements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.message?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className={PAGE}><Loading /></div>;

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
            <p className="text-slate-500 text-sm mt-0.5">{items.length} announcement{items.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="relative shrink-0">
            <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none w-44 bg-white" />
          </div>
        </div>

        {filtered.length === 0
          ? <div className="bg-white rounded-2xl border border-slate-100 shadow-sm"><Empty icon={MdCampaign} title="No announcements" /></div>
          : <div className="space-y-3">
              {filtered.map((a, i) => (
                <button key={a._id || i} onClick={() => setSelected(a)}
                  className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-violet-200 hover:shadow-md transition p-5 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${AUD_COLOR[a.audience] || "bg-slate-100 text-slate-600"}`}>{a.audience}</span>
                        {a.dept && a.dept !== "ALL" && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{a.dept}</span>}
                        {a.semester && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Sem {a.semester}</span>}
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm group-hover:text-violet-700 transition">{a.title}</h3>
                      <p className="text-slate-500 text-xs mt-1 line-clamp-2">{a.message}</p>
                    </div>
                    <span className="text-slate-300 group-hover:text-violet-400 transition text-lg shrink-0">→</span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><MdPerson size={11} />{a.createdBy?.name || "Admin"}</span>
                    <span className="flex items-center gap-1"><MdCalendarToday size={11} />{new Date(a.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</span>
                  </div>
                </button>
              ))}
            </div>}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"rgba(15,23,42,0.5)", backdropFilter:"blur(4px)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-start justify-between p-6 border-b border-slate-100">
              <div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${AUD_COLOR[selected.audience] || ""}`}>{selected.audience}</span>
                  {selected.dept && selected.dept !== "ALL" && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{selected.dept}</span>}
                </div>
                <h2 className="font-bold text-slate-900 text-lg">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
                <MdClose size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-400">
                <span className="flex items-center gap-1"><MdPerson size={11} />{selected.createdBy?.name || "Admin"}</span>
                <span>{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100">
              <button onClick={() => setSelected(null)} className="w-full py-2.5 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800 transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
