'use client';

import { useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setCredentials,
  setUser,
  logout as logoutAction,
  setAuthLoading,
  setAuthInitialized,
} from '../store/authSlice';
import {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useLazyGetProfileQuery,
} from '../services/authApi';

interface AuthHookReturn {
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

export function AuthInitializer({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const isInitialized = useAppSelector((state) => state.auth.isInitialized);
  const [triggerGetProfile] = useLazyGetProfileQuery();

  useEffect(() => {
    if (isInitialized) return;

    const verifyAuth = async () => {
      dispatch(setAuthLoading(true));

      if (!accessToken) {
        dispatch(setAuthLoading(false));
        dispatch(setAuthInitialized());
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
        dispatch(setAuthLoading(false));
        dispatch(setAuthInitialized());
      }
    };

    verifyAuth();
  }, [accessToken, dispatch, isInitialized, triggerGetProfile]);

  return <>{children}</>;
}

export function useAuth(): AuthHookReturn {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const isAuthenticated = Boolean(user);

  const [loginMutation] = useLoginMutation();
  const [registerMutation] = useRegisterMutation();
  const [logoutMutation] = useLogoutMutation();
  const [triggerGetProfile] = useLazyGetProfileQuery();

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

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshProfile,
  };
}

