import { useContext, useEffect, useState } from "react";
import { MdAdd, MdDelete, MdDescription, MdEdit } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as noticesService from "../../services/notices";

const AUDIENCE_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "STUDENT", label: "Students Only" },
  { value: "FACULTY", label: "Faculty Only" },
];

const CreateNotice = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    audience: "ALL",
  });
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const data = await noticesService.getNotices();
      // Show only notices created by this user
      const myNotices = (data?.notices || []).filter(
        (n) => n.createdBy?._id === user?.id || n.createdBy?.id === user?.id,
      );
      setNotices(myNotices);
    } catch (error) {
      console.error("Error fetching notices:", error);
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
        await noticesService.updateNotice(editingId, formData);
        setSuccess("Notice updated successfully!");
        setEditingId(null);
      } else {
        await noticesService.createNotice(formData);
        setSuccess("Notice published successfully!");
      }
      setFormData({ title: "", body: "", audience: "ALL" });
      fetchNotices();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          JSON.stringify(err.response?.data?.error) ||
          "Failed to save notice",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (notice) => {
    setFormData({
      title: notice.title,
      body: notice.body,
      audience: notice.audience,
    });
    setEditingId(notice._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this notice?")) {
      try {
        await noticesService.deleteNotice(id);
        setSuccess("Notice deleted!");
        fetchNotices();
        setTimeout(() => setSuccess(""), 3000);
      } catch {
        setError("Failed to delete notice");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <MdDescription className="text-blue-500" /> Create Notice
        </h1>
        <p className="text-gray-600 mb-8">
          Create and manage notices for students
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
              {editingId ? "Edit Notice" : "New Notice"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title * ({formData.title.length}/100)
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Notice title"
                  required
                  maxLength="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content * ({formData.body.length}/2000)
                </label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  placeholder="Notice content"
                  required
                  rows="5"
                  maxLength="2000"
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
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {loading ? "Publishing..." : editingId ? "Update" : "Publish"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ title: "", body: "", audience: "ALL" });
                    }}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              My Notices ({notices.length})
            </h2>
            {notices.length > 0 ? (
              <div className="space-y-4">
                {notices.map((notice) => (
                  <div
                    key={notice._id}
                    className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {notice.title}
                        </h3>
                        <p className="text-sm text-gray-700 mt-1">
                          {notice.body?.substring(0, 100)}...
                        </p>
                        <div className="flex gap-2 mt-2 text-xs">
                          <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded">
                            {notice.audience}
                          </span>
                          <span className="text-gray-600">
                            {new Date(notice.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(notice)}
                          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          <MdEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(notice._id)}
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
                <MdDescription
                  className="text-gray-300 mx-auto mb-4"
                  size={48}
                />
                <p className="text-gray-600">
                  No notices yet. Create one to get started!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNotice;
