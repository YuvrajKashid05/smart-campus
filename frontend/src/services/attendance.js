import api from "./api";

// ── Start Attendance Session ─────────────────────────────────────────
export const startSession = (data) =>
  api
    .post("/attendance/start", data)
    .then((r) => r.data);

// ── Mark Attendance ──────────────────────────────────────────────────
export const markAttendance = async (
  qrToken,
  lat = null,
  lng = null,
  deviceFingerprint = null,
  deviceInfo = null
) => {
  const payload = { qrToken };

  if (lat != null && lng != null) {
    payload.lat = lat;
    payload.lng = lng;
  }

  if (deviceFingerprint) {
    payload.deviceFingerprint = deviceFingerprint;
    payload.deviceInfo = deviceInfo;
  }

  const r = await api
    .post("/attendance/mark", payload);
  return r.data;
};

// ── Student Attendance Data ──────────────────────────────────────────
export const getMyAttendanceSummary = () =>
  api
    .get("/attendance/my-summary")
    .then((r) => r.data);

export const getMySessions = () =>
  api
    .get("/attendance/sessions")
    .then((r) => r.data);

// ── Faculty Session Management ───────────────────────────────────────
export const getSessionRecords = (id) =>
  api
    .get(`/attendance/sessions/${id}/records`)
    .then((r) => r.data);

export const manualMarkStudent = (sid, studentId) =>
  api
    .post(`/attendance/sessions/${sid}/manual-mark`, { studentId })
    .then((r) => r.data);

// ── Reports ──────────────────────────────────────────────────────────
export const getDefaulters = (filters = {}) =>
  api
    .get("/attendance/defaulters", { params: filters })
    .then((r) => r.data);

export const getFraudReport = (id) =>
  api
    .get(`/attendance/sessions/${id}/fraud-report`)
    .then((r) => r.data);

export const getFraudSummary = () =>
  api
    .get("/attendance/fraud-summary")
    .then((r) => r.data);