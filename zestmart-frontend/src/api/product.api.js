import api from './client';

export const productApi = {
  list: (params) => api.get('/products', { params }),
  featured: () => api.get('/products/featured'),
  trending: () => api.get('/products/trending'),
  bestsellers: () => api.get('/products/bestsellers'),
  newArrivals: () => api.get('/products/new-arrivals'),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  related: (id) => api.get(`/products/${id}/related`),
};
