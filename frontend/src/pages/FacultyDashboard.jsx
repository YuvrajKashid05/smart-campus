import { useEffect, useState } from "react";
import client from "../api/client";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState("");

  const [noticeForm, setNoticeForm] = useState({
    title: "",
    body: "",
    audience: "ALL",
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    audience: "ALL",
    dept: user.dept || "",
    semester: "",
    section: "",
  });
  const [slotForm, setSlotForm] = useState({
    subjectName: "",
    dayOfWeek: "MON",
    startTime: "09:00",
    endTime: "10:00",
    room: "",
    dept: user.dept || "",
    semester: 1,
    section: "A",
  });

  async function loadAll() {
    const [u, a, t] = await Promise.all([
      client.get("/api/users").catch(() => ({ data: { users: [] } })),
      client
        .get("/api/announcements")
        .catch(() => ({ data: { announcements: [] } })),
      client.get("/api/timetables").catch(() => ({ data: { slots: [] } })),
    ]);
    setUsers(u.data.users || []);
    setAnnouncements(a.data.announcements || []);
    setSlots(t.data.slots || t.data.entries || []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createNotice(e) {
    e.preventDefault();
    await client.post("/api/notices", noticeForm);
    setNoticeForm({ title: "", body: "", audience: "ALL" });
    setMessage("Notice created");
  }

  async function createAnnouncement(e) {
    e.preventDefault();
    await client.post("/api/announcements", {
      ...announcementForm,
      semester: announcementForm.semester
        ? Number(announcementForm.semester)
        : undefined,
    });
    setAnnouncementForm({
      title: "",
      message: "",
      audience: "ALL",
      dept: user.dept || "",
      semester: "",
      section: "",
    });
    loadAll();
  }

  async function deleteAnnouncement(id) {
    await client.delete(`/api/announcements/${id}`);
    loadAll();
  }

  async function createSlot(e) {
    e.preventDefault();
    await client.post("/api/timetables", {
      ...slotForm,
      semester: Number(slotForm.semester),
    });
    setMessage("Timetable slot created");
    loadAll();
  }

  async function deleteSlot(id) {
    await client.delete(`/api/timetables/${id}`);
    loadAll();
  }

  async function startAttendance() {
    const { data } = await client.post("/api/attendance/start", {
      course: "DBMS",
      dept: user.dept || "CSE",
      year: 2,
      ttlMinutes: 10,
    });
    setMessage(
      `Attendance started. Token: ${data.session?.qrToken || "created"}`,
    );
  }

  async function updateStudent(student) {
    await client.put(`/api/users/students/${student._id || student.id}`, {
      semester: student.semester,
      section: student.section,
      dept: student.dept,
      rollNo: student.rollNo,
      isActive: student.isActive,
    });
    loadAll();
  }

  const students = users.filter((u) => u.role === "STUDENT");

  return (
    <div className="space-y-6">
      <SectionCard
        title="Faculty Dashboard"
        right={
          <button
            onClick={startAttendance}
            className="rounded-xl bg-slate-900 px-4 py-2 text-white"
          >
            Start Attendance
          </button>
        }
      >
        <p className="text-slate-600">
          {user.name} • {user.dept}
        </p>
        {message && (
          <div className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-green-700">
            {message}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
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

        <SectionCard title="Create Announcement">
          <form onSubmit={createAnnouncement} className="space-y-3">
            <input
              className="w-full rounded-xl border px-4 py-3"
              placeholder="Title"
              value={announcementForm.title}
              onChange={(e) =>
                setAnnouncementForm({
                  ...announcementForm,
                  title: e.target.value,
                })
              }
            />
            <textarea
              className="w-full rounded-xl border px-4 py-3"
              rows="4"
              placeholder="Message"
              value={announcementForm.message}
              onChange={(e) =>
                setAnnouncementForm({
                  ...announcementForm,
                  message: e.target.value,
                })
              }
            />
            <input
              className="w-full rounded-xl border px-4 py-3"
              placeholder="Department"
              value={announcementForm.dept}
              onChange={(e) =>
                setAnnouncementForm({
                  ...announcementForm,
                  dept: e.target.value,
                })
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className="rounded-xl border px-4 py-3"
                placeholder="Semester"
                value={announcementForm.semester}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    semester: e.target.value,
                  })
                }
              />
              <input
                className="rounded-xl border px-4 py-3"
                placeholder="Section"
                value={announcementForm.section}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    section: e.target.value,
                  })
                }
              />
            </div>
            <button className="rounded-xl bg-slate-900 px-4 py-3 text-white">
              Create Announcement
            </button>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Manage Announcements">
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

      <SectionCard title="Create Timetable Slot">
        <form onSubmit={createSlot} className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="Subject"
            value={slotForm.subjectName}
            onChange={(e) =>
              setSlotForm({ ...slotForm, subjectName: e.target.value })
            }
          />
          <select
            className="rounded-xl border px-4 py-3"
            value={slotForm.dayOfWeek}
            onChange={(e) =>
              setSlotForm({ ...slotForm, dayOfWeek: e.target.value })
            }
          >
            <option>MON</option>
            <option>TUE</option>
            <option>WED</option>
            <option>THU</option>
            <option>FRI</option>
            <option>SAT</option>
          </select>
          <input
            className="rounded-xl border px-4 py-3"
            type="time"
            value={slotForm.startTime}
            onChange={(e) =>
              setSlotForm({ ...slotForm, startTime: e.target.value })
            }
          />
          <input
            className="rounded-xl border px-4 py-3"
            type="time"
            value={slotForm.endTime}
            onChange={(e) =>
              setSlotForm({ ...slotForm, endTime: e.target.value })
            }
          />
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="Room"
            value={slotForm.room}
            onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
          />
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="Department"
            value={slotForm.dept}
            onChange={(e) => setSlotForm({ ...slotForm, dept: e.target.value })}
          />
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="Semester"
            value={slotForm.semester}
            onChange={(e) =>
              setSlotForm({ ...slotForm, semester: e.target.value })
            }
          />
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="Section"
            value={slotForm.section}
            onChange={(e) =>
              setSlotForm({ ...slotForm, section: e.target.value })
            }
          />
          <button className="rounded-xl bg-slate-900 px-4 py-3 text-white md:col-span-2">
            Create Slot
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Timetable Slots">
        <div className="space-y-3">
          {slots.map((s) => (
            <div
              key={s._id}
              className="flex items-center justify-between rounded-xl border p-4"
            >
              <div>
                <div className="font-semibold">
                  {s.subjectName || s.subject}
                </div>
                <div className="text-sm text-slate-600">
                  {s.dept} • Sem {s.semester} • Sec {s.section} • {s.dayOfWeek}{" "}
                  {s.startTime}-{s.endTime}
                </div>
              </div>
              <button
                onClick={() => deleteSlot(s._id)}
                className="rounded-xl bg-red-600 px-3 py-2 text-white cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Students">
        <div className="space-y-3">
          {students.map((student) => (
            <div
              key={student._id || student.id}
              className="rounded-xl border p-4"
            >
              <div className="mb-2 font-semibold">{student.name}</div>
              <div className="grid gap-3 md:grid-cols-4">
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
              <button
                onClick={() => updateStudent(student)}
                className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-white"
              >
                Update Student
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
