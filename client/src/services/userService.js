import API from './api';

export const userService = {
  getAll: (params) => API.get('/users', { params }),
  getById: (id) => API.get(`/users/${id}`),
  getProfile: () => API.get('/users/profile'),
  updateProfile: (data) => API.put('/users/profile', data),
  uploadAvatar: (formData) => API.put('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadResume: (formData) => API.put('/users/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addPortfolio: (formData) => API.post('/users/portfolio', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePortfolio: (itemId) => API.delete(`/users/portfolio/${itemId}`),
  getTopFreelancers: () => API.get('/users/top-freelancers'),
  deleteAccount: () => API.delete('/users/account'),
};

export const reviewService = {
  create: (data) => API.post('/reviews', data),
  getUserReviews: (userId, params) => API.get(`/reviews/user/${userId}`, { params }),
  update: (id, data) => API.put(`/reviews/${id}`, data),
  delete: (id) => API.delete(`/reviews/${id}`),
};

export const notificationService = {
  getAll: (params) => API.get('/notifications', { params }),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/mark-all-read'),
  delete: (id) => API.delete(`/notifications/${id}`),
  deleteAll: () => API.delete('/notifications'),
};
