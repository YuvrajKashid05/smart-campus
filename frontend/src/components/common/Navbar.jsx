import { useContext, useState } from "react";
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
    { name: "Dashboard", path: "/student/dashboard", icon: "📊" },
    { name: "Timetable", path: "/student/timetable", icon: "📅" },
    { name: "Attendance", path: "/student/attendance", icon: "📱" },
    { name: "Notices", path: "/student/notices", icon: "📄" },
    { name: "Announcements", path: "/student/announcements", icon: "📢" },
    { name: "Complaint", path: "/student/complaint", icon: "💬" },
  ];

  const facultyLinks = [
    { name: "Dashboard", path: "/faculty/dashboard", icon: "📊" },
    { name: "Timetable", path: "/faculty/timetable", icon: "📅" },
    { name: "QR Attendance", path: "/faculty/qr-attendance", icon: "📱" },
    { name: "Notice", path: "/faculty/notice", icon: "📄" },
    { name: "Announcement", path: "/faculty/announcement", icon: "📢" },
  ];

  const adminLinks = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "📊" },
    { name: "Users", path: "/admin/users", icon: "👥" },
    { name: "Complaints", path: "/admin/complaints", icon: "💬" },
    { name: "Notices", path: "/admin/notices", icon: "📄" },
    { name: "Announcements", path: "/admin/announcements", icon: "📢" },
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

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to={
              isAuthenticated ? `/${user?.role?.toLowerCase()}/dashboard` : "/"
            }
            className="flex items-center gap-2 text-2xl font-bold"
          >
            <span>🎓</span>
            <span className="hidden sm:inline">Smart Campus</span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive(link.path)
                      ? "bg-white bg-opacity-20"
                      : "hover:bg-white hover:bg-opacity-10"
                  }`}
                  title={link.name}
                >
                  <span className="mr-1">{link.icon}</span>
                  <span className="hidden lg:inline">{link.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* User Info */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-sm font-bold">
                    {user?.firstName?.charAt(0)}
                  </div>
                  <div className="hidden lg:block text-sm">
                    <p className="font-semibold">{user?.firstName}</p>
                    <p className="text-blue-100 text-xs">{user?.role}</p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition text-sm"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
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

            {/* Mobile Menu Toggle */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
              >
                {mobileMenuOpen ? "✕" : "☰"}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(link.path)
                    ? "bg-white bg-opacity-20"
                    : "hover:bg-white hover:bg-opacity-10"
                }`}
              >
                <span className="mr-2">{link.icon}</span>
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
