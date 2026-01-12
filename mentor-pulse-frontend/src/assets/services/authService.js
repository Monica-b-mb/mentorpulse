import { api } from './api';

export const authService = {
  login: async (credentials) => {
    try {
      const res = await api.post('/auth/login', credentials);
      const data = res.data;

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
      }

      return data;
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      throw err;
    }
  },

  register: async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      const data = res.data;

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
      }

      return data;
    } catch (err) {
      console.error('Register error:', err.response?.data || err.message);
      throw err;
    }
  },
};
