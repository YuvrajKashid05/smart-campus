import { useEffect, useState } from "react";
import { MdAutoAwesome, MdRefresh } from "react-icons/md";
import { getWeeklyReport } from "../../services/ai";
import { Alert, PAGE } from "../../ui";

export default function AIWeeklyReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getWeeklyReport();
      if (res.ok) setData(res);
      else setError(res.error || "Failed to generate report");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate weekly report");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MdAutoAwesome size={22} className="text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-900">
                AI Weekly Campus Report
              </h1>
            </div>
            <p className="text-slate-500 text-sm">
              AI-generated campus health digest for the last 7 days
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <MdRefresh size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">
              AI is analyzing your campus data…
            </p>
          </div>
        ) : (
          data && (
            <div className="space-y-4">
              {/* AI Narrative */}
              <div className="p-6 rounded-2xl bg-linear-to-br from-indigo-50 via-purple-50 to-blue-50 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-700 mb-3 flex items-center gap-1.5">
                  <MdAutoAwesome size={14} />
                  AI Executive Summary — {data.stats?.period}
                </p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {data.summary}
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    l: "Total Students",
                    v: data.stats?.totalStudents,
                    c: "#6366f1",
                  },
                  {
                    l: "Total Faculty",
                    v: data.stats?.totalFaculty,
                    c: "#10b981",
                  },
                  {
                    l: "New Complaints",
                    v: data.stats?.complaints?.new,
                    c: "#f59e0b",
                  },
                  {
                    l: "Open Complaints",
                    v: data.stats?.complaints?.open,
                    c: "#ef4444",
                  },
                  {
                    l: "Resolved",
                    v: data.stats?.complaints?.resolved,
                    c: "#10b981",
                  },
                  {
                    l: "Sessions Held",
                    v: data.stats?.attendance?.sessionsHeld,
                    c: "#8b5cf6",
                  },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                    style={{ borderLeft: `3px solid ${s.c}` }}
                  >
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      {s.l}
                    </p>
                    <p
                      className="text-2xl font-extrabold mt-0.5"
                      style={{ color: s.c }}
                    >
                      {s.v ?? "—"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                    Content Published
                  </p>
                  <div className="space-y-2">
                    {[
                      { l: "New Notices", v: data.stats?.content?.newNotices },
                      {
                        l: "New Announcements",
                        v: data.stats?.content?.newAnnouncements,
                      },
                    ].map((r) => (
                      <div
                        key={r.l}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm text-slate-600">{r.l}</span>
                        <span className="font-bold text-slate-900">
                          {r.v ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                    Complaint Health
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        l: "Resolution Rate",
                        v:
                          data.stats?.complaints?.new > 0
                            ? `${Math.round((data.stats.complaints.resolved / data.stats.complaints.new) * 100)}%`
                            : "N/A",
                      },
                      { l: "Still Open", v: data.stats?.complaints?.open ?? 0 },
                    ].map((r) => (
                      <div
                        key={r.l}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm text-slate-600">{r.l}</span>
                        <span className="font-bold text-slate-900">{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
