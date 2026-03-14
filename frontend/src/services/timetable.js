import api from "./api";

export const getTimetable = async (filters = {}) => {
  const { data } = await api.get("/timetables", { params: filters });
  return data;
};

export const getMyTimetable = async () => {
  const { data } = await api.get("/timetables/my");
  return data;
};

export const getStudentTimetable = getMyTimetable;

export const getFacultyTimetable = async () => {
  const { data } = await api.get("/timetables/faculty/my");
  return data;
};

export const createTimetableSlot = async (payload) => {
  const { data } = await api.post("/timetables", {
    dept: String(payload.dept || "").trim().toUpperCase(),
    semester: Number(payload.semester),
    section: String(payload.section || "").trim().toUpperCase(),
    day: payload.day,
    slotType: payload.slotType,
    title: String(payload.title || "").trim(),
    subject: payload.slotType === "BREAK" ? "" : String(payload.subject || "").trim(),
    room: String(payload.room || "").trim(),
    startTime: payload.startTime,
    endTime: payload.endTime,
  });
  return data;
};

export const updateTimetableSlot = async (id, payload) => {
  const { data } = await api.put(`/timetables/${id}`, {
    dept: String(payload.dept || "").trim().toUpperCase(),
    semester: Number(payload.semester),
    section: String(payload.section || "").trim().toUpperCase(),
    day: payload.day,
    slotType: payload.slotType,
    title: String(payload.title || "").trim(),
    subject: payload.slotType === "BREAK" ? "" : String(payload.subject || "").trim(),
    room: String(payload.room || "").trim(),
    startTime: payload.startTime,
    endTime: payload.endTime,
  });
  return data;
};

export const deleteTimetableSlot = async (id) => {
  const { data } = await api.delete(`/timetables/${id}`);
  return data;
};