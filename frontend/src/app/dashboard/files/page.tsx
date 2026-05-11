'use client';

import { useState, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthStore';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHelper';
import {
  LogOut,
  User,
  Shield,
  FolderOpen,
  FolderPlus,
  FileUp,
  Trash2,
  Pencil,
  ArrowLeft,
  ChevronRight,
  Image,
  Video,
  FileAudio,
  FileText,
  File as FileIcon,
  MoreVertical,
  FolderInput,
  Home,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  useGetFoldersQuery,
  useCreateFolderMutation,
  useCreateSubFolderMutation,
  useDeleteFolderMutation,
  useRenameFolderMutation,
  useMoveFolderMutation,
  useGetFilesByFolderQuery,
  useUploadFileMutation,
  useRenameFileMutation,
  useMoveFileMutation,
  useDeleteFileMutation,
} from '@/services/fileManagerApi';
import type { Folder, FileItem } from '@/types';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

// ── helpers ────────────────────────────────────────────────────────────────
function fileTypeIcon(fileType: string) {
  switch (fileType) {
    case 'IMAGE':
      return <Image className="w-5 h-5 text-green-500" />;
    case 'VIDEO':
      return <Video className="w-5 h-5 text-blue-500" />;
    case 'AUDIO':
      return <FileAudio className="w-5 h-5 text-yellow-500" />;
    case 'PDF':
      return <FileText className="w-5 h-5 text-red-500" />;
    default:
      return <FileIcon className="w-5 h-5 text-gray-500" />;
  }
}

function formatSize(bytes: number | string) {
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

// ── component ──────────────────────────────────────────────────────────────
export default function FileManagerPage() {
  const { user, logout } = useAuth();

  // state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<
    | null
    | 'createFolder'
    | 'createSubFolder'
    | 'renameFolder'
    | 'moveFolder'
    | 'renameFile'
    | 'moveFile'
  >(null);
  const [dialogInput, setDialogInput] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // queries
  const { data: folders = [], isLoading: foldersLoading } = useGetFoldersQuery();
  const { data: files = [], isLoading: filesLoading } = useGetFilesByFolderQuery(
    currentFolderId!,
    { skip: !currentFolderId },
  );

  // mutations
  const [createFolder, { isLoading: creatingFolder }] = useCreateFolderMutation();
  const [createSubFolder, { isLoading: creatingSubFolder }] = useCreateSubFolderMutation();
  const [deleteFolder] = useDeleteFolderMutation();
  const [renameFolder] = useRenameFolderMutation();
  const [moveFolder] = useMoveFolderMutation();
  const [uploadFile, { isLoading: uploading }] = useUploadFileMutation();
  const [renameFile] = useRenameFileMutation();
  const [moveFile] = useMoveFileMutation();
  const [deleteFile] = useDeleteFileMutation();

  // derived
  const currentFolder = folders.find((f) => f.id === currentFolderId) ?? null;

  const childFolders = useMemo(
    () =>
      folders.filter((f) =>
        currentFolderId ? f.parentId === currentFolderId : f.parentId === null,
      ),
    [folders, currentFolderId],
  );

  // breadcrumb trail
  const breadcrumbs = useMemo(() => {
    const trail: Folder[] = [];
    let id = currentFolderId;
    while (id) {
      const f = folders.find((fo) => fo.id === id);
      if (f) {
        trail.unshift(f);
        id = f.parentId;
      } else break;
    }
    return trail;
  }, [folders, currentFolderId]);

  // ── handlers ───────────────────────────────────────────────────────────
  const openDialog = (
    type: typeof dialogType,
    folder?: Folder,
    file?: FileItem,
  ) => {
    setDialogType(type);
    setDialogInput(folder?.name ?? file?.name ?? '');
    setSelectedFolder(folder ?? null);
    setSelectedFile(file ?? null);
    setActionMenuId(null);
  };

  const closeDialog = () => {
    setDialogType(null);
    setDialogInput('');
    setSelectedFolder(null);
    setSelectedFile(null);
  };

  const handleDialogSubmit = async () => {
    try {
      if (dialogType === 'createFolder') {
        await createFolder({ name: dialogInput }).unwrap();
        toast.success('Folder created');
      } else if (dialogType === 'createSubFolder' && currentFolderId) {
        await createSubFolder({ name: dialogInput, parentId: currentFolderId }).unwrap();
        toast.success('Subfolder created');
      } else if (dialogType === 'renameFolder' && selectedFolder) {
        await renameFolder({ id: selectedFolder.id, name: dialogInput }).unwrap();
        toast.success('Folder renamed');
      } else if (dialogType === 'moveFolder' && selectedFolder) {
        await moveFolder({ id: selectedFolder.id, newParentId: dialogInput || null }).unwrap();
        toast.success('Folder moved');
      } else if (dialogType === 'renameFile' && selectedFile) {
        await renameFile({ id: selectedFile.id, name: dialogInput }).unwrap();
        toast.success('File renamed');
      } else if (dialogType === 'moveFile' && selectedFile) {
        await moveFile({ id: selectedFile.id, folderId: dialogInput }).unwrap();
        toast.success('File moved');
      }
    } catch (err) {
      toast.error(getErrorMessage(err as FetchBaseQueryError));
    }
    closeDialog();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentFolderId) return;
    try {
      await uploadFile({ folderId: currentFolderId, file }).unwrap();
      toast.success('File uploaded');
    } catch (err) {
      toast.error(getErrorMessage(err as FetchBaseQueryError));
    }
    e.target.value = '';
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Delete this folder and all its contents?')) return;
    try {
      await deleteFolder(id).unwrap();
      toast.success('Folder deleted');
    } catch (err) {
      toast.error(getErrorMessage(err as FetchBaseQueryError));
    }
    setActionMenuId(null);
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm('Delete this file?')) return;
    try {
      await deleteFile(id).unwrap();
      toast.success('File deleted');
    } catch (err) {
      toast.error(getErrorMessage(err as FetchBaseQueryError));
    }
    setActionMenuId(null);
  };

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ─ Main ─ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-sm flex-wrap">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Home className="w-4 h-4" /> Root
          </button>
          {breadcrumbs.map((bc) => (
            <span key={bc.id} className="flex items-center gap-1">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <button
                onClick={() => setCurrentFolderId(bc.id)}
                className={`hover:text-foreground ${
                  bc.id === currentFolderId ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
              >
                {bc.name}
              </button>
            </span>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          {currentFolderId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentFolderId(currentFolder?.parentId ?? null)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => openDialog(currentFolderId ? 'createSubFolder' : 'createFolder')}
          >
            <FolderPlus className="w-4 h-4 mr-1" /> New Folder
          </Button>

          {currentFolderId && (
            <>
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <FileUp className="w-4 h-4 mr-1" />
                )}
                Upload File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                title="Upload a file"
                onChange={handleUpload}
              />
            </>
          )}
        </div>

        {/* Content */}
        {foldersLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Folders ── */}
            {childFolders.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Folders</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {childFolders.map((folder) => (
                    <Card
                      key={folder.id}
                      className="group relative cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                    >
                      <CardContent
                        className="pt-4 pb-3 flex items-center gap-3"
                        onClick={() => setCurrentFolderId(folder.id)}
                      >
                        <FolderOpen className="w-8 h-8 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{folder.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(folder.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>

                      {/* action menu */}
                      <div className="absolute top-2 right-2">
                        <button
                          className="p-1 rounded hover:bg-muted"
                          title="Folder actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuId(actionMenuId === folder.id ? null : folder.id);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {actionMenuId === folder.id && (
                          <div className="absolute right-0 top-8 z-10 w-40 rounded-md border bg-popover shadow-md text-sm">
                            <button
                              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDialog('renameFolder', folder);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" /> Rename
                            </button>
                            <button
                              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDialog('moveFolder', folder);
                              }}
                            >
                              <FolderInput className="w-3.5 h-3.5" /> Move
                            </button>
                            <button
                              className="flex items-center gap-2 w-full px-3 py-2 text-destructive hover:bg-muted"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* ── Files ── */}
            {currentFolderId && (
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Files</h3>
                {filesLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : files.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                      No files in this folder yet. Click <strong>Upload File</strong> to add one.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((file) => (
                      <Card key={file.id} className="group relative hover:ring-2 hover:ring-primary/20 transition-all">
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-center gap-3">
                            {fileTypeIcon(file.fileType)}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate text-sm">{file.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {file.originalName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatSize(file.size)} &middot;{' '}
                                {new Date(file.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>

                        {/* action menu */}
                        <div className="absolute top-2 right-2">
                          <button
                            className="p-1 rounded hover:bg-muted"
                            title="File actions"
                            onClick={() =>
                              setActionMenuId(actionMenuId === file.id ? null : file.id)
                            }
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {actionMenuId === file.id && (
                            <div className="absolute right-0 top-8 z-10 w-40 rounded-md border bg-popover shadow-md text-sm">
                              <button
                                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted"
                                onClick={() => openDialog('renameFile', undefined, file)}
                              >
                                <Pencil className="w-3.5 h-3.5" /> Rename
                              </button>
                              <button
                                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted"
                                onClick={() => openDialog('moveFile', undefined, file)}
                              >
                                <FolderInput className="w-3.5 h-3.5" /> Move
                              </button>
                              <button
                                className="flex items-center gap-2 w-full px-3 py-2 text-destructive hover:bg-muted"
                                onClick={() => handleDeleteFile(file.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* empty state – root with no folders */}
            {!currentFolderId && childFolders.length === 0 && (
              <Card>
                <CardContent className="py-16 text-center space-y-4">
                  <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground" />
                  <CardTitle className="text-lg">No folders yet</CardTitle>
                  <CardDescription>
                    Create your first folder to start organising files.
                  </CardDescription>
                  <Button onClick={() => openDialog('createFolder')}>
                    <FolderPlus className="w-4 h-4 mr-1" /> New Folder
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* ── Dialogs ── */}
      <Dialog open={dialogType !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'createFolder' && 'Create Folder'}
              {dialogType === 'createSubFolder' && 'Create Sub-Folder'}
              {dialogType === 'renameFolder' && 'Rename Folder'}
              {dialogType === 'moveFolder' && 'Move Folder'}
              {dialogType === 'renameFile' && 'Rename File'}
              {dialogType === 'moveFile' && 'Move File'}
            </DialogTitle>
            <DialogDescription>
              {(dialogType === 'moveFolder' || dialogType === 'moveFile') ? (
                'Select the target folder ID (leave empty for root when moving a folder).'
              ) : (
                'Enter a name below.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <Label htmlFor="dialog-input">
              {dialogType === 'moveFolder' || dialogType === 'moveFile'
                ? 'Target Folder ID'
                : 'Name'}
            </Label>
            <Input
              id="dialog-input"
              value={dialogInput}
              onChange={(e) => setDialogInput(e.target.value)}
              placeholder={
                dialogType === 'moveFolder'
                  ? 'Folder ID (blank = root)'
                  : dialogType === 'moveFile'
                  ? 'Target Folder ID'
                  : 'Enter name…'
              }
              onKeyDown={(e) => e.key === 'Enter' && handleDialogSubmit()}
            />

            {/* For move operations show a quick folder picker */}
            {(dialogType === 'moveFolder' || dialogType === 'moveFile') && folders.length > 0 && (
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {dialogType === 'moveFolder' && (
                  <button
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted ${
                      dialogInput === '' ? 'bg-muted font-medium' : ''
                    }`}
                    onClick={() => setDialogInput('')}
                  >
                    <Home className="w-3.5 h-3.5" /> Root
                  </button>
                )}
                {folders
                  .filter((f) => f.id !== selectedFolder?.id && f.id !== selectedFile?.folderId)
                  .map((f) => (
                    <button
                      key={f.id}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted ${
                        dialogInput === f.id ? 'bg-muted font-medium' : ''
                      }`}
                      onClick={() => setDialogInput(f.id)}
                    >
                      <FolderOpen className="w-3.5 h-3.5" /> {f.name}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleDialogSubmit}
              disabled={
                creatingFolder ||
                creatingSubFolder ||
                (!dialogInput &&
                  dialogType !== 'moveFolder')
              }
            >
              {(creatingFolder || creatingSubFolder) && (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

