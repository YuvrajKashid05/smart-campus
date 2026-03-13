import { useEffect, useState } from "react";
import {
  MdBarChart,
  MdCheckCircle,
  MdError,
  MdInfo,
  MdRefresh,
  MdWarning,
} from "react-icons/md";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import * as attendanceService from "../../services/attendance";

const THRESHOLD = 75;
const PIE_COLORS = ["#22c55e", "#ef4444"]; // Present, Absent

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
      if (res.ok) {
        setData(res);
      } else {
        setError(res.error || "Failed to load attendance.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  const overall = data?.overallPercentage ?? 0;
  const totalSessions = data?.totalSessions ?? 0;
  const totalPresent = data?.totalPresent ?? 0;
  const summary = data?.summary ?? [];

  const pieData = [
    { name: "Present", value: totalPresent },
    { name: "Absent", value: Math.max(totalSessions - totalPresent, 0) },
  ];

  const barData = summary.map((s) => ({
    name: s.course.length > 14 ? `${s.course.slice(0, 14)}…` : s.course,
    fullName: s.course,
    percentage: s.percentage,
    attended: s.attended,
    total: s.totalClasses,
  }));

  const classesNeeded =
    overall < THRESHOLD
      ? Math.ceil(
          (THRESHOLD * totalSessions - totalPresent * 100) / (100 - THRESHOLD),
        )
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
              <MdBarChart className="text-blue-500" />
              My Attendance
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Subject-wise and overall attendance statistics
            </p>
          </div>

          <button
            onClick={fetchSummary}
            className="flex items-center gap-1 rounded-lg bg-gray-200 px-4 py-2 transition hover:bg-gray-300"
          >
            <MdRefresh size={18} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
            <MdError className="mt-0.5 shrink-0 text-red-500" size={20} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {totalSessions === 0 && !error ? (
          <div className="rounded-xl bg-white p-16 text-center shadow">
            <MdBarChart className="mx-auto mb-4 text-gray-200" size={64} />
            <p className="text-xl font-medium text-gray-500">
              No attendance data yet
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Attendance data will appear once your faculty starts running QR
              sessions.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                {
                  label: "Overall %",
                  value: `${overall}%`,
                  color: getColor(overall),
                  bg: overall >= 75 ? "border-green-400" : "border-red-400",
                },
                {
                  label: "Total Classes",
                  value: totalSessions,
                  color: "#3b82f6",
                  bg: "border-blue-400",
                },
                {
                  label: "Classes Attended",
                  value: totalPresent,
                  color: "#22c55e",
                  bg: "border-green-400",
                },
                {
                  label: "Classes Missed",
                  value: totalSessions - totalPresent,
                  color: "#ef4444",
                  bg: "border-red-400",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className={`rounded-xl border-l-4 bg-white p-5 shadow ${card.bg}`}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {card.label}
                  </p>
                  <p
                    className="mt-1 text-3xl font-bold"
                    style={{ color: card.color }}
                  >
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {overall < THRESHOLD && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4">
                <MdWarning className="mt-0.5 shrink-0 text-red-500" size={22} />
                <div>
                  <p className="font-bold text-red-800">
                    Attendance Below {THRESHOLD}% — Defaulter Risk!
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    Your overall attendance is <strong>{overall}%</strong>. You
                    need at least {THRESHOLD}% to avoid being listed as a
                    defaulter. You need to attend{" "}
                    <strong>{classesNeeded}</strong> more consecutive classes to
                    reach {THRESHOLD}%.
                  </p>
                </div>
              </div>
            )}

            {overall >= THRESHOLD && overall < 85 && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
                <MdInfo className="mt-0.5 shrink-0 text-yellow-600" size={22} />
                <p className="text-sm text-yellow-800">
                  Your attendance is <strong>{overall}%</strong> — safe but
                  close to the {THRESHOLD}% threshold. Keep attending regularly.
                </p>
              </div>
            )}

            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  Overall Attendance
                </h2>

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
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => [`${value} classes`, ""]} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="-mt-2 text-center">
                  <p
                    className="text-4xl font-bold"
                    style={{ color: getColor(overall) }}
                  >
                    {overall}%
                  </p>
                  <p className="text-sm text-gray-500">Overall Attendance</p>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  Subject-wise %
                </h2>

                {barData.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-gray-400">
                    No data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={barData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        angle={-25}
                        textAnchor="end"
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11 }}
                        unit="%"
                      />
                      <Tooltip
                        formatter={(value, _name, props) => [
                          `${value}% (${props.payload.attended}/${props.payload.total})`,
                          "Attendance",
                        ]}
                        labelFormatter={(label, payload) =>
                          payload?.[0]?.payload?.fullName || label
                        }
                      />
                      <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                        {barData.map((entry) => (
                          <Cell
                            key={entry.fullName}
                            fill={getColor(entry.percentage)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                <p className="mt-1 text-center text-xs text-gray-400">
                  <span className="mr-1 inline-block h-0.5 w-3 align-middle bg-red-400" />
                  75% threshold
                </p>
              </div>
            </div>

            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Subject-wise Breakdown
            </h2>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {summary.map((s) => {
                const label = getLabel(s.percentage);

                return (
                  <div
                    key={s.course}
                    className={`rounded-xl border bg-white p-5 shadow ${getBg(
                      s.percentage,
                    )}`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-gray-900">
                          {s.course}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">{s.dept}</p>
                      </div>

                      <span
                        className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${label.cls}`}
                      >
                        {label.text}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="mb-1 flex justify-between text-xs text-gray-600">
                        <span>
                          {s.attended} / {s.totalClasses} classes
                        </span>
                        <span
                          className="font-bold"
                          style={{ color: getColor(s.percentage) }}
                        >
                          {s.percentage}%
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${s.percentage}%`,
                            backgroundColor: getColor(s.percentage),
                          }}
                        />
                      </div>

                      <div className="relative mt-0.5 h-1">
                        <div
                          className="absolute top-0 -mt-2 h-3 w-0.5 bg-red-400"
                          style={{ left: "75%" }}
                        />
                      </div>
                    </div>

                    {s.sessions?.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-gray-400">
                          Recent classes
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {s.sessions.slice(0, 8).map((sess, i) => (
                            <span
                              key={`${s.course}-${sess.date}-${i}`}
                              title={new Date(sess.date).toLocaleDateString()}
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                sess.present
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-500"
                              }`}
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

            <div className="flex flex-wrap gap-4 rounded-xl bg-white p-4 text-sm shadow">
              {[
                { color: "bg-green-500", label: "≥ 85% — Good" },
                { color: "bg-yellow-400", label: "75–84% — Safe" },
                { color: "bg-red-500", label: "< 75% — Defaulter Risk" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <span className="text-gray-600">{item.label}</span>
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
