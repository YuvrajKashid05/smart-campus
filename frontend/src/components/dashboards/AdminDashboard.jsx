import { useEffect, useState } from "react";
import {
  MdBarChart,
  MdCampaign,
  MdCheckCircle,
  MdDescription,
  MdGroup,
  MdMessage,
  MdSchool,
  MdSettings,
} from "react-icons/md";
import { Link } from "react-router-dom";
import * as complaintsService from "../../services/complaints";
import * as usersService from "../../services/users";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    faculty: 0,
    complaints: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [usersData, complaintsData] = await Promise.allSettled([
          usersService.getAllUsers(),
          complaintsService.getComplaints(),
        ]);
        const users =
          usersData.status === "fulfilled" ? usersData.value?.users || [] : [];
        const complaints =
          complaintsData.status === "fulfilled"
            ? complaintsData.value?.complaints || []
            : [];
        setStats({
          totalUsers: users.length,
          students: users.filter((u) => u.role === "STUDENT").length,
          faculty: users.filter((u) => u.role === "FACULTY").length,
          complaints: complaints.length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-linear-to-r from-purple-600 to-purple-800 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MdSettings size={32} /> Admin Dashboard
          </h1>
          <p className="mt-2 text-purple-100">
            System Administration & Management
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Total Users",
              value: stats.totalUsers,
              icon: <MdGroup size={36} />,
              color: "border-blue-500",
              iconColor: "text-blue-400",
            },
            {
              label: "Students",
              value: stats.students,
              icon: <MdSchool size={36} />,
              color: "border-green-500",
              iconColor: "text-green-400",
            },
            {
              label: "Faculty",
              value: stats.faculty,
              icon: <MdSchool size={36} />,
              color: "border-orange-500",
              iconColor: "text-orange-400",
            },
            {
              label: "Complaints",
              value: stats.complaints,
              icon: <MdMessage size={36} />,
              color: "border-red-500",
              iconColor: "text-red-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${s.color}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{s.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {s.value}
                  </p>
                </div>
                <div className={s.iconColor}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/admin/users"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex items-start gap-4"
          >
            <MdGroup className="text-blue-500 mt-1" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">Manage Users</h3>
              <p className="text-sm text-gray-600 mt-1">
                View and manage all accounts
              </p>
            </div>
          </Link>
          <Link
            to="/admin/complaints"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex items-start gap-4"
          >
            <MdMessage className="text-red-500 mt-1" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">View Complaints</h3>
              <p className="text-sm text-gray-600 mt-1">
                Review and resolve student complaints
              </p>
            </div>
          </Link>
          <Link
            to="/admin/notices"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex items-start gap-4"
          >
            <MdDescription className="text-orange-500 mt-1" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">Manage Notices</h3>
              <p className="text-sm text-gray-600 mt-1">Control all notices</p>
            </div>
          </Link>
          <Link
            to="/admin/announcements"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex items-start gap-4"
          >
            <MdCampaign className="text-purple-500 mt-1" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">
                Manage Announcements
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                System-wide announcements
              </p>
            </div>
          </Link>
          <Link
            to="/admin/reports"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex items-start gap-4"
          >
            <MdBarChart className="text-indigo-500 mt-1" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">
                Reports & Analytics
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                View system statistics and trends
              </p>
            </div>
          </Link>
          <Link
            to="/admin/settings"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex items-start gap-4"
          >
            <MdSettings className="text-gray-500 mt-1" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">System Settings</h3>
              <p className="text-sm text-gray-600 mt-1">
                Configure system parameters
              </p>
            </div>
          </Link>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MdCheckCircle className="text-green-500" /> System Status
          </h2>
          <div className="space-y-3">
            {["Database", "Server", "API Services"].map((svc) => (
              <div key={svc} className="flex items-center justify-between">
                <span className="text-gray-700">{svc}</span>
                <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                  <MdCheckCircle size={14} /> Online
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
