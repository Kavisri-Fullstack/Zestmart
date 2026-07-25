import api from './client';

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  markAllRead: () => api.patch('/notifications/read-all'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  remove: (id) => api.delete(`/notifications/${id}`),
};
