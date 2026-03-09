import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const FacultyDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalStudents: 0,
    classesToday: 0,
    pendingNotices: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalStudents: 120,
        classesToday: 3,
        pendingNotices: 2,
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
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">
            Welcome, Prof. {user?.firstName}! 👋
          </h1>
          <p className="mt-2 text-green-100">
            {user?.email} • {user?.department}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Classes Today
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.classesToday}
                </p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.pendingNotices}
                </p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/faculty/qr-attendance"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <p className="text-3xl mb-2">📱</p>
            <h3 className="font-semibold text-gray-900">Generate QR</h3>
            <p className="text-sm text-gray-600 mt-1">
              Create QR code for attendance marking
            </p>
          </Link>

          <Link
            to="/faculty/timetable"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <p className="text-3xl mb-2">📅</p>
            <h3 className="font-semibold text-gray-900">Timetable</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage your class schedule
            </p>
          </Link>

          <Link
            to="/faculty/notice"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <p className="text-3xl mb-2">📄</p>
            <h3 className="font-semibold text-gray-900">Create Notice</h3>
            <p className="text-sm text-gray-600 mt-1">
              Send important notices to students
            </p>
          </Link>

          <Link
            to="/faculty/announcement"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <p className="text-3xl mb-2">📢</p>
            <h3 className="font-semibold text-gray-900">Announcement</h3>
            <p className="text-sm text-gray-600 mt-1">
              Make announcements to all students
            </p>
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
            <p className="text-3xl mb-2">📊</p>
            <h3 className="font-semibold text-gray-900">Attendance Report</h3>
            <p className="text-sm text-gray-600 mt-1">
              View student attendance statistics
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
            <p className="text-3xl mb-2">🎓</p>
            <h3 className="font-semibold text-gray-900">Student Grades</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage student academic details
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Classes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              📚 Today's Classes
            </h2>
            <div className="space-y-3">
              {[
                {
                  time: "9:00 AM",
                  class: "Data Structures (CS-102)",
                  section: "A",
                },
                {
                  time: "10:30 AM",
                  class: "Algorithm Design (CS-201)",
                  section: "B",
                },
                {
                  time: "2:00 PM",
                  class: "Database Systems (CS-301)",
                  section: "A",
                },
              ].map((cls, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-green-500 bg-green-50 p-3 rounded"
                >
                  <p className="font-semibold text-gray-900">
                    {cls.time} - {cls.class}
                  </p>
                  <p className="text-sm text-gray-600">Section {cls.section}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              💡 Quick Tips
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-lg">✅</span>
                <p className="text-gray-700">
                  Generate QR codes 15 minutes before class starts
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">✅</span>
                <p className="text-gray-700">
                  Mark attendance immediately after QR scanning starts
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">✅</span>
                <p className="text-gray-700">
                  Send notices in advance for important announcements
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">✅</span>
                <p className="text-gray-700">
                  Review attendance reports weekly
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
