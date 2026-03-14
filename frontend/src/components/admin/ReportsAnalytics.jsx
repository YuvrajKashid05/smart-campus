import { useEffect, useMemo, useState } from "react";
import {
  MdAnalytics,
  MdCheckCircle,
  MdGroup,
  MdPendingActions,
  MdPerson,
  MdRefresh,
  MdReportProblem,
  MdSchool,
} from "react-icons/md";
import * as complaintsService from "../../services/complaints";
import * as usersService from "../../services/users";
import { Alert, BTN_OUTLINE, CARD, PAGE } from "../../ui";

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
        </div>
        <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const key = String(status || "OPEN").toUpperCase();
  const cls =
    {
      OPEN: "bg-amber-50 text-amber-700 border-amber-200",
      IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
      RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    }[key] || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}
    >
      {key.replaceAll("_", " ")}
    </span>
  );
}

function BarRow({ label, value, max, colorClass = "bg-indigo-500" }) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 8 : 0) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate font-medium text-slate-700">{label}</span>
        <span className="shrink-0 text-slate-500">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function ReportsAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [usersRes, complaintsRes] = await Promise.allSettled([
        usersService.getAllUsers(),
        complaintsService.getComplaints(),
      ]);

      const nextUsers =
        usersRes.status === "fulfilled"
          ? usersRes.value?.users || usersRes.value?.data || []
          : [];

      const nextComplaints =
        complaintsRes.status === "fulfilled"
          ? complaintsRes.value?.complaints || complaintsRes.value?.data || []
          : [];

      setUsers(Array.isArray(nextUsers) ? nextUsers : []);
      setComplaints(Array.isArray(nextComplaints) ? nextComplaints : []);

      if (
        usersRes.status === "rejected" &&
        complaintsRes.status === "rejected"
      ) {
        setError("Failed to load reports data.");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load reports data.");
      setUsers([]);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const normalizedUsers = Array.isArray(users) ? users : [];
    const normalizedComplaints = Array.isArray(complaints) ? complaints : [];

    const students = normalizedUsers.filter(
      (u) => String(u?.role || "").toUpperCase() === "STUDENT",
    );
    const faculty = normalizedUsers.filter(
      (u) => String(u?.role || "").toUpperCase() === "FACULTY",
    );
    const admins = normalizedUsers.filter(
      (u) => String(u?.role || "").toUpperCase() === "ADMIN",
    );

    const deptCount = {};
    students.forEach((u) => {
      const dept = (u?.dept || "Unknown").toString().trim() || "Unknown";
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    });

    const complaintCategoryCount = {};
    const complaintStatusCount = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };

    normalizedComplaints.forEach((c) => {
      const category =
        (c?.category || "General").toString().trim() || "General";
      complaintCategoryCount[category] =
        (complaintCategoryCount[category] || 0) + 1;

      const status = String(c?.status || "OPEN").toUpperCase();
      if (complaintStatusCount[status] != null)
        complaintStatusCount[status] += 1;
      else complaintStatusCount[status] = 1;
    });

    return {
      students,
      faculty,
      admins,
      activeUsers: normalizedUsers.filter((u) => u?.isActive !== false),
      inactiveUsers: normalizedUsers.filter((u) => u?.isActive === false),
      deptCount,
      complaintCategoryCount,
      complaintStatusCount,
    };
  }, [users, complaints]);

  const deptEntries = Object.entries(stats.deptCount).sort(
    (a, b) => b[1] - a[1],
  );
  const complaintCategoryEntries = Object.entries(
    stats.complaintCategoryCount,
  ).sort((a, b) => b[1] - a[1]);
  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
    .slice(0, 8);

  const maxDept = Math.max(0, ...deptEntries.map(([, count]) => count));
  const maxComplaintCategory = Math.max(
    0,
    ...complaintCategoryEntries.map(([, count]) => count),
  );

  return (
    <div className={PAGE}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <MdAnalytics className="text-indigo-600" size={28} />
              Reports &amp; Analytics
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Admin overview of users, complaints, and department-wise activity.
            </p>
          </div>
          <button type="button" onClick={load} className={BTN_OUTLINE}>
            <MdRefresh size={18} />
            Refresh
          </button>
        </div>

        {error ? <Alert type="error">{error}</Alert> : null}

        {loading ? (
          <div className={`${CARD} p-10 text-center`}>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading reports...
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={MdGroup}
                label="Total users"
                value={users.length}
              />
              <StatCard
                icon={MdSchool}
                label="Students"
                value={stats.students.length}
              />
              <StatCard
                icon={MdPerson}
                label="Faculty"
                value={stats.faculty.length}
                sub={`${stats.admins.length} admins`}
              />
              <StatCard
                icon={MdReportProblem}
                label="Complaints"
                value={complaints.length}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className={`${CARD} p-6`}>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Students by department
                    </h2>
                    <p className="text-sm text-slate-500">
                      Distribution of registered students.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {deptEntries.length ? (
                    deptEntries.map(([dept, count]) => (
                      <BarRow
                        key={dept}
                        label={dept}
                        value={count}
                        max={maxDept}
                        colorClass="bg-indigo-500"
                      />
                    ))
                  ) : (
                    <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No department data available.
                    </p>
                  )}
                </div>
              </div>

              <div className={`${CARD} p-6`}>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Complaints by category
                    </h2>
                    <p className="text-sm text-slate-500">
                      Most common complaint categories.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {complaintCategoryEntries.length ? (
                    complaintCategoryEntries.map(([category, count]) => (
                      <BarRow
                        key={category}
                        label={category}
                        value={count}
                        max={maxComplaintCategory}
                        colorClass="bg-amber-500"
                      />
                    ))
                  ) : (
                    <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No complaint data available.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className={`${CARD} p-6`}>
                <h2 className="text-lg font-semibold text-slate-900">
                  Complaint status
                </h2>
                <p className="mb-5 text-sm text-slate-500">
                  Current resolution progress.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                        <MdPendingActions size={18} />
                      </div>
                      <span className="font-medium text-slate-700">Open</span>
                    </div>
                    <span className="text-xl font-bold text-slate-900">
                      {stats.complaintStatusCount.OPEN || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                        <MdRefresh size={18} />
                      </div>
                      <span className="font-medium text-slate-700">
                        In progress
                      </span>
                    </div>
                    <span className="text-xl font-bold text-slate-900">
                      {stats.complaintStatusCount.IN_PROGRESS || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                        <MdCheckCircle size={18} />
                      </div>
                      <span className="font-medium text-slate-700">
                        Resolved
                      </span>
                    </div>
                    <span className="text-xl font-bold text-slate-900">
                      {stats.complaintStatusCount.RESOLVED || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`${CARD} p-6`}>
                <h2 className="text-lg font-semibold text-slate-900">
                  User status
                </h2>
                <p className="mb-5 text-sm text-slate-500">
                  Quick view of account activity.
                </p>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        Active accounts
                      </span>
                      <span className="text-slate-500">
                        {stats.activeUsers.length}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${users.length ? (stats.activeUsers.length / users.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        Inactive accounts
                      </span>
                      <span className="text-slate-500">
                        {stats.inactiveUsers.length}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-rose-500"
                        style={{
                          width: `${users.length ? (stats.inactiveUsers.length / users.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${CARD} p-6`}>
                <h2 className="text-lg font-semibold text-slate-900">
                  Role summary
                </h2>
                <p className="mb-5 text-sm text-slate-500">
                  Breakdown by account type.
                </p>
                <div className="space-y-3">
                  {[
                    ["Students", stats.students.length, "bg-blue-500"],
                    ["Faculty", stats.faculty.length, "bg-emerald-500"],
                    ["Admins", stats.admins.length, "bg-violet-500"],
                  ].map(([label, value, color]) => (
                    <div key={label} className="rounded-2xl bg-slate-50 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-medium text-slate-700">
                          {label}
                        </span>
                        <span className="text-slate-500">{value}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white">
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{
                            width: `${users.length ? (value / users.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${CARD} overflow-hidden`}>
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Recent complaints
                </h2>
                <p className="text-sm text-slate-500">
                  Latest complaint activity across the system.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-slate-600">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-600">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-600">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-600">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {recentComplaints.length ? (
                      recentComplaints.map((item) => (
                        <tr
                          key={item._id || `${item.title}-${item.createdAt}`}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-medium text-slate-800">
                            {item.title || "Untitled complaint"}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {item.category || "General"}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-8 text-center text-slate-500"
                        >
                          No recent complaints found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
