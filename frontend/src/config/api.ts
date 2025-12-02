// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

// Debug: Log if Google Maps API key is missing
if (!GOOGLE_MAPS_API_KEY) {
  console.warn('GOOGLE_MAPS_API_KEY is not set. Address autocomplete will not work.');
  console.warn('Make sure VITE_GOOGLE_MAPS_API_KEY is set in .env.local');
} else {
  console.log('Google Maps API Key loaded:', GOOGLE_MAPS_API_KEY.substring(0, 10) + '...');
}
