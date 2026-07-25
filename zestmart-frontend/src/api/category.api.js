import api from './client';

export const categoryApi = {
  list: () => api.get('/categories'),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
  productsInCategory: (slug, params) => api.get(`/categories/${slug}/products`, { params }),
};
