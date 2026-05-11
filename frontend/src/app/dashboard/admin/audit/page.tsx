'use client';

import { useState } from 'react';
import { useGetAuditLogsQuery } from '@/services/adminApi';
import {
  FileText,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Filter,
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

const ACTION_BADGE: Record<string, string> = {
  USER_LOGIN: 'bg-green-500/10 text-green-400 border-green-500/20',
  USER_LOGOUT: 'bg-muted text-muted-foreground',
  USER_REGISTER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  USER_UPDATED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  USER_DELETED: 'bg-red-500/10 text-red-400 border-red-500/20',
  FILE_UPLOAD: 'bg-primary/10 text-primary border-primary/20',
  FILE_DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
  FILE_DOWNLOAD: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  FILE_RENAME: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  FILE_MOVE: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  FILE_SHARE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  FOLDER_CREATE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  FOLDER_DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
  SUBSCRIPTION_CHANGED: 'bg-accent/10 text-accent border-accent/20',
  PASSWORD_CHANGED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const ACTION_OPTIONS = [
  'USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTER', 'USER_UPDATED', 'USER_DELETED',
  'FILE_UPLOAD', 'FILE_DELETE', 'FILE_DOWNLOAD', 'FILE_RENAME', 'FILE_MOVE', 'FILE_SHARE',
  'FOLDER_CREATE', 'FOLDER_DELETE', 'FOLDER_RENAME', 'FOLDER_MOVE',
  'SUBSCRIPTION_CHANGED', 'PASSWORD_CHANGED', 'SHARE_LINK_CREATED', 'SHARE_LINK_REVOKED',
];

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading, isError, refetch } = useGetAuditLogsQuery({
    page,
    limit: 20,
    userId: userId || undefined,
    action: actionFilter || undefined,
  });

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setUserId(userIdInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setUserId(''); setUserIdInput(''); setActionFilter(''); setPage(1);
  };

  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pagination ? `${pagination.total.toLocaleString()} total events` : 'Complete platform activity trail'}
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
          <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48 space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="w-3 h-3" />Filter by User ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Paste user UUID…"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="w-3 h-3" />Action Type</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-48"
              >
                <option value="">All Actions</option>
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm">Apply</Button>
            {(userId || actionFilter) && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Event Log</CardTitle>
          <CardDescription>
            {pagination ? `Page ${pagination.page} of ${pagination.totalPages}` : 'All events'}
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
              <p className="text-sm text-muted-foreground">Failed to load audit logs</p>
              <Button onClick={refetch} variant="outline" size="sm">Retry</Button>
            </div>
          )}
          {!isLoading && !isError && (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-xs pl-6">Timestamp</TableHead>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs">Resource</TableHead>
                  <TableHead className="text-xs">IP Address</TableHead>
                  <TableHead className="text-xs pr-6">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.logs?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No audit logs found matching the current filters
                    </TableCell>
                  </TableRow>
                )}
                {data?.logs?.map((log) => (
                  <TableRow key={log.id} className="border-border/40 hover:bg-muted/20">
                    <TableCell className="pl-6 text-xs text-muted-foreground whitespace-nowrap">
                      <div>{new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="font-mono">{new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div>
                          <p className="text-sm font-medium text-foreground">{log.user.firstName} {log.user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">{log.userId}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs font-mono ${ACTION_BADGE[log.action] || 'bg-muted text-muted-foreground'}`}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono max-w-48 truncate" title={log.resource ?? undefined}>
                      {log.resource ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {log.ipAddress || '—'}
                    </TableCell>
                    <TableCell className="pr-6 text-xs text-muted-foreground max-w-40">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <span className="font-mono text-xs truncate block max-w-36" title={JSON.stringify(log.metadata)}>
                          {JSON.stringify(log.metadata).slice(0, 60)}…
                        </span>
                      ) : '—'}
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
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1} className="h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-foreground font-medium px-2">{page} / {pagination.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages} className="h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

