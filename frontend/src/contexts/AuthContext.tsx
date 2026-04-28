'use client';

import { createContext, useContext, useEffect, useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { useAppDispatch, useAppSelector } from '../store';
import { setCredentials, setUser, logout as logoutAction } from '../store/authSlice';
import {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useLazyGetProfileQuery,
} from '../services/authApi';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<string>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  const user = useAppSelector((s) => s.auth.user);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = !!user;

  const [loginMutation] = useLoginMutation();
  const [registerMutation] = useRegisterMutation();
  const [logoutMutation] = useLogoutMutation();
  const [triggerGetProfile] = useLazyGetProfileQuery();

  // On mount: if we have a token, verify it by fetching the profile
  useEffect(() => {
    const verifyAuth = async () => {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await triggerGetProfile().unwrap();
        if (result.success && result.data) {
          dispatch(setUser(result.data));
        }
      } catch {
        dispatch(logoutAction());
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [accessToken, dispatch, triggerGetProfile]);

  // Redirect to /login when the store says logged-out (e.g. after token refresh failure)
  useEffect(() => {
    if (!isLoading && !user && !accessToken) {
      // only redirect when it looks like the user was previously signed in
      // (localStorage already cleared by logoutAction)
    }
  }, [isLoading, user, accessToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await loginMutation({ email, password }).unwrap();

      if (response.success) {
        const { user: userData, accessToken: at, refreshToken: rt } = response.data;
        dispatch(setCredentials({ user: userData, accessToken: at, refreshToken: rt }));
      }
    },
    [dispatch, loginMutation],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
    ): Promise<string> => {
      const response = await registerMutation({
        email,
        password,
        firstName,
        lastName,
      }).unwrap();
      return response.message || 'Registration successful';
    },
    [registerMutation],
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // ignore
    } finally {
      dispatch(logoutAction());
    }
  }, [dispatch, logoutMutation]);

  const refreshProfile = useCallback(async () => {
    try {
      const result = await triggerGetProfile().unwrap();
      if (result.success && result.data) {
        dispatch(setUser(result.data));
      }
    } catch {
      // silently fail
    }
  }, [dispatch, triggerGetProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
