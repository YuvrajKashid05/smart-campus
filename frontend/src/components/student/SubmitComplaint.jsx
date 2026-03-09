import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import * as complaintsService from "../../services/complaints";

const SubmitComplaint = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Academic",
    priority: "Medium",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    "Academic",
    "Facilities",
    "Canteen",
    "Library",
    "Administrative",
    "Other",
  ];

  const priorities = ["Low", "Medium", "High"];

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
        ...formData,
        studentId: user?.id,
      });

      if (result.success || result._id) {
        setSuccess(
          "✅ Complaint submitted successfully! Your complaint ID: " +
            (result._id || "Submitted"),
        );
        setSubmitted(true);
        setFormData({
          title: "",
          description: "",
          category: "Academic",
          priority: "Medium",
        });
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          💬 Submit a Complaint
        </h1>
        <p className="text-gray-600 mb-8">
          Please let us know if you have any concerns. We're here to help!
        </p>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {submitted && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              📝 Your complaint has been recorded. You can track it using your
              complaint ID.
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-8 space-y-6"
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complaint Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Brief title of your complaint"
              required
              maxLength="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Category */}
          <div className="grid md:grid-cols-2 gap-6">
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
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {priorities.map((pri) => (
                  <option key={pri} value={pri}>
                    {pri}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Please provide detailed information about your complaint..."
              required
              rows="6"
              maxLength="1000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/1000 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 transition"
          >
            {loading ? "⏳ Submitting..." : "💬 Submit Complaint"}
          </button>
        </form>

        {/* Important Info */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-3">
            📌 Important Information
          </h3>
          <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
            <li>
              All complaints are confidential and will be reviewed by the
              administration
            </li>
            <li>You can track your complaint status using your complaint ID</li>
            <li>We aim to resolve complaints within 7 working days</li>
            <li>
              Please provide as much detail as possible for faster resolution
            </li>
            <li>
              False or abusive complaints may result in disciplinary action
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">📞 Need Help?</h3>
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
