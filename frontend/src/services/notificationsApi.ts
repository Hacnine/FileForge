import { baseApi } from '@/store/baseApi';
import type { AppNotification, PaginationMeta } from '@/types';

interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: PaginationMeta;
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, { page?: number; limit?: number } | void>({
      query: (params) => {
        const p = params ?? {};
        const qs = new URLSearchParams();
        if (p.page) qs.set('page', String(p.page));
        if (p.limit) qs.set('limit', String(p.limit));
        return `/user/notifications${qs.toString() ? `?${qs}` : ''}`;
      },
      transformResponse: (res: NotificationsResponse) => res,
      providesTags: ['Notifications'],
    }),

    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/user/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notifications'],
    }),

    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: '/user/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notifications'],
    }),

    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({ url: `/user/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notifications'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;

