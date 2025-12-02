// Centralized Google Maps initialization
// This ensures the API key is set once before any libraries are loaded

import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_API_KEY } from '../config/api';

let loaderInstance = null;
let isInitialized = false;

// Create a single loader instance with the API key
const getLoader = () => {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places']
    });
  }
  return loaderInstance;
};

// Initialize Google Maps - call this before using any Google Maps features
export const initGoogleMaps = async () => {
  if (isInitialized) {
    return window.google;
  }

  const loader = getLoader();

  try {
    await loader.load();
    isInitialized = true;
    console.log('Google Maps initialized successfully');
    return window.google;
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
    throw error;
  }
};

// Check if Google Maps is ready
export const isGoogleMapsReady = () => {
  return isInitialized && window.google;
};

// Get the loader instance (for advanced use cases)
export { getLoader };
