import api from './api';

// Mark attendance for student
export const markAttendance = async (attendanceData) => {
  const response = await api.post('/attendance/mark', attendanceData);
  return response.data;
};

// Get student attendance history
export const getStudentAttendance = async (studentId) => {
  const response = await api.get(`/attendance/student/${studentId}`);
  return response.data;
};

// Generate QR token for faculty (for a specific subject/class)
export const generateQRToken = async (qrData) => {
  const response = await api.post('/attendance/qr-token', qrData);
  return response.data;
};

// Verify and process QR token for attendance
export const verifyQRToken = async (token) => {
  const response = await api.get(`/attendance/verify-qr/${token}`);
  return response.data;
};

// Get attendance history for a specific subject/date range
export const getAttendanceHistory = async (filters) => {
  const response = await api.get('/attendance/history', { params: filters });
  return response.data;
};

// Get class attendance for faculty
export const getClassAttendance = async (classId) => {
  const response = await api.get(`/attendance/class/${classId}`);
  return response.data;
};

// Get attendance statistics
export const getAttendanceStats = async (studentId) => {
  const response = await api.get(`/attendance/stats/${studentId}`);
  return response.data;
};