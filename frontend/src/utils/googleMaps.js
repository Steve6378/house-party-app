// Centralized Google Maps initialization
// This ensures the API key is set once before any libraries are loaded
// Updated to use dynamic script loading (the @googlemaps/js-api-loader Loader class is deprecated)

import { GOOGLE_MAPS_API_KEY } from '../config/api';

let isInitialized = false;
let googleInstance = null;

// Initialize Google Maps using the new functional API
export const initGoogleMaps = async () => {
  if (isInitialized && googleInstance) {
    return googleInstance;
  }

  // Check if already loaded via script tag
  if (window.google && window.google.maps) {
    isInitialized = true;
    googleInstance = window.google;
    console.log('Google Maps already loaded');
    return window.google;
  }

  try {
    // Load Google Maps using dynamic script injection
    await loadGoogleMapsScript();

    // Wait for places library to be available
    if (window.google && window.google.maps) {
      // Import the places library
      await window.google.maps.importLibrary('places');

      isInitialized = true;
      googleInstance = window.google;
      console.log('Google Maps initialized successfully');
      return window.google;
    }

    throw new Error('Google Maps failed to load');
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
    throw error;
  }
};

// Load Google Maps script dynamically
const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', resolve);
      existingScript.addEventListener('error', reject);
      return;
    }

    // Create and load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('Google Maps script loaded');
      resolve();
    };

    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });
};

// Check if Google Maps is ready
export const isGoogleMapsReady = () => {
  return isInitialized && window.google && window.google.maps;
};
