import { useEffect, useRef, useState } from "react";
import {
  MdCameraAlt,
  MdCheckCircle,
  MdInfo,
  MdLocationOff,
  MdLocationOn,
  MdQrCode2,
  MdWarning,
} from "react-icons/md";
import * as attendanceService from "../../services/attendance";
import { Alert, PAGE } from "../../ui";

// ── Device fingerprint — browser APIs, no library needed ──────────────
function getDeviceFingerprint() {
  try {
    const parts = [
      navigator.userAgent,
      screen.width + "x" + screen.height,
      screen.colorDepth,
      navigator.language,
      navigator.hardwareConcurrency || "",
      navigator.deviceMemory || "",
      new Date().getTimezoneOffset(),
    ];
    // Simple hash
    const str = parts.join("|");
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  } catch {
    return null;
  }
}

function getDeviceInfo() {
  try {
    const ua = navigator.userAgent;
    const mobile = /mobile/i.test(ua);
    const os = /android/i.test(ua)
      ? "Android"
      : /iphone|ipad/i.test(ua)
        ? "iOS"
        : /windows/i.test(ua)
          ? "Windows"
          : "Other";
    const browser = /chrome/i.test(ua)
      ? "Chrome"
      : /firefox/i.test(ua)
        ? "Firefox"
        : /safari/i.test(ua)
          ? "Safari"
          : "Other";
    return `${os} ${mobile ? "Mobile" : "Desktop"} · ${browser} · ${screen.width}x${screen.height}`;
  } catch {
    return null;
  }
}

function extractToken(v) {
  if (!v) return "";
  const raw = String(v).trim();
  try {
    const p = JSON.parse(raw);
    return p?.qrToken || p?.token || p?.sessionId || raw;
  } catch {
    return raw;
  }
}

export default function MarkAttendance() {
  const [qrInput, setQrInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fraudWarning, setFraudWarning] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);

  // GPS
  const [gpsLat, setGpsLat] = useState(null);
  const [gpsLng, setGpsLng] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle"); // idle|loading|ok|denied|unavailable

  // Device
  const fingerprint = useRef(getDeviceFingerprint());
  const deviceInfo = useRef(getDeviceInfo());

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const requestGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGpsLat(p.coords.latitude);
        setGpsLng(p.coords.longitude);
        setGpsStatus("ok");
      },
      () => setGpsStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  useEffect(() => {
    requestGPS();
  }, []);

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

  const handleMark = async (value) => {
    const token = extractToken(value);
    if (!token) {
      setError("Invalid token. Scan again or paste manually.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    setFraudWarning("");
    try {
      const res = await attendanceService.markAttendance(
        token,
        gpsStatus === "ok" ? gpsLat : null,
        gpsStatus === "ok" ? gpsLng : null,
        fingerprint.current,
        deviceInfo.current,
      );
      if (!res?.ok) throw new Error(res?.error || "Failed to mark attendance.");

      let warning = "";
      if (res.proxyFlagged)
        warning =
          "⚠️ This device was already used by another student. This has been flagged as possible proxy attendance.";
      else if (res.locationFlagged && res.distanceMeters)
        warning = `⚠️ You are ${res.distanceMeters}m from the classroom. This has been flagged and your teacher notified.`;
      else if (res.locationFlagged)
        warning =
          "⚠️ Your location could not be verified. This has been flagged.";

      if (warning) setFraudWarning(warning);
      setSuccess(
        res.alreadyMarked
          ? "Attendance already marked for this session."
          : "✅ Attendance marked successfully!",
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
    setFraudWarning("");
    requestGPS();
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
      if (err?.name === "NotAllowedError")
        setError("Camera permission denied.");
      else if (err?.name === "NotFoundError")
        setError("No camera found on this device.");
      else
        setError(
          "Unable to access camera: " + (err?.message || "Unknown error"),
        );
    }
  };

  useEffect(() => {
    if (!scanning) return;
    let active = true;
    const run = async () => {
      try {
        const jsQR = (await import("jsqr")).default;
        const tick = () => {
          if (!active) return;
          const v = videoRef.current,
            c = canvasRef.current;
          if (!v || !c || v.readyState < v.HAVE_ENOUGH_DATA || !v.videoWidth) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
          c.width = v.videoWidth;
          c.height = v.videoHeight;
          const ctx = c.getContext("2d");
          ctx.drawImage(v, 0, 0, c.width, c.height);
          const img = ctx.getImageData(0, 0, c.width, c.height);
          const code = jsQR(img.data, img.width, img.height, {
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
    run();
    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scanning]);

  useEffect(() => () => stopCamera(), []);

  const GPS_STYLE = {
    ok: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      icon: <MdLocationOn size={15} className="text-emerald-500 shrink-0" />,
    },
    loading: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-700",
      icon: (
        <MdLocationOn
          size={15}
          className="text-blue-400 shrink-0 animate-pulse"
        />
      ),
    },
    denied: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      icon: <MdLocationOff size={15} className="text-amber-500 shrink-0" />,
    },
    unavailable: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      icon: <MdLocationOff size={15} className="text-red-400 shrink-0" />,
    },
    idle: {
      bg: "bg-slate-50 border-slate-200",
      text: "text-slate-600",
      icon: <MdLocationOff size={15} className="text-slate-400 shrink-0" />,
    },
  }[gpsStatus];

  const GPS_LABEL = {
    ok: `GPS ready · ${gpsLat?.toFixed(4)}, ${gpsLng?.toFixed(4)}`,
    loading: "Getting your location…",
    denied: "Location access denied — fraud check disabled",
    unavailable: "GPS unavailable on this device",
    idle: "Location not yet captured",
  }[gpsStatus];

  return (
    <div className={`${PAGE} fade-up`}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Mark Attendance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Scan the QR shown by your faculty. Location and device are verified
            automatically.
          </p>
        </div>

        {/* GPS badge */}
        <div
          className={`mb-4 flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium ${GPS_STYLE.bg}`}
        >
          {GPS_STYLE.icon}
          <span className={GPS_STYLE.text}>{GPS_LABEL}</span>
          {(gpsStatus === "denied" || gpsStatus === "idle") && (
            <button
              onClick={requestGPS}
              className="ml-auto text-indigo-600 font-semibold hover:underline shrink-0"
            >
              Retry
            </button>
          )}
        </div>

        {/* Device badge */}
        <div className="mb-4 flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500">
          <span>🔒</span>
          <span>
            Device ID:{" "}
            <span className="font-mono text-slate-700">
              {fingerprint.current || "N/A"}
            </span>{" "}
            · {deviceInfo.current}
          </span>
        </div>

        {loading && (
          <div className="mb-4">
            <Alert type="info">
              Marking attendance{gpsStatus === "ok" ? " with location" : ""}…
            </Alert>
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
        {fraudWarning && (
          <div className="mb-4 flex items-start gap-2.5 p-4 bg-amber-50 border border-amber-300 rounded-2xl">
            <MdWarning size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-amber-800 text-sm font-medium">{fraudWarning}</p>
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
                Camera auto-detects the QR. GPS and device ID are captured
                automatically for fraud detection.
              </p>
              <button
                onClick={startCamera}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition"
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
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${gpsStatus === "ok" ? "bg-emerald-500" : "bg-amber-500"} text-white`}
                  >
                    <MdLocationOn size={10} />
                    {gpsStatus === "ok" ? "GPS ✓" : "GPS?"}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-500 text-white">
                    🔒 Device logged
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-200">
                  {detected
                    ? "QR detected — processing…"
                    : "Point camera at the QR code"}
                </p>
                <button
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleMark(qrInput);
            }}
            className="space-y-3"
          >
            <textarea
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Paste token or raw QR JSON here…"
              rows={4}
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !qrInput.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              <MdCheckCircle size={17} />
              {loading ? "Processing…" : "Mark Attendance"}
            </button>
          </form>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-800">
              <MdInfo size={15} />
              AI Fraud Detection active
            </p>
            <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside">
              <li>GPS location verified against classroom coordinates</li>
              <li>Device fingerprint checked — prevents proxy attendance</li>
              <li>AI analyzes patterns and alerts your faculty instantly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
