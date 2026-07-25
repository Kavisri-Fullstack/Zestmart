import api from './client';

export const adminApi = {
  // Dashboard & analytics
  dashboard: () => api.get('/admin/dashboard'),
  salesAnalytics: (params) => api.get('/admin/analytics/sales', { params }),
  productAnalytics: () => api.get('/admin/analytics/products'),
  userAnalytics: () => api.get('/admin/analytics/users'),
  lowStock: (threshold) => api.get('/admin/inventory/low-stock', { params: { threshold } }),

  // Products
  listProducts: (params) => api.get('/admin/products', { params }),
  getProduct: (id) => api.get(`/admin/products/${id}`),
  createProduct: (formData) =>
    api.post('/admin/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProduct: (id, payload) => api.patch(`/admin/products/${id}`, payload),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  updateStock: (id, stock) => api.patch(`/admin/products/${id}/stock`, { stock }),

  // Categories
  listCategories: () => api.get('/categories'),
  createCategory: (formData) =>
    api.post('/admin/categories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCategory: (id, payload) => api.patch(`/admin/categories/${id}`, payload),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // Orders
  listOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, payload) => api.patch(`/admin/orders/${id}/status`, payload),
  refundOrder: (id) => api.patch(`/admin/orders/${id}/refund`),

  // Coupons
  listCoupons: () => api.get('/admin/coupons'),
  createCoupon: (payload) => api.post('/admin/coupons', payload),
  updateCoupon: (id, payload) => api.patch(`/admin/coupons/${id}`, payload),
  deleteCoupon: (id, hard) => api.delete(`/admin/coupons/${id}`, { params: hard ? { hard: true } : {} }),

  // Banners
  listBanners: () => api.get('/admin/banners'),
  createBanner: (formData) =>
    api.post('/admin/banners', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateBanner: (id, payload) => api.patch(`/admin/banners/${id}`, payload),
  deleteBanner: (id) => api.delete(`/admin/banners/${id}`),

  // Users
  listUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),

  // Support tickets
  listTickets: (params) => api.get('/admin/support-tickets', { params }),
  updateTicket: (id, payload) => api.patch(`/admin/support-tickets/${id}`, payload),
  replyTicket: (id, message) => api.post(`/admin/support-tickets/${id}/messages`, { message }),

  // Site settings
  updateSiteSettings: (payload) => api.patch('/admin/site-settings', payload),

  // Activity logs
  activityLogs: (params) => api.get('/admin/activity-logs', { params }),
};
