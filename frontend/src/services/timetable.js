import api from './api';

// Get all timetable slots (with optional filters)
export const getTimetable = async (filters) => {
  const response = await api.get('/timetables', { params: filters });
  return response.data;
};

// Get student's personal timetable (uses /my which reads from JWT)
export const getStudentTimetable = async () => {
  const response = await api.get('/timetables/my');
  return response.data;
};

// List timetable by dept/semester/section
export const getTimetableByClass = async (dept, semester, section) => {
  const response = await api.get('/timetables', {
    params: { dept, semester, section }
  });
  return response.data;
};

// Create timetable slot (Faculty/Admin)
export const createTimetable = async (timetableData) => {
  const response = await api.post('/timetables', timetableData);
  return response.data;
};

// Update timetable slot
export const updateTimetable = async (id, timetableData) => {
  const response = await api.put(`/timetables/${id}`, timetableData);
  return response.data;
};

// Delete timetable slot
export const deleteTimetable = async (id) => {
  const response = await api.delete(`/timetables/${id}`);
  return response.data;
};
