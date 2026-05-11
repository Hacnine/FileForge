import { baseApi } from '@/store/baseApi';
import type {
  AdminStats,
  AdminUser,
  AuditLog,
  StorageProvider,
  PaginationMeta,
  SubscriptionPackage,
  GrowthDataPoint,
} from '@/types';

// ── Response shapes ──────────────────────────────────────────────────────────

interface UsersResponse {
  success: boolean;
  users: AdminUser[];
  pagination: PaginationMeta;
}

interface UserResponse {
  success: boolean;
  user: AdminUser;
}

interface AuditLogsResponse {
  success: boolean;
  logs: AuditLog[];
  pagination: PaginationMeta;
}

interface StorageProvidersResponse {
  success: boolean;
  providers: StorageProvider[];
}

interface PackagesResponse {
  success: boolean;
  packages?: SubscriptionPackage[];
}

interface GrowthResponse {
  success: boolean;
  data: GrowthDataPoint[];
}

// ── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // Stats
    getAdminStats: builder.query<AdminStats, void>({
      query: () => '/admin/stats',
      transformResponse: (res: { success: boolean; stats: AdminStats }) => res.stats,
      providesTags: ['AdminStats'],
    }),

    getUserGrowth: builder.query<GrowthDataPoint[], number | void>({
      query: (days = 30) => `/admin/user-growth?days=${days}`,
      transformResponse: (res: GrowthResponse) => res.data,
      providesTags: ['AdminStats'],
    }),

    // Users
    getAdminUsers: builder.query<UsersResponse, { page?: number; limit?: number; search?: string; role?: string }>({
      query: ({ page = 1, limit = 20, search, role } = {}) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.set('search', search);
        if (role) params.set('role', role);
        return `/admin/users?${params}`;
      },
      providesTags: ['AdminUsers'],
    }),

    getAdminUserById: builder.query<AdminUser, string>({
      query: (id) => `/admin/users/${id}`,
      transformResponse: (res: UserResponse) => res.user,
      providesTags: ['AdminUsers'],
    }),

    updateAdminUser: builder.mutation<AdminUser, { id: string; data: Partial<{ role: string; isActive: boolean; firstName: string; lastName: string }> }>({
      query: ({ id, data }) => ({
        url: `/admin/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (res: UserResponse) => res.user,
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),

    deleteAdminUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),

    // Packages (admin)
    getAdminPackages: builder.query<SubscriptionPackage[], void>({
      query: () => '/admin/packages',
      providesTags: ['Packages'],
    }),

    createAdminPackage: builder.mutation<SubscriptionPackage, Partial<SubscriptionPackage>>({
      query: (data) => ({ url: '/admin/packages', method: 'POST', body: data }),
      invalidatesTags: ['Packages', 'AdminStats'],
    }),

    updateAdminPackage: builder.mutation<SubscriptionPackage, { id: string; data: Partial<SubscriptionPackage> }>({
      query: ({ id, data }) => ({ url: `/admin/packages/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Packages', 'AdminStats'],
    }),

    deleteAdminPackage: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/packages/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Packages', 'AdminStats'],
    }),

    // Audit Logs
    getAuditLogs: builder.query<AuditLogsResponse, { page?: number; limit?: number; userId?: string; action?: string }>({
      query: ({ page = 1, limit = 50, userId, action } = {}) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (userId) params.set('userId', userId);
        if (action) params.set('action', action);
        return `/admin/audit-logs?${params}`;
      },
      providesTags: ['AuditLogs'],
    }),

    // Storage Providers
    getStorageProviders: builder.query<StorageProvider[], void>({
      query: () => '/admin/storage-providers',
      transformResponse: (res: StorageProvidersResponse) => res.providers,
      providesTags: ['StorageProviders'],
    }),

    createStorageProvider: builder.mutation<StorageProvider, { name: string; type: string; bucket?: string; region?: string; endpoint?: string }>({
      query: (data) => ({ url: '/admin/storage-providers', method: 'POST', body: data }),
      invalidatesTags: ['StorageProviders'],
    }),

    updateStorageProvider: builder.mutation<StorageProvider, { id: string; name?: string; type?: string; bucket?: string; region?: string; endpoint?: string; isActive?: boolean }>({
      query: ({ id, ...data }) => ({ url: `/admin/storage-providers/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['StorageProviders'],
    }),

    deleteStorageProvider: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/storage-providers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['StorageProviders'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminStatsQuery,
  useGetUserGrowthQuery,
  useGetAdminUsersQuery,
  useGetAdminUserByIdQuery,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useGetAdminPackagesQuery,
  useCreateAdminPackageMutation,
  useUpdateAdminPackageMutation,
  useDeleteAdminPackageMutation,
  useGetAuditLogsQuery,
  useGetStorageProvidersQuery,
  useCreateStorageProviderMutation,
  useUpdateStorageProviderMutation,
  useDeleteStorageProviderMutation,
} = adminApi;

