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

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const startCamera = async () => {
    setError("");
    setSuccess("");

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

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

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
            stopCamera();

            let token = code.data;
            try {
              const parsed = JSON.parse(code.data);
              token = parsed.token || parsed.qrToken || code.data;
            } catch {
              // raw token
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

  useEffect(() => {
    return () => stopCamera();
  }, []);

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
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
            <MdQrCode2 className="text-blue-500" size={28} />
            Mark Attendance
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Scan the QR code shown by your teacher
          </p>
        </div>

        {loading && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm font-medium text-blue-800">
              Marking your attendance…
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
            <MdError className="mt-0.5 shrink-0 text-red-500" size={20} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 p-4">
            <MdCheckCircle className="shrink-0 text-green-500" size={24} />
            <p className="text-sm font-semibold text-green-800">{success}</p>
          </div>
        )}

        <div className="mb-5 overflow-hidden rounded-2xl bg-white shadow-lg">
          {!cameraActive ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                <MdCameraAlt className="text-blue-500" size={40} />
              </div>
              <p className="mb-1 font-semibold text-gray-800">
                Open Camera to Scan
              </p>
              <p className="mb-6 text-sm text-gray-500">
                The camera will automatically detect the QR code and mark your
                attendance instantly.
              </p>
              <button
                onClick={startCamera}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition hover:bg-blue-700 active:bg-blue-800"
              >
                <MdCameraAlt size={20} />
                Open Camera
              </button>
            </div>
          ) : (
            <div className="relative h-95 bg-black sm:h-105">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
              />

              {/* dark overlay */}
              <div className="absolute inset-0 bg-black/45" />

              {/* centered scan window */}
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <div className="relative h-55 w-55 sm:h-62.5 sm:w-62.5">
                  {/* outer dim using huge shadow */}
                  <div
                    className="absolute inset-0 rounded-2xl border border-white/20"
                    style={{
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.42)",
                    }}
                  />

                  {/* corner brackets */}
                  <div className="absolute left-0 top-0 h-10 w-10 rounded-tl-xl border-l-4 border-t-4 border-blue-400" />
                  <div className="absolute right-0 top-0 h-10 w-10 rounded-tr-xl border-r-4 border-t-4 border-blue-400" />
                  <div className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-xl border-b-4 border-l-4 border-blue-400" />
                  <div className="absolute bottom-0 right-0 h-10 w-10 rounded-br-xl border-b-4 border-r-4 border-blue-400" />

                  {/* scan line */}
                  <div className="absolute left-3 right-3 top-1/2 h-0.5 -translate-y-1/2 bg-linear-to-r from-transparent via-cyan-400 to-transparent animate-[scanline_2s_ease-in-out_infinite]" />
                </div>
              </div>

              {/* text */}
              <div className="absolute bottom-16 left-1/2 z-20 -translate-x-1/2">
                <span className="rounded-full bg-black/65 px-4 py-2 text-center text-sm text-white backdrop-blur-sm">
                  Align QR inside the box
                </span>
              </div>

              {/* stop button */}
              <button
                onClick={stopCamera}
                className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700"
              >
                <MdClose size={16} />
                Stop
              </button>
            </div>
          )}
        </div>

        <style>{`
          @keyframes scanline {
            0% {
              top: 12%;
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              top: 88%;
              opacity: 0;
            }
          }
        `}</style>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-300" />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Or enter token manually
          </span>
          <div className="h-px flex-1 bg-gray-300" />
        </div>

        <div className="mb-5 rounded-2xl bg-white p-6 shadow-lg">
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <textarea
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Paste the QR token from your teacher…"
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !qrInput.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              <MdCheckCircle size={18} />
              {loading ? "Processing…" : "Mark Attendance"}
            </button>
          </form>
        </div>

        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-blue-900">
            <MdInfo size={16} />
            How It Works
          </h3>
          <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
            <li>Teacher generates a QR code in class</li>
            <li>
              Tap <strong>Open Camera</strong>
            </li>
            <li>Keep the QR inside the scan box</li>
            <li>Attendance is marked automatically</li>
          </ol>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <MdWarning className="mt-0.5 shrink-0 text-yellow-600" size={18} />
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
