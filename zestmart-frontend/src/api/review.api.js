import api from './client';

export const reviewApi = {
  listForProduct: (productId, params) => api.get(`/products/${productId}/reviews`, { params }),
  create: (productId, payload) => api.post(`/products/${productId}/reviews`, payload),
  update: (id, payload) => api.patch(`/reviews/${id}`, payload),
  remove: (id) => api.delete(`/reviews/${id}`),
};
