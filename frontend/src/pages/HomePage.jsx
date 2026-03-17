import { useContext, useEffect } from "react";
import {
  MdArrowForward,
  MdBarChart,
  MdCalendarMonth,
  MdCheckCircle,
  MdDescription,
  MdGroup,
  MdMessage,
  MdQrCode2,
  MdSchool,
} from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const FEATURES = [
  {
    icon: MdQrCode2,
    color: "#6366f1",
    title: "QR Attendance",
    desc: "Dynamic QR codes — marked instantly the moment students scan.",
  },
  {
    icon: MdCalendarMonth,
    color: "#10b981",
    title: "Smart Timetable",
    desc: "Live weekly schedules with rooms, faculty and today highlights.",
  },
  {
    icon: MdDescription,
    color: "#f59e0b",
    title: "Notices & Alerts",
    desc: "Role-targeted notices and dept-specific announcements.",
  },
  {
    icon: MdBarChart,
    color: "#ef4444",
    title: "Analytics",
    desc: "Per-subject breakdowns, defaulter warnings and class calculations.",
  },
  {
    icon: MdMessage,
    color: "#8b5cf6",
    title: "Complaints",
    desc: "Submit, track and resolve issues with full admin oversight.",
  },
  {
    icon: MdGroup,
    color: "#06b6d4",
    title: "User Management",
    desc: "Manage all students, faculty and admins from one place.",
  },
];

export default function HomePage() {
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated)
      navigate(
        user?.role === "STUDENT"
          ? "/student/dashboard"
          : user?.role === "FACULTY"
            ? "/faculty/dashboard"
            : "/admin/dashboard",
        { replace: true },
      );
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <MdSchool size={17} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">
              Smart Campus
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-indigo-50/60 to-white pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-semibold text-indigo-600 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Campus Management Platform
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-[1.08] tracking-tight mb-6">
            Every campus operation,
            <br />
            <span className="text-indigo-600">unified.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            QR attendance, live timetables, department notices and complaints —
            everything your campus needs in one fast platform.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition text-sm"
            >
              Start Free <MdArrowForward size={17} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-2xl transition text-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Everything you need
            </h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Built for students, faculty, and administrators — each with their
              own tailored experience.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 transition"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: f.color + "15" }}
                >
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1.5">
                  {f.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Made for every role
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                role: "Students",
                color: "#6366f1",
                bg: "#eef2ff",
                items: [
                  "Scan QR to mark attendance",
                  "View personal timetable",
                  "Read notices & announcements",
                  "Submit complaints",
                  "Monitor attendance %",
                ],
              },
              {
                role: "Faculty",
                color: "#10b981",
                bg: "#ecfdf5",
                items: [
                  "Generate QR attendance",
                  "View session records",
                  "Mark students manually",
                  "Create timetable slots",
                  "Post notices",
                ],
              },
              {
                role: "Admins",
                color: "#8b5cf6",
                bg: "#f5f3ff",
                items: [
                  "Manage all users",
                  "View & resolve complaints",
                  "Control notices",
                  "Reports & analytics",
                  "System settings",
                ],
              },
            ].map((r, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-100 p-6"
                style={{ background: r.bg }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                  <h3 className="font-bold text-slate-900 text-sm">{r.role}</h3>
                </div>
                <ul className="space-y-2.5">
                  {r.items.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 text-slate-600 text-xs"
                    >
                      <MdCheckCircle
                        size={14}
                        style={{ color: r.color, flexShrink: 0 }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-indigo-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            Ready to begin?
          </h2>
          <p className="text-indigo-200 text-sm mb-8">
            Create your account and experience a smarter campus.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition"
          >
            Create Account <MdArrowForward size={17} />
          </Link>
        </div>
      </section>

      <footer className="py-6 px-6 border-t border-slate-100 text-center">
        <p className="text-slate-400 text-xs">
          © {new Date().getFullYear()} Smart Campus Management System
        </p>
      </footer>
    </div>
  );
}
