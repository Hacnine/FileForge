import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
}

function getLocalItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setLocalItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeLocalItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// hydrate from localStorage on startup (SSR-safe)
const initialState: AuthState = {
  user: (() => {
    const stored = getLocalItem('user');
    return stored ? JSON.parse(stored) : null;
  })(),
  accessToken: getLocalItem('accessToken'),
  refreshToken: getLocalItem('refreshToken'),
  isLoading: true,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>,
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isLoading = false;
      state.isInitialized = true;

      setLocalItem('user', JSON.stringify(action.payload.user));
      setLocalItem('accessToken', action.payload.accessToken);
      setLocalItem('refreshToken', action.payload.refreshToken);
    },

    setTokens(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>,
    ) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;

      setLocalItem('accessToken', action.payload.accessToken);
      setLocalItem('refreshToken', action.payload.refreshToken);
    },

    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      setLocalItem('user', JSON.stringify(action.payload));
    },

    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    setAuthInitialized(state) {
      state.isInitialized = true;
    },

    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isLoading = false;
      state.isInitialized = true;

      removeLocalItem('user');
      removeLocalItem('accessToken');
      removeLocalItem('refreshToken');
    },
  },
});

export const {
  setCredentials,
  setTokens,
  setUser,
  setAuthLoading,
  setAuthInitialized,
  logout,
} = authSlice.actions;
export default authSlice.reducer;

