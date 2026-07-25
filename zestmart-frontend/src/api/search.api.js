import api from './client';

export const searchApi = {
  suggestions: (q) => api.get('/search/suggestions', { params: { q } }),
  products: (params) => api.get('/search/products', { params }),
  recommendations: () => api.get('/recommendations'),
  recentlyViewed: () => api.get('/recently-viewed'),
};
