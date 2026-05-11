import { baseApi } from '../store/baseApi';
import type {
  AuthResponse,
  ApiResponse,
  LoginCredentials,
  RegisterData,
  User,
} from '../types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<ApiResponse, RegisterData>({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),

    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    verifyEmail: builder.query<ApiResponse, string>({
      query: (token) => `/auth/verify-email?token=${token}`,
    }),

    forgotPassword: builder.mutation<ApiResponse, string>({
      query: (email) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: { email },
      }),
    }),

    resetPassword: builder.mutation<ApiResponse, { token: string; password: string }>({
      query: ({ token, password }) => ({
        url: `/auth/reset-password?token=${token}`,
        method: 'POST',
        body: { password },
      }),
    }),

    getProfile: builder.query<ApiResponse<User>, void>({
      query: () => '/auth/profile',
      providesTags: ['Auth'],
    }),

    logout: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useVerifyEmailQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useLogoutMutation,
} = authApi;

