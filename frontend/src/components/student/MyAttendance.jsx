import { useEffect, useState } from "react";
import {
  Cell, Legend, Pie, PieChart, ResponsiveContainer,
  Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import {
  MdBarChart, MdCheckCircle, MdError, MdInfo,
  MdRefresh, MdWarning,
} from "react-icons/md";
import * as attendanceService from "../../services/attendance";

const THRESHOLD = 75; // below this = danger

const getColor = (pct) => {
  if (pct >= 85) return "#22c55e";
  if (pct >= 75) return "#f59e0b";
  return "#ef4444";
};

const getBg = (pct) => {
  if (pct >= 85) return "bg-green-50 border-green-300";
  if (pct >= 75) return "bg-yellow-50 border-yellow-300";
  return "bg-red-50 border-red-300";
};

const getLabel = (pct) => {
  if (pct >= 85) return { text: "Good", cls: "bg-green-100 text-green-800" };
  if (pct >= 75) return { text: "Safe", cls: "bg-yellow-100 text-yellow-800" };
  return { text: "Defaulter Risk", cls: "bg-red-100 text-red-800" };
};

const MyAttendance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await attendanceService.getMyAttendanceSummary();
      if (res.ok) setData(res);
      else setError(res.error || "Failed to load attendance.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  const overall = data?.overallPercentage ?? 0;
  const totalSessions = data?.totalSessions ?? 0;
  const totalPresent = data?.totalPresent ?? 0;
  const summary = data?.summary ?? [];

  // Pie chart data for overall
  const pieData = [
    { name: "Present", value: totalPresent },
    { name: "Absent", value: totalSessions - totalPresent },
  ];

  // Bar chart data — per subject
  const barData = summary.map(s => ({
    name: s.course.length > 14 ? s.course.slice(0, 14) + "…" : s.course,
    fullName: s.course,
    percentage: s.percentage,
    attended: s.attended,
    total: s.totalClasses,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MdBarChart className="text-blue-500" /> My Attendance
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Subject-wise and overall attendance statistics</p>
          </div>
          <button onClick={fetchSummary} className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
            <MdRefresh size={18} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
            <MdError className="text-red-500 shrink-0 mt-0.5" size={20} />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {totalSessions === 0 && !error ? (
          <div className="bg-white rounded-xl shadow p-16 text-center">
            <MdBarChart className="text-gray-200 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 font-medium">No attendance data yet</p>
            <p className="text-gray-400 text-sm mt-2">Attendance data will appear once your faculty starts running QR sessions.</p>
          </div>
        ) : (
          <>
            {/* Overall stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Overall %", value: `${overall}%`, color: getColor(overall), bg: overall >= 75 ? "border-green-400" : "border-red-400" },
                { label: "Total Classes", value: totalSessions, color: "#3b82f6", bg: "border-blue-400" },
                { label: "Classes Attended", value: totalPresent, color: "#22c55e", bg: "border-green-400" },
                { label: "Classes Missed", value: totalSessions - totalPresent, color: "#ef4444", bg: "border-red-400" },
              ].map(c => (
                <div key={c.label} className={`bg-white rounded-xl shadow p-5 border-l-4 ${c.bg}`}>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{c.label}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Warning if below threshold */}
            {overall < THRESHOLD && (
              <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-300 rounded-xl p-4">
                <MdWarning className="text-red-500 shrink-0 mt-0.5" size={22} />
                <div>
                  <p className="font-bold text-red-800">Attendance Below {THRESHOLD}% — Defaulter Risk!</p>
                  <p className="text-red-700 text-sm mt-1">
                    Your overall attendance is <strong>{overall}%</strong>. You need at least {THRESHOLD}% to avoid being listed as a defaulter.
                    You need to attend <strong>{Math.ceil(((THRESHOLD * totalSessions) - (totalPresent * 100)) / (100 - THRESHOLD))}</strong> more consecutive classes to reach {THRESHOLD}%.
                  </p>
                </div>
              </div>
            )}
            {overall >= THRESHOLD && overall < 85 && (
              <div className="mb-6 flex items-start gap-3 bg-yellow-50 border border-yellow-300 rounded-xl p-4">
                <MdInfo className="text-yellow-600 shrink-0 mt-0.5" size={22} />
                <p className="text-yellow-800 text-sm">
                  Your attendance is <strong>{overall}%</strong> — safe but close to the {THRESHOLD}% threshold. Keep attending regularly.
                </p>
              </div>
            )}

            {/* Charts row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Pie chart */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Overall Attendance</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#f3f4f6" />
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(v) => [`${v} classes`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center -mt-2">
                  <p className="text-4xl font-bold" style={{ color: getColor(overall) }}>{overall}%</p>
                  <p className="text-gray-500 text-sm">Overall Attendance</p>
                </div>
              </div>

              {/* Bar chart */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Subject-wise %</h2>
                {barData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-gray-400">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip
                        formatter={(v, _, p) => [`${v}% (${p.payload.attended}/${p.payload.total})`, "Attendance"]}
                        labelFormatter={(l, p) => p?.[0]?.payload?.fullName || l}
                      />
                      <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                        {barData.map((entry, i) => (
                          <Cell key={i} fill={getColor(entry.percentage)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {/* Threshold line label */}
                <p className="text-xs text-gray-400 text-center mt-1">
                  <span className="inline-block w-3 h-0.5 bg-red-400 mr-1 align-middle" /> 75% threshold
                </p>
              </div>
            </div>

            {/* Subject cards */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">Subject-wise Breakdown</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {summary.map((s) => {
                const label = getLabel(s.percentage);
                return (
                  <div key={s.course} className={`bg-white rounded-xl shadow border ${getBg(s.percentage)} p-5`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{s.course}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.dept}</p>
                      </div>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${label.cls}`}>
                        {label.text}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{s.attended} / {s.totalClasses} classes</span>
                        <span className="font-bold" style={{ color: getColor(s.percentage) }}>{s.percentage}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${s.percentage}%`, backgroundColor: getColor(s.percentage) }}
                        />
                      </div>
                      {/* Threshold marker */}
                      <div className="relative h-1 mt-0.5">
                        <div className="absolute top-0 w-0.5 h-3 bg-red-400 -mt-2" style={{ left: "75%" }} />
                      </div>
                    </div>

                    {/* Recent sessions */}
                    {s.sessions?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1 font-medium">Recent classes</p>
                        <div className="flex flex-wrap gap-1">
                          {s.sessions.slice(0, 8).map((sess, i) => (
                            <span
                              key={i}
                              title={new Date(sess.date).toLocaleDateString()}
                              className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${sess.present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}
                            >
                              {sess.present ? <MdCheckCircle size={14} /> : "✕"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-4 text-sm">
              {[
                { color: "bg-green-500", label: "≥ 85% — Good" },
                { color: "bg-yellow-400", label: "75–84% — Safe" },
                { color: "bg-red-500", label: "< 75% — Defaulter Risk" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${l.color}`} />
                  <span className="text-gray-600">{l.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyAttendance;
