import api from './api';

export const getAnnouncements = async (filters) => {
  const response = await api.get('/announcements', { params: filters });
  return response.data;
};

export const getAnnouncementById = async (id) => {
  const response = await api.get(`/announcements/${id}`);
  return response.data;
};

export const createAnnouncement = async (announcementData) => {
  const response = await api.post('/announcements', announcementData);
  return response.data;
};

export const updateAnnouncement = async (id, announcementData) => {
  const response = await api.put(`/announcements/${id}`, announcementData);
  return response.data;
};

export const deleteAnnouncement = async (id) => {
  const response = await api.delete(`/announcements/${id}`);
  return response.data;
};

export const getAnnouncementsByCategory = async (category) => {
  const response = await api.get('/announcements/category', { params: { category } });
  return response.data;
};

export const pinAnnouncement = async (id) => {
  const response = await api.put(`/announcements/${id}/pin`);
  return response.data;
};

export const unpinAnnouncement = async (id) => {
  const response = await api.put(`/announcements/${id}/unpin`);
  return response.data;
};