import { useEffect, useState } from "react";
import * as noticesService from "../../services/notices";

const ManageNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const data = await noticesService.getNotices({ limit: 1000 });
      setNotices(data?.data || []);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch notices");
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this notice?")) {
      try {
        await noticesService.deleteNotice(id);
        setSuccess("✅ Notice deleted successfully!");
        fetchNotices();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError("Failed to delete notice");
      }
    }
  };

  const filteredNotices = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📄 Manage Notices
        </h1>
        <p className="text-gray-600 mb-8">
          View and manage all notices in the system
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

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <input
            type="text"
            placeholder="Search notices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-sm text-gray-600 mt-2">
            Found: {filteredNotices.length} notices
          </p>
        </div>

        {/* Notices List */}
        {filteredNotices.length > 0 ? (
          <div className="space-y-4">
            {filteredNotices.map((notice) => (
              <div
                key={notice._id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {notice.title}
                    </h3>
                    <p className="text-gray-700 mt-2">
                      {notice.description?.substring(0, 150)}...
                    </p>
                    <div className="flex gap-4 mt-3 text-sm text-gray-600">
                      <span>👤 By: {notice.createdBy?.name || "Unknown"}</span>
                      <span>
                        📅 {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                      {notice.department && <span>🏢 {notice.department}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => window.alert("View: " + notice.title)}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={() => handleDelete(notice._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-4xl mb-4">📄</p>
            <p className="text-gray-600">No notices found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageNotices;
