import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "STUDENT",
  mobileNumber: "",
  dept: "",
  section: "",
  semester: 1,
  rollNo: "",
  employeeId: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        ...form,
        semester: form.role === "STUDENT" ? Number(form.semester) : undefined,
      };

      const { data } = await client.post("/api/auth/register", payload);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.error?.properties?.mobileNumber?.errors?.[0] ||
          "Registration failed",
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-4xl font-bold">Register</h1>
        <p className="mb-6 text-slate-500">Create your Smart Campus account</p>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="rounded-xl border px-4 py-3"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <select
            className="rounded-xl border px-4 py-3"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="STUDENT">STUDENT</option>
            <option value="FACULTY">FACULTY</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          {form.role === "STUDENT" && (
            <>
              <input
                className="rounded-xl border px-4 py-3"
                placeholder="Mobile Number"
                value={form.mobileNumber}
                onChange={(e) =>
                  setForm({ ...form, mobileNumber: e.target.value })
                }
              />
              <input
                className="rounded-xl border px-4 py-3"
                placeholder="Department"
                value={form.dept}
                onChange={(e) => setForm({ ...form, dept: e.target.value })}
              />
              <input
                className="rounded-xl border px-4 py-3"
                type="number"
                placeholder="Semester"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
              />
              <input
                className="rounded-xl border px-4 py-3"
                placeholder="Section"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
              />
              <input
                className="rounded-xl border px-4 py-3 md:col-span-2"
                placeholder="Roll Number"
                value={form.rollNo}
                onChange={(e) => setForm({ ...form, rollNo: e.target.value })}
              />
            </>
          )}

          {form.role === "FACULTY" && (
            <>
              <input
                className="rounded-xl border px-4 py-3"
                placeholder="Department"
                value={form.dept}
                onChange={(e) => setForm({ ...form, dept: e.target.value })}
              />
              <input
                className="rounded-xl border px-4 py-3"
                placeholder="Employee ID"
                value={form.employeeId}
                onChange={(e) =>
                  setForm({ ...form, employeeId: e.target.value })
                }
              />
            </>
          )}

          {form.role === "ADMIN" && (
            <input
              className="rounded-xl border px-4 py-3 md:col-span-2"
              placeholder="Department (optional)"
              value={form.dept}
              onChange={(e) => setForm({ ...form, dept: e.target.value })}
            />
          )}

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-red-600 md:col-span-2">
              {String(error)}
            </div>
          )}

          <button className="rounded-xl bg-slate-900 px-4 py-3 text-white md:col-span-2">
            Register
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link to="/login" className="underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
