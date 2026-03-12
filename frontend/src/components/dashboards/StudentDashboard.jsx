import { useContext, useEffect, useState } from "react";
import {
  MdBarChart,
  MdCalendarMonth,
  MdCampaign,
  MdDescription,
  MdMessage,
  MdQrCode2,
} from "react-icons/md";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import * as announcementsService from "../../services/announcements";
import * as noticesService from "../../services/notices";
import * as timetableService from "../../services/timetable";

const DAY_MAP = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
};

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [timetable, setTimetable] = useState([]);
  const [notices, setNotices] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ttData, notData, annData] = await Promise.allSettled([
          timetableService.getStudentTimetable(),
          noticesService.getNotices(),
          announcementsService.getAnnouncements(),
        ]);

        if (ttData.status === "fulfilled") {
          setTimetable((ttData.value?.timetables || []).slice(0, 3));
        }
        if (notData.status === "fulfilled") {
          setNotices((notData.value?.notices || []).slice(0, 3));
        }
        if (annData.status === "fulfilled") {
          setAnnouncements((annData.value?.announcements || []).slice(0, 3));
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const todayAbbr = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][
    new Date().getDay()
  ];
  const todayClasses = timetable.filter((t) => t.day === todayAbbr);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-linear-to-r from-blue-600 to-blue-800 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
          <p className="mt-2 text-blue-100">
            {user?.email} • {user?.dept} • Semester {user?.semester}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Today's Classes
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {todayClasses.length}
                </p>
              </div>
              <MdCalendarMonth className="text-blue-400" size={40} />
            </div>
            <Link
              to="/student/timetable"
              className="text-xs text-blue-600 mt-2 hover:underline block"
            >
              View Full Timetable →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Mark Attendance
                </p>
                <p className="text-sm text-gray-700 mt-2">Scan QR Code</p>
              </div>
              <MdQrCode2 className="text-green-400" size={40} />
            </div>
            <Link
              to="/student/attendance"
              className="text-xs text-green-600 mt-2 hover:underline block"
            >
              Start Scanning →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  My Attendance
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  View subject-wise %
                </p>
              </div>
              <MdBarChart className="text-indigo-400" size={40} />
            </div>
            <Link
              to="/student/my-attendance"
              className="text-xs text-indigo-600 mt-2 hover:underline block"
            >
              View Report →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Notices</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {notices.length}
                </p>
              </div>
              <MdDescription className="text-purple-400" size={40} />
            </div>
            <Link
              to="/student/notices"
              className="text-xs text-purple-600 mt-2 hover:underline block"
            >
              View All →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/student/notices"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex items-start gap-4"
          >
            <MdDescription className="text-blue-500 mt-1" size={28} />
            <div>
              <h3 className="font-semibold text-gray-900">Notices</h3>
              <p className="text-sm text-gray-600 mt-1">
                View all notices from faculty
              </p>
            </div>
          </Link>
          <Link
            to="/student/announcements"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex items-start gap-4"
          >
            <MdCampaign className="text-purple-500 mt-1" size={28} />
            <div>
              <h3 className="font-semibold text-gray-900">Announcements</h3>
              <p className="text-sm text-gray-600 mt-1">
                Stay updated with latest news
              </p>
            </div>
          </Link>
          <Link
            to="/student/complaint"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex items-start gap-4"
          >
            <MdMessage className="text-red-500 mt-1" size={28} />
            <div>
              <h3 className="font-semibold text-gray-900">Submit Complaint</h3>
              <p className="text-sm text-gray-600 mt-1">
                Report issues or concerns
              </p>
            </div>
          </Link>
        </div>

        {/* Timetable */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MdCalendarMonth className="text-blue-500" /> Your Timetable
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
                      <td className="py-3 px-4">
                        {DAY_MAP[cls.day] || cls.day}
                      </td>
                      <td className="py-3 px-4">
                        {cls.startTime} – {cls.endTime}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{cls.title}</span>
                        {cls.subject && (
                          <>
                            <br />
                            <span className="text-sm text-gray-600">
                              {cls.subject}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-4">{cls.faculty?.name || "-"}</td>
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

        {/* Recent Notices */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MdDescription className="text-blue-500" /> Recent Notices
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
                    {notice.body?.substring(0, 100)}...
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

        {/* Announcements */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MdCampaign className="text-purple-500" /> Announcements
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
              {announcements.map((ann) => (
                <div
                  key={ann._id}
                  className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded"
                >
                  <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                  <p className="text-sm text-gray-700 mt-1">
                    {ann.message?.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(ann.createdAt).toLocaleDateString()}
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
