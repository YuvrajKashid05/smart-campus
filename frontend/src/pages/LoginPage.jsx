import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const { data } = await client.post("/api/auth/login", form);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold">Login</h1>
        <p className="mb-6 text-slate-500">Sign in to Smart Campus</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full rounded-xl border px-4 py-3"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="w-full rounded-xl border px-4 py-3"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-red-600">
              {error}
            </div>
          )}

          <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white">
            Login
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link to="/register" className="underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
