'use client';

import { useState } from 'react';
import {
  useGetAdminPackagesQuery,
  useCreateAdminPackageMutation,
  useUpdateAdminPackageMutation,
  useDeleteAdminPackageMutation,
} from '@/services/adminApi';
import type { SubscriptionPackage } from '@/types';
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  RefreshCw,
  Loader2,
  AlertCircle,
  Users,
  HardDrive,
  FolderTree,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

type PackageWithCount = SubscriptionPackage & { _count?: { activeUsers: number }; isActive?: boolean; price?: number; description?: string };

const EMPTY_FORM: Partial<PackageWithCount> = {
  name: '',
  description: '',
  price: 0,
  maxFolders: 10,
  maxNestingLevel: 3,
  allowedFileTypes: ['IMAGE', 'PDF'],
  maxFileSize: 10,
  totalFileLimit: 100,
  filesPerFolder: 20,
};

export default function AdminPackagesPage() {
  const { data: packages, isLoading, isError, refetch } = useGetAdminPackagesQuery();
  const [createPackage, { isLoading: creating }] = useCreateAdminPackageMutation();
  const [updatePackage, { isLoading: updating }] = useUpdateAdminPackageMutation();
  const [deletePackage, { isLoading: deleting }] = useDeleteAdminPackageMutation();

  const [form, setForm] = useState<Partial<PackageWithCount>>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PackageWithCount | null>(null);

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setDialogOpen(false); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (name === 'allowedFileTypes') {
      setForm(p => ({ ...p, allowedFileTypes: value.split(',').map(v => v.trim().toUpperCase()).filter(Boolean) }));
    } else if (type === 'number') {
      setForm(p => ({ ...p, [name]: Number(value) }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updatePackage({ id: editingId, data: form }).unwrap();
        toast.success('Package updated');
      } else {
        await createPackage(form).unwrap();
        toast.success('Package created');
      }
      resetForm();
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || 'Something went wrong';
      toast.error(msg);
    }
  };

  const handleEdit = (pkg: PackageWithCount) => {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price ?? 0,
      maxFolders: pkg.maxFolders,
      maxNestingLevel: pkg.maxNestingLevel,
      allowedFileTypes: pkg.allowedFileTypes,
      maxFileSize: pkg.maxFileSize,
      totalFileLimit: pkg.totalFileLimit,
      filesPerFolder: pkg.filesPerFolder,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePackage(deleteTarget.id).unwrap();
      toast.success('Package deleted');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || 'Failed to delete';
      toast.error(msg);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Subscription Packages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {packages ? `${packages.length} packages configured` : 'Manage subscription plans'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refetch} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>
                <Plus className="w-4 h-4" />
                New Package
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Package' : 'Create New Package'}</DialogTitle>
                <DialogDescription>Configure the limits and settings for this subscription plan.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="name">Package Name *</Label>
                    <Input id="name" name="name" value={form.name || ''} onChange={handleChange} placeholder="e.g. Pro Plan" required />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" name="description" value={form.description || ''} onChange={handleChange} placeholder="Brief description…" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="price">Price ($/mo)</Label>
                    <Input id="price" name="price" type="number" min="0" step="0.01" value={form.price ?? ''} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="maxFolders">Max Folders</Label>
                    <Input id="maxFolders" name="maxFolders" type="number" min="1" value={form.maxFolders ?? ''} onChange={handleChange} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="maxNestingLevel">Max Nesting Levels</Label>
                    <Input id="maxNestingLevel" name="maxNestingLevel" type="number" min="1" value={form.maxNestingLevel ?? ''} onChange={handleChange} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                    <Input id="maxFileSize" name="maxFileSize" type="number" min="1" value={form.maxFileSize ?? ''} onChange={handleChange} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="totalFileLimit">Total File Limit</Label>
                    <Input id="totalFileLimit" name="totalFileLimit" type="number" min="1" value={form.totalFileLimit ?? ''} onChange={handleChange} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="filesPerFolder">Files per Folder</Label>
                    <Input id="filesPerFolder" name="filesPerFolder" type="number" min="1" value={form.filesPerFolder ?? ''} onChange={handleChange} required />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                    <Input
                      id="allowedFileTypes"
                      name="allowedFileTypes"
                      value={Array.isArray(form.allowedFileTypes) ? form.allowedFileTypes.join(', ') : ''}
                      onChange={handleChange}
                      placeholder="IMAGE, VIDEO, PDF, AUDIO, OTHER"
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated list of types</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button type="submit" disabled={creating || updating}>
                    {(creating || updating) ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      {isError && (
        <div className="flex flex-col items-center py-16 gap-3">
          <AlertCircle className="w-6 h-6 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load packages</p>
          <Button onClick={refetch} variant="outline" size="sm">Retry</Button>
        </div>
      )}

      {/* Package Cards */}
      {!isLoading && !isError && packages && (
        <>
          {packages.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground border border-dashed border-border/60 rounded-xl">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No packages yet. Create your first subscription plan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {(packages as PackageWithCount[]).map((pkg) => (
                <Card key={pkg.id} className={`border-border/60 hover:border-primary/30 transition-all ${pkg.isActive === false ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        {pkg.description && <CardDescription className="mt-1">{pkg.description}</CardDescription>}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {pkg.price != null && (
                          <Badge variant="secondary" className="text-sm font-bold">
                            ${Number(pkg.price).toFixed(2)}/mo
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className={`text-xs ${pkg.isActive !== false ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-muted text-muted-foreground'}`}
                        >
                          {pkg.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FolderTree className="w-3.5 h-3.5 text-primary" />
                        <span>{pkg.maxFolders} folders</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span>{pkg.maxNestingLevel} levels</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <HardDrive className="w-3.5 h-3.5 text-primary" />
                        <span>{pkg.maxFileSize} MB/file</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <HardDrive className="w-3.5 h-3.5 text-primary" />
                        <span>{pkg.totalFileLimit} total files</span>
                      </div>
                      {pkg._count && (
                        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                          <Users className="w-3.5 h-3.5 text-accent" />
                          <span>{pkg._count.activeUsers} active subscribers</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {pkg.allowedFileTypes.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border/40">
                      <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => handleEdit(pkg)}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        onClick={() => setDeleteTarget(pkg)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Summary Table */}
          {packages.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40">
                      <TableHead className="text-xs pl-6">Name</TableHead>
                      <TableHead className="text-xs">Price</TableHead>
                      <TableHead className="text-xs">Folders</TableHead>
                      <TableHead className="text-xs">Files</TableHead>
                      <TableHead className="text-xs">File Size</TableHead>
                      <TableHead className="text-xs">Subscribers</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(packages as PackageWithCount[]).map((pkg) => (
                      <TableRow key={pkg.id} className="border-border/40">
                        <TableCell className="pl-6 font-medium text-foreground">{pkg.name}</TableCell>
                        <TableCell className="text-muted-foreground">${Number(pkg.price ?? 0).toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">{pkg.maxFolders}</TableCell>
                        <TableCell className="text-muted-foreground">{pkg.totalFileLimit}</TableCell>
                        <TableCell className="text-muted-foreground">{pkg.maxFileSize} MB</TableCell>
                        <TableCell className="text-muted-foreground">{pkg._count?.activeUsers ?? '—'}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${pkg.isActive !== false ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}`}
                          >
                            {pkg.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Package
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the <strong>{deleteTarget?.name}</strong> package?
              This can only be done if no users are currently subscribed to it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

