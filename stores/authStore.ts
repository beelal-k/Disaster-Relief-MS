import { create } from 'zustand';

interface AuthState {
  user: null | { id: string; email: string; role: string };
  token: string | null;
  isInitialized: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isInitialized: false,
  
  login: (token, user) => {
    localStorage.setItem('token', token);
    set({ user, token, isInitialized: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isInitialized: true });
  },

  initialize: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return set({ isInitialized: true });
    }

    try {
      // Verify token with backend
      const response = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Invalid token');
      
      const user = await response.json();
      set({ user, token, isInitialized: true });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isInitialized: true });
    }
  }
}));