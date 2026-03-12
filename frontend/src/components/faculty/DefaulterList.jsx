import { useContext, useState } from "react";
import {
  MdDownload,
  MdError,
  MdPerson,
  MdRefresh,
  MdSearch,
  MdWarning,
} from "react-icons/md";
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

const now = new Date();

const DefaulterList = () => {
  const { user } = useContext(AuthContext);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const fetchDefaulters = async (e) => {
    e?.preventDefault();
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
      else setError(res.error || "Failed to fetch defaulters.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch defaulter list.");
    } finally {
      setLoading(false);
    }
  };

  const months = [
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

  const years = Array.from({ length: 3 }, (_, i) =>
    String(now.getFullYear() - i),
  );

  const filtered = (result?.defaulters || []).filter(
    (d) =>
      !search ||
      d.student.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.student.rollNo?.toLowerCase().includes(search.toLowerCase()),
  );

  // Chart data
  const chartData = filtered.slice(0, 15).map((d) => ({
    name: d.student.rollNo || d.student.name.split(" ")[0],
    fullName: d.student.name,
    percentage: d.percentage,
  }));

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const header = [
      "Name",
      "Roll No",
      "Email",
      "Dept",
      "Section",
      "Semester",
      "Attended",
      "Total",
      "Percentage",
      "Shortfall",
    ];
    const rows = filtered.map((d) => [
      d.student.name,
      d.student.rollNo,
      d.student.email,
      d.student.dept,
      d.student.section,
      d.student.semester,
      d.attended,
      d.totalSessions,
      `${d.percentage}%`,
      `${d.shortfall}%`,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `defaulters_${filters.dept}_${months[parseInt(filters.month) - 1]}_${filters.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MdWarning className="text-orange-500" /> Defaulter List
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Students below the attendance threshold for a given month
          </p>
        </div>

        {/* Filter form */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <form
            onSubmit={fetchDefaulters}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                Department *
              </label>
              <input
                type="text"
                name="dept"
                value={filters.dept}
                onChange={handleChange}
                placeholder="e.g. CS"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                Section
              </label>
              <input
                type="text"
                name="section"
                value={filters.section}
                onChange={handleChange}
                placeholder="e.g. A (or leave blank)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                Semester
              </label>
              <select
                name="semester"
                value={filters.semester}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Sem {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                Threshold %
              </label>
              <select
                name="threshold"
                value={filters.threshold}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {["60", "65", "70", "75", "80", "85"].map((t) => (
                  <option key={t} value={t}>
                    Below {t}%
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                Month
              </label>
              <select
                name="month"
                value={filters.month}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {months.map((m, i) => (
                  <option key={m} value={String(i + 1)}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                Year
              </label>
              <select
                name="year"
                value={filters.year}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition font-semibold"
              >
                <MdRefresh
                  size={18}
                  className={loading ? "animate-spin" : ""}
                />
                {loading ? "Loading…" : "Generate List"}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
            <MdError className="text-red-500 shrink-0 mt-0.5" size={20} />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <>
            {/* Summary banner */}
            <div
              className={`rounded-xl p-5 mb-6 ${filtered.length > 0 ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}
            >
              <div className="flex flex-wrap gap-6 items-center">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {filtered.length}
                  </p>
                  <p className="text-sm text-gray-600">Defaulters</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {result.totalSessions}
                  </p>
                  <p className="text-sm text-gray-600">Sessions this month</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {result.threshold}%
                  </p>
                  <p className="text-sm text-gray-600">Threshold</p>
                </div>
                <div className="ml-auto flex gap-2">
                  {filtered.length > 0 && (
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium"
                    >
                      <MdDownload size={16} /> Export CSV
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bar chart */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Attendance % — Defaulters
                </h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-35}
                      textAnchor="end"
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip
                      formatter={(v, _, p) => [`${v}%`, p.payload.fullName]}
                    />
                    {/* Threshold reference */}
                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.percentage < 60 ? "#ef4444" : "#f59e0b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Search */}
            {filtered.length > 0 && (
              <div className="mb-4 flex items-center gap-2 bg-white rounded-xl shadow px-4 py-3">
                <MdSearch size={20} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or roll number…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 outline-none text-sm"
                />
              </div>
            )}

            {/* Table */}
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <p className="text-2xl">🎉</p>
                <p className="text-gray-500 font-semibold mt-2">
                  No defaulters found!
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  All students are above the {result.threshold}% threshold.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-orange-50 border-b border-orange-200">
                      <tr>
                        {[
                          "#",
                          "Name",
                          "Roll No",
                          "Dept",
                          "Section",
                          "Sem",
                          "Attended",
                          "Total",
                          "Attendance %",
                          "Shortfall",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((d, i) => (
                        <tr
                          key={d.student._id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                <MdPerson className="text-red-400" size={16} />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {d.student.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {d.student.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-blue-700">
                            {d.student.rollNo || "—"}
                          </td>
                          <td className="px-4 py-3">{d.student.dept || "—"}</td>
                          <td className="px-4 py-3">
                            {d.student.section || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {d.student.semester || "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {d.attended}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {d.totalSessions}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-16">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${d.percentage}%`,
                                    backgroundColor:
                                      d.percentage < 60 ? "#ef4444" : "#f59e0b",
                                  }}
                                />
                              </div>
                              <span
                                className={`font-bold text-sm ${d.percentage < 60 ? "text-red-600" : "text-yellow-600"}`}
                              >
                                {d.percentage}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                              -{d.shortfall}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DefaulterList;
