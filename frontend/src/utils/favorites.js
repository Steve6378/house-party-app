import { create } from 'zustand';
import { api } from './api';

export const useFavorites = create((set, get) => ({
  favorites: [],
  initialized: false,

  // Initialize from backend
  init: async () => {
    try {
      const data = await api.getFavorites();
      const favorites = Array.isArray(data) ? data : [];
      set({ favorites, initialized: true });
    } catch (error) {
      console.error('Failed to initialize favorites:', error);
      set({ favorites: [], initialized: true });
    }
  },

  // Check if event is favorite
  isFavorite: (eventId) => {
    const favorites = get().favorites;
    if (!Array.isArray(favorites)) return false;
    return favorites.some(f => f.id === eventId);
  },

  // Add favorite
  addFavorite: async (event) => {
    try {
      await api.addFavorite(event);
      const currentFavorites = get().favorites;
      set({ favorites: [...(Array.isArray(currentFavorites) ? currentFavorites : []), event] });
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  },

  // Remove favorite
  removeFavorite: async (eventId) => {
    try {
      await api.removeFavorite(eventId);
      const currentFavorites = get().favorites;
      set({ favorites: (Array.isArray(currentFavorites) ? currentFavorites : []).filter(f => f.id !== eventId) });
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  },
}));
