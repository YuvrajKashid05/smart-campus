import api from './api';

// Start an attendance session (Faculty) - generates a QR token
export const startSession = async (sessionData) => {
  const response = await api.post('/attendance/start', sessionData);
  return response.data;
};

// Mark attendance with QR token (Student)
export const markAttendance = async (qrToken) => {
  const response = await api.post('/attendance/mark', { qrToken });
  return response.data;
};
