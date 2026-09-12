import API from './api';

export const adminService = {
  getStats: () => API.get('/admin/stats'),
  getUsers: (params) => API.get('/admin/users', { params }),
  toggleBan: (id) => API.put(`/admin/users/${id}/ban`),
  verifyEmail: (id) => API.put(`/admin/users/${id}/verify`),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  getProjects: (params) => API.get('/admin/projects', { params }),
  toggleFeature: (id) => API.put(`/admin/projects/${id}/feature`),
  getReviews: (params) => API.get('/admin/reviews', { params }),
  deleteReview: (id) => API.delete(`/admin/reviews/${id}`),
};
