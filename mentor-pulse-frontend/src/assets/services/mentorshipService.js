import axios from 'axios';
const API = 'http://localhost:5000/api/mentorship';

export const mentorshipService = {
  sendRequest: async (mentorId, data) => {
    const token = localStorage.getItem('token');
    const res = await axios.post(`${API}/request`, { mentorId, ...data }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  getMentorRequests: async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API}/mentor/requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  getMenteeRequests: async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API}/mentee/requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  updateStatus: async (id, status) => {
    const token = localStorage.getItem('token');
    const res = await axios.patch(`${API}/${id}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
};
