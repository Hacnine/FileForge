'use client';

import { useState } from 'react';
import { useGetStorageProvidersQuery, useCreateStorageProviderMutation } from '@/services/adminApi';
import {
  HardDrive,
  Plus,
  RefreshCw,
  Loader2,
  AlertCircle,
  Cloud,
  Server,
  Database,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  s3: Cloud,
  gcs: Cloud,
  azure: Cloud,
  local: Server,
};

const TYPE_COLOR: Record<string, string> = {
  s3: 'text-orange-400 bg-orange-400/10',
  gcs: 'text-blue-400 bg-blue-400/10',
  azure: 'text-cyan-400 bg-cyan-400/10',
  local: 'text-green-400 bg-green-400/10',
};

const TYPES = ['s3', 'gcs', 'azure', 'local'];

export default function AdminStoragePage() {
  const { data: providers, isLoading, isError, refetch } = useGetStorageProvidersQuery();
  const [createProvider, { isLoading: creating }] = useCreateStorageProviderMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 's3', bucket: '', region: '', endpoint: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProvider({
        name: form.name,
        type: form.type,
        bucket: form.bucket || undefined,
        region: form.region || undefined,
        endpoint: form.endpoint || undefined,
      }).unwrap();
      toast.success('Storage provider created');
      setDialogOpen(false);
      setForm({ name: '', type: 's3', bucket: '', region: '', endpoint: '' });
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || 'Failed to create provider';
      toast.error(msg);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-primary" />
            Storage Providers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {providers ? `${providers.length} provider(s) configured` : 'Manage storage backends'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Storage Provider</DialogTitle>
                <DialogDescription>Configure a new storage backend for file storage.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sp-name">Provider Name *</Label>
                  <Input id="sp-name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Primary S3" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp-type">Provider Type *</Label>
                  <select
                    id="sp-type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
                {form.type !== 'local' && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="sp-bucket">Bucket</Label>
                      <Input id="sp-bucket" name="bucket" value={form.bucket} onChange={handleChange} placeholder="my-bucket" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sp-region">Region</Label>
                      <Input id="sp-region" name="region" value={form.region} onChange={handleChange} placeholder="us-east-1" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sp-endpoint">Endpoint (optional)</Label>
                      <Input id="sp-endpoint" name="endpoint" value={form.endpoint} onChange={handleChange} placeholder="https://s3.example.com" />
                    </div>
                  </>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Provider'}
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
          <p className="text-sm text-muted-foreground">Failed to load providers</p>
          <Button onClick={refetch} variant="outline" size="sm">Retry</Button>
        </div>
      )}

      {/* Provider Cards */}
      {!isLoading && !isError && providers && (
        <>
          {providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border border-dashed border-border/60 rounded-xl gap-4">
              <Database className="w-12 h-12 opacity-30" />
              <div className="text-center">
                <p className="font-medium">No storage providers configured</p>
                <p className="text-sm mt-1">Add your first storage backend to start managing files.</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Provider
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {providers.map((provider) => {
                const Icon = TYPE_ICON[provider.type] || Server;
                const colorClass = TYPE_COLOR[provider.type] || 'text-primary bg-primary/10';
                return (
                  <Card key={provider.id} className="border-border/60 hover:border-primary/30 transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{provider.name}</CardTitle>
                            {provider.isDefault && (
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className={`text-xs ${colorClass}`}>
                              {provider.type.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      {provider.bucket && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground/60">Bucket</span>
                          <span className="font-mono text-xs">{provider.bucket}</span>
                        </div>
                      )}
                      {provider.region && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground/60">Region</span>
                          <span className="font-mono text-xs">{provider.region}</span>
                        </div>
                      )}
                      {provider.endpoint && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground/60">Endpoint</span>
                          <span className="font-mono text-xs truncate max-w-32" title={provider.endpoint}>{provider.endpoint}</span>
                        </div>
                      )}
                      {provider._count && (
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <span className="text-xs font-medium text-foreground/60">Files stored</span>
                          <span className="font-semibold text-foreground">{provider._count.files.toLocaleString()}</span>
                        </div>
                      )}
                      {!provider.bucket && !provider.region && !provider.endpoint && (
                        <p className="text-xs italic">No additional configuration</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Info card */}
      <Card className="border-border/60 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Supported Storage Types</CardTitle>
          <CardDescription>Configure any of the following backends as your file storage layer.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { type: 's3', label: 'Amazon S3', desc: 'AWS Simple Storage Service' },
              { type: 'gcs', label: 'Google Cloud Storage', desc: 'GCP object storage' },
              { type: 'azure', label: 'Azure Blob Storage', desc: 'Microsoft Azure storage' },
              { type: 'local', label: 'Local Filesystem', desc: 'Server local disk storage' },
            ].map(({ type, label, desc }) => {
              const Icon = TYPE_ICON[type] || Server;
              const colorClass = TYPE_COLOR[type] || 'text-primary bg-primary/10';
              return (
                <div key={type} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

