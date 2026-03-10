import { useContext, useState } from "react";
import {
  MdCheckCircle,
  MdError,
  MdInfo,
  MdMessage,
  MdSend,
  MdWarning,
} from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as complaintsService from "../../services/complaints";

// Backend enum: "IT" | "FACILITY" | "ACADEMIC" | "OTHER"
const CATEGORIES = [
  { label: "Academic", value: "ACADEMIC" },
  { label: "IT / Technical", value: "IT" },
  { label: "Facility", value: "FACILITY" },
  { label: "Other", value: "OTHER" },
];

const SubmitComplaint = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    category: "ACADEMIC",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await complaintsService.submitComplaint({
        category: formData.category,
        message: formData.message,
      });

      if (result.ok) {
        setSuccess(
          "Complaint submitted successfully! Complaint ID: " +
            result.complaint._id,
        );
        setFormData({ category: "ACADEMIC", message: "" });
      } else {
        setError(result.error || "Failed to submit complaint");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <MdMessage className="text-blue-500" /> Submit a Complaint
        </h1>
        <p className="text-gray-600 mb-8">
          Please let us know if you have any concerns.
        </p>

        {success && (
          <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-4">
            <MdCheckCircle className="text-green-500 shrink-0" size={20} />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4">
            <MdError className="text-red-500 shrink-0" size={20} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description * ({formData.message.length}/1000)
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Please provide detailed information about your complaint..."
              required
              rows="6"
              maxLength="1000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-blue-800 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 transition"
          >
            <MdSend size={18} />
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
            <MdWarning size={18} /> Important Information
          </h3>
          <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
            <li>
              All complaints are confidential and reviewed by administration
            </li>
            <li>We aim to resolve complaints within 7 working days</li>
            <li>
              Please provide as much detail as possible for faster resolution
            </li>
          </ul>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <MdInfo size={18} /> Need Help?
          </h3>
          <p className="text-sm text-blue-800">
            If your issue is urgent, please contact the administration office
            directly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubmitComplaint;
