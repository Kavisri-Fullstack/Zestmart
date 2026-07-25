import api from './client';

export const couponApi = {
  active: () => api.get('/coupons/active'),
  validate: (code, cartTotal) => api.post('/coupons/validate', { code, cartTotal }),
};
