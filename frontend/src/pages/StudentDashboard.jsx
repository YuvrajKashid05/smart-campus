import { useEffect, useState } from "react";
import client from "../api/client";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [notices, setNotices] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [complaintForm, setComplaintForm] = useState({
    category: "OTHER",
    message: "",
  });
  const [qrToken, setQrToken] = useState("");

  async function loadAll() {
    const [tt, nt, an, cp] = await Promise.all([
      client.get("/api/timetables/my").catch(() => ({ data: { slots: [] } })),
      client.get("/api/notices").catch(() => ({ data: { notices: [] } })),
      client
        .get("/api/announcements", {
          params: {
            dept: user.dept,
            semester: user.semester,
            section: user.section,
          },
        })
        .catch(() => ({ data: { announcements: [] } })),
      client
        .get("/api/complaints/mine")
        .catch(() => ({ data: { complaints: [] } })),
    ]);

    setTimetable(tt.data.slots || tt.data.entries || tt.data.timetable || []);
    setNotices(nt.data.notices || []);
    setAnnouncements(an.data.announcements || []);
    setComplaints(cp.data.complaints || []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function submitComplaint(e) {
    e.preventDefault();
    await client.post("/api/complaints", complaintForm);
    setComplaintForm({ category: "OTHER", message: "" });
    loadAll();
  }

  async function markAttendance(e) {
    e.preventDefault();
    await client.post("/api/attendance/mark", { qrToken });
    setQrToken("");
    alert("Attendance request sent");
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Student Dashboard">
        <p className="text-slate-600">
          {user.name} • {user.dept} • Semester {user.semester} • Section{" "}
          {user.section}
        </p>
      </SectionCard>

      <SectionCard title="My Timetable">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {timetable.map((item) => (
            <div key={item._id} className="rounded-xl border p-4">
              <div className="font-semibold">
                {item.subjectName || item.subject || "Subject"}
              </div>
              <div className="text-sm text-slate-500">
                {item.dayOfWeek} • {item.startTime} - {item.endTime}
              </div>
              <div className="text-sm text-slate-500">{item.room}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Mark Attendance">
          <form onSubmit={markAttendance} className="space-y-3">
            <input
              className="w-full rounded-xl border px-4 py-3"
              placeholder="Paste QR token"
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
            />
            <button className="rounded-xl bg-slate-900 px-4 py-3 text-white">
              Mark Attendance
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Create Complaint">
          <form onSubmit={submitComplaint} className="space-y-3">
            <select
              className="w-full rounded-xl border px-4 py-3"
              value={complaintForm.category}
              onChange={(e) =>
                setComplaintForm({ ...complaintForm, category: e.target.value })
              }
            >
              <option value="OTHER">OTHER</option>
              <option value="IT">IT</option>
              <option value="FACILITY">FACILITY</option>
              <option value="ACADEMIC">ACADEMIC</option>
            </select>
            <textarea
              className="w-full rounded-xl border px-4 py-3"
              rows="4"
              placeholder="Complaint message"
              value={complaintForm.message}
              onChange={(e) =>
                setComplaintForm({ ...complaintForm, message: e.target.value })
              }
            />
            <button className="rounded-xl bg-slate-900 px-4 py-3 text-white">
              Submit Complaint
            </button>
          </form>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Announcements">
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a._id} className="rounded-xl border p-4">
                <div className="font-semibold">{a.title}</div>
                <div className="text-sm text-slate-600">{a.message}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Notices">
          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n._id} className="rounded-xl border p-4">
                <div className="font-semibold">{n.title}</div>
                <div className="text-sm text-slate-600">{n.body}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="My Complaints">
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c._id} className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{c.category}</div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                  {c.status}
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-600">{c.message}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
