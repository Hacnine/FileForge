'use client';

import React, { useState, useEffect } from 'react';
import {
  useGetPackagesQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useDeletePackageMutation,
} from '@/services/packagesApi';
import { SubscriptionPackage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';

export default function PackagesPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const { data: packages, isLoading, error } = useGetPackagesQuery();
  const [createPackage, { isLoading: isCreating }] =
    useCreatePackageMutation();
  const [updatePackage, { isLoading: isUpdating }] =
    useUpdatePackageMutation();
  const [deletePackage] = useDeletePackageMutation();

  const [formState, setFormState] = useState<Partial<SubscriptionPackage>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setFormState({});
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | string[] = value;
    if (name === 'allowedFileTypes') {
      newValue = value.split(',').map((v) => v.trim());
    } else if (type === 'number') {
      newValue = Number(value);
    }
    setFormState((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updatePackage({ id: editingId, data: formState }).unwrap();
        toast.success('Package updated successfully');
      } else {
        await createPackage(formState).unwrap();
        toast.success('Package created successfully');
      }
      resetForm();
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleEdit = (pkg: SubscriptionPackage) => {
    setEditingId(pkg.id);
    setFormState({
      name: pkg.name,
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
    if (!deletingId) return;
    try {
      await deletePackage(deletingId).unwrap();
      toast.success('Package deleted successfully');
    } catch {
      toast.error('Failed to delete package');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Subscription Packages
              </h1>
              <p className="text-muted-foreground text-sm">
                Manage your subscription packages
              </p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null);
                  setFormState({});
                }}
              >
                <Plus className="h-4 w-4" />
                New Package
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Package' : 'Create New Package'}
                </DialogTitle>
                <DialogDescription>
                  {editingId
                    ? 'Update the package details below.'
                    : 'Fill in the details for a new subscription package.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Package Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formState.name || ''}
                      onChange={handleChange}
                      placeholder="e.g. Pro Plan"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxFolders">Max Folders</Label>
                    <Input
                      id="maxFolders"
                      name="maxFolders"
                      type="number"
                      value={formState.maxFolders ?? ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxNestingLevel">Max Nesting Level</Label>
                    <Input
                      id="maxNestingLevel"
                      name="maxNestingLevel"
                      type="number"
                      value={formState.maxNestingLevel ?? ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="allowedFileTypes">
                      Allowed File Types{' '}
                      <span className="text-muted-foreground font-normal">
                        (comma separated)
                      </span>
                    </Label>
                    <Input
                      id="allowedFileTypes"
                      name="allowedFileTypes"
                      value={
                        Array.isArray(formState.allowedFileTypes)
                          ? formState.allowedFileTypes.join(', ')
                          : formState.allowedFileTypes || ''
                      }
                      onChange={handleChange}
                      placeholder="pdf, jpg, png, docx"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                    <Input
                      id="maxFileSize"
                      name="maxFileSize"
                      type="number"
                      value={formState.maxFileSize ?? ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalFileLimit">Total File Limit</Label>
                    <Input
                      id="totalFileLimit"
                      name="totalFileLimit"
                      type="number"
                      value={formState.totalFileLimit ?? ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filesPerFolder">Files Per Folder</Label>
                    <Input
                      id="filesPerFolder"
                      name="filesPerFolder"
                      type="number"
                      value={formState.filesPerFolder ?? ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating || isUpdating}
                  >
                    {(isCreating || isUpdating) && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Packages Table */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Packages</CardTitle>
            <CardDescription>
              All subscription packages available in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <p className="text-destructive text-sm py-4">
                Failed to load packages
              </p>
            )}

            {packages && packages.length === 0 && (
              <p className="text-muted-foreground text-sm py-4">
                No packages defined yet. Create your first one above.
              </p>
            )}

            {packages && packages.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Max Folders</TableHead>
                    <TableHead>File Types</TableHead>
                    <TableHead>Max Size</TableHead>
                    <TableHead>Total Files</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell>{pkg.maxFolders}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {pkg.allowedFileTypes.slice(0, 3).map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                          {pkg.allowedFileTypes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{pkg.allowedFileTypes.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{pkg.maxFileSize} MB</TableCell>
                      <TableCell>{pkg.totalFileLimit}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(pkg)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(pkg.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Package</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this package? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
