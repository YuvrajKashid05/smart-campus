import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
          <p className="mt-3 text-sm text-slate-500">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    const fallback =
      user?.role === "ADMIN"
        ? "/admin/dashboard"
        : user?.role === "FACULTY"
          ? "/faculty/dashboard"
          : "/student/dashboard";

    return <Navigate to={fallback} replace />;
  }

  return children;
}
