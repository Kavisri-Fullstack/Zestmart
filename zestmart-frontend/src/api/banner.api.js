import api from './client';

export const bannerApi = {
  list: (position) => api.get('/banners', { params: position ? { position } : {} }),
};
