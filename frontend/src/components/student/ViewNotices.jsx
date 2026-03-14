import { useEffect, useState } from "react";
import { MdDescription, MdSearch, MdClose, MdPerson, MdCalendarToday } from "react-icons/md";
import * as noticesService from "../../services/notices";
import { PAGE, Loading, Empty } from "../../ui";

const AUD_COLOR = { ALL:"bg-blue-50 text-blue-700", STUDENT:"bg-indigo-50 text-indigo-700", FACULTY:"bg-emerald-50 text-emerald-700" };

export default function ViewNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    noticesService.getNotices()
      .then(d => setNotices(d?.notices || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = notices.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.body?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className={PAGE}><Loading /></div>;

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notices</h1>
            <p className="text-slate-500 text-sm mt-0.5">{notices.length} notice{notices.length !== 1 ? "s" : ""} available</p>
          </div>
          <div className="relative shrink-0">
            <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notices…"
              className="pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none w-48 bg-white" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Empty icon={MdDescription} title="No notices found" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(n => (
              <button key={n._id} onClick={() => setSelected(n)}
                className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition p-5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${AUD_COLOR[n.audience] || "bg-slate-100 text-slate-600"}`}>{n.audience}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-700 transition">{n.title}</h3>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">{n.body}</p>
                  </div>
                  <div className="shrink-0 text-slate-300 group-hover:text-indigo-400 transition text-lg">→</div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><MdPerson size={12} />{n.createdBy?.name || "Faculty"}</span>
                  <span className="flex items-center gap-1"><MdCalendarToday size={12} />{new Date(n.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(15,23,42,0.5)", backdropFilter:"blur(4px)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-start justify-between p-6 border-b border-slate-100">
              <div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${AUD_COLOR[selected.audience] || "bg-slate-100 text-slate-600"}`}>{selected.audience}</span>
                <h2 className="font-bold text-slate-900 text-lg mt-2">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
                <MdClose size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{selected.body}</p>
              <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-400">
                <span className="flex items-center gap-1"><MdPerson size={12} />{selected.createdBy?.name || "Faculty"}</span>
                <span className="flex items-center gap-1"><MdCalendarToday size={12} />{new Date(selected.createdAt).toLocaleString()}</span>
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
