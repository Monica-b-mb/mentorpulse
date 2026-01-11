import axios from 'axios';

const API_URL = 'https://mentorpulse.onrender.com/api';

export const mentorService = {
  getAllMentors: async () => {
    try {
      console.log('🔄 Fetching mentors from API...');
      const response = await axios.get(`${API_URL}/mentors`);
      console.log('✅ Mentors API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching mentors:', error);
      throw new Error('Failed to fetch mentors from server');
    }
  }
};
