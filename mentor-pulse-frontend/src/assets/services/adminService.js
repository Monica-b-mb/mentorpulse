import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'https://mentorpulse.onrender.com/api/admin',
  timeout: 10000,
});

// Add auth token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

class AdminService {
  // 📊 Dashboard statistics
  static async getDashboardStats() {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }

  // 🕒 Recent activity
  static async getRecentActivity() {
    const response = await api.get('/recent-activity');
    return response.data;
  }

  // ⚙️ System status
  static async getSystemStatus() {
    const response = await api.get('/system-status');
    return response.data;
  }

  // 👥 Users
  static async getUsers(params) {
    const response = await api.get('/users', { params });
    return response.data;
  }

  static async updateUserStatus(id, status) {
    const response = await api.patch(`/users/${id}/status`, { status });
    return response.data;
  }

  static async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }

  // 📅 Sessions
  static async getSessions(params) {
    const response = await api.get('/sessions', { params });
    return response.data;
  }

  // 📈 Analytics
  static async getAnalytics() {
    const response = await api.get('/analytics');
    return response.data;
  }
}

export default AdminService;
