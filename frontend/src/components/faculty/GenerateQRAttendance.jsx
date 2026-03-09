import { useState } from "react";
import * as attendanceService from "../../services/attendance";

const GenerateQRAttendance = () => {
  const [formData, setFormData] = useState({
    subjectCode: "",
    subjectName: "",
    section: "",
    semester: "",
    department: "",
  });

  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateQR = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await attendanceService.generateQRToken({
        ...formData,
        expiryTime: 15,
      });

      if (result.token) {
        setQrData(
          JSON.stringify({
            token: result.token,
            subject: formData.subjectCode,
            subjectName: formData.subjectName,
            section: formData.section,
          }),
        );

        let seconds = 900;
        const interval = setInterval(() => {
          seconds--;
          setTimeRemaining(Math.floor(seconds / 60));
          if (seconds <= 0) {
            clearInterval(interval);
            setQrData(null);
            setError("QR code expired!");
          }
        }, 1000);

        setSuccess("✅ QR code generated! Valid for 15 minutes.");
      }
    } catch (err) {
      setError("Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          📱 Generate QR Code
        </h1>

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

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Class Details
            </h2>

            <form onSubmit={handleGenerateQR} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Code *
                </label>
                <input
                  type="text"
                  name="subjectCode"
                  value={formData.subjectCode}
                  onChange={handleInputChange}
                  placeholder="e.g., CS101"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  name="subjectName"
                  value={formData.subjectName}
                  onChange={handleInputChange}
                  placeholder="e.g., Data Structures"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    placeholder="e.g., A"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g., Computer Science"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "⏳ Generating..." : "📱 Generate QR Code"}
              </button>
            </form>
          </div>

          {/* QR Display */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
            {qrData ? (
              <>
                <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                  <p className="text-center font-mono text-sm break-all">
                    {qrData}
                  </p>
                </div>

                {timeRemaining && (
                  <div className="text-center mb-6">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.floor(timeRemaining / 60)}:
                      {(timeRemaining % 60).toString().padStart(2, "0")}
                    </p>
                    <p className="text-sm text-gray-600">Expires in</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4 w-full text-center">
                  <p className="font-semibold text-gray-900">
                    {formData.subjectCode} - {formData.subjectName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Section {formData.section} | Semester {formData.semester}
                  </p>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Share this QR code data with students to mark attendance
                </p>
              </>
            ) : (
              <div className="text-center">
                <p className="text-4xl mb-4">📱</p>
                <p className="text-gray-600">Fill form and generate QR code</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateQRAttendance;
