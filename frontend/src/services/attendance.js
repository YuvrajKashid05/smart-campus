import api from './api';

// Faculty: Start attendance session
export const startSession = async (sessionData) => {
  const response = await api.post('/attendance/start', sessionData);
  return response.data;
};

// Student: Mark attendance with QR token
export const markAttendance = async (qrToken) => {
  const response = await api.post('/attendance/mark', { qrToken });
  return response.data;
};

// Student: Get own attendance summary (per subject + overall)
export const getMyAttendanceSummary = async () => {
  const response = await api.get('/attendance/my-summary');
  return response.data;
};

// Faculty: Get sessions I created
export const getMySessions = async () => {
  const response = await api.get('/attendance/sessions');
  return response.data;
};

// Faculty: Get records for a specific session
export const getSessionRecords = async (sessionId) => {
  const response = await api.get(`/attendance/sessions/${sessionId}/records`);
  return response.data;
};

// Faculty: Get defaulters list
export const getDefaulters = async (filters) => {
  const response = await api.get('/attendance/defaulters', { params: filters });
  return response.data;
};
