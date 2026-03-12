import api from './api';

export const getComplaints = async (filters) => {
  const response = await api.get('/complaints', { params: filters });
  // backend returns { ok, complaints }
  return { ...response.data, data: response.data.complaints };
};

export const getMyComplaints = async () => {
  const response = await api.get('/complaints/mine');
  return { ...response.data, data: response.data.complaints };
};

export const submitComplaint = async (complaintData) => {
  const response = await api.post('/complaints', complaintData);
  return response.data;
};

// Backend endpoint: PUT /complaints/:id/status
export const updateComplaintStatus = async (id, status) => {
  const response = await api.put(`/complaints/${id}/status`, { status });
  return response.data;
};
