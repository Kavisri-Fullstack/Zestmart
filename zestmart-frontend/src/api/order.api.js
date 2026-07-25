import api from './client';

export const orderApi = {
  place: (payload) => api.post('/orders', payload),
  list: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.patch(`/orders/${id}/cancel`),
  track: (id) => api.get(`/orders/${id}/track`),
  invoiceUrl: (id, baseURL) => `${baseURL}/orders/${id}/invoice`,
};
