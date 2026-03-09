import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalComplaints: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalUsers: 350,
        totalStudents: 280,
        totalFaculty: 50,
        totalComplaints: 12,
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Admin Dashboard 🔧</h1>
          <p className="mt-2 text-purple-100">
            System Administration & Management
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="text-4xl">🎓</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Faculty</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalFaculty}
                </p>
              </div>
              <div className="text-4xl">👨‍🏫</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Complaints</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalComplaints}
                </p>
              </div>
              <div className="text-4xl">💬</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/admin/users"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <p className="text-3xl mb-2">👥</p>
            <h3 className="font-semibold text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-600 mt-1">
              Create, edit, delete user accounts
            </p>
            <p className="text-xs text-gray-500 mt-2 font-semibold">
              Total: {stats.totalUsers}
            </p>
          </Link>

          <Link
            to="/admin/complaints"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <p className="text-3xl mb-2">💬</p>
            <h3 className="font-semibold text-gray-900">View Complaints</h3>
            <p className="text-sm text-gray-600 mt-1">
              Review and manage student complaints
            </p>
            <p className="text-xs text-gray-500 mt-2 font-semibold">
              Pending: {stats.totalComplaints}
            </p>
          </Link>

          <Link
            to="/admin/notices"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <p className="text-3xl mb-2">📄</p>
            <h3 className="font-semibold text-gray-900">Manage Notices</h3>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage notices
            </p>
            <p className="text-xs text-gray-500 mt-2 font-semibold">
              Control all notices
            </p>
          </Link>

          <Link
            to="/admin/announcements"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <p className="text-3xl mb-2">📢</p>
            <h3 className="font-semibold text-gray-900">
              Manage Announcements
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Create and control announcements
            </p>
            <p className="text-xs text-gray-500 mt-2 font-semibold">
              System-wide control
            </p>
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
            <p className="text-3xl mb-2">📊</p>
            <h3 className="font-semibold text-gray-900">Reports & Analytics</h3>
            <p className="text-sm text-gray-600 mt-1">
              View system reports and statistics
            </p>
            <p className="text-xs text-gray-500 mt-2 font-semibold">
              Full analytics
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
            <p className="text-3xl mb-2">⚙️</p>
            <h3 className="font-semibold text-gray-900">System Settings</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure system parameters
            </p>
            <p className="text-xs text-gray-500 mt-2 font-semibold">
              Admin controls
            </p>
          </div>
        </div>

        {/* System Health */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* System Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              🟢 System Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Database</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                  ✓ Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Server</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                  ✓ Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">API Services</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                  ✓ Running
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Email Service</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                  ✓ Working
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              📋 Recent Activity
            </h2>
            <div className="space-y-3 text-sm">
              <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                <p className="font-semibold text-gray-900">
                  New User Registered
                </p>
                <p className="text-gray-600">2 hours ago</p>
              </div>
              <div className="border-l-4 border-red-500 bg-red-50 p-3 rounded">
                <p className="font-semibold text-gray-900">
                  Complaint Submitted
                </p>
                <p className="text-gray-600">4 hours ago</p>
              </div>
              <div className="border-l-4 border-green-500 bg-green-50 p-3 rounded">
                <p className="font-semibold text-gray-900">Notice Published</p>
                <p className="text-gray-600">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
