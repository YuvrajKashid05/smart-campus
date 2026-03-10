import { useContext, useState } from "react";
import { MdCheckCircle, MdError, MdQrCode2, MdTimer } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as attendanceService from "../../services/attendance";

const GenerateQRAttendance = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    course: "",
    dept: user?.dept || "",
    ttlMinutes: "10",
  });

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);

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
      const result = await attendanceService.startSession({
        course: formData.course,
        dept: formData.dept,
        ttlMinutes: parseInt(formData.ttlMinutes),
      });

      if (result.ok) {
        setSession(result.session);
        setSuccess(
          `QR session started! Token is valid for ${formData.ttlMinutes} minutes.`,
        );

        // Countdown
        let seconds = parseInt(formData.ttlMinutes) * 60;
        const interval = setInterval(() => {
          seconds--;
          setTimeLeft(seconds);
          if (seconds <= 0) {
            clearInterval(interval);
            setSession(null);
            setTimeLeft(null);
            setError("QR session expired. Generate a new one.");
          }
        }, 1000);
      } else {
        setError(result.error || "Failed to generate QR session");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate QR session");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (sec) => {
    if (sec == null) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <MdQrCode2 className="text-blue-500" /> Generate QR Attendance
        </h1>

        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4">
            <MdError className="text-red-500 shrink-0" size={20} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-4">
            <MdCheckCircle className="text-green-500 shrink-0" size={20} />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Session Details
            </h2>
            <form onSubmit={handleGenerateQR} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course / Subject Name *
                </label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  placeholder="e.g., Data Structures"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="dept"
                  value={formData.dept}
                  onChange={handleInputChange}
                  placeholder="e.g., CS"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Duration (minutes)
                </label>
                <select
                  name="ttlMinutes"
                  value={formData.ttlMinutes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <MdQrCode2 size={18} />
                {loading ? "Generating..." : "Generate QR Session"}
              </button>
            </form>
          </div>

          {/* QR Display */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
            {session ? (
              <>
                <div className="mb-4 p-6 bg-gray-100 rounded-lg w-full text-center">
                  <p className="text-xs text-gray-500 mb-2 font-medium">
                    QR TOKEN
                  </p>
                  <p className="font-mono text-sm break-all bg-white p-3 rounded border border-gray-300 select-all">
                    {session.qrToken}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Share this token with students
                  </p>
                </div>

                {timeLeft != null && (
                  <div className="text-center mb-4">
                    <div className="flex items-center gap-2 justify-center text-2xl font-bold text-blue-600">
                      <MdTimer size={28} />
                      {formatTime(timeLeft)}
                    </div>
                    <p className="text-sm text-gray-600">Time remaining</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4 w-full text-center text-sm">
                  <p className="font-semibold text-gray-900">
                    {session.course}
                  </p>
                  <p className="text-gray-600">
                    {session.dept} • Expires:{" "}
                    {new Date(session.expiresAt).toLocaleTimeString()}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center">
                <MdQrCode2 className="text-gray-300 mx-auto mb-4" size={80} />
                <p className="text-gray-600">
                  Fill the form and generate a QR session
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateQRAttendance;
