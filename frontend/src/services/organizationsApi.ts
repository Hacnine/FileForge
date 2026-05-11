import { baseApi } from '@/store/baseApi';
import type {
  Organization,
  OrganizationMember,
  OrganizationRole,
  Invoice,
  Payment,
  PaginationMeta,
} from '@/types';

interface OrgsResponse {
  success: boolean;
  organizations: Organization[];
}

interface OrgResponse {
  success: boolean;
  organization: Organization;
}

interface MembersResponse {
  success: boolean;
  members: OrganizationMember[];
}

interface InvoicesResponse {
  success: boolean;
  invoices: Invoice[];
  pagination: PaginationMeta;
}

export const organizationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Organizations ──────────────────────────────────────────────────────
    getOrganizations: builder.query<Organization[], void>({
      query: () => '/organizations',
      transformResponse: (res: OrgsResponse) => res.organizations,
      providesTags: ['Organizations'],
    }),

    getOrganizationById: builder.query<Organization, string>({
      query: (id) => `/organizations/${id}`,
      transformResponse: (res: OrgResponse) => res.organization,
      providesTags: (_r, _e, id) => [{ type: 'Organizations', id }],
    }),

    createOrganization: builder.mutation<Organization, { name: string; slug?: string }>({
      query: (body) => ({ url: '/organizations', method: 'POST', body }),
      transformResponse: (res: OrgResponse) => res.organization,
      invalidatesTags: ['Organizations'],
    }),

    updateOrganization: builder.mutation<Organization, { id: string; name?: string; isActive?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/organizations/${id}`, method: 'PATCH', body }),
      transformResponse: (res: OrgResponse) => res.organization,
      invalidatesTags: (_r, _e, { id }) => ['Organizations', { type: 'Organizations', id }],
    }),

    deleteOrganization: builder.mutation<void, string>({
      query: (id) => ({ url: `/organizations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Organizations'],
    }),

    // ── Members ────────────────────────────────────────────────────────────
    getMembers: builder.query<OrganizationMember[], string>({
      query: (orgId) => `/organizations/${orgId}/members`,
      transformResponse: (res: MembersResponse) => res.members,
      providesTags: (_r, _e, orgId) => [{ type: 'Organizations', id: `${orgId}-members` }],
    }),

    addMember: builder.mutation<OrganizationMember, { orgId: string; email: string; role?: OrganizationRole }>({
      query: ({ orgId, ...body }) => ({ url: `/organizations/${orgId}/members`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { orgId }) => [{ type: 'Organizations', id: `${orgId}-members` }],
    }),

    updateMemberRole: builder.mutation<OrganizationMember, { orgId: string; memberId: string; role: OrganizationRole }>({
      query: ({ orgId, memberId, role }) => ({
        url: `/organizations/${orgId}/members/${memberId}`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: (_r, _e, { orgId }) => [{ type: 'Organizations', id: `${orgId}-members` }],
    }),

    removeMember: builder.mutation<void, { orgId: string; memberId: string }>({
      query: ({ orgId, memberId }) => ({
        url: `/organizations/${orgId}/members/${memberId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { orgId }) => [{ type: 'Organizations', id: `${orgId}-members` }],
    }),

    // ── Billing / Invoices ─────────────────────────────────────────────────
    getInvoices: builder.query<InvoicesResponse, { orgId: string; page?: number; status?: string }>({
      query: ({ orgId, page = 1, status }) => {
        const qs = new URLSearchParams({ page: String(page) });
        if (status) qs.set('status', status);
        return `/organizations/${orgId}/billing/invoices?${qs}`;
      },
      providesTags: (_r, _e, { orgId }) => [{ type: 'Organizations', id: `${orgId}-invoices` }],
    }),

    createInvoice: builder.mutation<Invoice, { orgId: string; amount: number; description?: string; dueAt?: string }>({
      query: ({ orgId, ...body }) => ({
        url: `/organizations/${orgId}/billing/invoices`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { orgId }) => [{ type: 'Organizations', id: `${orgId}-invoices` }],
    }),

    createPayment: builder.mutation<Payment, { orgId: string; invoiceId: string; method: string; amount: number; reference?: string }>({
      query: ({ orgId, invoiceId, ...body }) => ({
        url: `/organizations/${orgId}/billing/invoices/${invoiceId}/payments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { orgId }) => [{ type: 'Organizations', id: `${orgId}-invoices` }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOrganizationsQuery,
  useGetOrganizationByIdQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useGetMembersQuery,
  useAddMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useCreatePaymentMutation,
} = organizationsApi;

