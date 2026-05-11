import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import type { RootState } from './index';
import { logout, setTokens } from './authSlice';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// ── base query with automatic token refresh ─────────────────────────────────
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // skip refresh for auth endpoints
    const url = typeof args === 'string' ? args : args.url;
    if (url?.includes('/auth')) {
      return result;
    }

    const refreshToken = (api.getState() as RootState).auth.refreshToken;
    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        {
          url: '/auth/refresh-token',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const data = (refreshResult.data as { data: { accessToken: string; refreshToken: string } }).data;
        api.dispatch(setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken }));
        // retry the original request
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

// ── RTK Query API (empty – endpoints injected by feature slices) ────────────
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth',
    'Packages',
    'Folders',
    'Files',
    'Subscription',
    'AdminStats',
    'AdminUsers',
    'AuditLogs',
    'StorageProviders',
    'Organizations',
    'Notifications',
  ],
  endpoints: () => ({}),
});

