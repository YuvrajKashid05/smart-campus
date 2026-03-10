import { useContext, useEffect, useState } from "react";
import {
  MdAdd,
  MdCalendarMonth,
  MdClose,
  MdDelete,
  MdEdit,
} from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as timetableService from "../../services/timetable";

const DAY_OPTIONS = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
];

const CreateTimetable = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    dept: user?.dept || "",
    semester: "1",
    section: "A",
    day: "MON",
    slotType: "LECTURE",
    title: "",
    subject: "",
    room: "",
    startTime: "09:00",
    endTime: "10:00",
  });

  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    try {
      const data = await timetableService.getTimetable({ dept: user?.dept });
      setTimetables(data?.timetables || []);
    } catch (error) {
      console.error("Error fetching timetables:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const payload = {
      dept: formData.dept.trim().toUpperCase(),
      semester: parseInt(formData.semester),
      section: formData.section.trim().toUpperCase(),
      day: formData.day,
      slotType: formData.slotType,
      title: formData.title,
      subject: formData.slotType === "LECTURE" ? formData.subject : "",
      room: formData.room,
      startTime: formData.startTime,
      endTime: formData.endTime,
    };

    try {
      if (editingId) {
        await timetableService.updateTimetable(editingId, payload);
        setSuccess("Timetable updated successfully!");
        setEditingId(null);
      } else {
        await timetableService.createTimetable(payload);
        setSuccess("Timetable slot created successfully!");
      }
      resetForm();
      fetchTimetables();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save timetable");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      dept: user?.dept || "",
      semester: "1",
      section: "A",
      day: "MON",
      slotType: "LECTURE",
      title: "",
      subject: "",
      room: "",
      startTime: "09:00",
      endTime: "10:00",
    });
  };

  const handleEdit = (t) => {
    setFormData({
      dept: t.dept,
      semester: String(t.semester),
      section: t.section,
      day: t.day,
      slotType: t.slotType,
      title: t.title,
      subject: t.subject || "",
      room: t.room || "",
      startTime: t.startTime,
      endTime: t.endTime,
    });
    setEditingId(t._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this timetable slot?")) {
      try {
        await timetableService.deleteTimetable(id);
        setSuccess("Deleted successfully!");
        fetchTimetables();
        setTimeout(() => setSuccess(""), 3000);
      } catch {
        setError("Failed to delete");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <MdCalendarMonth className="text-blue-500" /> Manage Timetable
        </h1>
        <p className="text-gray-600 mb-8">
          Create and manage class timetable slots
        </p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Form */}
          <div className="md:col-span-1 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              {editingId ? <MdEdit size={20} /> : <MdAdd size={20} />}
              {editingId ? "Edit Slot" : "Add New Slot"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Dept *
                  </label>
                  <input
                    type="text"
                    name="dept"
                    value={formData.dept}
                    onChange={handleInputChange}
                    placeholder="CS"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Sem {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    {["A", "B", "C"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Day
                  </label>
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    {DAY_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Slot Type
                </label>
                <select
                  name="slotType"
                  value={formData.slotType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  <option value="LECTURE">Lecture</option>
                  <option value="BREAK">Break</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Data Structures"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              {formData.slotType === "LECTURE" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="e.g., CS301"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Room
                </label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  placeholder="e.g., 101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm"
                >
                  {loading ? "Saving..." : editingId ? "Update" : "Add Slot"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      resetForm();
                    }}
                    className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                  >
                    <MdClose size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Timetable Slots ({timetables.length})
            </h2>
            {timetables.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Day</th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Room
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">Sec</th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {timetables.map((t) => (
                      <tr key={t._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{t.day}</td>
                        <td className="px-4 py-3">
                          {t.startTime} – {t.endTime}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold">{t.title}</p>
                          {t.subject && (
                            <p className="text-xs text-gray-600">{t.subject}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">{t.room || "-"}</td>
                        <td className="px-4 py-3">{t.section}</td>
                        <td className="px-4 py-3 flex gap-1">
                          <button
                            onClick={() => handleEdit(t)}
                            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            <MdEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(t._id)}
                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            <MdDelete size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <MdCalendarMonth
                  className="text-gray-300 mx-auto mb-4"
                  size={48}
                />
                <p className="text-gray-600">
                  No timetable entries yet. Create one to get started!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTimetable;
