import api from './api';

export const getComplaints = async (filters) => {
  const response = await api.get('/complaints', { params: filters });
  return response.data;
};

export const getMyComplaints = async () => {
  const response = await api.get('/complaints/my-complaints');
  return response.data;
};

export const getComplaintById = async (id) => {
  const response = await api.get(`/complaints/${id}`);
  return response.data;
};

export const submitComplaint = async (complaintData) => {
  const response = await api.post('/complaints', complaintData);
  return response.data;
};

export const updateComplaintStatus = async (id, status) => {
  const response = await api.put(`/complaints/${id}`, { status });
  return response.data;
};

export const deleteComplaint = async (id) => {
  const response = await api.delete(`/complaints/${id}`);
  return response.data;
};

export const replyToComplaint = async (id, reply) => {
  const response = await api.put(`/complaints/${id}/reply`, { reply });
  return response.data;
};

export const addCommentToComplaint = async (id, comment) => {
  const response = await api.post(`/complaints/${id}/comment`, { comment });
  return response.data;
};

export const getComplaintsByStatus = async (status) => {
  const response = await api.get('/complaints/status', { params: { status } });
  return response.data;
};