import { useEffect, useState } from "react";
import {
  MdCalendarMonth,
  MdCampaign,
  MdDelete,
  MdPerson,
  MdSearch,
} from "react-icons/md";
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
      const data = await announcementsService.getAnnouncements();
      setAnnouncements(data?.announcements || []);
    } catch {
      setError("Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this announcement?")) {
      try {
        await announcementsService.deleteAnnouncement(id);
        setSuccess("Announcement deleted!");
        fetchAnnouncements();
        setTimeout(() => setSuccess(""), 3000);
      } catch {
        setError("Failed to delete announcement");
      }
    }
  };

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.message?.toLowerCase().includes(searchTerm.toLowerCase()),
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
          <MdCampaign className="text-purple-500" /> Manage Announcements
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

        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex items-center gap-2">
          <MdSearch size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span className="text-sm text-gray-600 whitespace-nowrap">
            Found: {filteredAnnouncements.length}
          </span>
        </div>

        {filteredAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {filteredAnnouncements.map((ann) => (
              <div
                key={ann._id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ann.title}
                    </h3>
                    <p className="text-gray-700 mt-2">
                      {ann.message?.substring(0, 150)}...
                    </p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MdPerson size={14} /> {ann.createdBy?.name || "Admin"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MdCalendarMonth size={14} />{" "}
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        {ann.audience}
                      </span>
                      {ann.dept !== "ALL" && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {ann.dept}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(ann._id)}
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
            <MdCampaign className="text-gray-300 mx-auto mb-4" size={48} />
            <p className="text-gray-600">No announcements found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAnnouncements;
