import { api } from './api';

export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const data = res.data;

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
    }

    return data;
  },

  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    const data = res.data;

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
    }

    return data;
  },
};
