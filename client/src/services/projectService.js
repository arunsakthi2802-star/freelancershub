import API from './api';

export const projectService = {
  getAll: (params) => API.get('/projects', { params }),
  getById: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
  getClientProjects: (params) => API.get('/projects/client/my-projects', { params }),
  getFeatured: () => API.get('/projects/featured'),
  getStats: () => API.get('/projects/stats'),
};

export const applicationService = {
  apply: (data) => API.post('/applications', data),
  getMyApplications: (params) => API.get('/applications/my-applications', { params }),
  getProjectApplications: (projectId) => API.get(`/applications/project/${projectId}`),
  updateStatus: (id, data) => API.put(`/applications/${id}`, data),
  withdraw: (id) => API.put(`/applications/${id}/withdraw`),
};
