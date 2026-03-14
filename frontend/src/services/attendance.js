import api from "./api";

export const startSession = async (sessionData) => {
  const response = await api.post("/attendance/start", sessionData);
  return response.data;
};

export const markAttendance = async (qrToken) => {
  const response = await api.post("/attendance/mark", { qrToken });
  return response.data;
};

export const getMyAttendanceSummary = async () => {
  const response = await api.get("/attendance/my-summary");
  return response.data;
};

export const getMySessions = async () => {
  const response = await api.get("/attendance/sessions");
  return response.data;
};

export const getSessionRecords = async (sessionId) => {
  const response = await api.get(`/attendance/sessions/${sessionId}/records`);
  return response.data;
};

export const manualMarkStudent = async (sessionId, studentId) => {
  const response = await api.post(`/attendance/sessions/${sessionId}/manual-mark`, { studentId });
  return response.data;
};

export const getDefaulters = async (filters = {}) => {
  const response = await api.get("/attendance/defaulters", { params: filters });
  return response.data;
};
