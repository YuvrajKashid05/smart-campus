import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        const from = location.state?.from?.pathname;
        const dashboardPath =
          result.user?.role?.toLowerCase() === "student"
            ? "/student/dashboard"
            : result.user?.role?.toLowerCase() === "faculty"
              ? "/faculty/dashboard"
              : "/admin/dashboard";
        navigate(from || dashboardPath, { replace: true });
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="text-4xl">🎓</div>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Smart Campus
          </h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">
            Demo Credentials:
          </p>
          <div className="text-xs text-blue-800 space-y-1">
            <p>
              <span className="font-semibold">Student:</span>{" "}
              student@example.com / student123
            </p>
            <p>
              <span className="font-semibold">Faculty:</span>{" "}
              faculty@example.com / faculty123
            </p>
            <p>
              <span className="font-semibold">Admin:</span> admin@example.com /
              admin123
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
