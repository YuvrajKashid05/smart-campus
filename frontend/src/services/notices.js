import api from './api';

export const getNotices = async (filters) => {
  const response = await api.get('/notices', { params: filters });
  // backend returns { ok, notices }
  return { ...response.data, data: response.data.notices };
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
