import axios from 'axios';
import { API_URL } from '../config/api';

// Create axios instance with base config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage);
        const token = authData.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: { email: string; password: string; name: string; phone?: string }) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Events API
export const eventsAPI = {
  list: async (params?: { skip?: number; limit?: number; status?: string; event_type?: string }) => {
    const response = await api.get('/api/events', { params });
    return response.data;
  },

  get: async (eventId: string) => {
    const response = await api.get(`/api/events/${eventId}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    event_type: string;
    date: string;
    time?: string;
    address?: string;
    group_id?: string;
    budget_per_person?: number;
    expected_guests?: number;
    visibility?: string;
  }) => {
    const response = await api.post('/api/events', data);
    return response.data;
  },

  update: async (eventId: string, data: Partial<{
    name: string;
    event_type: string;
    date: string;
    time: string;
    address: string;
    budget_per_person: number;
    expected_guests: number;
    visibility: string;
    status: string;
  }>) => {
    const response = await api.put(`/api/events/${eventId}`, data);
    return response.data;
  },

  delete: async (eventId: string) => {
    const response = await api.delete(`/api/events/${eventId}`);
    return response.data;
  },

  archive: async (eventId: string) => {
    const response = await api.post(`/api/events/${eventId}/archive`);
    return response.data;
  },
};

// Messages API
export const messagesAPI = {
  list: async (eventId: string, params?: { skip?: number; limit?: number }) => {
    const response = await api.get(`/api/events/${eventId}/messages`, { params });
    return response.data;
  },

  send: async (eventId: string, data: { content: string; message_type?: string }) => {
    const response = await api.post(`/api/events/${eventId}/messages`, data);
    return response.data;
  },
};

// Ground Truth API
export const groundTruthAPI = {
  list: async (eventId: string) => {
    const response = await api.get(`/api/events/${eventId}/ground_truth`);
    return response.data;
  },

  create: async (eventId: string, data: {
    category: string;
    content: string;
    keywords?: string[];
  }) => {
    const response = await api.post(`/api/events/${eventId}/ground_truth`, data);
    return response.data;
  },

  update: async (factId: string, data: {
    category?: string;
    content?: string;
    keywords?: string[];
    is_active?: boolean;
  }) => {
    const response = await api.put(`/api/ground_truth/${factId}`, data);
    return response.data;
  },

  delete: async (factId: string) => {
    const response = await api.delete(`/api/ground_truth/${factId}`);
    return response.data;
  },

  query: async (eventId: string, question: string) => {
    const response = await api.post(`/api/events/${eventId}/ground_truth/query`, { question });
    return response.data;
  },
};

// AI Assistant API
export const aiAPI = {
  guestQuery: async (eventId: string, question: string) => {
    const response = await api.post('/api/ai/query', { event_id: eventId, question });
    return response.data;
  },

  hostAssist: async (eventId: string, task: string, context?: any) => {
    const response = await api.post('/api/ai/host-assist', { event_id: eventId, task, context });
    return response.data;
  },
};

// Attendance/Invitation API
export const attendanceAPI = {
  inviteUser: async (eventId: string, email: string, message?: string) => {
    const response = await api.post(`/api/events/${eventId}/invite`, { email, message });
    return response.data;
  },

  getMyInvitations: async () => {
    const response = await api.get('/api/events/invitations');
    return response.data;
  },

  updateAttendance: async (eventId: string, data: {
    rsvp_status: 'yes' | 'no' | 'maybe';
    plus_ones?: number;
    rsvp_notes?: string;
  }) => {
    const response = await api.put(`/api/events/${eventId}/attendance`, data);
    return response.data;
  },

  getAttendees: async (eventId: string) => {
    const response = await api.get(`/api/events/${eventId}/attendees`);
    return response.data;
  },
};

export default api;
