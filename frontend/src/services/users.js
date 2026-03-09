import api from './api';

export const getAllUsers = async (filters) => {
  const response = await api.get('/users', { params: filters });
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const getUsersByRole = async (role) => {
  const response = await api.get('/users/role', { params: { role } });
  return response.data;
};

export const getUsersByDepartment = async (dept) => {
  const response = await api.get('/users/department', { params: { dept } });
  return response.data;
};

export const changeUserPassword = async (id, newPassword) => {
  const response = await api.put(`/users/${id}/password`, { newPassword });
  return response.data;
};

export const toggleUserStatus = async (id) => {
  const response = await api.put(`/users/${id}/toggle-status`);
  return response.data;
};

export const bulkImportUsers = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/users/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const exportUsers = async (format = 'csv') => {
  const response = await api.get('/users/export', {
    params: { format },
    responseType: 'blob'
  });
  return response.data;
};