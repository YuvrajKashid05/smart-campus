import { useEffect, useMemo, useState } from "react";
import { MdAdd, MdDelete, MdEdit, MdRefresh } from "react-icons/md";
import * as timetableService from "../../services/timetable";
import { Alert, BTN_PRIMARY, INPUT, PAGE, SELECT } from "../../ui";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const DAY_LABEL = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
};
const SLOT_TYPES = ["LECTURE", "BREAK"];

function toMinutes(time = "") {
  const [h = "0", m = "0"] = String(time).split(":");
  return Number(h) * 60 + Number(m);
}

function sortByTime(slots = []) {
  return [...slots].sort(
    (a, b) =>
      toMinutes(a.startTime || "00:00") - toMinutes(b.startTime || "00:00"),
  );
}

function badgeClass(slotType = "") {
  return String(slotType).toUpperCase() === "BREAK"
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
}

export default function CreateTimetable() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [slots, setSlots] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [meta, setMeta] = useState({
    dept: "",
    semester: "",
    section: "",
  });

  const [form, setForm] = useState({
    day: "MON",
    slotType: "LECTURE",
    title: "",
    subject: "",
    room: "",
    startTime: "",
    endTime: "",
  });

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setMetaField = (key, value) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      day: "MON",
      slotType: "LECTURE",
      title: "",
      subject: "",
      room: "",
      startTime: "",
      endTime: "",
    });
  };

  const loadTimetable = async (overrideMeta = null) => {
    setLoading(true);
    setError("");

    try {
      const activeMeta = overrideMeta || meta;
      const res = await timetableService.getTimetable({
        dept: activeMeta.dept || undefined,
        semester: activeMeta.semester || undefined,
        section: activeMeta.section || undefined,
      });
      setSlots(Array.isArray(res?.timetables) ? res.timetables : []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load timetable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!meta.dept || !meta.semester || !meta.section) {
      setError("Department, semester and section are required.");
      return;
    }

    if (!form.startTime || !form.endTime) {
      setError("Start time and end time are required.");
      return;
    }

    if (toMinutes(form.endTime) <= toMinutes(form.startTime)) {
      setError("End time must be after start time.");
      return;
    }

    if (form.slotType !== "BREAK" && !form.title.trim()) {
      setError("Title is required.");
      return;
    }

    const payload = {
      dept: meta.dept,
      semester: meta.semester,
      section: meta.section,
      day: form.day,
      slotType: form.slotType,
      title: form.slotType === "BREAK" ? "Break" : form.title,
      subject: form.slotType === "BREAK" ? "" : form.subject,
      room: form.room,
      startTime: form.startTime,
      endTime: form.endTime,
    };

    try {
      setSaving(true);

      if (editingId) {
        await timetableService.updateTimetableSlot(editingId, payload);
        setSuccess("Timetable slot updated successfully.");
      } else {
        await timetableService.createTimetableSlot(payload);
        setSuccess("Timetable slot created successfully.");
      }

      await loadTimetable(meta);
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save timetable slot.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (slot) => {
    setEditingId(slot._id);
    setMeta({
      dept: slot.dept || "",
      semester: slot.semester || "",
      section: slot.section || "",
    });
    setForm({
      day: slot.day || "MON",
      slotType: slot.slotType || "LECTURE",
      title: slot.title || "",
      subject: slot.subject || "",
      room: slot.room || "",
      startTime: slot.startTime || "",
      endTime: slot.endTime || "",
    });
  };

  const handleDelete = async (slot) => {
    try {
      await timetableService.deleteTimetableSlot(slot._id);
      setSuccess("Timetable slot deleted successfully.");
      await loadTimetable(meta);
    } catch (err) {
      setError(
        err?.response?.data?.error || "Failed to delete timetable slot.",
      );
    }
  };

  const sessionRows = useMemo(() => {
    const unique = new Map();
    slots.forEach((slot) => {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!unique.has(key)) {
        unique.set(key, {
          key,
          label: `${slot.startTime} - ${slot.endTime}`,
          startTime: slot.startTime,
        });
      }
    });
    return [...unique.values()].sort(
      (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime),
    );
  }, [slots]);

  const gridMap = useMemo(() => {
    const map = { MON: {}, TUE: {}, WED: {}, THU: {}, FRI: {} };
    sortByTime(slots).forEach((slot) => {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (map[slot.day]) map[slot.day][key] = slot;
    });
    return map;
  }, [slots]);

  return (
    <div className={`${PAGE} min-h-screen bg-slate-50 pb-24`}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-indigo-600">
            Faculty Panel
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Create Timetable
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage class timetable
          </p>
        </div>

        {(error || success) && (
          <div className="mb-5 space-y-3">
            {error && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}
          </div>
        )}

        <div className="grid xl:grid-cols-12 gap-6">
          <div className="xl:col-span-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-5">
                {editingId ? "Edit Slot" : "Add New Slot"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Department
                    </label>
                    <input
                      value={meta.dept}
                      onChange={(e) =>
                        setMetaField("dept", e.target.value.toUpperCase())
                      }
                      className={INPUT}
                      placeholder="CS"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Section
                    </label>
                    <input
                      value={meta.section}
                      onChange={(e) =>
                        setMetaField("section", e.target.value.toUpperCase())
                      }
                      className={INPUT}
                      placeholder="A"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Semester
                  </label>
                  <select
                    value={meta.semester}
                    onChange={(e) => setMetaField("semester", e.target.value)}
                    className={SELECT}
                  >
                    <option value="">Select semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => loadTimetable(meta)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 font-semibold text-slate-700"
                >
                  <MdRefresh size={18} />
                  Load Class Timetable
                </button>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Day
                  </label>
                  <select
                    value={form.day}
                    onChange={(e) => setField("day", e.target.value)}
                    className={SELECT}
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>
                        {DAY_LABEL[day]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Slot Type
                  </label>
                  <select
                    value={form.slotType}
                    onChange={(e) => setField("slotType", e.target.value)}
                    className={SELECT}
                  >
                    {SLOT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Title
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    className={INPUT}
                    placeholder="Data Science"
                    disabled={form.slotType === "BREAK"}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Subject
                  </label>
                  <input
                    value={form.subject}
                    onChange={(e) => setField("subject", e.target.value)}
                    className={INPUT}
                    placeholder="DS01"
                    disabled={form.slotType === "BREAK"}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setField("startTime", e.target.value)}
                      className={INPUT}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setField("endTime", e.target.value)}
                      className={INPUT}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Room
                  </label>
                  <input
                    value={form.room}
                    onChange={(e) => setField("room", e.target.value)}
                    className={INPUT}
                    placeholder="A-102"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`${BTN_PRIMARY} flex-1 justify-center py-3`}
                  >
                    {saving ? (
                      "Saving..."
                    ) : editingId ? (
                      <>
                        <MdEdit size={18} />
                        Update Slot
                      </>
                    ) : (
                      <>
                        <MdAdd size={18} />
                        Add Slot
                      </>
                    )}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="xl:col-span-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 px-5 sm:px-6 py-5 bg-linear-to-r from-slate-50 to-white">
                <h2 className="text-2xl font-bold text-slate-900">
                  Timetable Preview
                </h2>
              </div>

              <div className="p-4 sm:p-6">
                {loading ? (
                  <div className="py-16 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin" />
                  </div>
                ) : sessionRows.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-12 text-center">
                    <p className="text-lg font-semibold text-slate-700">
                      No timetable slots found
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-245">
                      <div className="grid grid-cols-6 gap-3 mb-3">
                        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
                          Time
                        </div>
                        {DAYS.map((day) => (
                          <div
                            key={day}
                            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 text-center"
                          >
                            {DAY_LABEL[day]}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        {sessionRows.map((row) => (
                          <div key={row.key} className="grid grid-cols-6 gap-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                              <p className="text-sm font-bold text-slate-900">
                                {row.label}
                              </p>
                            </div>

                            {DAYS.map((day) => {
                              const slot = gridMap[day]?.[row.key];

                              return (
                                <div
                                  key={`${day}-${row.key}`}
                                  className={`rounded-2xl border px-4 py-4 min-h-35 ${
                                    slot
                                      ? "bg-white border-slate-200 shadow-sm"
                                      : "bg-slate-50 border-slate-100"
                                  }`}
                                >
                                  {slot ? (
                                    <div className="h-full flex flex-col justify-between">
                                      <div>
                                        <div className="flex items-start justify-between gap-2">
                                          <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                            {slot.title || "Class"}
                                          </h3>
                                          <span
                                            className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full border ${badgeClass(
                                              slot.slotType,
                                            )}`}
                                          >
                                            {slot.slotType}
                                          </span>
                                        </div>

                                        <p className="mt-2 text-xs text-slate-600">
                                          <span className="font-semibold">
                                            Subject:
                                          </span>{" "}
                                          {slot.subject || "—"}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600">
                                          <span className="font-semibold">
                                            Faculty:
                                          </span>{" "}
                                          {slot.faculty?.name ||
                                            "Auto assigned"}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600">
                                          <span className="font-semibold">
                                            Room:
                                          </span>{" "}
                                          {slot.room || "—"}
                                        </p>
                                      </div>

                                      <div className="mt-4 flex gap-2">
                                        <button
                                          onClick={() => handleEdit(slot)}
                                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-semibold text-sm"
                                        >
                                          <MdEdit size={16} />
                                          Edit
                                        </button>

                                        <button
                                          onClick={() => handleDelete(slot)}
                                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-semibold text-sm"
                                        >
                                          <MdDelete size={16} />
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-full flex items-center justify-center text-sm text-slate-400">
                                      —
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
