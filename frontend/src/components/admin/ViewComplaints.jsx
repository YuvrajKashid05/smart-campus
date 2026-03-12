import { useEffect, useState } from "react";
import {
  MdCalendarMonth,
  MdCheckCircle,
  MdMessage,
  MdPerson,
  MdRefresh,
} from "react-icons/md";
import * as complaintsService from "../../services/complaints";

const STATUS_STYLES = {
  OPEN: "bg-yellow-100 text-yellow-800 border-yellow-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-300",
  CLOSED: "bg-green-100 text-green-800 border-green-300",
};

const BORDER_COLORS = {
  OPEN: "border-yellow-400",
  IN_PROGRESS: "border-blue-400",
  CLOSED: "border-green-400",
};

const ViewComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await complaintsService.getComplaints();
      setComplaints(data?.complaints || []);
    } catch {
      setError("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await complaintsService.updateComplaintStatus(id, newStatus);
      setComplaints((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c)),
      );
      setSuccess(`Status updated to ${newStatus}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to update status");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = complaints.filter((c) => {
    const matchCat = filterCategory === "ALL" || c.category === filterCategory;
    const matchStatus = filterStatus === "ALL" || c.status === filterStatus;
    return matchCat && matchStatus;
  });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MdMessage className="text-red-500" /> View Complaints
          </h1>
          <button
            onClick={fetchComplaints}
            className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            <MdRefresh size={18} /> Refresh
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Review and manage student complaints
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
            {success}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Category:
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">All</option>
              <option value="IT">IT</option>
              <option value="FACILITY">Facility</option>
              <option value="ACADEMIC">Academic</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">All</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <span className="text-sm text-gray-500 ml-auto">
            Showing {filtered.length} of {complaints.length}
          </span>
        </div>

        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((complaint) => (
              <div
                key={complaint._id}
                className={`bg-white rounded-lg shadow p-5 border-l-4 hover:shadow-md transition ${BORDER_COLORS[complaint.status] || "border-gray-400"}`}
              >
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                      {complaint.category}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold border ${STATUS_STYLES[complaint.status] || "bg-gray-100 text-gray-800"}`}
                    >
                      {complaint.status || "OPEN"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MdCalendarMonth size={14} />
                    {new Date(complaint.createdAt).toLocaleString()}
                  </div>
                </div>

                <p className="text-gray-800 my-3">{complaint.message}</p>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MdPerson size={16} />
                    <span className="font-medium">
                      {complaint.createdBy?.name || "Unknown"}
                    </span>
                    {complaint.createdBy?.role && (
                      <span className="text-gray-400">
                        ({complaint.createdBy.role})
                      </span>
                    )}
                    {complaint.createdBy?.dept && (
                      <span className="text-gray-400">
                        • {complaint.createdBy.dept}
                      </span>
                    )}
                    {complaint.createdBy?.rollNo && (
                      <span className="text-gray-400">
                        • {complaint.createdBy.rollNo}
                      </span>
                    )}
                  </div>

                  {/* Status update */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Update status:
                    </span>
                    <select
                      value={complaint.status || "OPEN"}
                      disabled={updatingId === complaint._id}
                      onChange={(e) =>
                        handleStatusChange(complaint._id, e.target.value)
                      }
                      className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    {updatingId === complaint._id && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <MdCheckCircle className="text-green-300 mx-auto mb-4" size={48} />
            <p className="text-gray-600">No complaints found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewComplaints;
