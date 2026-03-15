import { useContext } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import ChatbotWidget from "./components/common/ChatbotWidget";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Sidebar from "./components/common/Sidebar";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";
// Pages
import AdminDashboard from "./components/dashboards/AdminDashboard";
import FacultyDashboard from "./components/dashboards/FacultyDashboard";
import StudentDashboard from "./components/dashboards/StudentDashboard";

// Dashboards
import AIWeeklyReport from "./components/admin/AIWeeklyReport";
import ManageAnnouncements from "./components/admin/ManageAnnouncements";
import ManageNotices from "./components/admin/ManageNotices";
import ManageUsers from "./components/admin/ManageUsers";
import ReportsAnalytics from "./components/admin/ReportsAnalytics";
import SystemSettings from "./components/admin/SystemSettings";
import ViewComplaints from "./components/admin/ViewComplaints";
import AIRiskReport from "./components/faculty/AIRiskReport";
import AttendanceReport from "./components/faculty/AttendanceReport";
import CreateAnnouncement from "./components/faculty/CreateAnnouncement";
import CreateNotice from "./components/faculty/CreateNotice";
import CreateTimetable from "./components/faculty/CreateTimetable";
import DefaulterList from "./components/faculty/DefaulterList";
import FraudReport from "./components/faculty/FraudReport";
import GenerateQRAttendance from "./components/faculty/GenerateQRAttendance";
import MyTimetable from "./components/faculty/MyTimetable";
import StudentRecords from "./components/faculty/StudentRecords";
import MarkAttendance from "./components/student/MarkAttendance";
import MyAttendance from "./components/student/MyAttendance";
import SubmitComplaint from "./components/student/SubmitComplaint";
import ViewAnnouncements from "./components/student/ViewAnnouncements";
import ViewNotices from "./components/student/ViewNotices";
import ViewTimetable from "./components/student/ViewTimetable";

const PUBLIC = new Set(["/", "/login", "/register"]);

function S({ role, children }) {
  return <ProtectedRoute requiredRole={role}>{children}</ProtectedRoute>;
}

function AppShell({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  const { pathname } = useLocation();
  if (!isAuthenticated || PUBLIC.has(pathname)) return <>{children}</>;
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen">{children}</main>
      <ChatbotWidget />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppShell>
            <Routes>
              {/* Public */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Student */}
              <Route
                path="/student/dashboard"
                element={
                  <S role="STUDENT">
                    <StudentDashboard />
                  </S>
                }
              />
              <Route
                path="/student/timetable"
                element={
                  <S role="STUDENT">
                    <ViewTimetable />
                  </S>
                }
              />
              <Route
                path="/student/attendance"
                element={
                  <S role="STUDENT">
                    <MarkAttendance />
                  </S>
                }
              />
              <Route
                path="/student/my-attendance"
                element={
                  <S role="STUDENT">
                    <MyAttendance />
                  </S>
                }
              />
              <Route
                path="/student/notices"
                element={
                  <S role="STUDENT">
                    <ViewNotices />
                  </S>
                }
              />
              <Route
                path="/student/announcements"
                element={
                  <S role="STUDENT">
                    <ViewAnnouncements />
                  </S>
                }
              />
              <Route
                path="/student/complaint"
                element={
                  <S role="STUDENT">
                    <SubmitComplaint />
                  </S>
                }
              />

              {/* Faculty */}
              <Route
                path="/faculty/dashboard"
                element={
                  <S role="FACULTY">
                    <FacultyDashboard />
                  </S>
                }
              />
              <Route
                path="/faculty/qr-attendance"
                element={
                  <S role="FACULTY">
                    <GenerateQRAttendance />
                  </S>
                }
              />
              <Route
                path="/faculty/attendance-report"
                element={
                  <S role="FACULTY">
                    <AttendanceReport />
                  </S>
                }
              />
              <Route
                path="/faculty/defaulters"
                element={
                  <S role="FACULTY">
                    <DefaulterList />
                  </S>
                }
              />
              <Route
                path="/faculty/student-records"
                element={
                  <S role="FACULTY">
                    <StudentRecords />
                  </S>
                }
              />
              <Route
                path="/faculty/timetable"
                element={
                  <S role="FACULTY">
                    <CreateTimetable />
                  </S>
                }
              />
              <Route
                path="/faculty/my-timetable"
                element={
                  <S role="FACULTY">
                    <MyTimetable />
                  </S>
                }
              />
              <Route
                path="/faculty/notice"
                element={
                  <S role="FACULTY">
                    <CreateNotice />
                  </S>
                }
              />
              <Route
                path="/faculty/announcement"
                element={
                  <S role="FACULTY">
                    <CreateAnnouncement />
                  </S>
                }
              />
              <Route
                path="/faculty/ai-risk-report"
                element={
                  <S role="FACULTY">
                    <AIRiskReport />
                  </S>
                }
              />
              <Route
                path="/faculty/fraud-report"
                element={
                  <S role="FACULTY">
                    <FraudReport />
                  </S>
                }
              />

              {/* Admin */}
              <Route
                path="/admin/dashboard"
                element={
                  <S role="ADMIN">
                    <AdminDashboard />
                  </S>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <S role="ADMIN">
                    <ManageUsers />
                  </S>
                }
              />
              <Route
                path="/admin/complaints"
                element={
                  <S role="ADMIN">
                    <ViewComplaints />
                  </S>
                }
              />
              <Route
                path="/admin/notices"
                element={
                  <S role="ADMIN">
                    <ManageNotices />
                  </S>
                }
              />
              <Route
                path="/admin/announcements"
                element={
                  <S role="ADMIN">
                    <ManageAnnouncements />
                  </S>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <S role="ADMIN">
                    <ReportsAnalytics />
                  </S>
                }
              />
              <Route
                path="/admin/ai-report"
                element={
                  <S role="ADMIN">
                    <AIWeeklyReport />
                  </S>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <S role="ADMIN">
                    <SystemSettings />
                  </S>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AppShell>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
