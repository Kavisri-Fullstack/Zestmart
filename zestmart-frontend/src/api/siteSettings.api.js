import api from './client';

export const siteSettingsApi = {
  get: () => api.get('/site-settings'),
};
