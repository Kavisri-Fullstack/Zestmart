import api from './client';

export const addressApi = {
  list: () => api.get('/addresses'),
  create: (payload) => api.post('/addresses', payload),
  update: (id, payload) => api.patch(`/addresses/${id}`, payload),
  remove: (id) => api.delete(`/addresses/${id}`),
  setDefault: (id) => api.patch(`/addresses/${id}/default`),
};
