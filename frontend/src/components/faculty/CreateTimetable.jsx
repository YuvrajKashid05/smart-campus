import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import * as timetableService from "../../services/timetable";

const CreateTimetable = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    subjectCode: "",
    subjectName: "",
    day: "Monday",
    time: "09:00",
    endTime: "10:00",
    room: "",
    section: "A",
    semester: "1",
    department: user?.department || "",
  });

  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const sections = ["A", "B", "C"];

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    try {
      const data = await timetableService.getTimetable({
        facultyId: user?.id,
        limit: 100,
      });
      setTimetables(data?.data || []);
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

    try {
      if (editingId) {
        await timetableService.updateTimetable(editingId, {
          ...formData,
          facultyId: user?.id,
          facultyName: user?.firstName + " " + user?.lastName,
        });
        setSuccess("✅ Timetable updated successfully!");
        setEditingId(null);
      } else {
        await timetableService.createTimetable({
          ...formData,
          facultyId: user?.id,
          facultyName: user?.firstName + " " + user?.lastName,
        });
        setSuccess("✅ Timetable created successfully!");
      }

      setFormData({
        subjectCode: "",
        subjectName: "",
        day: "Monday",
        time: "09:00",
        endTime: "10:00",
        room: "",
        section: "A",
        semester: "1",
        department: user?.department || "",
      });

      fetchTimetables();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save timetable");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (timetable) => {
    setFormData({
      subjectCode: timetable.subjectCode,
      subjectName: timetable.subjectName,
      day: timetable.day,
      time: timetable.time,
      endTime: timetable.endTime,
      room: timetable.room,
      section: timetable.section,
      semester: timetable.semester,
      department: timetable.department,
    });
    setEditingId(timetable._id);
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this timetable entry?")
    ) {
      try {
        await timetableService.deleteTimetable(id);
        setSuccess("✅ Timetable deleted successfully!");
        fetchTimetables();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError("Failed to delete timetable");
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      subjectCode: "",
      subjectName: "",
      day: "Monday",
      time: "09:00",
      endTime: "10:00",
      room: "",
      section: "A",
      semester: "1",
      department: user?.department || "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📅 Manage Timetable
        </h1>
        <p className="text-gray-600 mb-8">
          Create and manage your class timetable
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
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingId ? "✏️ Edit Timetable" : "➕ Add New Class"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Code *
                </label>
                <input
                  type="text"
                  name="subjectCode"
                  value={formData.subjectCode}
                  onChange={handleInputChange}
                  placeholder="e.g., CS101"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  name="subjectName"
                  value={formData.subjectName}
                  onChange={handleInputChange}
                  placeholder="e.g., Data Structures"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day *
                </label>
                <select
                  name="day"
                  value={formData.day}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  placeholder="e.g., 101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {semesters.map((sem) => (
                      <option key={sem} value={sem}>
                        Sem {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {sections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {loading
                    ? "⏳ Saving..."
                    : editingId
                      ? "✅ Update"
                      : "➕ Add"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 transition"
                  >
                    ✕ Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Timetable List */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              📋 My Timetable
            </h2>

            {timetables.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">Day</th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Room
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Section
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {timetables.map((timetable) => (
                      <tr
                        key={timetable._id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold">
                            {timetable.subjectCode}
                          </p>
                          <p className="text-xs text-gray-600">
                            {timetable.subjectName}
                          </p>
                        </td>
                        <td className="px-4 py-3">{timetable.day}</td>
                        <td className="px-4 py-3">
                          {timetable.time} - {timetable.endTime}
                        </td>
                        <td className="px-4 py-3">{timetable.room || "-"}</td>
                        <td className="px-4 py-3">{timetable.section}</td>
                        <td className="px-4 py-3 space-x-2">
                          <button
                            onClick={() => handleEdit(timetable)}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(timetable._id)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-4xl mb-4">📭</p>
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
