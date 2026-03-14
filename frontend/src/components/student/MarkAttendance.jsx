import { useEffect, useRef, useState } from "react";
import {
  MdCameraAlt,
  MdCheckCircle,
  MdClose,
  MdInfo,
  MdQrCode2,
  MdWarning,
} from "react-icons/md";
import * as attendanceService from "../../services/attendance";
import { Alert, PAGE } from "../../ui";

export default function MarkAttendance() {
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
      if (err.name === "NotAllowedError")
        setError(
          "Camera permission denied. Allow camera access in browser settings.",
        );
      else if (err.name === "NotFoundError")
        setError("No camera found on this device.");
      else setError("Unable to access camera: " + err.message);
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
    if (videoRef.current) videoRef.current.srcObject = null;
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
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(img.data, img.width, img.height, {
            inversionAttempts: "dontInvert",
          });
          if (code?.data) {
            active = false;
            setDetected(true);
            stopCamera();
            let token = code.data;
            try {
              const p = JSON.parse(code.data);
              token = p.token || p.qrToken || code.data;
            } catch {}
            handleMark(token);
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        setError("QR scanner failed. Use manual entry below.");
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

  const handleMark = async (token) => {
    if (!token?.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await attendanceService.markAttendance(token.trim());
      if (res.ok) {
        setSuccess(
          res.alreadyMarked
            ? "Attendance already marked for this session."
            : "✅ Attendance marked successfully!",
        );
        setQrInput("");
      } else setError(res.error || "Failed to mark attendance.");
    } catch (err) {
      setError(
        err.response?.data?.error || "Invalid QR token or session expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManual = (e) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    try {
      const p = JSON.parse(qrInput);
      handleMark(p.token || p.qrToken || qrInput);
    } catch {
      handleMark(qrInput.trim());
    }
  };

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-md mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Mark Attendance</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Scan the QR code displayed by your teacher
          </p>
        </div>

        {loading && (
          <div className="mb-4 flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
            <div className="w-4 h-4 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin shrink-0" />
            <p className="text-sm text-blue-800 font-medium">
              Marking attendance…
            </p>
          </div>
        )}
        {error && (
          <div className="mb-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <MdCheckCircle size={22} className="text-emerald-500 shrink-0" />
            <p className="text-emerald-800 text-sm font-semibold">{success}</p>
          </div>
        )}

        {/* Camera card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-5">
          {!cameraActive ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MdQrCode2 size={42} className="text-indigo-400" />
              </div>
              <p className="font-semibold text-slate-900 mb-1.5">
                Scan QR Code
              </p>
              <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto">
                Camera will auto-detect and mark your attendance instantly — no
                button needed.
              </p>
              <button
                onClick={startCamera}
                className="inline-flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition active:scale-95 text-sm"
              >
                <MdCameraAlt size={18} />
                Open Camera
              </button>
            </div>
          ) : (
            <div className="relative bg-black" style={{ height: 360 }}>
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
                }}
              />
              {/* Dark overlay with cutout */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.55)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 200px 200px at 50% 46%,transparent 99%,black 100%)",
                  maskImage:
                    "radial-gradient(ellipse 200px 200px at 50% 46%,transparent 99%,black 100%)",
                }}
              />
              {/* Scan box corners */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-54%)",
                  width: 220,
                  height: 220,
                }}
              >
                {[
                  {
                    top: 0,
                    left: 0,
                    borderTop: "3px solid #818cf8",
                    borderLeft: "3px solid #818cf8",
                    borderRadius: "6px 0 0 0",
                  },
                  {
                    top: 0,
                    right: 0,
                    borderTop: "3px solid #818cf8",
                    borderRight: "3px solid #818cf8",
                    borderRadius: "0 6px 0 0",
                  },
                  {
                    bottom: 0,
                    left: 0,
                    borderBottom: "3px solid #818cf8",
                    borderLeft: "3px solid #818cf8",
                    borderRadius: "0 0 0 6px",
                  },
                  {
                    bottom: 0,
                    right: 0,
                    borderBottom: "3px solid #818cf8",
                    borderRight: "3px solid #818cf8",
                    borderRadius: "0 0 6px 0",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      width: 28,
                      height: 28,
                      ...s,
                    }}
                  />
                ))}
                <div
                  style={{
                    position: "absolute",
                    left: 8,
                    right: 8,
                    height: 2,
                    background:
                      "linear-gradient(90deg,transparent,#818cf8,transparent)",
                    animation: "scanline 1.8s ease-in-out infinite",
                    top: "50%",
                  }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 52,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    background: "rgba(0,0,0,0.55)",
                    color: "#c7d2fe",
                    fontSize: 12,
                    padding: "4px 14px",
                    borderRadius: 20,
                  }}
                >
                  Point at QR — auto-marks on detect
                </span>
              </div>
              <button
                onClick={stopCamera}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "rgba(239,68,68,0.85)",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <MdClose size={14} />
                Stop
              </button>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
            or enter manually
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Manual entry */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 mb-5">
          <form onSubmit={handleManual} className="space-y-3">
            <textarea
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Paste the QR token from your teacher…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none text-sm font-mono resize-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !qrInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition disabled:opacity-50 text-sm active:scale-[0.98]"
            >
              <MdCheckCircle size={17} />
              {loading ? "Processing…" : "Mark Attendance"}
            </button>
          </form>
        </div>

        {/* Help */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 mb-2">
            <MdInfo size={14} />
            How it works
          </p>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Teacher generates a QR in class</li>
            <li>
              Tap <strong>Open Camera</strong> and point at the QR
            </li>
            <li>
              Attendance is marked <strong>instantly</strong> — no button needed
            </li>
            <li>Or paste the token manually if camera isn't available</li>
          </ol>
        </div>
        <div className="flex items-start gap-2 p-3.5 bg-amber-50 border border-amber-100 rounded-2xl">
          <MdWarning size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> QR codes expire when the session ends. Mark
            attendance promptly.
          </p>
        </div>
      </div>
    </div>
  );
}
