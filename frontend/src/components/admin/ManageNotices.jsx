import { useEffect, useState } from "react";
import {
  MdCalendarMonth,
  MdDelete,
  MdDescription,
  MdPerson,
  MdSearch,
} from "react-icons/md";
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
      const data = await noticesService.getNotices();
      setNotices(data?.notices || []);
    } catch {
      setError("Failed to fetch notices");
    } finally {
      setLoading(false);
    }
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

  const filteredNotices = notices.filter(
    (n) =>
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.body?.toLowerCase().includes(searchTerm.toLowerCase()),
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <MdDescription className="text-blue-500" /> Manage Notices
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

        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex items-center gap-2">
          <MdSearch size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search notices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span className="text-sm text-gray-600 whitespace-nowrap">
            Found: {filteredNotices.length}
          </span>
        </div>

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
                      {notice.body?.substring(0, 150)}...
                    </p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MdPerson size={14} />{" "}
                        {notice.createdBy?.name || "Unknown"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MdCalendarMonth size={14} />{" "}
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {notice.audience}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(notice._id)}
                    className="ml-4 p-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <MdDelete size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <MdDescription className="text-gray-300 mx-auto mb-4" size={48} />
            <p className="text-gray-600">No notices found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageNotices;
