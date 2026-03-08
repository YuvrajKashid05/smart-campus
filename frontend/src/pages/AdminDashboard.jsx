import { useEffect, useState } from "react";
import client from "../api/client";
import SectionCard from "../components/SectionCard";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    body: "",
    audience: "ALL",
  });

  async function loadAll() {
    const [u, c, a] = await Promise.all([
      client.get("/api/users").catch(() => ({ data: { users: [] } })),
      client.get("/api/complaints").catch(() => ({ data: { complaints: [] } })),
      client
        .get("/api/announcements")
        .catch(() => ({ data: { announcements: [] } })),
    ]);

    setUsers(u.data.users || []);
    setComplaints(c.data.complaints || []);
    setAnnouncements(a.data.announcements || []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function updateStudent(student) {
    await client.put(`/api/users/students/${student._id || student.id}`, {
      name: student.name,
      mobileNumber: student.mobileNumber,
      dept: student.dept,
      section: student.section,
      semester: Number(student.semester),
      rollNo: student.rollNo,
      isActive: student.isActive,
    });
    loadAll();
  }

  async function createNotice(e) {
    e.preventDefault();
    await client.post("/api/notices", noticeForm);
    setNoticeForm({ title: "", body: "", audience: "ALL" });
  }

  async function deleteAnnouncement(id) {
    await client.delete(`/api/announcements/${id}`);
    loadAll();
  }

  const students = users.filter((u) => u.role === "STUDENT");

  return (
    <div className="space-y-6">
      <SectionCard title="Admin Dashboard">
        <p className="text-slate-600">
          Manage users, complaints, notices and announcements
        </p>
      </SectionCard>

      <SectionCard title="Create Notice">
        <form onSubmit={createNotice} className="space-y-3">
          <input
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Title"
            value={noticeForm.title}
            onChange={(e) =>
              setNoticeForm({ ...noticeForm, title: e.target.value })
            }
          />
          <textarea
            className="w-full rounded-xl border px-4 py-3"
            rows="4"
            placeholder="Body"
            value={noticeForm.body}
            onChange={(e) =>
              setNoticeForm({ ...noticeForm, body: e.target.value })
            }
          />
          <select
            className="w-full rounded-xl border px-4 py-3"
            value={noticeForm.audience}
            onChange={(e) =>
              setNoticeForm({ ...noticeForm, audience: e.target.value })
            }
          >
            <option value="ALL">ALL</option>
            <option value="STUDENT">STUDENT</option>
            <option value="FACULTY">FACULTY</option>
          </select>
          <button className="rounded-xl bg-slate-900 px-4 py-3 text-white">
            Create Notice
          </button>
        </form>
      </SectionCard>

      <SectionCard title="All Students">
        <div className="space-y-3">
          {students.map((student) => (
            <div
              key={student._id || student.id}
              className="rounded-xl border p-4"
            >
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  className="rounded-xl border px-3 py-2"
                  value={student.name || ""}
                  onChange={(e) =>
                    setUsers((prev) =>
                      prev.map((u) =>
                        u._id === student._id
                          ? { ...u, name: e.target.value }
                          : u,
                      ),
                    )
                  }
                />
                <input
                  className="rounded-xl border px-3 py-2"
                  value={student.mobileNumber || ""}
                  onChange={(e) =>
                    setUsers((prev) =>
                      prev.map((u) =>
                        u._id === student._id
                          ? { ...u, mobileNumber: e.target.value }
                          : u,
                      ),
                    )
                  }
                />
                <input
                  className="rounded-xl border px-3 py-2"
                  value={student.dept || ""}
                  onChange={(e) =>
                    setUsers((prev) =>
                      prev.map((u) =>
                        u._id === student._id
                          ? { ...u, dept: e.target.value }
                          : u,
                      ),
                    )
                  }
                />
                <input
                  className="rounded-xl border px-3 py-2"
                  value={student.section || ""}
                  onChange={(e) =>
                    setUsers((prev) =>
                      prev.map((u) =>
                        u._id === student._id
                          ? { ...u, section: e.target.value }
                          : u,
                      ),
                    )
                  }
                />
                <input
                  className="rounded-xl border px-3 py-2"
                  value={student.semester || ""}
                  onChange={(e) =>
                    setUsers((prev) =>
                      prev.map((u) =>
                        u._id === student._id
                          ? { ...u, semester: e.target.value }
                          : u,
                      ),
                    )
                  }
                />
                <input
                  className="rounded-xl border px-3 py-2"
                  value={student.rollNo || ""}
                  onChange={(e) =>
                    setUsers((prev) =>
                      prev.map((u) =>
                        u._id === student._id
                          ? { ...u, rollNo: e.target.value }
                          : u,
                      ),
                    )
                  }
                />
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={student.isActive !== false}
                  onChange={(e) =>
                    setUsers((prev) =>
                      prev.map((u) =>
                        u._id === student._id
                          ? { ...u, isActive: e.target.checked }
                          : u,
                      ),
                    )
                  }
                />
                Active
              </label>

              <button
                onClick={() => updateStudent(student)}
                className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-white"
              >
                Save
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="All Complaints">
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c._id} className="rounded-xl border p-4">
              <div className="font-semibold">{c.category}</div>
              <div className="text-sm text-slate-600">{c.message}</div>
              <div className="mt-2 text-xs text-slate-500">
                By {c.createdBy?.name} • {c.createdBy?.dept}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Announcements">
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a._id}
              className="flex items-center justify-between rounded-xl border p-4"
            >
              <div>
                <div className="font-semibold">{a.title}</div>
                <div className="text-sm text-slate-600">{a.message}</div>
              </div>
              <button
                onClick={() => deleteAnnouncement(a._id)}
                className="rounded-xl bg-red-600 px-3 py-2 text-white"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
