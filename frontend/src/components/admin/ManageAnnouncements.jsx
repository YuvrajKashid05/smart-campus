import { useEffect, useState } from "react";
import * as announcementsService from "../../services/announcements";

const ManageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await announcementsService.getAnnouncements({ limit: 1000 });
      const sorted = (data?.data || []).sort((a, b) => {
        if (a.isPinned === b.isPinned) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return a.isPinned ? -1 : 1;
      });
      setAnnouncements(sorted);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch announcements");
      setLoading(false);
    }
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
      setSuccess(`✅ Announcement ${isPinned ? "unpinned" : "pinned"}!`);
      fetchAnnouncements();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update announcement pin status");
    }
  };

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase()),
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
          📢 Manage Announcements
        </h1>
        <p className="text-gray-600 mb-8">
          View and manage all announcements in the system
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
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-sm text-gray-600 mt-2">
            Found: {filteredAnnouncements.length} announcements
          </p>
        </div>

        {/* Announcements List */}
        {filteredAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement._id}
                className={`rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition ${
                  announcement.isPinned
                    ? "bg-yellow-50 border-yellow-500"
                    : "bg-purple-50 border-purple-500"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {announcement.title}
                      </h3>
                      {announcement.isPinned && (
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-semibold">
                          📌 Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mt-2">
                      {announcement.description?.substring(0, 150)}...
                    </p>
                    <div className="flex gap-4 mt-3 text-sm text-gray-600">
                      <span>
                        👤 By: {announcement.createdBy?.name || "Admin"}
                      </span>
                      <span>
                        📅{" "}
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-1 bg-purple-200 text-purple-800 rounded text-xs">
                        {announcement.category}
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
                      onClick={() =>
                        window.alert("View: " + announcement.title)
                      }
                      className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    >
                      👁️
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
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-4xl mb-4">📢</p>
            <p className="text-gray-600">No announcements found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAnnouncements;
