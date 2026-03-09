import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import * as announcementsService from "../../services/announcements";

const CreateAnnouncement = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General",
    isPinned: false,
  });

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  const categories = [
    "General",
    "Academic",
    "Event",
    "Holiday",
    "Important",
    "Urgent",
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await announcementsService.getAnnouncements({ limit: 100 });
      const myAnnouncements =
        data?.data?.filter((a) => a.createdBy?.id === user?.id) || [];
      setAnnouncements(myAnnouncements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await announcementsService.updateAnnouncement(editingId, {
          ...formData,
          createdBy: {
            id: user?.id,
            name: user?.firstName + " " + user?.lastName,
          },
        });
        setSuccess("✅ Announcement updated successfully!");
        setEditingId(null);
      } else {
        await announcementsService.createAnnouncement({
          ...formData,
          createdBy: {
            id: user?.id,
            name: user?.firstName + " " + user?.lastName,
          },
        });
        setSuccess("✅ Announcement published successfully!");
      }

      setFormData({
        title: "",
        description: "",
        category: "General",
        isPinned: false,
      });

      fetchAnnouncements();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save announcement");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      description: announcement.description,
      category: announcement.category,
      isPinned: announcement.isPinned || false,
    });
    setEditingId(announcement._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await announcementsService.deleteAnnouncement(id);
        setSuccess("✅ Announcement deleted successfully!");
        fetchAnnouncements();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError("Failed to delete announcement");
      }
    }
  };

  const handlePin = async (id, isPinned) => {
    try {
      if (isPinned) {
        await announcementsService.unpinAnnouncement(id);
      } else {
        await announcementsService.pinAnnouncement(id);
      }
      fetchAnnouncements();
    } catch (err) {
      setError("Failed to update announcement pin status");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      category: "General",
      isPinned: false,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📢 Create Announcement
        </h1>
        <p className="text-gray-600 mb-8">
          Create system-wide announcements for all students
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
              {editingId ? "✏️ Edit Announcement" : "➕ New Announcement"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Announcement title"
                  required
                  maxLength="150"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/150
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Announcement content"
                  required
                  rows="5"
                  maxLength="3000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/3000
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  name="isPinned"
                  checked={formData.isPinned}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label
                  htmlFor="isPinned"
                  className="text-sm font-medium text-gray-700"
                >
                  📌 Pin this announcement (show at top)
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {loading
                    ? "⏳ Publishing..."
                    : editingId
                      ? "✅ Update"
                      : "📢 Publish"}
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

          {/* Announcements List */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              📋 My Announcements
            </h2>

            {announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement._id}
                    className={`border-l-4 p-4 rounded ${
                      announcement.isPinned
                        ? "bg-yellow-50 border-yellow-500"
                        : "bg-purple-50 border-purple-500"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {announcement.title}
                          </h3>
                          {announcement.isPinned && (
                            <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-semibold">
                              📌 Pinned
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {announcement.description?.substring(0, 100)}...
                        </p>
                        <div className="flex gap-2 mt-2 text-xs">
                          <span className="px-2 py-1 bg-purple-200 text-purple-800 rounded">
                            {announcement.category}
                          </span>
                          <span className="text-gray-600">
                            {new Date(
                              announcement.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() =>
                            handlePin(announcement._id, announcement.isPinned)
                          }
                          className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                        >
                          {announcement.isPinned ? "📌" : "📍"}
                        </button>
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(announcement._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-4xl mb-4">📭</p>
                <p className="text-gray-600">
                  No announcements yet. Create one to get started!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAnnouncement;
