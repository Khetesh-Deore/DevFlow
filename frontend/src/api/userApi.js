import api from './axiosConfig';

export const getUserProfile = async (username) => {
  const res = await api.get(`/users/${username}`);
  return res.data;
};

export const getGlobalLeaderboard = async (params) => {
  const res = await api.get('/users/leaderboard', { params });
  return res.data;
};

export const updateProfile = async (data) => {
  const res = await api.put('/users/me', data);
  return res.data;
};

export const changePassword = async (data) => {
  const res = await api.put('/users/me/password', data);
  return res.data;
};
