import { baseApi } from '@/store/baseApi';
import type { SubscriptionHistory, ApiResponse } from '@/types';

export interface SubscriptionStatus {
  hasActivePackage: boolean;
  package?: {
    id: string;
    name: string;
    maxFolders: number;
    maxNestingLevel: number;
    allowedFileTypes: string[];
    maxFileSize: number;
    totalFileLimit: number;
    filesPerFolder: number;
  };
  usage?: {
    folders: number;
    files: number;
  };
  message?: string;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Subscription endpoints
    getSubscriptionHistory: builder.query<{ history: SubscriptionHistory[] }, void>({
      query: () => '/user/subscription-history',
      providesTags: ['Subscription'],
    }),

    getSubscriptionStatus: builder.query<SubscriptionStatus, void>({
      query: () => '/user/subscription-status',
      providesTags: ['Subscription'],
    }),

    subscribePackage: builder.mutation<ApiResponse, { packageId: string }>({
      query: (data) => ({
        url: '/user/subscribe',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Subscription', 'Auth'],
    }),

    unsubscribePackage: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: '/user/unsubscribe',
        method: 'POST',
      }),
      invalidatesTags: ['Subscription', 'Auth'],
    }),

    // Folder endpoints
    createFolder: builder.mutation<{ folder: any }, { name: string }>({
      query: (data) => ({
        url: '/user/folders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Folders'],
    }),

    createSubFolder: builder.mutation<{ folder: any }, { name: string; parentId: string }>({
      query: (data) => ({
        url: '/user/folders/sub',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Folders'],
    }),

    getFolders: builder.query<{ folders: any[] }, void>({
      query: () => '/user/folders',
      providesTags: ['Folders'],
    }),

    deleteFolder: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/user/folders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Folders'],
    }),

    renameFolder: builder.mutation<{ folder: any }, { id: string; name: string }>({
      query: ({ id, name }) => ({
        url: `/user/folders/${id}/rename`,
        method: 'PATCH',
        body: { name },
      }),
      invalidatesTags: ['Folders'],
    }),

    moveFolder: builder.mutation<{ folder: any }, { id: string; newParentId?: string }>({
      query: ({ id, newParentId }) => ({
        url: `/user/folders/${id}/move`,
        method: 'PATCH',
        body: { newParentId },
      }),
      invalidatesTags: ['Folders'],
    }),

    // File endpoints
    getFilesByFolder: builder.query<{ files: any[] }, string>({
      query: (folderId) => `/user/files/folder/${folderId}`,
      providesTags: ['Files'],
    }),

    renameFile: builder.mutation<{ file: any }, { id: string; name: string }>({
      query: ({ id, name }) => ({
        url: `/user/files/${id}/rename`,
        method: 'PATCH',
        body: { name },
      }),
      invalidatesTags: ['Files'],
    }),

    moveFile: builder.mutation<{ file: any }, { id: string; folderId: string }>({
      query: ({ id, folderId }) => ({
        url: `/user/files/${id}/move`,
        method: 'PATCH',
        body: { folderId },
      }),
      invalidatesTags: ['Files'],
    }),

    deleteFile: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/user/files/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Files'],
    }),
  }),
});

export const {
  useGetSubscriptionHistoryQuery,
  useGetSubscriptionStatusQuery,
  useSubscribePackageMutation,
  useUnsubscribePackageMutation,
  useCreateFolderMutation,
  useCreateSubFolderMutation,
  useGetFoldersQuery,
  useDeleteFolderMutation,
  useRenameFolderMutation,
  useMoveFolderMutation,
  useGetFilesByFolderQuery,
  useRenameFileMutation,
  useMoveFileMutation,
  useDeleteFileMutation,
} = userApi;


