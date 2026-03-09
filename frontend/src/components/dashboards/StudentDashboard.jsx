import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import * as announcementsService from "../../services/announcements";
import * as attendanceService from "../../services/attendance";
import * as noticesService from "../../services/notices";
import * as timetableService from "../../services/timetable";

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [timetable, setTimetable] = useState([]);
  const [notices, setNotices] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    attendancePercentage: 0,
    pendingComplaints: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch student's timetable
        const timetableData = await timetableService.getStudentTimetable(
          user?.id,
        );
        setTimetable(timetableData?.data?.slice(0, 3) || []);

        // Fetch notices
        const noticesData = await noticesService.getNotices({ limit: 3 });
        setNotices(noticesData?.data || []);

        // Fetch announcements
        const announcementsData = await announcementsService.getAnnouncements({
          limit: 3,
        });
        setAnnouncements(announcementsData?.data || []);

        // Fetch attendance stats
        const attendanceStats = await attendanceService.getAttendanceStats(
          user?.id,
        );
        setStats({
          totalClasses: attendanceStats?.totalClasses || 0,
          attendancePercentage: attendanceStats?.percentage || 0,
          pendingComplaints: 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Welcome, {user?.firstName}! 👋</h1>
          <p className="mt-2 text-blue-100">
            {user?.email} • {user?.department} • Semester {user?.semester}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Attendance Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Attendance</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.attendancePercentage}%
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Total Classes: {stats.totalClasses}
            </p>
          </div>

          {/* Today's Classes */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Today's Classes
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {
                    timetable.filter(
                      (t) =>
                        t.day ===
                        new Date().toLocaleDateString("en-US", {
                          weekday: "long",
                        }),
                    ).length
                  }
                </p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
            <Link
              to="/student/timetable"
              className="text-xs text-blue-600 mt-2 hover:underline"
            >
              View Full Timetable →
            </Link>
          </div>

          {/* Mark Attendance */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Mark Attendance
                </p>
                <p className="text-sm text-gray-700 mt-2">Scan QR Code</p>
              </div>
              <div className="text-4xl">📱</div>
            </div>
            <Link
              to="/student/attendance"
              className="text-xs text-purple-600 mt-2 hover:underline"
            >
              Start Scanning →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/student/notices"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">📄</p>
            <h3 className="font-semibold text-gray-900">Notices</h3>
            <p className="text-sm text-gray-600 mt-1">
              View all notices from faculty
            </p>
          </Link>

          <Link
            to="/student/announcements"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">📢</p>
            <h3 className="font-semibold text-gray-900">Announcements</h3>
            <p className="text-sm text-gray-600 mt-1">
              Stay updated with latest news
            </p>
          </Link>

          <Link
            to="/student/complaint"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">💬</p>
            <h3 className="font-semibold text-gray-900">Submit Complaint</h3>
            <p className="text-sm text-gray-600 mt-1">
              Report issues or concerns
            </p>
          </Link>
        </div>

        {/* Timetable Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              📅 Your Timetable (This Week)
            </h2>
            <Link
              to="/student/timetable"
              className="text-blue-600 hover:text-blue-800"
            >
              View All →
            </Link>
          </div>

          {timetable.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Day
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Time
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Subject
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Faculty
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Room
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((cls, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{cls.day}</td>
                      <td className="py-3 px-4">{cls.time}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{cls.subjectCode}</span>
                        <br />
                        <span className="text-sm text-gray-600">
                          {cls.subjectName}
                        </span>
                      </td>
                      <td className="py-3 px-4">{cls.facultyName || "-"}</td>
                      <td className="py-3 px-4">{cls.room || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              No timetable available
            </p>
          )}
        </div>

        {/* Notices Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              📄 Recent Notices
            </h2>
            <Link
              to="/student/notices"
              className="text-blue-600 hover:text-blue-800"
            >
              View All →
            </Link>
          </div>

          {notices.length > 0 ? (
            <div className="space-y-4">
              {notices.map((notice) => (
                <div
                  key={notice._id}
                  className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded"
                >
                  <h3 className="font-semibold text-gray-900">
                    {notice.title}
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    {notice.description?.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              No notices available
            </p>
          )}
        </div>

        {/* Announcements Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              📢 Announcements
            </h2>
            <Link
              to="/student/announcements"
              className="text-blue-600 hover:text-blue-800"
            >
              View All →
            </Link>
          </div>

          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded"
                >
                  <h3 className="font-semibold text-gray-900">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    {announcement.description?.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              No announcements available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
