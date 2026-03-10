import { useContext, useEffect, useState } from "react";
import { MdAdd, MdCampaign, MdDelete, MdEdit } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as announcementsService from "../../services/announcements";

const AUDIENCE_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "STUDENT", label: "Students Only" },
  { value: "FACULTY", label: "Faculty Only" },
];

const CreateAnnouncement = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    audience: "ALL",
  });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await announcementsService.getAnnouncements();
      const myAnns = (data?.announcements || []).filter(
        (a) => a.createdBy?._id === user?.id || a.createdBy?.id === user?.id,
      );
      setAnnouncements(myAnns);
    } catch (error) {
      console.error("Error fetching announcements:", error);
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
        await announcementsService.updateAnnouncement(editingId, formData);
        setSuccess("Announcement updated successfully!");
        setEditingId(null);
      } else {
        await announcementsService.createAnnouncement(formData);
        setSuccess("Announcement published successfully!");
      }
      setFormData({ title: "", message: "", audience: "ALL" });
      fetchAnnouncements();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save announcement");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ann) => {
    setFormData({
      title: ann.title,
      message: ann.message,
      audience: ann.audience,
    });
    setEditingId(ann._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this announcement?")) {
      try {
        await announcementsService.deleteAnnouncement(id);
        setSuccess("Announcement deleted!");
        fetchAnnouncements();
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
          <MdCampaign className="text-purple-500" /> Create Announcement
        </h1>
        <p className="text-gray-600 mb-8">
          Create announcements for students and faculty
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
          <div className="md:col-span-1 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              {editingId ? <MdEdit size={20} /> : <MdAdd size={20} />}
              {editingId ? "Edit Announcement" : "New Announcement"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title * ({formData.title.length}/150)
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message * ({formData.message.length}/3000)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Announcement content"
                  required
                  rows="5"
                  maxLength="3000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Audience
                </label>
                <select
                  name="audience"
                  value={formData.audience}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {AUDIENCE_OPTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {loading ? "Publishing..." : editingId ? "Update" : "Publish"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ title: "", message: "", audience: "ALL" });
                    }}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              My Announcements ({announcements.length})
            </h2>
            {announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div
                    key={ann._id}
                    className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {ann.title}
                        </h3>
                        <p className="text-sm text-gray-700 mt-1">
                          {ann.message?.substring(0, 100)}...
                        </p>
                        <div className="flex gap-2 mt-2 text-xs">
                          <span className="px-2 py-1 bg-purple-200 text-purple-800 rounded">
                            {ann.audience}
                          </span>
                          <span className="text-gray-600">
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(ann)}
                          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          <MdEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(ann._id)}
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MdCampaign className="text-gray-300 mx-auto mb-4" size={48} />
                <p className="text-gray-600">
                  No announcements yet. Create one!
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
