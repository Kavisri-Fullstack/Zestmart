import api from './client';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  googleSignIn: (idToken) => api.post('/auth/google', { idToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (payload) => api.post('/auth/verify-otp', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};
