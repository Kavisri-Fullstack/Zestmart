import api from './client';

export const aiChatApi = {
  send: (message, history) => api.post('/ai/chat', { message, history }),
};
