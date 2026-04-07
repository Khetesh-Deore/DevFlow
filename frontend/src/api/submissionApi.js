import api from './axiosConfig';

export const submitCode = async (data) => {
  const res = await api.post('/submissions', data);
  return res.data;
};

export const runCode = async (data) => {
  const res = await api.post('/submissions/run', data);
  return res.data;
};

export const getSubmission = async (id) => {
  const res = await api.get(`/submissions/${id}`);
  return res.data;
};

export const getMySubmissions = async (problemId) => {
  const res = await api.get('/submissions', { params: { problemId } });
  return res.data;
};

export const getSubmissionHistory = async (params) => {
  const res = await api.get('/submissions/history', { params });
  return res.data;
};
