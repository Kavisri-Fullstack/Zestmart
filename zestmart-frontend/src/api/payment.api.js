import api from './client';

export const paymentApi = {
  createOrder: () => api.post('/payments/create-order'),
  verify: (payload) => api.post('/payments/verify', payload),
  getByOrderId: (orderId) => api.get(`/payments/${orderId}`),
};
