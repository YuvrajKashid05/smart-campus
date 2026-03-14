import { useContext, useState } from "react";
import {
  MdBarChart, MdCalendarMonth, MdCampaign, MdCheckCircle,
  MdClose, MdDashboard, MdDescription, MdGroup, MdMenu,
  MdMessage, MdQrCode2, MdSchool, MdSettings, MdWarning,
  MdLogout, MdAnalytics, MdPerson,
} from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const STUDENT_NAV = [
  { label: "Dashboard",       path: "/student/dashboard",      icon: MdDashboard },
  { label: "My Attendance",   path: "/student/my-attendance",  icon: MdCheckCircle },
  { label: "Mark Attendance", path: "/student/attendance",     icon: MdQrCode2 },
  { label: "Timetable",       path: "/student/timetable",      icon: MdCalendarMonth },
  { label: "Notices",         path: "/student/notices",        icon: MdDescription },
  { label: "Announcements",   path: "/student/announcements",  icon: MdCampaign },
  { label: "Complaint",       path: "/student/complaint",      icon: MdMessage },
];
const FACULTY_NAV = [
  { label: "Dashboard",          path: "/faculty/dashboard",         icon: MdDashboard },
  { label: "Generate QR",        path: "/faculty/qr-attendance",     icon: MdQrCode2 },
  { label: "Attendance Report",  path: "/faculty/attendance-report", icon: MdBarChart },
  { label: "Defaulter List",     path: "/faculty/defaulters",        icon: MdWarning },
  { label: "Student Records",    path: "/faculty/student-records",   icon: MdGroup },
  { label: "Timetable",          path: "/faculty/timetable",         icon: MdCalendarMonth },
  { label: "Create Notice",      path: "/faculty/notice",            icon: MdDescription },
  { label: "Announcement",       path: "/faculty/announcement",      icon: MdCampaign },
];
const ADMIN_NAV = [
  { label: "Dashboard",     path: "/admin/dashboard",      icon: MdDashboard },
  { label: "Users",         path: "/admin/users",          icon: MdGroup },
  { label: "Complaints",    path: "/admin/complaints",     icon: MdMessage },
  { label: "Notices",       path: "/admin/notices",        icon: MdDescription },
  { label: "Announcements", path: "/admin/announcements",  icon: MdCampaign },
  { label: "Reports",       path: "/admin/reports",        icon: MdAnalytics },
  { label: "Settings",      path: "/admin/settings",       icon: MdSettings },
];

const ROLE_META = {
  STUDENT: { accent: "#818cf8", label: "Student Portal",  bg: "#6366f1" },
  FACULTY: { accent: "#34d399", label: "Faculty Portal",  bg: "#10b981" },
  ADMIN:   { accent: "#c084fc", label: "Admin Portal",    bg: "#8b5cf6" },
};

export default function Sidebar() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthenticated) return null;

  const nav = user?.role === "STUDENT" ? STUDENT_NAV : user?.role === "FACULTY" ? FACULTY_NAV : ADMIN_NAV;
  const meta = ROLE_META[user?.role] || ROLE_META.STUDENT;
  const handleLogout = () => { logout(); navigate("/"); };

  const Content = () => (
    <div className="flex flex-col h-full" style={{ background: "#0f172a" }}>

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-[18px] border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${meta.bg}, ${meta.bg}cc)` }}>
          <MdSchool size={17} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-none">Smart Campus</p>
          <p className="text-[11px] mt-0.5 font-medium" style={{ color: meta.accent }}>{meta.label}</p>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-300">
          <MdClose size={18} />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {nav.map(({ label, path, icon: Icon }) => {
          const active = pathname === path || (path !== "/student/dashboard" && path !== "/faculty/dashboard" && path !== "/admin/dashboard" && pathname.startsWith(path));
          return (
            <Link key={path} to={path} onClick={() => setMobileOpen(false)}
              style={active ? { color: meta.accent, background: `${meta.bg}1a`, borderLeft: `2px solid ${meta.bg}` } : {}}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${active ? "" : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border-l-2 border-transparent"}`}
            >
              <Icon size={17} className="shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── User footer ── */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04]">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, ${meta.bg}, ${meta.bg}bb)` }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-xs font-semibold truncate leading-tight">{user?.name}</p>
            <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} title="Logout"
            className="text-slate-500 hover:text-red-400 transition shrink-0 p-1 rounded-lg hover:bg-white/5">
            <MdLogout size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-9 h-9 flex items-center justify-center rounded-xl shadow-lg text-slate-700 bg-white border border-slate-200">
        <MdMenu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-64 z-50 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Content />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col fixed top-0 left-0 h-full w-60 z-30">
        <Content />
      </div>
    </>
  );
}
