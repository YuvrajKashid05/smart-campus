import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

// Auth Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";

// Dashboards
import AdminDashboard from "./components/dashboards/AdminDashboard";
import FacultyDashboard from "./components/dashboards/FacultyDashboard";
import StudentDashboard from "./components/dashboards/StudentDashboard";

// Student Components
import MarkAttendance from "./components/student/MarkAttendance";
import SubmitComplaint from "./components/student/SubmitComplaint";
import ViewAnnouncements from "./components/student/ViewAnnouncements";
import ViewNotices from "./components/student/ViewNotices";
import ViewTimetable from "./components/student/ViewTimetable";

// Faculty Components
import CreateAnnouncement from "./components/faculty/CreateAnnouncement";
import CreateNotice from "./components/faculty/CreateNotice";
import CreateTimetable from "./components/faculty/CreateTimetable";
import GenerateQRAttendance from "./components/faculty/GenerateQRAttendance";

// Admin Components
import ManageAnnouncements from "./components/admin/ManageAnnouncements";
import ManageNotices from "./components/admin/ManageNotices";
import ManageUsers from "./components/admin/ManageUsers";
import ViewComplaints from "./components/admin/ViewComplaints";

import Navbar from "./components/common/Navbar";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/timetable"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <ViewTimetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <MarkAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notices"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <ViewNotices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/announcements"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <ViewAnnouncements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/complaint"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <SubmitComplaint />
              </ProtectedRoute>
            }
          />

          {/* Faculty Routes */}
          <Route
            path="/faculty/dashboard"
            element={
              <ProtectedRoute requiredRole="FACULTY">
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/timetable"
            element={
              <ProtectedRoute requiredRole="FACULTY">
                <CreateTimetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/qr-attendance"
            element={
              <ProtectedRoute requiredRole="FACULTY">
                <GenerateQRAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/notice"
            element={
              <ProtectedRoute requiredRole="FACULTY">
                <CreateNotice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/announcement"
            element={
              <ProtectedRoute requiredRole="FACULTY">
                <CreateAnnouncement />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ViewComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notices"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ManageNotices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ManageAnnouncements />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
