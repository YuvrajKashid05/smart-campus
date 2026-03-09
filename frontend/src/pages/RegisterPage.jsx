import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
    department: "",
    semester: "1",
    section: "A",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const departments = [
    "Computer Science",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Information Technology",
  ];

  const roles = ["STUDENT", "FACULTY"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department || undefined,
        semester: formData.role === "STUDENT" ? formData.semester : undefined,
        section: formData.role === "STUDENT" ? formData.section : undefined,
      });

      if (result.success) {
        navigate("/login", {
          replace: true,
          state: { message: "Registration successful! Please log in." },
        });
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err) {
      setError("An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="text-4xl">🎓</div>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Smart Campus
          </h2>
          <p className="mt-2 text-sm text-gray-600">Create your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First Name"
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last Name"
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Email */}
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email Address"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />

          {/* Role */}
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role === "STUDENT" ? "Student" : "Faculty"}
              </option>
            ))}
          </select>

          {/* Department */}
          <select
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Semester (Student only) */}
          {formData.role === "STUDENT" && (
            <div className="grid grid-cols-2 gap-3">
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Sem {sem}
                  </option>
                ))}
              </select>
              <select
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          )}

          {/* Password */}
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />

          {/* Confirm Password */}
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm Password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-blue-600 to-blue-800 text-white py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 transition"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
