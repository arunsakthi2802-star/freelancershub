import API from './api';

export const authService = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  adminLogin: (data) => API.post('/auth/admin-login', data),
  logout: () => API.post('/auth/logout'),
  getMe: () => API.get('/auth/me'),
  verifyEmail: (token) => API.get(`/auth/verify/${token}`),
  resendVerification: () => API.post('/auth/resend-verification'),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => API.put(`/auth/reset-password/${token}`, { password }),
  changePassword: (data) => API.put('/auth/change-password', data),
};
