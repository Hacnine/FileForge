'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHelper';
import {
  LogOut,
  User,
  Shield,
  Home,
  FolderOpen,
  Building2,
  Users,
  Receipt,
  ChevronLeft,
  UserPlus,
  Trash2,
  Crown,
  Loader2,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import NotificationBell from '@/components/NotificationBell';
import {
  useGetOrganizationByIdQuery,
  useGetMembersQuery,
  useAddMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useGetInvoicesQuery,
} from '@/services/organizationsApi';
import type { OrganizationRole } from '@/types';

type Tab = 'members' | 'invoices';

const roleBadgeStyles: Record<OrganizationRole, string> = {
  OWNER: 'border-yellow-500/30 text-yellow-500',
  ADMIN: 'border-blue-500/30 text-blue-400',
  MEMBER: 'border-border text-muted-foreground',
  VIEWER: 'border-border text-muted-foreground/60',
};

const invoiceStatusConfig = {
  PENDING:   { label: 'Pending',   icon: Clock,         className: 'border-yellow-500/30 text-yellow-500' },
  PAID:      { label: 'Paid',      icon: CheckCircle2,  className: 'border-green-500/30 text-green-400' },
  FAILED:    { label: 'Failed',    icon: XCircle,       className: 'border-red-500/30 text-red-400' },
  CANCELLED: { label: 'Cancelled', icon: Ban,           className: 'border-border text-muted-foreground' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const ROLES: OrganizationRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];

export default function OrganizationDetailPage() {
  const { id: orgId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('members');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', role: 'MEMBER' as OrganizationRole });
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);

  const { data: org, isLoading: orgLoading } = useGetOrganizationByIdQuery(orgId);
  const { data: members = [], isLoading: membersLoading } = useGetMembersQuery(orgId);
  const { data: invoicesData, isLoading: invoicesLoading } = useGetInvoicesQuery({ orgId }, { skip: tab !== 'invoices' });

  const [addMember, { isLoading: adding }] = useAddMemberMutation();
  const [updateRole] = useUpdateMemberRoleMutation();
  const [removeMember, { isLoading: removing }] = useRemoveMemberMutation();

  const invoices = invoicesData?.invoices ?? [];

  const handleAddMember = async () => {
    if (!addForm.email.trim()) return;
    try {
      await addMember({ orgId, email: addForm.email.trim(), role: addForm.role }).unwrap();
      toast.success('Member added');
      setAddMemberOpen(false);
      setAddForm({ email: '', role: 'MEMBER' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRoleChange = async (memberId: string, role: OrganizationRole) => {
    try {
      await updateRole({ orgId, memberId, role }).unwrap();
      toast.success('Role updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberId) return;
    try {
      await removeMember({ orgId, memberId: removeMemberId }).unwrap();
      toast.success('Member removed');
      setRemoveMemberId(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-linear-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="font-bold text-foreground">CloudVault</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard"><Button variant="ghost" size="sm" className="gap-2"><Home className="w-4 h-4" /> Dashboard</Button></Link>
            <Link href="/dashboard/files"><Button variant="ghost" size="sm" className="gap-2"><FolderOpen className="w-4 h-4" /> Files</Button></Link>
            <NotificationBell />
            <Separator orientation="vertical" className="h-6" />
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground"><User className="w-4 h-4" />{user?.firstName}</Button>
            </Link>
            {user?.role === 'ADMIN' && (
              <Link href="/dashboard/admin"><Button variant="ghost" size="sm" className="text-blue-400"><Shield className="w-4 h-4" /></Button></Link>
            )}
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/dashboard/organizations" className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Organizations
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-foreground text-sm font-medium">{orgLoading ? '…' : (org?.name ?? 'Organization')}</span>
        </div>

        {orgLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !org ? (
          <Card className="border-border/60">
            <CardContent className="py-16 text-center text-muted-foreground">Organization not found.</CardContent>
          </Card>
        ) : (
          <>
            {/* Org Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{org.name}</h1>
                {org.slug && <p className="text-sm text-muted-foreground">@{org.slug}</p>}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-border/40">
              {(['members', 'invoices'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                    tab === t
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === 'members' ? <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Members</span>
                   : <span className="flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5" />Invoices</span>}
                </button>
              ))}
            </div>

            {/* Members Tab */}
            {tab === 'members' && (
              <Card className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">
                    Members ({members.length})
                  </CardTitle>
                  <Button size="sm" onClick={() => setAddMemberOpen(true)} className="gap-1.5">
                    <UserPlus className="w-4 h-4" /> Add Member
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {membersLoading ? (
                    <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                  ) : members.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground text-sm">No members yet</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/40">
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((m) => {
                          const isOwner = m.role === 'OWNER';
                          const canManage = org.ownerId === user?.id && !isOwner;
                          return (
                            <TableRow key={m.id} className="border-border/20">
                              <TableCell>
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {m.user ? `${m.user.firstName} ${m.user.lastName}`.trim() : m.userId}
                                  </p>
                                  {m.user?.email && <p className="text-xs text-muted-foreground">{m.user.email}</p>}
                                </div>
                              </TableCell>
                              <TableCell>
                                {canManage ? (
                                  <select
                                    value={m.role}
                                    onChange={(e) => handleRoleChange(m.id, e.target.value as OrganizationRole)}
                                    className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
                                  >
                                    {ROLES.map((r) => (
                                      <option key={r} value={r}>{r}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <Badge variant="outline" className={`text-xs ${roleBadgeStyles[m.role]}`}>
                                    {m.role === 'OWNER' && <Crown className="w-2.5 h-2.5 mr-1" />}
                                    {m.role}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatDate(m.joinedAt)}
                              </TableCell>
                              <TableCell>
                                {canManage && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setRemoveMemberId(m.id)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1 h-auto"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Invoices Tab */}
            {tab === 'invoices' && (
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Invoices</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {invoicesLoading ? (
                    <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                  ) : invoices.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground text-sm">No invoices found</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/40">
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Issued</TableHead>
                          <TableHead>Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((inv) => {
                          const status = invoiceStatusConfig[inv.status as keyof typeof invoiceStatusConfig] ?? invoiceStatusConfig.PENDING;
                          const StatusIcon = status.icon;
                          return (
                            <TableRow key={inv.id} className="border-border/20">
                              <TableCell className="text-sm text-foreground">{inv.description ?? '—'}</TableCell>
                              <TableCell className="text-sm font-medium">{formatCurrency(inv.amount)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-xs gap-1 ${status.className}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{formatDate(inv.issuedAt)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{inv.dueAt ? formatDate(inv.dueAt) : '—'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>Invite a user to this organization by their email address.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="member-email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="member-email"
                type="email"
                placeholder="user@example.com"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-role">Role</Label>
              <select
                id="member-role"
                value={addForm.role}
                onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value as OrganizationRole }))}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={adding || !addForm.email.trim()}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirm Dialog */}
      <Dialog open={!!removeMemberId} onOpenChange={() => setRemoveMemberId(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="text-destructive">Remove Member</DialogTitle>
            <DialogDescription>Are you sure you want to remove this member from the organization?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveMemberId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveMember} disabled={removing}>
              {removing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
