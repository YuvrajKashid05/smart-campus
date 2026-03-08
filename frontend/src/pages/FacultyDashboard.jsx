import { useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");

  const handleStartAttendance = async () => {
    setMessage("");
    try {
      const { data } = await client.post("/api/attendance/start", {
        course: "DBMS",
        dept: user.dept || "CSE",
        year: 2,
        ttlMinutes: 10,
      });

      setMessage(
        `Attendance session started. QR Token: ${data.session?.qrToken}`,
      );
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to start attendance");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
        <p className="mt-2 text-slate-600">Welcome, {user.name}</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Attendance</h2>
        <button
          onClick={handleStartAttendance}
          className="rounded-xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-700"
        >
          Start Attendance Session
        </button>

        {message && (
          <div className="mt-4 rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
