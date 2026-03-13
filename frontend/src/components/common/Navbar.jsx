import { useContext, useState } from "react";
import {
  MdBarChart,
  MdCalendarMonth,
  MdCampaign,
  MdClose,
  MdDescription,
  MdGroup,
  MdLogout,
  MdMenu,
  MdMessage,
  MdQrCode2,
  MdSchool,
} from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const studentLinks = [
    {
      name: "Dashboard",
      path: "/student/dashboard",
      icon: <MdBarChart size={18} />,
    },
    {
      name: "Timetable",
      path: "/student/timetable",
      icon: <MdCalendarMonth size={18} />,
    },
    {
      name: "Attendance",
      path: "/student/attendance",
      icon: <MdQrCode2 size={18} />,
    },
    {
      name: "Notices",
      path: "/student/notices",
      icon: <MdDescription size={18} />,
    },
    {
      name: "Announcements",
      path: "/student/announcements",
      icon: <MdCampaign size={18} />,
    },
    {
      name: "Complaint",
      path: "/student/complaint",
      icon: <MdMessage size={18} />,
    },
  ];

  const facultyLinks = [
    {
      name: "Dashboard",
      path: "/faculty/dashboard",
      icon: <MdBarChart size={18} />,
    },
    {
      name: "Timetable",
      path: "/faculty/timetable",
      icon: <MdCalendarMonth size={18} />,
    },
    {
      name: "QR Attendance",
      path: "/faculty/qr-attendance",
      icon: <MdQrCode2 size={18} />,
    },
    {
      name: "Notice",
      path: "/faculty/notice",
      icon: <MdDescription size={18} />,
    },
    {
      name: "Announcement",
      path: "/faculty/announcement",
      icon: <MdCampaign size={18} />,
    },
  ];

  const adminLinks = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <MdBarChart size={18} />,
    },
    { name: "Users", path: "/admin/users", icon: <MdGroup size={18} /> },
    {
      name: "Complaints",
      path: "/admin/complaints",
      icon: <MdMessage size={18} />,
    },
    {
      name: "Notices",
      path: "/admin/notices",
      icon: <MdDescription size={18} />,
    },
    {
      name: "Announcements",
      path: "/admin/announcements",
      icon: <MdCampaign size={18} />,
    },
  ];

  const getNavLinks = () => {
    if (!user) return [];
    if (user.role === "STUDENT") return studentLinks;
    if (user.role === "FACULTY") return facultyLinks;
    if (user.role === "ADMIN") return adminLinks;
    return [];
  };

  const navLinks = getNavLinks();

  const isActive = (path) => location.pathname === path;

  const linkClasses = (path) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
      isActive(path)
        ? "bg-white text-blue-700"
        : "text-white hover:bg-blue-500/40"
    }`;

  return (
    <nav className="bg-linear-to-r from-blue-600 to-blue-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to={
              isAuthenticated ? `/${user?.role?.toLowerCase()}/dashboard` : "/"
            }
            className="flex items-center gap-2 text-2xl font-bold"
          >
            <MdSchool size={28} />
            <span className="hidden sm:inline">Smart Campus</span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={linkClasses(link.path)}
                >
                  {link.icon}
                  <span className="hidden lg:inline">{link.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* User Info */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white text-blue-700 flex items-center justify-center text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>

                  <div className="hidden lg:block leading-tight">
                    <p className="text-sm font-semibold text-white">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-blue-100">{user?.role}</p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition"
                >
                  <MdLogout size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg font-semibold transition"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-blue-500/40 rounded-lg"
              >
                {mobileMenuOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm transition ${
                  isActive(link.path)
                    ? "bg-white text-blue-700"
                    : "hover:bg-blue-500/40"
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
