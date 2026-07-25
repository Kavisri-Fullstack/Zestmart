import api from './client';

export const supportTicketApi = {
  list: () => api.get('/support-tickets'),
  create: (payload) => api.post('/support-tickets', payload),
  getById: (id) => api.get(`/support-tickets/${id}`),
  addMessage: (id, message) => api.post(`/support-tickets/${id}/messages`, { message }),
};
