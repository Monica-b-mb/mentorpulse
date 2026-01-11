import { api } from './api.js';
export const chatService = {
  // Get user's chat list
  getUserChats: async () => {
    try {
      const response = await api.get('/api/chat/my-chats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch chats');
    }
  },

  // Get available users to chat with
  getAvailableUsers: async () => {
    try {
      const response = await api.get('/api/chat/available-users');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch available users');
    }
  },

  // Get or create chat
  getOrCreateChat: async (participantId) => {
    try {
      const response = await api.post('/api/chat/get-or-create', { participantId });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get or create chat');
    }
  },

  // Get chat messages
  getChatMessages: async (chatId, page = 1, limit = 50) => {
    try {
      const response = await api.get(`/api/chat/${chatId}/messages?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch messages');
    }
  },

  // Send message (HTTP fallback)
  sendMessage: async (chatId, content, messageType = 'text') => {
    try {
      const response = await api.post(`/api/chat/${chatId}/messages`, {
        content,
        messageType
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
  },

  // Mark messages as read
  markAsRead: async (chatId) => {
    try {
      const response = await api.patch(`/api/chat/${chatId}/read`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mark as read');
    }
  }
};