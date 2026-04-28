'use client';

import { useState } from 'react';
import {
  useGetAdminUsersQuery,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
} from '@/services/adminApi';
import type { AdminUser } from '@/types';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
  Trash2,
  MoreVertical,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

function formatBytes(bytes: string | number): string {
  const n = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(n) || n === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.max(n, 1)) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type ActionMenu = { user: AdminUser; open: boolean };

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionMenu, setActionMenu] = useState<ActionMenu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const { data, isLoading, isError, refetch } = useGetAdminUsersQuery({
    page,
    limit: 15,
    search: search || undefined,
    role: roleFilter || undefined,
  });

  const [updateUser, { isLoading: updating }] = useUpdateAdminUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteAdminUserMutation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      await updateUser({ id: user.id, data: { isActive: !user.isActive } }).unwrap();
      toast.success(`User ${user.isActive ? 'suspended' : 'activated'}`);
      setActionMenu(null);
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleToggleRole = async (user: AdminUser) => {
    try {
      const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
      await updateUser({ id: user.id, data: { role: newRole } }).unwrap();
      toast.success(`Role changed to ${newRole}`);
      setActionMenu(null);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || 'Failed to change role';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id).unwrap();
      toast.success('User deleted');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || 'Failed to delete user';
      toast.error(msg);
    }
  };

  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pagination ? `${pagination.total.toLocaleString()} total users` : 'Manage all platform users'}
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>
            <Button type="submit" size="sm">Search</Button>
            {(search || roleFilter) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(''); setSearchInput(''); setRoleFilter(''); setPage(1); }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Users</CardTitle>
          <CardDescription>
            Page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {isError && (
            <div className="flex flex-col items-center py-16 gap-3">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load users</p>
              <Button onClick={refetch} variant="outline" size="sm">Retry</Button>
            </div>
          )}
          {!isLoading && !isError && (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-xs pl-6">User</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Plan</TableHead>
                  <TableHead className="text-xs">Files</TableHead>
                  <TableHead className="text-xs">Storage</TableHead>
                  <TableHead className="text-xs">Last Login</TableHead>
                  <TableHead className="text-xs">Joined</TableHead>
                  <TableHead className="text-xs text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
                {data?.users?.map((user) => (
                  <TableRow key={user.id} className="border-border/40 hover:bg-muted/20">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {user.role === 'ADMIN' ? <Shield className="w-3 h-3 mr-1" /> : null}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${user.isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                      >
                        {user.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.activePackage ? (
                        <Badge variant="secondary" className="text-xs">{user.activePackage.name}</Badge>
                      ) : (
                        <span className="text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span title={`${user._count.folders} folders`}>{user._count.files} / {user._count.folders}f</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatBytes(user.storageUsed)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(user.lastLoginAt)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-1 relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setActionMenu(prev => prev?.user.id === user.id ? null : { user, open: true })}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        {actionMenu?.user.id === user.id && (
                          <div className="absolute right-0 top-8 z-10 min-w-44 rounded-xl border border-border/60 bg-card shadow-xl py-1">
                            <button
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted/40 transition-colors"
                              onClick={() => handleToggleRole(user)}
                              disabled={updating}
                            >
                              {user.role === 'ADMIN' ? <ShieldOff className="w-4 h-4 text-muted-foreground" /> : <Shield className="w-4 h-4 text-primary" />}
                              {user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                            </button>
                            <button
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted/40 transition-colors"
                              onClick={() => handleToggleActive(user)}
                              disabled={updating}
                            >
                              {user.isActive ? <UserX className="w-4 h-4 text-orange-400" /> : <UserCheck className="w-4 h-4 text-green-400" />}
                              {user.isActive ? 'Suspend' : 'Activate'}
                            </button>
                            <div className="border-t border-border/40 my-1" />
                            <button
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                              onClick={() => { setDeleteTarget(user); setActionMenu(null); }}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete User
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border/40 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1} className="h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-foreground font-medium">{page}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages} className="h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong> ({deleteTarget?.email})?
              This action cannot be undone and will remove all their files and data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
