import { useContext, useState } from "react";
import { MdDownload, MdRefresh, MdSearch, MdWarning } from "react-icons/md";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AuthContext } from "../../context/AuthContext";
import * as attendanceService from "../../services/attendance";
import { Alert, BTN_PRIMARY, INPUT, PAGE, SectionCard, SELECT } from "../../ui";

const LABEL =
  "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pctColor(p) {
  return p >= 75 ? "#10b981" : p >= 60 ? "#f59e0b" : "#ef4444";
}

export default function DefaulterList() {
  const { user } = useContext(AuthContext);
  const now = new Date();
  const [filters, setFilters] = useState({
    dept: user?.dept || "",
    section: "",
    semester: "",
    threshold: "75",
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const set = (k, v) => setFilters((p) => ({ ...p, [k]: v }));

  const fetch = async (e) => {
    e?.preventDefault();
    if (!filters.dept) {
      setError("Department is required.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const params = {
        dept: filters.dept,
        threshold: filters.threshold,
        month: filters.month,
        year: filters.year,
      };
      if (filters.section) params.section = filters.section;
      if (filters.semester) params.semester = filters.semester;
      const res = await attendanceService.getDefaulters(params);
      if (res.ok) setResult(res);
      else setError(res.error || "Failed to fetch.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed.");
    } finally {
      setLoading(false);
    }
  };

  const defaulters = result?.defaulters || [];
  const filtered = defaulters.filter(
    (d) =>
      !search ||
      d.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.student?.rollNo?.toLowerCase().includes(search.toLowerCase()),
  );

  const exportCSV = () => {
    const rows = [
      [
        "Name",
        "Roll No",
        "Dept",
        "Semester",
        "Section",
        "Attended",
        "Total",
        "Percentage",
      ],
    ];
    filtered.forEach((d) =>
      rows.push([
        d.student?.name || "",
        d.student?.rollNo || "",
        d.student?.dept || "",
        d.student?.semester || "",
        d.student?.section || "",
        d.attended,
        d.total,
        d.percentage + "%",
      ]),
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `defaulters_${filters.dept}_${MONTHS[parseInt(filters.month) - 1]}_${filters.year}.csv`;
    a.click();
  };

  const barData = filtered.slice(0, 15).map((d) => ({
    name: d.student?.name?.split(" ")[0] || "?",
    pct: d.percentage,
    rollNo: d.student?.rollNo || "",
  }));

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Defaulter List</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Students below the attendance threshold
          </p>
        </div>
        {error && (
          <div className="mb-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {/* Filter form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
          <form
            onSubmit={fetch}
            className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end"
          >
            <div className="lg:col-span-1">
              <label className={LABEL}>Dept *</label>
              <input
                value={filters.dept}
                onChange={(e) => set("dept", e.target.value.toUpperCase())}
                placeholder="CS"
                className={INPUT}
                required
              />
            </div>
            <div>
              <label className={LABEL}>Section</label>
              <input
                value={filters.section}
                onChange={(e) => set("section", e.target.value.toUpperCase())}
                placeholder="A"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Semester</label>
              <select
                value={filters.semester}
                onChange={(e) => set("semester", e.target.value)}
                className={SELECT}
              >
                <option value="">All</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Threshold %</label>
              <input
                type="number"
                value={filters.threshold}
                onChange={(e) => set("threshold", e.target.value)}
                min="0"
                max="100"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Month</label>
              <select
                value={filters.month}
                onChange={(e) => set("month", e.target.value)}
                className={SELECT}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Year</label>
              <input
                type="number"
                value={filters.year}
                onChange={(e) => set("year", e.target.value)}
                min="2020"
                className={INPUT}
              />
            </div>
            <div className="sm:col-span-3 lg:col-span-6">
              <button type="submit" disabled={loading} className={BTN_PRIMARY}>
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Fetching…
                  </>
                ) : (
                  <>
                    <MdRefresh size={15} />
                    Fetch Defaulters
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {result && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                {
                  l: "Total Defaulters",
                  v: defaulters.length,
                  c: "text-red-600 bg-red-50",
                },
                {
                  l: "Threshold",
                  v: filters.threshold + "%",
                  c: "text-amber-600 bg-amber-50",
                },
                {
                  l: "Period",
                  v: `${MONTHS[parseInt(filters.month) - 1].slice(0, 3)} ${filters.year}`,
                  c: "text-blue-600 bg-blue-50",
                },
              ].map((c) => (
                <div
                  key={c.l}
                  className={`rounded-2xl p-4 ${c.c.split(" ")[1]}`}
                >
                  <p className="text-xs font-semibold text-slate-500">{c.l}</p>
                  <p
                    className={`text-2xl font-bold mt-0.5 ${c.c.split(" ")[0]}`}
                  >
                    {c.v}
                  </p>
                </div>
              ))}
            </div>

            {defaulters.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MdWarning size={28} className="text-emerald-500" />
                  </div>
                  <p className="font-semibold text-slate-700">
                    No defaulters! 🎉
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    All students are above {filters.threshold}%
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Bar chart */}
                {barData.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
                    <p className="font-semibold text-slate-900 text-sm mb-4">
                      Attendance % (top {barData.length})
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={barData}
                        margin={{ bottom: 30, left: -15 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          angle={-30}
                          textAnchor="end"
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 11 }}
                          unit="%"
                        />
                        <Tooltip
                          formatter={(v, _, p) => [
                            `${v}% (${p.payload.rollNo})`,
                            "Attendance",
                          ]}
                        />
                        <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                          {barData.map((d, i) => (
                            <Cell key={i} fill={pctColor(d.pct)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-1 flex items-center gap-1 justify-center">
                      <div className="w-16 h-0.5 bg-red-300" />
                      <span className="text-xs text-slate-400">
                        {filters.threshold}% threshold
                      </span>
                    </div>
                  </div>
                )}

                {/* Table */}
                <SectionCard
                  title={`Defaulters (${filtered.length})`}
                  action={
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <MdSearch
                          size={13}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search…"
                          className="pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-indigo-500 outline-none bg-white w-36"
                        />
                      </div>
                      <button
                        onClick={exportCSV}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                      >
                        <MdDownload size={13} />
                        CSV
                      </button>
                    </div>
                  }
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {[
                            "Student",
                            "Roll No",
                            "Sem · Sec",
                            "Attended",
                            "Total",
                            "Attendance",
                            "Shortfall",
                          ].map((h) => (
                            <th
                              key={h}
                              className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filtered.map((d, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600 shrink-0">
                                  {d.student?.name?.charAt(0)?.toUpperCase() ||
                                    "?"}
                                </div>
                                <p className="font-semibold text-slate-900 text-sm">
                                  {d.student?.name || "—"}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-slate-600">
                              {d.student?.rollNo || "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {d.student?.semester
                                ? `Sem ${d.student.semester}`
                                : ""}
                              {d.student?.section
                                ? ` · ${d.student.section}`
                                : ""}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                              {d.attended}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">
                              {d.totalSessions}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${d.percentage}%`,
                                      backgroundColor: pctColor(d.percentage),
                                    }}
                                  />
                                </div>
                                <span
                                  className="text-xs font-bold"
                                  style={{ color: pctColor(d.percentage) }}
                                >
                                  {d.percentage}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                                -
                                {d.shortfall ||
                                  Math.round(filters.threshold - d.percentage)}
                                %
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
