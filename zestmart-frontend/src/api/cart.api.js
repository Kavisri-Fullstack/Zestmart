import api from './client';

export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (payload) => api.post('/cart/items', payload),
  updateItem: (productId, payload) => api.patch(`/cart/items/${productId}`, payload),
  removeItem: (productId) => api.delete(`/cart/items/${productId}`),
  clear: () => api.delete('/cart'),
};
