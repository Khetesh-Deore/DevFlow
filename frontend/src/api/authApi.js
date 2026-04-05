import api from './axiosConfig';

export const registerUser = async (formData) => {
  try {
    const res = await api.post('/auth/register', formData);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
};

export const loginUser = async (credentials) => {
  try {
    const res = await api.post('/auth/login', { email: credentials.email, password: credentials.password });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
};

export const logoutUser = async () => {
  try {
    const res = await api.get('/auth/logout');
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
};

export const getMe = async () => {
  try {
    const res = await api.get('/auth/me');
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
};

export const forgotPassword = async (email) => {
  try {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
};

export const resetPassword = async (token, password) => {
  try {
    const res = await api.put(`/auth/reset-password/${token}`, { password });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
};
