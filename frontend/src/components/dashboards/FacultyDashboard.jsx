import { useContext } from "react";
import {
  MdBarChart,
  MdCalendarMonth,
  MdCampaign,
  MdCheckCircle,
  MdDescription,
  MdGroup,
  MdLightbulb,
  MdQrCode2,
  MdSchool,
} from "react-icons/md";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const FacultyDashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-linear-to-r from-green-600 to-green-800 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Welcome, Prof. {user?.name}!</h1>
          <p className="mt-2 text-green-100">
            {user?.email} • {user?.dept}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/faculty/qr-attendance"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex items-start gap-4"
          >
            <MdQrCode2 className="text-blue-500 mt-1" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">Generate QR</h3>
              <p className="text-sm text-gray-600 mt-1">
                Create QR code for attendance marking
              </p>
            </div>
          </Link>

          <Link
            to="/faculty/timetable"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex items-start gap-4"
          >
            <MdCalendarMonth className="text-green-500 mt-1" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">Timetable</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage your class schedule
              </p>
            </div>
          </Link>

          <Link
            to="/faculty/notice"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex items-start gap-4"
          >
            <MdDescription className="text-orange-500 mt-1" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">Create Notice</h3>
              <p className="text-sm text-gray-600 mt-1">
                Send important notices to students
              </p>
            </div>
          </Link>

          <Link
            to="/faculty/announcement"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex items-start gap-4"
          >
            <MdCampaign className="text-purple-500 mt-1" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">Announcement</h3>
              <p className="text-sm text-gray-600 mt-1">
                Make announcements to all students
              </p>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6 flex items-start gap-4">
            <MdBarChart className="text-indigo-500 mt-1" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">Attendance Report</h3>
              <p className="text-sm text-gray-600 mt-1">
                View student attendance statistics
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 flex items-start gap-4">
            <MdSchool className="text-pink-500 mt-1" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">Student Records</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage student academic details
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MdGroup className="text-green-500" /> Overview
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p>Use the menu above to manage your classes and students.</p>
              <p>Generate QR codes before each class to take attendance.</p>
              <p>Create notices for important deadlines or announcements.</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MdLightbulb className="text-yellow-500" /> Quick Tips
            </h2>
            <div className="space-y-3 text-sm">
              {[
                "Generate QR codes 15 minutes before class starts",
                "Mark attendance immediately after QR scanning starts",
                "Send notices in advance for important announcements",
                "Review attendance reports weekly",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <MdCheckCircle
                    className="text-green-500 mt-0.5 shrink-0"
                    size={18}
                  />
                  <p className="text-gray-700">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
