import { useEffect, useState } from "react";
import {
  MdCalendarMonth,
  MdClose,
  MdDescription,
  MdPerson,
} from "react-icons/md";
import * as noticesService from "../../services/notices";

const ViewNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const data = await noticesService.getNotices();
        setNotices(data?.notices || []);
      } catch (error) {
        console.error("Error fetching notices:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
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
          <MdDescription className="text-blue-500" /> Notices
        </h1>
        <p className="text-gray-600 mb-8">
          Important notices from faculty and administration
        </p>

        {notices.length > 0 ? (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice._id}
                onClick={() => setSelectedNotice(notice)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer border-l-4 border-blue-500 p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {notice.title}
                    </h3>
                    <p className="text-gray-700 text-sm mb-3">
                      {notice.body?.substring(0, 150)}...
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MdPerson size={14} />{" "}
                        {notice.createdBy?.name || "Faculty"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MdCalendarMonth size={14} />{" "}
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {notice.audience}
                      </span>
                    </div>
                  </div>
                  <span className="text-blue-600 ml-4">→</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-12 text-center">
            <MdDescription className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-lg text-gray-600">No notices available</p>
          </div>
        )}

        {/* Modal */}
        {selectedNotice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 pr-4">
                  {selectedNotice.title}
                </h2>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <MdClose size={24} />
                </button>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <MdPerson size={16} />{" "}
                  {selectedNotice.createdBy?.name || "Faculty"}
                </span>
                <span className="flex items-center gap-1">
                  <MdCalendarMonth size={16} />{" "}
                  {new Date(selectedNotice.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {selectedNotice.body}
              </p>
              <button
                onClick={() => setSelectedNotice(null)}
                className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
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

export default ViewNotices;
