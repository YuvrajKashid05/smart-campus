import { useEffect, useState } from "react";
import {
  MdBarChart,
  MdGroup,
  MdMessage,
  MdPerson,
  MdRefresh,
  MdSchool,
  MdTrendingUp,
} from "react-icons/md";
import * as complaintsService from "../../services/complaints";
import * as usersService from "../../services/users";

const BAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-red-500",
];

const StatCard = ({ label, value, icon, color }) => (
  <div className={`bg-white rounded-xl shadow p-6 border-l-4 ${color}`}>
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-4xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className="opacity-30 text-5xl">{icon}</div>
    </div>
  </div>
);

const SimpleBar = ({ label, value, max, colorClass }) => (
  <div className="flex items-center gap-3">
    <span className="text-sm text-gray-600 w-24 shrink-0 truncate">
      {label}
    </span>
    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
      <div
        className={`h-full rounded-full ${colorClass} transition-all duration-700`}
        style={{ width: max ? `${Math.round((value / max) * 100)}%` : "0%" }}
      />
    </div>
    <span className="text-sm font-bold text-gray-800 w-8 text-right">
      {value}
    </span>
  </div>
);

const ReportsAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, complRes] = await Promise.allSettled([
        usersService.getAllUsers(),
        complaintsService.getComplaints(),
      ]);

      const users =
        usersRes.status === "fulfilled" ? usersRes.value?.users || [] : [];
      const complaints =
        complRes.status === "fulfilled" ? complRes.value?.complaints || [] : [];

      const students = users.filter((u) => u.role === "STUDENT");
      const faculty = users.filter((u) => u.role === "FACULTY");

      // Dept breakdown
      const deptMap = {};
      students.forEach((u) => {
        const d = u.dept || "Unknown";
        deptMap[d] = (deptMap[d] || 0) + 1;
      });

      // Complaint category breakdown
      const catMap = {};
      complaints.forEach((c) => {
        const cat = c.category || "OTHER";
        catMap[cat] = (catMap[cat] || 0) + 1;
      });

      // Monthly registrations (last 6 months)
      const now = new Date();
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
          label: d.toLocaleString("default", { month: "short" }),
          year: d.getFullYear(),
          month: d.getMonth(),
        };
      });
      const monthlyRegistrations = months.map((m) => ({
        label: m.label,
        count: users.filter((u) => {
          const d = new Date(u.createdAt);
          return d.getFullYear() === m.year && d.getMonth() === m.month;
        }).length,
      }));

      setData({
        totalUsers: users.length,
        totalStudents: students.length,
        totalFaculty: faculty.length,
        totalComplaints: complaints.length,
        openComplaints: complaints.filter((c) => c.status === "OPEN").length,
        deptMap,
        catMap,
        monthlyRegistrations,
      });
    } catch {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MdBarChart className="text-indigo-500" /> Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              System-wide statistics and insights
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            <MdRefresh size={18} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Stat cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                label="Total Users"
                value={data.totalUsers}
                icon={<MdGroup />}
                color="border-blue-500"
              />
              <StatCard
                label="Students"
                value={data.totalStudents}
                icon={<MdSchool />}
                color="border-green-500"
              />
              <StatCard
                label="Faculty"
                value={data.totalFaculty}
                icon={<MdPerson />}
                color="border-orange-500"
              />
              <StatCard
                label="Total Complaints"
                value={data.totalComplaints}
                icon={<MdMessage />}
                color="border-red-500"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Monthly registrations */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MdTrendingUp className="text-blue-500" /> Monthly
                  Registrations (6 months)
                </h2>
                <div className="space-y-3">
                  {data.monthlyRegistrations.map((m, i) => (
                    <SimpleBar
                      key={m.label}
                      label={m.label}
                      value={m.count}
                      max={Math.max(
                        ...data.monthlyRegistrations.map((x) => x.count),
                        1,
                      )}
                      colorClass={BAR_COLORS[i % BAR_COLORS.length]}
                    />
                  ))}
                </div>
              </div>

              {/* Department breakdown */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MdSchool className="text-green-500" /> Students by Department
                </h2>
                {Object.keys(data.deptMap).length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No student data available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.deptMap)
                      .sort((a, b) => b[1] - a[1])
                      .map(([dept, count], i) => (
                        <SimpleBar
                          key={dept}
                          label={dept}
                          value={count}
                          max={Math.max(...Object.values(data.deptMap))}
                          colorClass={BAR_COLORS[i % BAR_COLORS.length]}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Complaint categories */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MdMessage className="text-red-500" /> Complaints by Category
              </h2>
              {Object.keys(data.catMap).length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No complaints data available
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(data.catMap).map(([cat, count], i) => (
                    <div
                      key={cat}
                      className={`rounded-xl p-4 text-center ${["bg-blue-50", "bg-green-50", "bg-purple-50", "bg-orange-50"][i % 4]}`}
                    >
                      <p className="text-3xl font-bold text-gray-900">
                        {count}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{cat}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsAnalytics;
