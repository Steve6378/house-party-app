const API_BASE = '/api';

export const api = {
  // Autocomplete
  getSuggestions: async (keyword) => {
    const response = await fetch(`${API_BASE}/suggest?keyword=${encodeURIComponent(keyword)}`);
    return response.json();
  },

  // Event Search
  searchEvents: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/events?${queryString}`);
    return response.json();
  },

  // Event Details
  getEventDetails: async (id) => {
    const response = await fetch(`${API_BASE}/events/${id}`);
    return response.json();
  },

  // Spotify Artist
  getArtist: async (name) => {
    const response = await fetch(`${API_BASE}/spotify/artist?name=${encodeURIComponent(name)}`);
    return response.json();
  },

  // Favorites
  getFavorites: async () => {
    const response = await fetch(`${API_BASE}/favorites`);
    return response.json();
  },

  addFavorite: async (event) => {
    const response = await fetch(`${API_BASE}/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    return response.json();
  },

  removeFavorite: async (id) => {
    const response = await fetch(`${API_BASE}/favorites/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// IPinfo API (called directly from frontend)
export const getLocation = async () => {
  try {
    const response = await fetch('https://ipinfo.io/json?token=66e8a1256f48d9');
    return response.json();
  } catch (error) {
    console.error('IPinfo error:', error);
    // Fallback to approximate location
    return { loc: '34.0522,-118.2437' }; // LA as default
  }
};

// Google Geocoding API (called directly from frontend)
export const geocodeLocation = async (address) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyC0pZESmcvudSPIJptKdTh5L46xkD_dyd0`
    );
    return response.json();
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};
