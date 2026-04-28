'use client';

import { useState } from 'react';
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
  Plus,
  Trash2,
  Users,
  ChevronRight,
  Loader2,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import NotificationBell from '@/components/NotificationBell';
import {
  useGetOrganizationsQuery,
  useCreateOrganizationMutation,
  useDeleteOrganizationMutation,
} from '@/services/organizationsApi';

export default function OrganizationsPage() {
  const { user, logout } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState({ name: '', slug: '' });

  const { data, isLoading } = useGetOrganizationsQuery();
  const [createOrg, { isLoading: creating }] = useCreateOrganizationMutation();
  const [deleteOrg, { isLoading: deleting }] = useDeleteOrganizationMutation();

  const orgs = data ?? [];

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await createOrg({ name: form.name.trim(), slug: form.slug.trim() || undefined }).unwrap();
      toast.success('Organization created');
      setCreateOpen(false);
      setForm({ name: '', slug: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteOrg(deleteConfirm.id).unwrap();
      toast.success('Organization deleted');
      setDeleteConfirm(null);
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Organizations
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your organizations and collaborate with team members
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Organization
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : orgs.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No organizations yet</h3>
              <p className="text-sm text-muted-foreground/60 mt-1">Create an organization to collaborate with your team</p>
              <Button className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4" /> Create Organization
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgs.map((org) => {
              const isOwner = org.ownerId === user?.id;
              return (
                <Card key={org.id} className="border-border/60 hover:border-primary/40 transition-colors group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold">{org.name}</CardTitle>
                          {org.slug && <CardDescription className="text-xs">@{org.slug}</CardDescription>}
                        </div>
                      </div>
                      {isOwner && (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 text-[10px] gap-1">
                          <Crown className="w-2.5 h-2.5" /> Owner
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      {org._count?.members !== undefined && (
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {org._count.members} member{org._count.members !== 1 ? 's' : ''}</span>
                      )}
                      {org._count?.folders !== undefined && (
                        <span className="flex items-center gap-1"><FolderOpen className="w-3.5 h-3.5" /> {org._count.folders} folder{org._count.folders !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/organizations/${org.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                          View <ChevronRight className="w-3 h-3" />
                        </Button>
                      </Link>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm({ id: org.id, name: org.name })}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>Set up a new organization to collaborate with your team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="org-name"
                placeholder="Acme Corp"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-slug">Slug <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="org-slug"
                placeholder="acme-corp"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                className="bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !form.name.trim()}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
