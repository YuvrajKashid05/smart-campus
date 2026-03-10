import { useEffect, useState } from "react";
import { MdCalendarMonth, MdCampaign, MdClose, MdPerson } from "react-icons/md";
import * as announcementsService from "../../services/announcements";

const ViewAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await announcementsService.getAnnouncements();
        setAnnouncements(data?.announcements || []);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <MdCampaign className="text-purple-500" /> Announcements
        </h1>
        <p className="text-gray-600 mb-8">
          Stay updated with the latest announcements
        </p>

        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div
                key={ann._id}
                onClick={() => setSelected(ann)}
                className="rounded-lg shadow-md hover:shadow-lg transition cursor-pointer border-l-4 border-purple-500 bg-white p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {ann.title}
                    </h3>
                    <p className="text-gray-700 text-sm mb-3">
                      {ann.message?.substring(0, 150)}...
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MdPerson size={14} /> {ann.createdBy?.name || "Admin"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MdCalendarMonth size={14} />{" "}
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {ann.audience}
                      </span>
                    </div>
                  </div>
                  <span className="text-purple-600 ml-4">→</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-12 text-center">
            <MdCampaign className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-lg text-gray-600">No announcements yet</p>
          </div>
        )}

        {/* Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 pr-4">
                  {selected.title}
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <MdClose size={24} />
                </button>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <MdPerson size={16} /> {selected.createdBy?.name || "Admin"}
                </span>
                <span className="flex items-center gap-1">
                  <MdCalendarMonth size={16} />{" "}
                  {new Date(selected.createdAt).toLocaleString()}
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                  {selected.audience}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {selected.message}
              </p>
              <button
                onClick={() => setSelected(null)}
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
