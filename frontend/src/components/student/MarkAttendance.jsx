import { useContext, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import * as attendanceService from "../../services/attendance";

const MarkAttendance = () => {
  const [qrInput, setQrInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [markedAttendance, setMarkedAttendance] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { user } = useContext(AuthContext);

  // Initialize camera for QR scanning
  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowScanner(true);
      }
    } catch (err) {
      setError("Unable to access camera. Please allow camera permissions.");
    }
  };

  // Stop camera
  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      setShowScanner(false);
    }
  };

  // Capture frame and scan for QR code
  const captureFrame = async () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext("2d");
      context.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );

      // Use jsQR to decode QR code
      const imageData = context.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );
      // QR code scanning logic - you'll need to install jsqr library
      // For now, we'll use text input as fallback
    }
  };

  // Process QR token manually
  const handleProcessQR = async (token) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await attendanceService.verifyQRToken(token);

      if (result.success) {
        // Mark attendance
        const markResult = await attendanceService.markAttendance({
          qrToken: token,
          studentId: user.id,
          markedAt: new Date(),
        });

        setMarkedAttendance({
          subject: result.subject,
          subjectName: result.subjectName,
          section: result.section,
          markedAt: new Date().toLocaleString(),
          status: "marked",
        });

        setSuccess(`✅ Attendance marked for ${result.subjectName}`);
        setQrInput("");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid QR code or token expired",
      );
      setMarkedAttendance(null);
    } finally {
      setLoading(false);
      stopScanner();
    }
  };

  const handleManualQRSubmit = (e) => {
    e.preventDefault();
    if (qrInput.trim()) {
      try {
        const qrData = JSON.parse(qrInput);
        handleProcessQR(qrData.token);
      } catch {
        // If not JSON, assume it's just the token
        handleProcessQR(qrInput);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📱 Mark Your Attendance
          </h1>
          <p className="text-gray-600 mb-8">
            Scan the QR code provided by your teacher to mark attendance
          </p>

          {/* Alert Messages */}
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

          {/* Scanner/Form Section */}
          <div className="space-y-6">
            {/* Camera Scanner */}
            {!showScanner ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
                <p className="text-5xl mb-4">📷</p>
                <p className="text-gray-700 mb-4">
                  Click below to start scanning QR code with your phone camera
                </p>
                <button
                  onClick={startScanner}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition mb-4"
                >
                  📱 Start Camera
                </button>
                <p className="text-sm text-gray-600">
                  Or manually enter QR code below
                </p>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-80 object-cover"
                  onLoadedMetadata={() => {
                    // Start scanning
                    const interval = setInterval(captureFrame, 500);
                    return () => clearInterval(interval);
                  }}
                />
                <canvas
                  ref={canvasRef}
                  style={{ display: "none" }}
                  width={640}
                  height={480}
                />
                <div className="bg-black p-4 flex gap-2">
                  <button
                    onClick={stopScanner}
                    className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                  >
                    ❌ Stop Scanner
                  </button>
                </div>
              </div>
            )}

            {/* Manual QR Input */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Manual QR Code Entry
              </h3>
              <form onSubmit={handleManualQRSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Token / Code
                  </label>
                  <textarea
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Paste QR code data or token here..."
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !qrInput.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-green-800 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-green-900 disabled:opacity-50 transition"
                >
                  {loading ? "⏳ Processing..." : "✅ Mark Attendance"}
                </button>
              </form>
            </div>

            {/* Marked Attendance Display */}
            {markedAttendance && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">
                  ✅ Attendance Marked Successfully
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-semibold">Subject:</span>{" "}
                    {markedAttendance.subjectName} ({markedAttendance.subject})
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Section:</span>{" "}
                    {markedAttendance.section}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Marked At:</span>{" "}
                    {markedAttendance.markedAt}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">
              📋 Instructions
            </h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Your teacher will generate and display a QR code in class</li>
              <li>Click "Start Camera" to scan the QR code with your phone</li>
              <li>
                Point your camera at the QR code displayed by your teacher
              </li>
              <li>Wait for the system to process the QR code</li>
              <li>
                Your attendance will be marked automatically for that subject
              </li>
              <li>You'll receive a confirmation message once marked</li>
            </ol>
          </div>

          {/* Important Notes */}
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">⚠️ Important:</span> QR codes are
              valid for 15 minutes only. Make sure you mark attendance within
              the time limit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
