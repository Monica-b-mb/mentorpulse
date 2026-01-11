// Safe localStorage utilities
export const authUtils = {
  // Safe get user data
  getUser: () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData || userData === 'undefined' || userData === 'null') {
        return null;
      }
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  // Safe get token
  getToken: () => {
    try {
      const token = localStorage.getItem('token');
      return token && token !== 'undefined' ? token : null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Set user data
  setUser: (userData) => {
    try {
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  },

  // Set token
  setToken: (token) => {
    try {
      localStorage.setItem('token', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },

  // Clear auth data
  clearAuth: () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!authUtils.getToken();
  }
};