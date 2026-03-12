import { useEffect, useRef, useState } from "react";
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
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const startCamera = async () => {
    setError("");
    setDetected(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setScanning(true);
        }
      }, 150);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError(
          "Camera permission denied. Please allow camera access in your browser settings.",
        );
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Unable to access camera: " + err.message);
      }
    }
  };

  const stopCamera = () => {
    setScanning(false);
    setCameraActive(false);
    setDetected(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Auto-scan loop — marks attendance automatically on detection
  useEffect(() => {
    if (!scanning) return;
    let active = true;

    const runScan = async () => {
      try {
        const jsQR = (await import("jsqr")).default;
        const tick = () => {
          if (!active) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (
            !video ||
            !canvas ||
            video.readyState < video.HAVE_ENOUGH_DATA ||
            video.videoWidth === 0
          ) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (code?.data) {
            active = false;
            setDetected(true);
            stopCamera();
            let token = code.data;
            try {
              const parsed = JSON.parse(code.data);
              token = parsed.token || parsed.qrToken || code.data;
            } catch {
              /* raw token */
            }
            handleMarkAttendance(token);
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        setError("QR scanner failed to load. Use manual token entry below.");
        stopCamera();
      }
    };
    runScan();
    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scanning]);

  useEffect(() => () => stopCamera(), []);

  const handleMarkAttendance = async (token) => {
    if (!token?.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await attendanceService.markAttendance(token.trim());
      if (result.ok) {
        setSuccess(
          result.alreadyMarked
            ? "Attendance already marked for this session."
            : "✅ Attendance marked successfully!",
        );
        setQrInput("");
      } else {
        setError(result.error || "Failed to mark attendance.");
      }
    } catch (err) {
      setError(
        err.response?.data?.error || "Invalid QR token or session expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    try {
      const parsed = JSON.parse(qrInput);
      handleMarkAttendance(parsed.token || parsed.qrToken || qrInput);
    } catch {
      handleMarkAttendance(qrInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <MdQrCode2 className="text-blue-500" size={28} /> Mark Attendance
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Scan the QR code shown by your teacher
          </p>
        </div>

        {/* Status messages */}
        {loading && (
          <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-sm text-blue-800 font-medium">
              Marking your attendance…
            </p>
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
            <MdError className="text-red-500 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-300 rounded-xl p-4">
            <MdCheckCircle className="text-green-500 shrink-0" size={24} />
            <p className="text-sm text-green-800 font-semibold">{success}</p>
          </div>
        )}

        {/* Camera card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-5">
          {!cameraActive ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdCameraAlt className="text-blue-500" size={40} />
              </div>
              <p className="font-semibold text-gray-800 mb-1">
                Open Camera to Scan
              </p>
              <p className="text-gray-500 text-sm mb-6">
                The camera will automatically detect the QR code and mark your
                attendance instantly.
              </p>
              <button
                onClick={startCamera}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition font-semibold text-base"
              >
                <MdCameraAlt size={20} /> Open Camera
              </button>
            </div>
          ) : (
            <div className="relative bg-black" style={{ height: "380px" }}>
              {/* Live video feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              {/* Dark overlay with transparent center cutout using SVG mask */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `
                    linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6))
                  `,
                  WebkitMaskImage: `
                    radial-gradient(ellipse 200px 200px at 50% 46%, transparent 99%, black 100%)
                  `,
                  maskImage: `
                    radial-gradient(ellipse 200px 200px at 50% 46%, transparent 99%, black 100%)
                  `,
                }}
              />

              {/* Scan box border */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -54%)",
                  width: "220px",
                  height: "220px",
                }}
              >
                {/* Corner brackets */}
                {[
                  {
                    top: 0,
                    left: 0,
                    borderTop: "4px solid #60a5fa",
                    borderLeft: "4px solid #60a5fa",
                    borderRadius: "4px 0 0 0",
                  },
                  {
                    top: 0,
                    right: 0,
                    borderTop: "4px solid #60a5fa",
                    borderRight: "4px solid #60a5fa",
                    borderRadius: "0 4px 0 0",
                  },
                  {
                    bottom: 0,
                    left: 0,
                    borderBottom: "4px solid #60a5fa",
                    borderLeft: "4px solid #60a5fa",
                    borderRadius: "0 0 0 4px",
                  },
                  {
                    bottom: 0,
                    right: 0,
                    borderBottom: "4px solid #60a5fa",
                    borderRight: "4px solid #60a5fa",
                    borderRadius: "0 0 4px 0",
                  },
                ].map((style, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      width: "28px",
                      height: "28px",
                      ...style,
                    }}
                  />
                ))}

                {/* Animated scan line */}
                <div
                  style={{
                    position: "absolute",
                    left: "8px",
                    right: "8px",
                    height: "2px",
                    background:
                      "linear-gradient(90deg, transparent, #60a5fa, transparent)",
                    animation: "scanline 1.8s ease-in-out infinite",
                    top: "50%",
                  }}
                />
              </div>

              {/* Label */}
              <div
                style={{
                  position: "absolute",
                  bottom: "52px",
                  left: 0,
                  right: 0,
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    background: "rgba(0,0,0,0.55)",
                    color: "white",
                    fontSize: "13px",
                    padding: "4px 14px",
                    borderRadius: "20px",
                  }}
                >
                  Point at QR code — auto-marks on detect
                </span>
              </div>

              {/* Close button */}
              <button
                onClick={stopCamera}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "rgba(220,38,38,0.85)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                <MdClose size={16} /> Stop
              </button>
            </div>
          )}
        </div>

        {/* Scan line animation */}
        <style>{`
          @keyframes scanline {
            0%   { top: 10%; opacity: 0; }
            10%  { opacity: 1; }
            90%  { opacity: 1; }
            100% { top: 90%; opacity: 0; }
          }
        `}</style>

        {/* Hidden canvas for jsQR */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
            Or enter token manually
          </span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Manual Entry */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <textarea
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Paste the QR token from your teacher…"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm resize-none"
            />
            <button
              type="submit"
              disabled={loading || !qrInput.trim()}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition"
            >
              <MdCheckCircle size={18} />
              {loading ? "Processing…" : "Mark Attendance"}
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-1 text-sm">
            <MdInfo size={16} /> How It Works
          </h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Teacher generates a QR code in class</li>
            <li>
              Tap <strong>Open Camera</strong> and point at the QR code
            </li>
            <li>
              Attendance is marked <strong>automatically</strong> — no button
              needed
            </li>
            <li>Or paste the token manually if camera isn't available</li>
          </ol>
        </div>

        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <MdWarning className="text-yellow-600 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> QR tokens expire when the session ends. Mark
            attendance promptly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
