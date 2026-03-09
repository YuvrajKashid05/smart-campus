import api from './api';

// Get timetable (general)
export const getTimetable = async (filters) => {
  const response = await api.get('/timetable', { params: filters });
  return response.data;
};

// Get student's personal timetable (role-based)
export const getStudentTimetable = async (studentId) => {
  const response = await api.get(`/timetable/student/${studentId}`);
  return response.data;
};

// Get faculty's timetable
export const getFacultyTimetable = async (facultyId) => {
  const response = await api.get(`/timetable/faculty/${facultyId}`);
  return response.data;
};

// Create timetable entry (Faculty/Admin)
export const createTimetable = async (timetableData) => {
  const response = await api.post('/timetable', timetableData);
  return response.data;
};

// Update timetable entry
export const updateTimetable = async (id, timetableData) => {
  const response = await api.put(`/timetable/${id}`, timetableData);
  return response.data;
};

// Delete timetable entry
export const deleteTimetable = async (id) => {
  const response = await api.delete(`/timetable/${id}`);
  return response.data;
};

// Get timetable by department, semester, section
export const getTimetableByClass = async (dept, semester, section) => {
  const response = await api.get('/timetable/class', {
    params: { dept, semester, section }
  });
  return response.data;
};

// Get weekly timetable
export const getWeeklyTimetable = async (dept, semester, section, weekStart) => {
  const response = await api.get('/timetable/weekly', {
    params: { dept, semester, section, weekStart }
  });
  return response.data;
};