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

function getDeviceFingerprint() {
  try {
    const parts = [
      navigator.userAgent,
      `${screen.width}x${screen.height}`,
      screen.colorDepth,
      navigator.language,
      navigator.hardwareConcurrency || "",
      navigator.deviceMemory || "",
      new Date().getTimezoneOffset(),
    ];

    const str = parts.join("|");
    let hash = 0;

    for (let i = 0; i < str.length; i += 1) {
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

function extractToken(value) {
  if (!value) return "";

  const raw = String(value).trim();

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
  const [fraudWarning, setFraudWarning] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);

  const [gpsLat, setGpsLat] = useState(null);
  const [gpsLng, setGpsLng] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle"); // idle | loading | ok | weak | denied | unavailable

  const fingerprint = useRef(getDeviceFingerprint());
  const deviceInfo = useRef(getDeviceInfo());

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const requestGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      setGpsLat(null);
      setGpsLng(null);
      setGpsAccuracy(null);
      return;
    }

    setGpsStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        setGpsLat(latitude);
        setGpsLng(longitude);
        setGpsAccuracy(accuracy ?? null);

        if (accuracy != null && accuracy > 80) {
          setGpsStatus("weak");
          return;
        }

        setGpsStatus("ok");
      },
      (err) => {
        setGpsLat(null);
        setGpsLng(null);
        setGpsAccuracy(null);

        if (err?.code === 1) {
          setGpsStatus("denied");
        } else if (err?.code === 2 || err?.code === 3) {
          setGpsStatus("unavailable");
        } else {
          setGpsStatus("unavailable");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
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
      setError("Invalid token. Scan again or paste manually.");
      return;
    }

    let lat = null;
    let lng = null;
    let accuracy = null;
    let preWarning = "";

    if (gpsStatus === "ok" || gpsStatus === "weak") {
      lat = gpsLat;
      lng = gpsLng;
      accuracy = gpsAccuracy;
    }

    if (gpsStatus === "loading") {
      preWarning =
        "⚠️ GPS is still loading. Attendance will continue without location verification.";
    } else if (gpsStatus === "weak") {
      preWarning =
        "⚠️ GPS signal is weak indoors. Attendance will still be verified.";
    } else if (gpsStatus === "denied") {
      preWarning =
        "⚠️ Location access is denied. Attendance will continue without GPS verification.";
    } else if (gpsStatus === "unavailable") {
      preWarning =
        "⚠️ GPS is unavailable on this device right now. Attendance will continue without location verification.";
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setFraudWarning(preWarning);

    try {
      const response = await attendanceService.markAttendance(
        token,
        lat,
        lng,
        fingerprint.current,
        deviceInfo.current,
        accuracy,
      );

      if (!response?.ok) {
        throw new Error(response?.error || "Failed to mark attendance.");
      }

      let warning = preWarning;

      if (response.proxyFlagged) {
        warning =
          "⚠️ This device was already used by another student. Possible proxy attendance.";
      }

      if (warning) {
        setFraudWarning(warning);
      }

      setSuccess(
        response.alreadyMarked
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
      if (err?.name === "NotAllowedError") {
        setError("Camera permission denied.");
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

    const run = async () => {
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
            !video.videoWidth
          ) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(image.data, image.width, image.height, {
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
    weak: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      icon: <MdWarning size={15} className="text-amber-500 shrink-0" />,
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
    ok: `GPS ready · ${gpsLat?.toFixed(4)}, ${gpsLng?.toFixed(4)} · ±${Math.round(gpsAccuracy || 0)}m`,
    weak: `Indoor GPS weak · ±${Math.round(gpsAccuracy || 0)}m · attendance can still work`,
    loading: "Getting your location…",
    denied: "Location access denied",
    unavailable: "GPS unavailable on this device",
    idle: "Location not yet captured",
  }[gpsStatus];

  return (
    <div className={`${PAGE} fade-up`}>
      <div className="mx-auto w-full max-w-2xl px-0 sm:px-2">
        <div className="mb-5 px-1 text-center sm:mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Mark Attendance
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-sm">
            Scan the QR shown by your faculty. Location and device are verified
            automatically.
          </p>
        </div>

        <div
          className={`mb-4 flex items-start gap-2.5 rounded-2xl border p-3 text-xs font-medium sm:items-center ${GPS_STYLE.bg}`}
        >
          {GPS_STYLE.icon}
          <span className={`min-w-0 flex-1 leading-5 ${GPS_STYLE.text}`}>
            {GPS_LABEL}
          </span>

          {(gpsStatus === "denied" ||
            gpsStatus === "idle" ||
            gpsStatus === "weak" ||
            gpsStatus === "unavailable") && (
            <button
              onClick={requestGPS}
              className="shrink-0 rounded-lg px-1 py-0.5 font-semibold text-indigo-600 hover:underline"
            >
              Retry
            </button>
          )}
        </div>

        <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
          <span className="mt-0.5 shrink-0">🔒</span>
          <span className="min-w-0 wrap-break-word leading-5">
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
              Marking attendance
              {gpsStatus === "ok" || gpsStatus === "weak"
                ? " with location verification"
                : ""}
              …
            </Alert>
          </div>
        )}

        {error && (
          <div className="mb-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <MdCheckCircle
              size={22}
              className="mt-0.5 shrink-0 text-emerald-500"
            />
            <p className="text-sm font-semibold leading-6 text-emerald-800">
              {success}
            </p>
          </div>
        )}

        {fraudWarning && (
          <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <MdWarning size={20} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-sm font-medium leading-6 text-amber-800">
              {fraudWarning}
            </p>
          </div>
        )}

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:p-6">
          {!cameraActive ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center sm:p-6">
              <div className="mx-auto mb-4 flex h-18 w-18 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 sm:h-20 sm:w-20">
                <MdQrCode2
                  size={36}
                  className="text-indigo-600 sm:text-[38px]"
                />
              </div>

              <h2 className="text-lg font-semibold text-slate-900">
                Scan QR Code
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Camera auto-detects the QR. GPS and device ID are captured
                automatically for fraud detection.
              </p>

              <button
                onClick={startCamera}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700 sm:w-auto"
              >
                <MdCameraAlt size={18} />
                Open Camera
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-2.5 text-white sm:p-3">
              <div className="relative overflow-hidden rounded-[20px] bg-black">
                <video
                  ref={videoRef}
                  className="block h-85 w-full object-cover sm:h-105"
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
                  <div className="h-45 w-45 rounded-2xl border-4 border-indigo-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] sm:h-55 sm:w-55" />
                </div>

                <div className="absolute left-3 right-3 top-3 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white ${
                      gpsStatus === "ok"
                        ? "bg-emerald-500"
                        : gpsStatus === "weak"
                          ? "bg-amber-500"
                          : gpsStatus === "loading"
                            ? "bg-blue-500"
                            : "bg-slate-500"
                    }`}
                  >
                    <MdLocationOn size={10} />
                    {gpsStatus === "ok"
                      ? "GPS ✓"
                      : gpsStatus === "weak"
                        ? "GPS weak"
                        : gpsStatus === "loading"
                          ? "GPS loading"
                          : "GPS?"}
                  </span>

                  <span className="inline-flex items-center rounded-full bg-indigo-500 px-2.5 py-1 text-[10px] font-bold text-white">
                    🔒 Device logged
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/40 to-transparent px-4 pb-4 pt-12">
                  <p className="text-sm font-medium text-white sm:text-base">
                    {detected
                      ? "QR detected — processing…"
                      : "Point camera at the QR code"}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <button
                  onClick={stopCamera}
                  className="w-full rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Stop Camera
                </button>
              </div>
            </div>
          )}

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
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
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-indigo-500"
            />

            <button
              type="submit"
              disabled={loading || !qrInput.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
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
            <ul className="list-inside list-disc space-y-1 text-xs leading-5 text-blue-700">
              <li>GPS location is checked against classroom range</li>
              <li>Indoor weak GPS is allowed and verified by backend</li>
              <li>Shared-device proxy attendance is flagged</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
