import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    // Don't intercept if retry already attempted or if calling refresh-token/login/register
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/refresh-token') &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/register')
    ) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh-token`, {}, { withCredentials: true });
        const newAccessToken = data?.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          original.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(original);
        }
      } catch (refreshErr) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:unauthorized'));
        if (typeof window !== 'undefined' && !['/login', '/register', '/forgot-password'].includes(window.location.pathname)) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (data) => api.post('/auth/google', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
  verifyFarmer: (formData) => api.post('/auth/verify-farmer', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  forgotPassword: (email, mode = 'link') => api.post('/auth/forgot-password', { email, mode }),
  verifyResetOtp: (data) => api.post('/auth/verify-reset-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  resetPasswordWithToken: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getLive: () => api.get('/dashboard/live'),
};

export const sensorAPI = {
  getAll: () => api.get('/sensors'),
  create: (data) => api.post('/sensors', data),
  update: (id, data) => api.put(`/sensors/${id}`, data),
  delete: (id) => api.delete(`/sensors/${id}`),
};

export const weatherAPI = {
  getCurrent: (location) => api.get('/weather', { params: { location } }),
  getForecast: (location) => api.get('/weather/forecast', { params: { location } }),
  getAlerts: (location) => api.get('/weather/alerts', { params: { location } }),
};

export const cropAPI = {
  recommend: (data) => api.post('/crop/recommend', data),
  getHistory: () => api.get('/crop/history'),
  downloadPdf: (id) => api.get(`/crop/report/${id}/pdf`, { responseType: 'blob' }),
};

export const marketAPI = {
  getPrices: (params) => api.get('/market', { params }),
};

export const marketplaceAPI = {
  getListings: (params) => api.get('/marketplace', { params }),
  createListing: (formData) => api.post('/marketplace', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyListings: () => api.get('/marketplace/my-listings'),
  updateListing: (id, data) => api.patch(`/marketplace/${id}`, data),
  revealContact: (id) => api.post(`/marketplace/${id}/contact`),
};

export const schemeAPI = {
  getSchemes: (params) => api.get('/schemes', { params }),
  toggleBookmark: (id) => api.post(`/schemes/${id}/bookmark`),
};

export const fertilizerAPI = {
  calculate: (data) => api.post('/fertilizer/calculate', data),
  getHistory: () => api.get('/fertilizer/history'),
  downloadPdf: (id) => api.get(`/fertilizer/report/${id}/pdf`, { responseType: 'blob' }),
};

export const communityAPI = {
  getPosts: (params) => api.get('/posts', { params }),
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (data) => api.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePost: (id, data) => api.patch(`/posts/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePost: (id, params = {}) => api.delete(`/posts/${id}`, { data: params, params }),
  likePost: (id) => api.post(`/posts/${id}/like`),
  commentPost: (id, text, parentComment) => api.post(`/posts/${id}/comment`, { text, parentComment }),
  getComments: (id) => api.get(`/posts/${id}/comments`),
  updateComment: (id, text) => api.patch(`/posts/comments/${id}`, { text }),
  likeComment: (id) => api.post(`/posts/comments/${id}/like`),
  deleteComment: (postId, commentId) => api.delete(`/posts/${postId}/comment/${commentId}`),
  sharePost: (id) => api.post(`/posts/${id}/share`),
  bookmarkPost: (id) => api.post(`/posts/${id}/bookmark`),
  reportPost: (id, reason, details) => api.post(`/posts/${id}/report`, { reason, details }),
  getMyPosts: (params) => api.get('/posts/myposts', { params }),
  getBookmarks: (params) => api.get('/posts/bookmarks', { params }),
  getTrending: (params) => api.get('/posts/trending', { params }),
  getCategories: () => api.get('/posts/categories'),
  searchPosts: (params) => api.get('/posts/search', { params }),
  moderatePost: (id, data) => api.patch(`/posts/admin/${id}/moderate`, data),
  followUser: (userId) => api.post(`/posts/user/${userId}/follow`),
};

export const alertAPI = {
  getAlerts: () => api.get('/alerts'),
  markRead: (id) => api.put(`/alerts/${id}/read`),
};

export const chatAPI = {
  send: (question) => api.post('/chat', { question }),
  getHistory: () => api.get('/chat/history'),
};

export const adminAPI = {
  getUsers: (page) => api.get('/admin/users', { params: { page } }),
  updateUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getDashboard: () => api.get('/admin/dashboard'),
  getReports: (page) => api.get('/admin/reports', { params: { page } }),
  updateReportStatus: (id, status) => api.patch(`/admin/reports/${id}`, { status }),
  getVerifications: (status) => api.get('/admin/verifications', { params: { status } }),
  reviewVerification: (id, data) => api.patch(`/admin/verifications/${id}`, data),
  getExperts: () => api.get('/admin/experts'),
  updateExpertStatus: (id, data) => api.patch(`/admin/experts/${id}/status`, data),
};

export const paymentAPI = {
  createOrder: (data) => api.post('/payment/create-order', data),
  verifyPayment: (data) => api.post('/payment/verify', data),
  getHistory: (params) => api.get('/payment/history', { params }),
  downloadReceipt: (paymentId) =>
    api.get(`/payment/receipt/${paymentId}`, { responseType: 'blob' }),
};

export const consultationAPI = {
  getExperts: () => api.get('/consultations/experts'),
  getExpertById: (id) => api.get(`/consultations/experts/${id}`),
  getMyConsultations: () => api.get('/consultations'),
  getById: (id) => api.get(`/consultations/${id}`),
  sendMessage: (id, data) => api.post(`/consultations/${id}/messages`, data),
  resolve: (id) => api.post(`/consultations/${id}/resolve`),
  rate: (id, data) => api.post(`/consultations/${id}/rate`, data),
  respond: (id, data) => api.post(`/consultations/${id}/respond`, data),
};

export default api;
