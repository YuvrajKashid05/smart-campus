import { useEffect, useState } from "react";
import * as complaintsService from "../../services/complaints";

const ViewComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyText, setReplyText] = useState("");

  const statuses = ["All", "Pending", "In Progress", "Resolved", "Closed"];

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const data = await complaintsService.getComplaints({ limit: 1000 });
      setComplaints(data?.data || []);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch complaints");
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await complaintsService.updateComplaintStatus(id, newStatus);
      setSuccess(`✅ Complaint status updated to ${newStatus}!`);
      fetchComplaints();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update complaint status");
    }
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;

    try {
      await complaintsService.replyToComplaint(id, replyText);
      setSuccess("✅ Reply sent!");
      setReplyText("");
      fetchComplaints();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to send reply");
    }
  };

  const filteredComplaints =
    filterStatus === "All"
      ? complaints
      : complaints.filter((c) => c.status === filterStatus);

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
          💬 View Complaints
        </h1>
        <p className="text-gray-600 mb-8">
          Manage student complaints and provide resolutions
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

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-600 mt-2">
            Total: {filteredComplaints.length} complaints
          </p>
        </div>

        {/* Complaints Grid */}
        {filteredComplaints.length > 0 ? (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint._id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {complaint.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      By: {complaint.studentId?.firstName}{" "}
                      {complaint.studentId?.lastName}(
                      {complaint.studentId?.email})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        complaint.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : complaint.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : complaint.status === "Resolved"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {complaint.status}
                    </span>
                    <span
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        complaint.priority === "High"
                          ? "bg-red-100 text-red-800"
                          : complaint.priority === "Medium"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {complaint.priority}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{complaint.description}</p>

                <div className="flex gap-4 mb-4 text-sm text-gray-600">
                  <span>📁 Category: {complaint.category}</span>
                  <span>
                    📅 {new Date(complaint.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                  <select
                    value={complaint.status}
                    onChange={(e) =>
                      handleStatusChange(complaint._id, e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    {statuses.slice(1).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() =>
                      setSelectedComplaint(
                        selectedComplaint?._id === complaint._id
                          ? null
                          : complaint,
                      )
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    {selectedComplaint?._id === complaint._id
                      ? "✕ Close"
                      : "📝 Reply"}
                  </button>
                </div>

                {/* Reply Section */}
                {selectedComplaint?._id === complaint._id && (
                  <div className="bg-gray-50 rounded-lg p-4 border-t">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Send Reply
                      </label>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your response..."
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <button
                      onClick={() => handleReply(complaint._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      ✉️ Send Reply
                    </button>
                  </div>
                )}

                {/* Previous Replies */}
                {complaint.replies && complaint.replies.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Replies:
                    </p>
                    <div className="space-y-2">
                      {complaint.replies.map((reply, idx) => (
                        <div
                          key={idx}
                          className="bg-blue-50 p-3 rounded text-sm"
                        >
                          <p className="font-semibold">{reply.by || "Admin"}</p>
                          <p className="text-gray-700">{reply.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(reply.sentAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-4xl mb-4">💬</p>
            <p className="text-gray-600">No complaints found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewComplaints;
