import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-bold text-slate-800">
            Smart Campus
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm text-slate-600">
                <div className="font-semibold">{user.name}</div>
                <div>{user.role}</div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
