import api from './axiosConfig';

export const getAdminStats = async () => {
  const res = await api.get('/admin/stats');
  return res.data;
};

export const getAdminProblems = async (params) => {
  const res = await api.get('/admin/problems', { params });
  return res.data;
};

export const getAdminUsers = async (params) => {
  const res = await api.get('/admin/users', { params });
  return res.data;
};

export const updateUserRole = async (id, role) => {
  const res = await api.put(`/admin/users/${id}/role`, { role });
  return res.data;
};

export const getAdminSubmissions = async () => {
  const res = await api.get('/admin/submissions');
  return res.data;
};
