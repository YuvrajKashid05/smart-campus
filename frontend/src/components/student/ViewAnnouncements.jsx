import { useEffect, useState } from "react";
import * as announcementsService from "../../services/announcements";

const ViewAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await announcementsService.getAnnouncements({
          limit: 100,
        });
        const sorted = (data?.data || []).sort((a, b) => {
          if (a.isPinned === b.isPinned) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return a.isPinned ? -1 : 1;
        });
        setAnnouncements(sorted);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📢 Announcements
        </h1>
        <p className="text-gray-600 mb-8">
          Stay updated with the latest announcements
        </p>

        {/* Announcements List */}
        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement._id}
                className={`rounded-lg shadow-md hover:shadow-lg transition cursor-pointer ${
                  announcement.isPinned
                    ? "bg-yellow-50 border-l-4 border-yellow-500"
                    : "bg-white border-l-4 border-purple-500"
                }`}
              >
                <div
                  onClick={() => setSelectedAnnouncement(announcement)}
                  className="p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {announcement.title}
                        </h3>
                        {announcement.isPinned && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                            📌 Pinned
                          </span>
                        )}
                      </div>

                      <p className="text-gray-700 text-sm mb-3">
                        {announcement.description?.substring(0, 150)}...
                      </p>

                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>
                          👤 By {announcement.createdBy?.name || "Admin"}
                        </span>
                        <span>
                          📅{" "}
                          {new Date(
                            announcement.createdAt,
                          ).toLocaleDateString()}
                        </span>
                        {announcement.category && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                            {announcement.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="text-purple-600 hover:text-purple-800 ml-4">
                      →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-12 text-center">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-lg text-gray-600">No announcements yet</p>
          </div>
        )}

        {/* Announcement Detail Modal */}
        {selectedAnnouncement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto p-8">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedAnnouncement.title}
                  </h2>
                  {selectedAnnouncement.isPinned && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                      📌 Pinned
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>
                    👤 {selectedAnnouncement.createdBy?.name || "Admin"}
                  </span>
                  <span>
                    📅{" "}
                    {new Date(selectedAnnouncement.createdAt).toLocaleString()}
                  </span>
                  {selectedAnnouncement.category && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                      {selectedAnnouncement.category}
                    </span>
                  )}
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedAnnouncement.description}
                  </p>
                </div>

                {selectedAnnouncement.attachments &&
                  selectedAnnouncement.attachments.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Attachments
                      </h4>
                      <div className="space-y-2">
                        {selectedAnnouncement.attachments.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            📎 {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="mt-6 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewAnnouncements;
