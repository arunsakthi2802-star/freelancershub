import API from './api';

export const chatService = {
  getConversations: () => API.get('/chat/conversations'),
  getMessages: (roomId, params) => API.get(`/chat/${roomId}`, { params }),
  sendMessage: (data) => API.post('/chat', data),
  deleteMessage: (id) => API.delete(`/chat/${id}`),
  getUnreadCount: () => API.get('/chat/unread-count'),
};

export const paymentService = {
  createIntent: (data) => API.post('/payments/create-intent', data),
  confirmMock: (paymentId) => API.post('/payments/confirm-mock', { paymentId }),
  getHistory: (params) => API.get('/payments/history', { params }),
  getById: (id) => API.get(`/payments/${id}`),
};
