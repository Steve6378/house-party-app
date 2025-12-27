import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  age?: string;
  bio?: string;
  profile_photo?: string;
  has_face_encoding?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

/**
 * Auth store for user state.
 *
 * Note: Auth tokens are now stored in httpOnly cookies, not in this store.
 * This store only persists user info for UI display.
 * Actual authentication is handled by cookies automatically.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (userData) => set({ user: userData, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (userData) => set((state) => ({ user: state.user ? { ...state.user, ...userData } : null })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
