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
  Trash2,
  RotateCcw,
  FolderOpen,
  File as FileIcon,
  Image,
  Video,
  FileAudio,
  FileText,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  useGetTrashQuery,
  useRestoreFromTrashMutation,
  useEmptyTrashMutation,
} from '@/services/fileManagerApi';

function fileTypeIcon(type?: string) {
  switch (type) {
    case 'IMAGE': return <Image className="w-4 h-4 text-green-500" />;
    case 'VIDEO': return <Video className="w-4 h-4 text-blue-500" />;
    case 'AUDIO': return <FileAudio className="w-4 h-4 text-yellow-500" />;
    case 'PDF':   return <FileText className="w-4 h-4 text-red-500" />;
    default:      return <FileIcon className="w-4 h-4 text-gray-500" />;
  }
}

function formatSize(bytes: string | number | undefined): string {
  if (!bytes) return '—';
  const n = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function timeAgo(date: string): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function TrashPage() {
  const { user, logout } = useAuth();
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const { data: trash, isLoading } = useGetTrashQuery();
  const [restore, { isLoading: restoring }] = useRestoreFromTrashMutation();
  const [emptyTrash, { isLoading: emptying }] = useEmptyTrashMutation();

  const files = trash?.files ?? [];
  const folders = trash?.folders ?? [];
  const totalItems = files.length + folders.length;

  const handleRestore = async (type: 'file' | 'folder', id: string, name: string) => {
    try {
      await restore({ type, id }).unwrap();
      toast.success(`"${name}" restored`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await emptyTrash().unwrap();
      toast.success('Trash emptied');
      setConfirmEmpty(false);
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
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2"><Home className="w-4 h-4" /> Dashboard</Button>
            </Link>
            <Link href="/dashboard/files">
              <Button variant="ghost" size="sm" className="gap-2"><FolderOpen className="w-4 h-4" /> Files</Button>
            </Link>
            <NotificationBell />
            <Separator orientation="vertical" className="h-6" />
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                {user?.firstName}
              </Button>
            </Link>
            {user?.role === 'ADMIN' && (
              <Link href="/dashboard/admin">
                <Button variant="ghost" size="sm" className="gap-1 text-blue-400"><Shield className="w-4 h-4" /></Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground gap-2">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-muted-foreground" />
              Trash
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {totalItems === 0
                ? 'Trash is empty'
                : `${totalItems} item${totalItems !== 1 ? 's' : ''} — files here will be permanently deleted when you empty the trash`}
            </p>
          </div>
          {totalItems > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmEmpty(true)}
              disabled={emptying}
              className="gap-2"
            >
              {emptying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Empty Trash
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : totalItems === 0 ? (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Trash2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">Trash is empty</h3>
              <p className="text-sm text-muted-foreground/60 mt-1">Deleted files and folders will appear here</p>
              <Link href="/dashboard/files" className="mt-4">
                <Button variant="outline" size="sm">Go to Files</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Trashed Folders */}
            {folders.length > 0 && (
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-yellow-500" />
                    Folders ({folders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40">
                    {folders.map((folder) => (
                      <div key={folder.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <FolderOpen className="w-4 h-4 text-yellow-500 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{folder.name}</p>
                            <p className="text-xs text-muted-foreground">Deleted {timeAgo(folder.deletedAt)}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore('folder', folder.id, folder.name)}
                          disabled={restoring}
                          className="gap-1.5 text-xs"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trashed Files */}
            {files.length > 0 && (
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileIcon className="w-4 h-4 text-blue-500" />
                    Files ({files.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          {fileTypeIcon(file.fileType)}
                          <div>
                            <p className="text-sm font-medium text-foreground">{file.originalName ?? file.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {file.fileType && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{file.fileType}</Badge>
                              )}
                              {file.size && (
                                <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                              )}
                              <span className="text-xs text-muted-foreground">Deleted {timeAgo(file.deletedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore('file', file.id, file.originalName ?? file.name)}
                          disabled={restoring}
                          className="gap-1.5 text-xs"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Confirm Empty Dialog */}
      <Dialog open={confirmEmpty} onOpenChange={setConfirmEmpty}>
        <DialogContent className="sm:max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Empty Trash?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{totalItems} item{totalItems !== 1 ? 's' : ''}</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmEmpty(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleEmptyTrash} disabled={emptying}>
              {emptying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
