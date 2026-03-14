import { Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";
import { useContext } from "react";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import Sidebar from "./components/common/Sidebar";

import HomePage      from "./pages/HomePage";
import LoginPage     from "./pages/LoginPage";
import NotFoundPage  from "./pages/NotFoundPage";
import RegisterPage  from "./pages/RegisterPage";

import AdminDashboard   from "./components/dashboards/AdminDashboard";
import FacultyDashboard from "./components/dashboards/FacultyDashboard";
import StudentDashboard from "./components/dashboards/StudentDashboard";

import MarkAttendance    from "./components/student/MarkAttendance";
import MyAttendance      from "./components/student/MyAttendance";
import SubmitComplaint   from "./components/student/SubmitComplaint";
import ViewAnnouncements from "./components/student/ViewAnnouncements";
import ViewNotices       from "./components/student/ViewNotices";
import ViewTimetable     from "./components/student/ViewTimetable";

import AttendanceReport     from "./components/faculty/AttendanceReport";
import CreateAnnouncement   from "./components/faculty/CreateAnnouncement";
import CreateNotice         from "./components/faculty/CreateNotice";
import CreateTimetable      from "./components/faculty/CreateTimetable";
import DefaulterList        from "./components/faculty/DefaulterList";
import GenerateQRAttendance from "./components/faculty/GenerateQRAttendance";
import StudentRecords       from "./components/faculty/StudentRecords";

import ManageAnnouncements from "./components/admin/ManageAnnouncements";
import ManageNotices       from "./components/admin/ManageNotices";
import ManageUsers         from "./components/admin/ManageUsers";
import ReportsAnalytics    from "./components/admin/ReportsAnalytics";
import SystemSettings      from "./components/admin/SystemSettings";
import ViewComplaints      from "./components/admin/ViewComplaints";

// Pages where sidebar should NOT show
const PUBLIC_PATHS = ["/", "/login", "/register"];

function Layout({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const isPublic = PUBLIC_PATHS.includes(location.pathname);

  if (!isAuthenticated || isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      {/* Main content — offset for sidebar on desktop */}
      <main className="flex-1 lg:ml-60 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/"         element={<HomePage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Student */}
            <Route path="/student/dashboard"     element={<ProtectedRoute requiredRole="STUDENT"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/timetable"     element={<ProtectedRoute requiredRole="STUDENT"><ViewTimetable /></ProtectedRoute>} />
            <Route path="/student/attendance"    element={<ProtectedRoute requiredRole="STUDENT"><MarkAttendance /></ProtectedRoute>} />
            <Route path="/student/my-attendance" element={<ProtectedRoute requiredRole="STUDENT"><MyAttendance /></ProtectedRoute>} />
            <Route path="/student/notices"       element={<ProtectedRoute requiredRole="STUDENT"><ViewNotices /></ProtectedRoute>} />
            <Route path="/student/announcements" element={<ProtectedRoute requiredRole="STUDENT"><ViewAnnouncements /></ProtectedRoute>} />
            <Route path="/student/complaint"     element={<ProtectedRoute requiredRole="STUDENT"><SubmitComplaint /></ProtectedRoute>} />

            {/* Faculty */}
            <Route path="/faculty/dashboard"         element={<ProtectedRoute requiredRole="FACULTY"><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/qr-attendance"     element={<ProtectedRoute requiredRole="FACULTY"><GenerateQRAttendance /></ProtectedRoute>} />
            <Route path="/faculty/attendance-report" element={<ProtectedRoute requiredRole="FACULTY"><AttendanceReport /></ProtectedRoute>} />
            <Route path="/faculty/defaulters"        element={<ProtectedRoute requiredRole="FACULTY"><DefaulterList /></ProtectedRoute>} />
            <Route path="/faculty/student-records"   element={<ProtectedRoute requiredRole="FACULTY"><StudentRecords /></ProtectedRoute>} />
            <Route path="/faculty/timetable"         element={<ProtectedRoute requiredRole="FACULTY"><CreateTimetable /></ProtectedRoute>} />
            <Route path="/faculty/notice"            element={<ProtectedRoute requiredRole="FACULTY"><CreateNotice /></ProtectedRoute>} />
            <Route path="/faculty/announcement"      element={<ProtectedRoute requiredRole="FACULTY"><CreateAnnouncement /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/dashboard"     element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users"         element={<ProtectedRoute requiredRole="ADMIN"><ManageUsers /></ProtectedRoute>} />
            <Route path="/admin/complaints"    element={<ProtectedRoute requiredRole="ADMIN"><ViewComplaints /></ProtectedRoute>} />
            <Route path="/admin/notices"       element={<ProtectedRoute requiredRole="ADMIN"><ManageNotices /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute requiredRole="ADMIN"><ManageAnnouncements /></ProtectedRoute>} />
            <Route path="/admin/reports"       element={<ProtectedRoute requiredRole="ADMIN"><ReportsAnalytics /></ProtectedRoute>} />
            <Route path="/admin/settings"      element={<ProtectedRoute requiredRole="ADMIN"><SystemSettings /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
