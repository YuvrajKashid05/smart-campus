import { useRef, useState } from "react";
import {
  MdCameraAlt,
  MdCheckCircle,
  MdClose,
  MdError,
  MdInfo,
  MdQrCode2,
  MdWarning,
} from "react-icons/md";
import * as attendanceService from "../../services/attendance";

const MarkAttendance = () => {
  const [qrInput, setQrInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef(null);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowScanner(true);
      }
    } catch {
      setError("Unable to access camera. Please allow camera permissions.");
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      setShowScanner(false);
    }
  };

  const handleMarkAttendance = async (token) => {
    if (!token?.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await attendanceService.markAttendance(token.trim());
      if (result.ok) {
        if (result.alreadyMarked) {
          setSuccess("Attendance already marked for this session.");
        } else {
          setSuccess("Attendance marked successfully!");
        }
        setQrInput("");
        stopScanner();
      } else {
        setError(result.error || "Failed to mark attendance");
      }
    } catch (err) {
      setError(
        err.response?.data?.error || "Invalid QR token or session expired",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (qrInput.trim()) {
      // Try to parse JSON (in case it's the full QR data), otherwise use raw token
      try {
        const qrData = JSON.parse(qrInput);
        handleMarkAttendance(qrData.token || qrInput);
      } catch {
        handleMarkAttendance(qrInput.trim());
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <MdQrCode2 className="text-blue-500" /> Mark Your Attendance
          </h1>
          <p className="text-gray-600 mb-8">
            Scan the QR code provided by your teacher to mark attendance
          </p>

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

          <div className="space-y-6">
            {!showScanner ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
                <MdCameraAlt className="text-blue-400 mx-auto mb-4" size={52} />
                <p className="text-gray-700 mb-4">
                  Click below to start scanning QR code with your camera
                </p>
                <button
                  onClick={startScanner}
                  className="flex items-center gap-2 mx-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition mb-3"
                >
                  <MdCameraAlt size={18} /> Start Camera
                </button>
                <p className="text-sm text-gray-600">
                  Or manually enter QR token below
                </p>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-80 object-cover"
                />
                <div className="bg-black p-4">
                  <button
                    onClick={stopScanner}
                    className="flex items-center gap-2 mx-auto bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
                  >
                    <MdClose size={18} /> Stop Scanner
                  </button>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Manual QR Token Entry
              </h3>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Token
                  </label>
                  <textarea
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Paste QR token here..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !qrInput.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-green-600 to-green-800 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-green-900 disabled:opacity-50 transition"
                >
                  <MdCheckCircle size={18} />
                  {loading ? "Processing..." : "Mark Attendance"}
                </button>
              </form>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <MdInfo size={18} /> Instructions
            </h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Your teacher will generate and display a QR code in class</li>
              <li>Click "Start Camera" to scan the QR code</li>
              <li>Or paste the QR token in the text box above</li>
              <li>Your attendance will be marked automatically</li>
            </ol>
          </div>

          <div className="mt-4 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <MdWarning className="text-yellow-600 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Important:</span> QR tokens expire
              after the session ends. Mark attendance promptly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
