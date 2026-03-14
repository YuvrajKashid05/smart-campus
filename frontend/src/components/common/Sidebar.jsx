import { useContext, useMemo, useState } from "react";
import {
  MdAnalytics,
  MdBarChart,
  MdCalendarMonth,
  MdCampaign,
  MdCheckCircle,
  MdClose,
  MdDashboard,
  MdDescription,
  MdGroup,
  MdLogout,
  MdMenu,
  MdMessage,
  MdQrCode2,
  MdSchedule,
  MdSettings,
  MdWarning,
} from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const navByRole = {
  STUDENT: [
    ["Dashboard", "/student/dashboard", MdDashboard],
    ["My Attendance", "/student/my-attendance", MdCheckCircle],
    ["Mark Attendance", "/student/attendance", MdQrCode2],
    ["Timetable", "/student/timetable", MdCalendarMonth],
    ["Notices", "/student/notices", MdDescription],
    ["Announcements", "/student/announcements", MdCampaign],
    ["Complaint", "/student/complaint", MdMessage],
  ],
  FACULTY: [
    ["Dashboard", "/faculty/dashboard", MdDashboard],
    ["Generate QR", "/faculty/qr-attendance", MdQrCode2],
    ["Attendance Report", "/faculty/attendance-report", MdBarChart],
    ["Defaulter List", "/faculty/defaulters", MdWarning],
    ["Student Records", "/faculty/student-records", MdGroup],
    ["Timetable", "/faculty/timetable", MdCalendarMonth],
    ["MyTimetable", "/faculty/my-timetable", MdSchedule],
    ["Create Notice", "/faculty/notice", MdDescription],
    ["Announcement", "/faculty/announcement", MdCampaign],
  ],
  ADMIN: [
    ["Dashboard", "/admin/dashboard", MdDashboard],
    ["Users", "/admin/users", MdGroup],
    ["Complaints", "/admin/complaints", MdMessage],
    ["Notices", "/admin/notices", MdDescription],
    ["Announcements", "/admin/announcements", MdCampaign],
    ["Reports", "/admin/reports", MdAnalytics],
    ["Settings", "/admin/settings", MdSettings],
  ],
};

const roleMeta = {
  STUDENT: {
    label: "Student Portal",
    accent: "bg-indigo-600",
    soft: "bg-indigo-50 text-indigo-700",
  },
  FACULTY: {
    label: "Faculty Portal",
    accent: "bg-emerald-600",
    soft: "bg-emerald-50 text-emerald-700",
  },
  ADMIN: {
    label: "Admin Portal",
    accent: "bg-violet-600",
    soft: "bg-violet-50 text-violet-700",
  },
};

function SidebarContent({ onNavigate }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const items = useMemo(
    () => navByRole[user?.role] || navByRole.STUDENT,
    [user?.role],
  );
  const meta = roleMeta[user?.role] || roleMeta.STUDENT;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200 shadow-sm">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`h-11 w-11 rounded-2xl ${meta.accent} text-white grid place-items-center font-black text-lg`}
          >
            SC
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">
              Smart Campus
            </p>
            <p
              className={`text-xs font-semibold mt-1 inline-flex px-2 py-0.5 rounded-full ${meta.soft}`}
            >
              {meta.label}
            </p>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 flex-1 overflow-y-auto">
        <nav className="space-y-1">
          {items.map(([label, path, Icon]) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={onNavigate}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
          <p className="font-semibold text-slate-900 text-sm truncate">
            {user?.name || "User"}
          </p>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {user?.email || ""}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 text-sm font-semibold transition"
          >
            <MdLogout size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { isAuthenticated } = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm grid place-items-center"
      >
        <MdMenu size={22} />
      </button>

      {open && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 z-50 h-full w-72">
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded-xl bg-white/90 border border-slate-200 grid place-items-center"
              >
                <MdClose size={20} />
              </button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </>
      )}

      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 z-30">
        <SidebarContent />
      </aside>
    </>
  );
}
