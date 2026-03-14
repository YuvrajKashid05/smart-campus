import { useEffect, useRef, useState } from "react";
import {
  MdCameraAlt,
  MdCheckCircle,
  MdInfo,
  MdQrCode2,
  MdWarning,
} from "react-icons/md";
import * as attendanceService from "../../services/attendance";
import { Alert, PAGE } from "../../ui";

function extractToken(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);
    return parsed?.qrToken || parsed?.token || parsed?.sessionId || raw;
  } catch {
    return raw;
  }
}

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

  const stopCamera = () => {
    setScanning(false);
    setCameraActive(false);
    setDetected(false);
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

  const handleMark = async (value) => {
    const token = extractToken(value);
    if (!token) {
      setError("Invalid token. Please scan again or paste the token manually.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await attendanceService.markAttendance(token);
      if (!res?.ok) {
        throw new Error(res?.error || "Failed to mark attendance.");
      }
      setSuccess(
        res.alreadyMarked
          ? "Attendance already marked for this session."
          : "Attendance marked successfully.",
      );
      setQrInput("");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Invalid QR token or session expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setError("");
    setSuccess("");
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
      }, 100);
    } catch (err) {
      if (err?.name === "NotAllowedError") {
        setError(
          "Camera permission denied. Allow camera access in browser settings.",
        );
      } else if (err?.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError(`Unable to access camera: ${err?.message || "Unknown error"}`);
      }
    }
  };

  useEffect(() => {
    if (!scanning) return undefined;

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

          const context = canvas.getContext("2d");
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code?.data) {
            active = false;
            setDetected(true);
            stopCamera();
            handleMark(code.data);
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

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleMark(qrInput);
  };

  return (
    <div className={`${PAGE} fade-up`}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Mark Attendance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Scan the QR shown by your faculty or paste the session token.
          </p>
        </div>

        {loading && (
          <div className="mb-4">
            <Alert type="info">Marking attendance…</Alert>
          </div>
        )}
        {error && (
          <div className="mb-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}
        {success && (
          <div className="mb-4">
            <Alert type="success">{success}</Alert>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          {!cameraActive ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <MdQrCode2 size={38} className="text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Scan QR Code
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Camera will auto-detect the QR and mark your attendance
                instantly.
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                <MdCameraAlt size={18} />
                Open Camera
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-3 text-white">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-52 w-52 rounded-2xl border-4 border-indigo-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-200">
                  {detected
                    ? "QR detected"
                    : "Point your camera at the QR code"}
                </p>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Stop
                </button>
              </div>
            </div>
          )}

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              or enter manually
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-3">
            <textarea
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Paste the token or raw QR JSON here…"
              rows={4}
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !qrInput.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MdCheckCircle size={17} />
              {loading ? "Processing…" : "Mark Attendance"}
            </button>
          </form>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-800">
              <MdInfo size={15} />
              How it works
            </p>
            <ol className="list-inside list-decimal space-y-1 text-xs text-blue-700">
              <li>Teacher generates a QR code in class.</li>
              <li>Open camera and point it at the QR code.</li>
              <li>Attendance is marked automatically after detection.</li>
              <li>If camera fails, paste the token manually.</li>
            </ol>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-800">
            <MdWarning size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-xs">
              QR codes expire when the session ends, so mark attendance as soon
              as possible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
