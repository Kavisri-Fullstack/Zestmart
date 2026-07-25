import api from './client';

export const wishlistApi = {
  get: () => api.get('/wishlist'),
  addItem: (productId, note) => api.post('/wishlist/items', { productId, note }),
  removeItem: (productId) => api.delete(`/wishlist/items/${productId}`),
};
