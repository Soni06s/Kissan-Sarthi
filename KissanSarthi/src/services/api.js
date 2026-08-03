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
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh-token`, {}, { withCredentials: true });
        localStorage.setItem('accessToken', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
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
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetOtp: (data) => api.post('/auth/verify-reset-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
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
  getForecast: (location) => api.get('/weather', { params: { location } }),
};

export const cropAPI = {
  recommend: (data) => api.post('/crop/recommend', data),
  getHistory: () => api.get('/crop/history'),
};

export const marketAPI = {
  getPrices: (params) => api.get('/market', { params }),
};

export const fertilizerAPI = {
  calculate: (data) => api.post('/fertilizer/calculate', data),
  getHistory: () => api.get('/fertilizer/history'),
};

export const communityAPI = {
  getPosts: (params) => api.get('/posts', { params }),
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (data) => api.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePost: (id, data) => api.patch(`/posts/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePost: (id) => api.delete(`/posts/${id}`),
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
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getDashboard: () => api.get('/admin/dashboard'),
};

export default api;
