import api from './api';

export const getNotices = async (filters) => {
  const response = await api.get('/notices', { params: filters });
  return response.data;
};

export const getNoticeById = async (id) => {
  const response = await api.get(`/notices/${id}`);
  return response.data;
};

export const createNotice = async (noticeData) => {
  const response = await api.post('/notices', noticeData);
  return response.data;
};

export const updateNotice = async (id, noticeData) => {
  const response = await api.put(`/notices/${id}`, noticeData);
  return response.data;
};

export const deleteNotice = async (id) => {
  const response = await api.delete(`/notices/${id}`);
  return response.data;
};

export const getNoticesByDept = async (dept) => {
  const response = await api.get('/notices/department', { params: { dept } });
  return response.data;
};

export const markNoticeAsRead = async (noticeId) => {
  const response = await api.put(`/notices/${noticeId}/read`);
  return response.data;
};