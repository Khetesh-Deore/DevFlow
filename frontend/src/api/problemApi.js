import api from './axiosConfig';

export const getProblems = async (params) => {
  const res = await api.get('/problems', { params });
  return res.data;
};

export const getProblem = async (slug) => {
  const res = await api.get(`/problems/${slug}`);
  return res.data;
};

export const getTags = async () => {
  const res = await api.get('/problems/tags');
  return res.data;
};

export const createProblem = async (data) => {
  const res = await api.post('/problems', data);
  return res.data;
};

export const updateProblem = async (id, data) => {
  const res = await api.put(`/problems/${id}`, data);
  return res.data;
};

export const deleteProblem = async (id) => {
  const res = await api.delete(`/problems/${id}`);
  return res.data;
};

export const togglePublish = async (id) => {
  const res = await api.patch(`/problems/${id}/publish`);
  return res.data;
};

export const addTestCase = async (id, data) => {
  const res = await api.post(`/problems/${id}/testcases`, data);
  return res.data;
};

export const getTestCases = async (id) => {
  const res = await api.get(`/problems/${id}/testcases`);
  return res.data;
};

export const updateTestCase = async (id, tcId, data) => {
  const res = await api.put(`/problems/${id}/testcases/${tcId}`, data);
  return res.data;
};

export const deleteTestCase = async (id, tcId) => {
  const res = await api.delete(`/problems/${id}/testcases/${tcId}`);
  return res.data;
};
