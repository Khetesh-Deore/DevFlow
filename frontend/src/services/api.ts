import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (username: string, email: string, password: string) =>
  api.post('/auth/register', { username, email, password });

// Contests
export const getContests = () => api.get('/contests');
export const getContestDetails = (id: string) => api.get(`/contests/${id}`);
export const createContest = (data: any) => api.post('/contests', data);

// Submissions
export const submitCode = (data: { problemId: string; contestId: string; code: string; language: string }) =>
  api.post('/submissions', data);

export const runCode = (data: { code: string; language: string; input: string }) =>
  api.post('/submissions/run', data);

export const getSubmissions = () => api.get('/submissions');

// Leaderboard
export const getLeaderboard = (contestId: string) =>
  api.get(`/contests/${contestId}/leaderboard`);

export default api;
