import api from './axiosConfig';

export const getContests = async (params) => {
  const res = await api.get('/contests', { params });
  return res.data;
};

export const getContest = async (slug) => {
  const res = await api.get(`/contests/${slug}`);
  return res.data;
};

export const registerForContest = async (id) => {
  const res = await api.post(`/contests/${id}/register`);
  return res.data;
};

export const submitInContest = async (slug, data) => {
  const res = await api.post(`/contests/${slug}/submit`, data);
  return res.data;
};

export const getContestLeaderboard = async (slug) => {
  const res = await api.get(`/contests/${slug}/leaderboard`);
  return res.data;
};

export const getMyContestSubmissions = async (slug) => {
  const res = await api.get(`/contests/${slug}/my-submissions`);
  return res.data;
};

export const createContest = async (data) => {
  const res = await api.post('/contests', data);
  return res.data;
};

export const updateContest = async (id, data) => {
  const res = await api.put(`/contests/${id}`, data);
  return res.data;
};

export const deleteContest = async (id) => {
  const res = await api.delete(`/contests/${id}`);
  return res.data;
};

export const toggleContestPublish = async (id) => {
  const res = await api.patch(`/contests/${id}/publish`);
  return res.data;
};

export const getContestReport = async (slug) => {
  const res = await api.get(`/contests/${slug}/report`);
  return res.data;
};
