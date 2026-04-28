'use client';

import { useGetAdminStatsQuery } from '@/services/adminApi';
import { useGetAuditLogsQuery } from '@/services/adminApi';
import {
  Users,
  FileText,
  FolderOpen,
  Package,
  HardDrive,
  Building2,
  TrendingUp,
  Activity,
  AlertCircle,
  Loader2,
  UserCheck,
  UserX,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function formatBytes(bytes: string | number): string {
  const n = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(n) || n === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ACTION_COLOR: Record<string, string> = {
  USER_LOGIN: 'text-green-400',
  USER_LOGOUT: 'text-muted-foreground',
  FILE_UPLOAD: 'text-primary',
  FILE_DELETE: 'text-destructive',
  FILE_DOWNLOAD: 'text-blue-400',
  SUBSCRIPTION_CHANGED: 'text-accent',
  USER_REGISTER: 'text-green-400',
  USER_DELETED: 'text-destructive',
};

export default function AdminOverviewPage() {
  const { data: stats, isLoading, isError, refetch } = useGetAdminStatsQuery();
  const { data: logsData } = useGetAuditLogsQuery({ page: 1, limit: 8 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground">Failed to load dashboard stats</p>
        <Button onClick={refetch} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  const statCards = stats ? [
    {
      label: 'Total Users',
      value: stats.users.total.toLocaleString(),
      sub: `${stats.users.active} active`,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Total Files',
      value: stats.files.toLocaleString(),
      sub: `${stats.folders} folders`,
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Active Packages',
      value: stats.packages.toLocaleString(),
      sub: `${stats.subscriptionBreakdown.reduce((total: number, plan) => total + plan.activeUsers, 0)} subscribers`,
      icon: Package,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Organizations',
      value: stats.organizations.toLocaleString(),
      sub: 'Active orgs',
      icon: Building2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: 'Storage Used',
      value: formatBytes(stats.totalStorageUsed),
      sub: 'Across all users',
      icon: HardDrive,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform health and activity at a glance</p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label} className="bg-card border-border/60">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Breakdown */}
        <Card className="lg:col-span-1 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Subscription Plans
            </CardTitle>
            <CardDescription>Active subscribers per plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.subscriptionBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No active plans</p>
            )}
            {stats?.subscriptionBreakdown.map((plan) => {
              const total = stats.subscriptionBreakdown.reduce((a, p) => a + p.activeUsers, 0);
              const pct = total > 0 ? Math.round((plan.activeUsers / total) * 100) : 0;
              return (
                <div key={plan.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-foreground">{plan.name}</span>
                    <span className="text-muted-foreground">{plan.activeUsers} users</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-primary to-accent transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{pct}% of subscribers</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* File Type Breakdown */}
        <Card className="lg:col-span-1 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-400" />
              File Types
            </CardTitle>
            <CardDescription>Distribution by file category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.fileTypeBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No files uploaded yet</p>
            )}
            {stats?.fileTypeBreakdown.map((ft) => {
              const total = stats.fileTypeBreakdown.reduce((a, f) => a + f.count, 0);
              const pct = total > 0 ? Math.round((ft.count / total) * 100) : 0;
              const colors: Record<string, string> = {
                IMAGE: 'from-blue-500 to-cyan-500',
                VIDEO: 'from-purple-500 to-pink-500',
                PDF: 'from-red-500 to-orange-500',
                AUDIO: 'from-green-500 to-emerald-500',
                OTHER: 'from-gray-500 to-slate-500',
              };
              return (
                <div key={ft.type}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{ft.type}</Badge>
                    </div>
                    <span className="text-muted-foreground">{ft.count} files · {formatBytes(ft.totalSize)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-linear-to-r ${colors[ft.type] || colors.OTHER} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="lg:col-span-1 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Recent Signups
            </CardTitle>
            <CardDescription>Latest registered users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats?.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {u.firstName[0]}{u.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">{formatDate(u.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest platform events</CardDescription>
        </CardHeader>
        <CardContent>
          {!logsData?.logs?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs">Resource</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsData.logs.map((log) => (
                  <TableRow key={log.id} className="border-border/40 hover:bg-muted/20">
                    <TableCell className="text-sm">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-foreground">{log.user.firstName} {log.user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-mono font-semibold ${ACTION_COLOR[log.action] || 'text-foreground'}`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono max-w-32 truncate">{log.resource}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{log.ipAddress || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Active vs Inactive */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.users.active.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <UserX className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{(stats.users.total - stats.users.active).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Inactive / Suspended</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
