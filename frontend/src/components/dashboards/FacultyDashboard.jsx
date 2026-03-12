import { useContext } from "react";
import {
  MdBarChart,
  MdCalendarMonth,
  MdCampaign,
  MdCheckCircle,
  MdDescription,
  MdLightbulb,
  MdQrCode2,
  MdSchool,
  MdWarning,
} from "react-icons/md";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const FacultyDashboard = () => {
  const { user } = useContext(AuthContext);

  const links = [
    {
      to: "/faculty/qr-attendance",
      icon: <MdQrCode2 className="text-blue-500" size={32} />,
      title: "Generate QR",
      desc: "Create QR code for attendance",
    },
    {
      to: "/faculty/attendance-report",
      icon: <MdBarChart className="text-indigo-500" size={32} />,
      title: "Attendance Report",
      desc: "View session records",
    },
    {
      to: "/faculty/defaulters",
      icon: <MdWarning className="text-orange-500" size={32} />,
      title: "Defaulter List",
      desc: "Students below threshold",
    },
    {
      to: "/faculty/student-records",
      icon: <MdSchool className="text-pink-500" size={32} />,
      title: "Student Records",
      desc: "Browse your department",
    },
    {
      to: "/faculty/timetable",
      icon: <MdCalendarMonth className="text-green-500" size={32} />,
      title: "Timetable",
      desc: "Manage class schedule",
    },
    {
      to: "/faculty/notice",
      icon: <MdDescription className="text-orange-400" size={32} />,
      title: "Create Notice",
      desc: "Send notices to students",
    },
    {
      to: "/faculty/announcement",
      icon: <MdCampaign className="text-purple-500" size={32} />,
      title: "Announcement",
      desc: "Broadcast to all students",
    },
  ];

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
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5 mb-8">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="bg-white rounded-xl shadow p-5 hover:shadow-md transition flex items-start gap-3"
            >
              <div className="mt-0.5">{l.icon}</div>
              <div>
                <h3 className="font-semibold text-gray-900">{l.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{l.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdLightbulb className="text-yellow-500" /> Quick Tips
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "Generate QR codes just before class — set section & semester to restrict access",
              "Check Defaulter List monthly and notify students below 75%",
              "Use Attendance Report to see exactly which students came",
              "Send notices early for assignments and exam schedules",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <MdCheckCircle
                  className="text-green-500 mt-0.5 shrink-0"
                  size={16}
                />
                <p className="text-gray-600 text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
