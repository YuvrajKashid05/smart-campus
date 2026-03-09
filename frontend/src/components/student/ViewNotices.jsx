import { useEffect, useState } from "react";
import * as noticesService from "../../services/notices";

const ViewNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [filterDept, setFilterDept] = useState("All");

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const data = await noticesService.getNotices({ limit: 100 });
        setNotices(data?.data || []);
      } catch (error) {
        console.error("Error fetching notices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const departments = [
    "All",
    ...new Set(notices.map((n) => n.department).filter(Boolean)),
  ];
  const filteredNotices =
    filterDept === "All"
      ? notices
      : notices.filter((n) => n.department === filterDept);

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📄 Notices</h1>
        <p className="text-gray-600 mb-8">
          Important notices from faculty and administration
        </p>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Department
          </label>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Notices List */}
        {filteredNotices.length > 0 ? (
          <div className="space-y-4">
            {filteredNotices.map((notice) => (
              <div
                key={notice._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <div
                  onClick={() => setSelectedNotice(notice)}
                  className="p-6 border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {notice.title}
                      </h3>
                      <p className="text-gray-700 text-sm mb-3">
                        {notice.description?.substring(0, 150)}...
                      </p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>👤 By {notice.createdBy?.name || "Faculty"}</span>
                        <span>
                          📅 {new Date(notice.createdAt).toLocaleDateString()}
                        </span>
                        {notice.department && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {notice.department}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 ml-4">
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
            <p className="text-lg text-gray-600">No notices available</p>
          </div>
        )}

        {/* Selected Notice Modal */}
        {selectedNotice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto p-8">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedNotice.title}
                </h2>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>👤 {selectedNotice.createdBy?.name || "Faculty"}</span>
                  <span>
                    📅 {new Date(selectedNotice.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedNotice.description}
                  </p>
                </div>

                {selectedNotice.attachments &&
                  selectedNotice.attachments.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Attachments
                      </h4>
                      <div className="space-y-2">
                        {selectedNotice.attachments.map((file, idx) => (
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
