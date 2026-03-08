import { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

function groupByDay(entries = []) {
  const days = { MON: [], TUE: [], WED: [], THU: [], FRI: [], SAT: [] };
  entries.forEach((item) => {
    if (days[item.dayOfWeek]) days[item.dayOfWeek].push(item);
  });

  Object.keys(days).forEach((day) => {
    days[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  return days;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState(null);
  const [notices, setNotices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ttRes, noticeRes, complaintRes] = await Promise.all([
          client.get("/api/timetable/my/week"),
          client.get("/api/notices"),
          client.get("/api/complaints/mine"),
        ]);

        setTimetable(ttRes.data.timetable || null);
        setNotices(noticeRes.data.notices || []);
        setComplaints(complaintRes.data.complaints || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="text-lg">Loading dashboard...</div>;
  }

  const days = groupByDay(timetable?.entries || []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <p className="mt-2 text-slate-600">
          {user.name} • {user.dept} • Semester {user.semester} • Section{" "}
          {user.section || "-"}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">My Weekly Timetable</h2>

        {!timetable ? (
          <p className="text-slate-500">
            No timetable found for your class group.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {Object.entries(days).map(([day, entries]) => (
              <div
                key={day}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <h3 className="mb-3 font-bold text-slate-800">{day}</h3>

                {entries.length === 0 ? (
                  <p className="text-sm text-slate-400">No classes</p>
                ) : (
                  <div className="space-y-3">
                    {entries.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-white p-3 shadow-sm"
                      >
                        <div className="font-semibold text-slate-900">
                          {item.subjectName}
                        </div>
                        <div className="text-sm text-slate-500">
                          {item.startTime} - {item.endTime}
                        </div>
                        <div className="text-sm text-slate-500">
                          {item.room}
                        </div>
                        <div className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          {item.type}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Notices</h2>
          <div className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-slate-500">No notices available.</p>
            ) : (
              notices.map((notice) => (
                <div
                  key={notice._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <h3 className="font-semibold">{notice.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{notice.body}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">My Complaints</h2>
          <div className="space-y-3">
            {complaints.length === 0 ? (
              <p className="text-slate-500">No complaints submitted.</p>
            ) : (
              complaints.map((complaint) => (
                <div
                  key={complaint._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{complaint.category}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                      {complaint.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {complaint.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
