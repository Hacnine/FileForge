import { baseApi } from '@/store/baseApi';
import type { SubscriptionPackage } from '@/types';

export const publicPackagesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicPackages: builder.query<SubscriptionPackage[], void>({
      query: () => '/packages',
      providesTags: ['Packages'],
    }),
  }),
});

export const { useGetPublicPackagesQuery } = publicPackagesApi;
