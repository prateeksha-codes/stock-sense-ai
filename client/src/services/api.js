import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  registerOwner: (data) => api.post('/auth/register/owner', data),
  registerCustomer: (data) => api.post('/auth/register/customer', data),
  getMe: () => api.get('/auth/me'),
};

// Business APIs
export const businessAPI = {
  getAll: () => api.get('/businesses'),
  getById: (id) => api.get(`/businesses/${id}`),
  update: (id, data) => api.put(`/businesses/${id}`, data),
};

// Product APIs
export const productAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getByBusiness: (businessId) => api.get(`/products/business/${businessId}`),
};

// Inventory APIs
export const inventoryAPI = {
  getOverview: () => api.get('/inventory'),
  getTransactions: () => api.get('/inventory/transactions'),
  getAlerts: () => api.get('/inventory/alerts'),
  addTransaction: (data) => api.post('/inventory/transactions', data),
};

// Customer APIs
export const customerAPI = {
  getProfile: () => api.get('/customers/profile'),
  updateProfile: (data) => api.put('/customers/profile', data),
  getAddresses: () => api.get('/customers/addresses'),
  addAddress: (data) => api.post('/customers/addresses', data),
  updateAddress: (id, data) => api.put(`/customers/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/customers/addresses/${id}`),
  // Discovery location (used by Nearby feature)
  getDiscoveryLocation: () => api.get('/customers/discovery-location'),
  updateDiscoveryLocation: (data) => api.put('/customers/discovery-location', data),
};

// Order APIs
export const orderAPI = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  getTracking: (id) => api.get(`/orders/${id}/tracking`),
};

// Supplier APIs
export const supplierAPI = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// Purchase Order APIs
export const purchaseOrderAPI = {
  getAll: () => api.get('/purchase-orders'),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  updateStatus: (id, data) => api.put(`/purchase-orders/${id}/status`, data),
  receive: (id, data) => api.post(`/purchase-orders/${id}/receive`, data),
};

// Payment APIs
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
  confirmCOD: (data) => api.post('/payments/confirm-cod', data),
  getStatus: (orderId) => api.get(`/payments/${orderId}`),
};

// Analytics APIs
export const analyticsAPI = {
  getSales: () => api.get('/analytics/sales'),
  getInventory: () => api.get('/analytics/inventory'),
  getProducts: () => api.get('/analytics/products'),
  getSuppliers: () => api.get('/analytics/suppliers'),
};

// AI APIs
export const aiAPI = {
  getInsights: (businessId) => api.get(`/ai/insights/${businessId}`),
  predictStockout: (data) => api.post('/ai/predict-stockout', data),
  reorderRecommendation: (data) => api.post('/ai/reorder-recommendation', data),
  deadStock: (data) => api.post('/ai/dead-stock', data),
  supplierInsights: (data) => api.post('/ai/supplier-insights', data),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getBusinesses: () => api.get('/admin/businesses'),
  toggleBusiness: (id) => api.put(`/admin/businesses/${id}/toggle`),
  getOwners: () => api.get('/admin/owners'),
  getCustomers: () => api.get('/admin/customers'),
  getAllProducts: () => api.get('/admin/products'),
  getAllOrders: () => api.get('/admin/orders'),
  getAnalytics: () => api.get('/admin/analytics'),
  getActivityLogs: () => api.get('/admin/activity-logs'),
};
// ============================================
// FEATURE 1 & 2: Discovery (nearby + smart search)
// ============================================
export const discoveryAPI = {
  getNearby: (params) =>
    api.get('/discovery/nearby', { params }),
  searchProducts: (params) =>
    api.get('/discovery/search-products', { params }),
  getFilters: () =>
    api.get('/discovery/filters'),
};

// ============================================
// FEATURE 4: Reviews
// ============================================
export const reviewAPI = {
  create: (data) =>
    api.post('/reviews', data),
  getByBusiness: (businessId, params) =>
    api.get(`/reviews/business/${businessId}`, { params }),
  getMine: () =>
    api.get('/reviews/my'),
  getOwnerReviews: () =>
    api.get('/reviews/owner'),
  getEligibleOrders: () =>
    api.get('/reviews/eligible-orders'),
  update: (id, data) =>
    api.put(`/reviews/${id}`, data),
  remove: (id) =>
    api.delete(`/reviews/${id}`),
};

// ============================================
// FEATURE 5: AI Recommendations
// ============================================
export const recommendationAPI = {
  getForProduct: (productId) =>
    api.get(`/ai/recommendations/${productId}`),
  getForCart: (items) =>
    api.post('/ai/recommendations/cart', { items }),
};

// ============================================
// FEATURE 6: Notifications
// ============================================
export const notificationAPI = {
  getAll: (params) =>
    api.get('/notifications', { params }),
  getUnreadCount: () =>
    api.get('/notifications/unread-count'),
  markRead: (id) =>
    api.put(`/notifications/${id}/read`),
  markAllRead: () =>
    api.put('/notifications/mark-all-read'),
  remove: (id) =>
    api.delete(`/notifications/${id}`),
  clearRead: () =>
    api.delete('/notifications/clear-read'),
};

export default api;