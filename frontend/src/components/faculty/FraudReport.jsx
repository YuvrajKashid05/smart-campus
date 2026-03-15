import { useEffect, useState } from "react";
import {
  MdAutoAwesome,
  MdDevices,
  MdLocationOn,
  MdRefresh,
  MdWarning,
} from "react-icons/md";
import * as attendanceService from "../../services/attendance";
import { Alert, PAGE, SectionCard } from "../../ui";

export default function FraudReport() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await attendanceService.getFraudSummary();
      if (res.ok) setSummary(res.summary || []);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadSummary();
  }, []);

  const loadReport = async (s) => {
    setSelected(s);
    setReport(null);
    setReportLoading(true);
    try {
      const res = await attendanceService.getFraudReport(s.sessionId);
      if (res.ok) setReport(res);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to load fraud report");
    } finally {
      setReportLoading(false);
    }
  };

  const totalFlagged = summary.reduce((a, s) => a + s.flagged, 0);
  const totalProxy = summary.reduce((a, s) => a + (s.proxy || 0), 0);

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <MdAutoAwesome size={22} className="text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              AI Attendance Fraud Report
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            GPS location verification + device fingerprint proxy detection —
            powered by Gemini AI
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {/* How it works */}
        <div className="mb-5 p-4 rounded-2xl bg-linear-to-r from-indigo-50 to-blue-50 border border-indigo-100">
          <p className="text-xs font-bold text-indigo-800 mb-3">
            🛡️ Two-Layer Fraud Detection
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-indigo-700">
            <div className="flex gap-2.5">
              <MdLocationOn
                size={16}
                className="text-indigo-500 shrink-0 mt-0.5"
              />
              <div>
                <p className="font-bold mb-0.5">Layer 1 — GPS Verification</p>
                <p className="text-indigo-600">
                  Student GPS is compared to classroom location. Anyone outside
                  the allowed radius is flagged.
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <MdDevices
                size={16}
                className="text-indigo-500 shrink-0 mt-0.5"
              />
              <div>
                <p className="font-bold mb-0.5">Layer 2 — Device Fingerprint</p>
                <p className="text-indigo-600">
                  Each device gets a unique ID. If two students mark attendance
                  from the same device → proxy detected.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { l: "Sessions", v: summary.length, c: "#6366f1" },
            {
              l: "Location Flags",
              v: totalFlagged,
              c: totalFlagged > 0 ? "#ef4444" : "#10b981",
            },
            {
              l: "Proxy Flags",
              v: totalProxy,
              c: totalProxy > 0 ? "#f59e0b" : "#10b981",
            },
            {
              l: "Clean",
              v: summary.filter((s) => !s.flagged && !s.proxy).length,
              c: "#10b981",
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
                {loading ? "—" : s.v}
              </p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-5">
          {/* Session list */}
          <div className="lg:col-span-2">
            <SectionCard
              title="Sessions"
              action={
                <button
                  onClick={loadSummary}
                  className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1"
                >
                  <MdRefresh size={13} />
                  Refresh
                </button>
              }
            >
              {loading ? (
                <div className="p-8 flex justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" />
                </div>
              ) : summary.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-400">
                  No sessions yet. Set classroom GPS when generating QR.
                </p>
              ) : (
                <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
                  {summary.map((s) => {
                    const isActive = selected?.sessionId === s.sessionId;
                    const hasFraud = s.flagged > 0 || s.proxy > 0;
                    return (
                      <button
                        key={s.sessionId}
                        onClick={() => loadReport(s)}
                        className={`w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition ${isActive ? "bg-indigo-50" : ""}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${hasFraud ? "bg-red-500" : "bg-emerald-400"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-semibold text-sm truncate ${isActive ? "text-indigo-700" : "text-slate-900"}`}
                          >
                            {s.course}
                          </p>
                          <p className="text-xs text-slate-500">
                            {s.dept}
                            {s.section ? ` · ${s.section}` : ""} ·{" "}
                            {new Date(s.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="shrink-0 flex flex-col gap-1 items-end">
                          {s.flagged > 0 && (
                            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                              {s.flagged} GPS
                            </span>
                          )}
                          {s.proxy > 0 && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                              {s.proxy} proxy
                            </span>
                          )}
                          {!hasFraud && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                              Clean
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Report detail */}
          <div className="lg:col-span-3">
            {!selected ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-48 flex items-center justify-center">
                <div className="text-center">
                  <MdAutoAwesome
                    size={40}
                    className="text-slate-200 mx-auto mb-2"
                  />
                  <p className="text-slate-400 text-sm">
                    Select a session to view AI fraud analysis
                  </p>
                </div>
              </div>
            ) : reportLoading ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-indigo-500 animate-spin mb-4" />
                <p className="text-slate-500 text-sm font-medium">
                  AI analyzing records…
                </p>
              </div>
            ) : report ? (
              <div className="space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: "Total Marked", v: report.total, c: "#6366f1" },
                    {
                      l: "GPS Flagged",
                      v: report.flaggedCount,
                      c: report.flaggedCount > 0 ? "#ef4444" : "#10b981",
                    },
                    {
                      l: "Proxy",
                      v:
                        report.flagged?.filter((r) => r.proxyFlagged).length ||
                        0,
                      c: "#f59e0b",
                    },
                  ].map((s) => (
                    <div
                      key={s.l}
                      className="bg-white rounded-2xl border border-slate-100 p-3 text-center"
                      style={{ borderLeft: `3px solid ${s.c}` }}
                    >
                      <p className="text-[10px] font-bold text-slate-500 uppercase">
                        {s.l}
                      </p>
                      <p
                        className="text-xl font-extrabold"
                        style={{ color: s.c }}
                      >
                        {s.v}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Rapid marking alerts */}
                {report.rapidPairs?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200">
                    <p className="text-xs font-bold text-orange-700 mb-2 flex items-center gap-1.5">
                      <MdWarning size={13} />
                      Rapid Marking Detected
                    </p>
                    {report.rapidPairs.map((p, i) => (
                      <p key={i} className="text-xs text-orange-700">
                        • {p}
                      </p>
                    ))}
                  </div>
                )}

                {/* Device duplicates */}
                {report.deviceDuplicates?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                      <MdDevices size={13} />
                      Same Device — Multiple Students
                    </p>
                    {report.deviceDuplicates.map((d, i) => (
                      <p key={i} className="text-xs text-amber-700 font-mono">
                        • {d}
                      </p>
                    ))}
                  </div>
                )}

                {/* AI Analysis */}
                <div className="p-5 rounded-2xl bg-linear-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-700 mb-3 flex items-center gap-1.5">
                    <MdAutoAwesome size={14} />
                    Gemini AI Analysis
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {report.aiAnalysis}
                  </p>
                </div>

                {/* Flagged students */}
                {report.flagged?.length > 0 && (
                  <SectionCard
                    title={`Flagged Records (${report.flagged.length})`}
                  >
                    <div className="divide-y divide-slate-50">
                      {report.flagged.map((r, i) => (
                        <div key={i} className="flex items-start gap-3 p-4">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                            style={{
                              background: r.proxyFlagged
                                ? "#f59e0b"
                                : "#ef4444",
                            }}
                          >
                            {r.student?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-semibold text-slate-900 text-sm">
                                {r.student?.name}
                              </p>
                              <span className="text-xs font-mono text-slate-400">
                                {r.student?.rollNo}
                              </span>
                              {r.proxyFlagged && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <MdDevices size={9} />
                                  PROXY
                                </span>
                              )}
                              {r.locationFlagged && r.distanceMeters && (
                                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <MdLocationOn size={9} />
                                  {r.distanceMeters}m away
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mb-0.5">
                              {r.flagReason}
                            </p>
                            {r.deviceInfo && (
                              <p className="text-[11px] text-slate-400 font-mono">
                                {r.deviceInfo}
                              </p>
                            )}
                            <div className="flex gap-3 mt-1">
                              <span className="text-xs text-slate-400">
                                {new Date(r.markedAt).toLocaleTimeString()}
                              </span>
                              {r.studentLocation?.lat && (
                                <a
                                  href={`https://maps.google.com/?q=${r.studentLocation.lat},${r.studentLocation.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5"
                                >
                                  <MdLocationOn size={11} />
                                  View on Maps
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {report.flaggedCount === 0 &&
                  !report.rapidPairs?.length &&
                  !report.deviceDuplicates?.length && (
                    <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-8 text-center">
                      <p className="text-emerald-700 font-semibold text-lg mb-1">
                        ✅ No fraud detected
                      </p>
                      <p className="text-emerald-600 text-sm">
                        All students marked from within the classroom. No proxy
                        patterns found.
                      </p>
                    </div>
                  )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
