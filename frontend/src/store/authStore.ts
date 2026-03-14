import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  email: string;
  full_name_ar: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateToken: (accessToken: string) => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  setAuth: (user, accessToken, refreshToken) => {
    // Save to localStorage first
    try {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Also save a timestamp for session tracking
      localStorage.setItem('sessionTimestamp', new Date().toISOString());
      
      // Update state
      set({ user, accessToken, refreshToken });
      
      console.log('Session saved successfully');
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionTimestamp');
    set({ user: null, accessToken: null, refreshToken: null });
  },
  updateToken: (accessToken) => {
    localStorage.setItem('accessToken', accessToken);
    set({ accessToken });
  },
  loadFromStorage: () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const userStr = localStorage.getItem('user');
      
      if (accessToken && refreshToken && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({
            accessToken,
            refreshToken,
            user,
          });
        } catch (parseError) {
          // Invalid user data, clear it
          console.error('Failed to parse user data:', parseError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  },
}));

