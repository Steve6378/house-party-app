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
      // Token expired or invalid - clear auth state
      // ProtectedRoute will handle redirect to login (no page reload needed)
      localStorage.removeItem('auth-storage');
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

  updateProfile: async (data: { name?: string; phone?: string; age?: string; bio?: string; address?: string; latitude?: number; longitude?: number }) => {
    const response = await api.put('/api/auth/me', data);
    return response.data;
  },

  uploadProfilePhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/auth/me/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getProfilePhotoUrl: () => {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage);
        const token = authData.state?.token;
        if (token) {
          return `${API_URL}/api/auth/me/photo?token=${token}`;
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error);
      }
    }
    return null;
  },

  refreshFaceEncoding: async () => {
    const response = await api.post('/api/auth/me/refresh-face-encoding');
    return response.data;
  },

  disableFaceRecognition: async () => {
    const response = await api.delete('/api/auth/me/face-recognition');
    return response.data;
  },

  autoLocate: async () => {
    const response = await api.get('/api/auth/me/auto-locate');
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
    is_online?: boolean;
    online_link?: string;
    is_paid?: boolean;
    ticket_price?: number;
    latitude?: number;
    longitude?: number;
    description?: string;
    topics?: string[];
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

  discoverPublic: async (params?: {
    skip?: number;
    limit?: number;
    latitude?: number;
    longitude?: number;
    radius_km?: number;
    is_online?: boolean;
    is_free?: boolean;
  }) => {
    const response = await api.get('/api/events/discover/public', { params });
    return response.data;
  },

  join: async (eventId: string) => {
    const response = await api.post(`/api/events/${eventId}/join`);
    return response.data;
  },

  // Cover image methods
  uploadCoverImage: async (eventId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/events/${eventId}/cover-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  generateCoverImage: async (eventId: string, preview: boolean = false) => {
    const response = await api.post(`/api/events/${eventId}/cover-image/generate?preview=${preview}`);
    return response.data;
  },

  applyCoverImage: async (eventId: string, coverImageUrl: string) => {
    const response = await api.post(`/api/events/${eventId}/cover-image/apply`, {
      cover_image_url: coverImageUrl
    });
    return response.data;
  },

  deleteCoverImage: async (eventId: string) => {
    const response = await api.delete(`/api/events/${eventId}/cover-image`);
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

// Ground Truth API (backend uses /facts endpoints)
export const groundTruthAPI = {
  list: async (eventId: string) => {
    const response = await api.get(`/api/events/${eventId}/facts`);
    return response.data;
  },

  create: async (eventId: string, data: {
    category: string;
    content: string;
    keywords?: string[];
  }) => {
    const response = await api.post(`/api/events/${eventId}/facts`, data);
    return response.data;
  },

  update: async (eventId: string, factId: string, data: {
    category?: string;
    content?: string;
    keywords?: string[];
    is_active?: boolean;
  }) => {
    const response = await api.put(`/api/events/${eventId}/facts/${factId}`, data);
    return response.data;
  },

  delete: async (eventId: string, factId: string) => {
    const response = await api.delete(`/api/events/${eventId}/facts/${factId}`);
    return response.data;
  },

  query: async (eventId: string, question: string) => {
    const response = await api.post(`/api/events/${eventId}/ask`, { question });
    return response.data;
  },
};

// Conversation message type for AI chat history
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// AI Assistant API
export const aiAPI = {
  guestQuery: async (eventId: string, question: string, conversationHistory?: ConversationMessage[]) => {
    const response = await api.post('/api/ai/guest-query', {
      event_id: eventId,
      question,
      conversation_history: conversationHistory
    });
    return response.data;
  },

  hostAssist: async (eventId: string, task: string, context?: any, conversationHistory?: ConversationMessage[]) => {
    const response = await api.post('/api/ai/host-assist', {
      event_id: eventId,
      task,
      context,
      conversation_history: conversationHistory
    });
    return response.data;
  },

  searchPhotos: async (query: string, eventId?: string, limit: number = 10) => {
    // Uses find-my-photos endpoint (face recognition based)
    // Note: text-based search is not implemented, this uses face matching
    if (!eventId) {
      return { photos: [], message: 'Event ID required', total_found: 0 };
    }
    const response = await api.post('/api/ai/find-my-photos', { event_id: eventId });
    return response.data;
  },

  searchVendors: async (eventId: string, vendorType: string, query?: string, radius: number = 5000) => {
    // Uses recommendation endpoint (Google Places API)
    const searchQuery = query || vendorType;
    const response = await api.post('/api/ai/recommendation', {
      event_id: eventId,
      query: searchQuery,
      radius
    });
    // Map the response to expected vendor format
    const data = response.data;
    return {
      vendors: data.places.map((place: any) => ({
        place_id: place.place_id,
        name: place.name,
        address: place.address,
        rating: place.rating,
        total_ratings: place.total_ratings,
        price_level: place.price_level,
        photos: [],
        is_open: place.opening_hours === 'Open now'
      })),
      message: data.message,
      total_found: data.total_found
    };
  },

  broadcast: async (eventId: string, message: string, messageType: string = 'announcement') => {
    const response = await api.post('/api/ai/broadcast', {
      event_id: eventId,
      message,
      message_type: messageType
    });
    return response.data;
  },

  getFAQs: async (eventId: string) => {
    const response = await api.get(`/api/ai/faq/${eventId}`);
    return response.data;
  },

  recordFAQ: async (eventId: string, question: string, answer: string) => {
    const response = await api.post('/api/ai/record-faq', {
      event_id: eventId,
      question,
      answer
    });
    return response.data;
  },

  findMyPhotos: async (eventId: string) => {
    const response = await api.post('/api/ai/find-my-photos', { event_id: eventId });
    return response.data;
  },

  generalQuery: async (question: string, conversationHistory?: ConversationMessage[], eventId?: string) => {
    const response = await api.post('/api/ai/general-query', {
      question,
      conversation_history: conversationHistory,
      event_id: eventId
    });
    return response.data;
  },

  generateDescription: async (data: {
    name: string;
    event_type: string;
    topics?: string[];
    date?: string;
    address?: string;
    expected_guests?: number;
    is_online?: boolean;
  }) => {
    const response = await api.post('/api/ai/generate-description', data);
    return response.data;
  },

  recommendation: async (eventId: string, query: string, radius: number = 5000) => {
    const response = await api.post('/api/ai/recommendation', {
      event_id: eventId,
      query,
      radius
    });
    return response.data;
  },

  executeAction: async (eventId: string, functionName: string, args: Record<string, any>) => {
    const response = await api.post('/api/ai/execute-action', {
      event_id: eventId,
      function: functionName,
      args
    });
    return response.data;
  },
};

// Documents API (PDF extraction for AI context)
export const documentsAPI = {
  upload: async (eventId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/events/${eventId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  list: async (eventId: string) => {
    const response = await api.get(`/api/events/${eventId}/documents`);
    return response.data;
  },

  delete: async (eventId: string, documentId: string) => {
    const response = await api.delete(`/api/events/${eventId}/documents/${documentId}`);
    return response.data;
  },
};

// Photos API
export const photosAPI = {
  upload: async (eventId: string, file: File, caption?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }
    const response = await api.post(`/api/events/${eventId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  list: async (eventId: string) => {
    const response = await api.get(`/api/events/${eventId}/photos`);
    return response.data;
  },

  getFile: async (photoId: string) => {
    const response = await api.get(`/api/events/photos/${photoId}/file`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (eventId: string, photoId: string) => {
    const response = await api.delete(`/api/events/${eventId}/photos/${photoId}`);
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

  // Invite link methods
  createInviteLink: async (eventId: string, options?: {
    role?: 'attendee' | 'cohost';
    expires_in_hours?: number;
    max_uses?: number;
  }) => {
    const response = await api.post(`/api/events/${eventId}/invite-link`, options || {});
    return response.data;
  },

  listInviteLinks: async (eventId: string) => {
    const response = await api.get(`/api/events/${eventId}/invite-links`);
    return response.data;
  },

  revokeInviteLink: async (eventId: string, token: string) => {
    const response = await api.delete(`/api/events/${eventId}/invite-link/${token}`);
    return response.data;
  },

  // Co-host management
  addCoHost: async (eventId: string, email: string, permissions?: string) => {
    const response = await api.post(`/api/events/${eventId}/cohosts`, {
      email,
      permissions: permissions || 'edit_facts'
    });
    return response.data;
  },

  getCohosts: async (eventId: string) => {
    const response = await api.get(`/api/events/${eventId}/cohosts`);
    return response.data;
  },

  removeCoHost: async (eventId: string, userId: string) => {
    const response = await api.delete(`/api/events/${eventId}/cohosts/${userId}`);
    return response.data;
  },
};

// Public invite API (for accepting invites)
export const inviteAPI = {
  getDetails: async (token: string) => {
    const response = await api.get(`/api/invite/${token}`);
    return response.data;
  },

  accept: async (token: string) => {
    const response = await api.post(`/api/invite/${token}/accept`);
    return response.data;
  },
};

// Groups API
export const groupsAPI = {
  create: async (data: { name: string; description?: string; is_private?: boolean }) => {
    const response = await api.post('/api/groups', data);
    return response.data;
  },

  list: async () => {
    const response = await api.get('/api/groups');
    return response.data;
  },

  get: async (groupId: string) => {
    const response = await api.get(`/api/groups/${groupId}`);
    return response.data;
  },

  update: async (groupId: string, data: { name?: string; description?: string; is_private?: boolean }) => {
    const response = await api.put(`/api/groups/${groupId}`, data);
    return response.data;
  },

  delete: async (groupId: string) => {
    const response = await api.delete(`/api/groups/${groupId}`);
    return response.data;
  },

  addMember: async (groupId: string, userId: string) => {
    const response = await api.post(`/api/groups/${groupId}/members`, { user_id: userId });
    return response.data;
  },

  removeMember: async (groupId: string, userId: string) => {
    const response = await api.delete(`/api/groups/${groupId}/members/${userId}`);
    return response.data;
  },

  getEvents: async (groupId: string) => {
    const response = await api.get(`/api/groups/${groupId}/events`);
    return response.data;
  },

  getMessages: async (groupId: string, skip?: number, limit?: number) => {
    const response = await api.get(`/api/groups/${groupId}/messages`, {
      params: { skip, limit }
    });
    return response.data;
  },

  sendMessage: async (groupId: string, content: string) => {
    const response = await api.post(`/api/groups/${groupId}/messages`, {
      content,
      message_type: 'user'
    });
    return response.data;
  },
};

export default api;
