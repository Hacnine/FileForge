import { baseApi } from '../store/baseApi';
import type { SubscriptionPackage, ApiResponse } from '../types';

export const packagesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public endpoints - no auth required
    getPublicPackages: builder.query<SubscriptionPackage[], void>({
      query: () => '/admin/packages/public',
      providesTags: ['Packages'],
    }),

    // Admin endpoints
    getPackages: builder.query<SubscriptionPackage[], void>({
      query: () => '/admin/packages',
      providesTags: ['Packages'],
    }),

    getPackageById: builder.query<SubscriptionPackage, string>({
      query: (id) => `/admin/packages/${id}`,
      providesTags: ['Packages'],
    }),

    createPackage: builder.mutation<ApiResponse<SubscriptionPackage>, Partial<SubscriptionPackage>>({
      query: (data) => ({
        url: '/admin/packages',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Packages'],
    }),

    updatePackage: builder.mutation<ApiResponse<SubscriptionPackage>, { id: string; data: Partial<SubscriptionPackage> }>({
      query: ({ id, data }) => ({
        url: `/admin/packages/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Packages'],
    }),

    deletePackage: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/admin/packages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Packages'],
    }),
  }),
});

export const {
  useGetPublicPackagesQuery,
  useGetPackagesQuery,
  useGetPackageByIdQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useDeletePackageMutation,
} = packagesApi;


