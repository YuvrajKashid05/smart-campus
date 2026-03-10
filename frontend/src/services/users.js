import api from './api';

export const getAllUsers = async (filters) => {
  const response = await api.get('/users', { params: filters });
  // backend returns { ok, users }
  return { ...response.data, data: response.data.users };
};

export const getMe = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const updateStudent = async (id, userData) => {
  const response = await api.put(`/users/students/${id}`, userData);
  return response.data;
};
