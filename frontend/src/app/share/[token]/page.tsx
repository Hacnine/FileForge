import { Cloud, FileIcon, FileText, Image as ImageIcon, Video, FileAudio } from 'lucide-react';
import Link from 'next/link';
import { ShareDownloadSection, ShareErrorPage } from './ShareClient';

// SSR — force-dynamic
//
// Why force-dynamic here (not ISR or SSG)?
//   Share links can be revoked, expired, or use-count limited at any moment.
//   Caching this page — even for a minute — could show a "download available"
//   UI to someone whose link was just revoked.
//
//   This is a real product correctness requirement, not a preference.
//   The server MUST check link validity on every request.
//
// How it works:
//   1. Browser navigates to /share/:token
//   2. Next.js server calls /api/share/:token (our Route Handler)
//   3. The Route Handler proxies GET /api/files/share/:token/info on the Express backend
//   4. Express checks: is the link active? expired? max-uses reached? returns metadata
//   5. Next.js renders HTML with file info server-side — SEO friendly, correct state
//   6. The download button is a Client Component island (ShareDownloadSection)

export const dynamic = 'force-dynamic';

interface ShareInfo {
  fileName: string;
  mimeType: string;
  size: string;
  fileType: string;
  expiresAt: string | null;
  hasPassword: boolean;
  maxUses: number | null;
  useCount: number;
}

interface ApiResult {
  success: boolean;
  info?: ShareInfo;
  message?: string;
}

// Use the internal base URL for server-to-server calls (avoids going through public internet)
const INTERNAL_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchShareInfo(token: string): Promise<ApiResult> {
  try {
    const res = await fetch(`${INTERNAL_API}/files/share/${token}/info`, {
      cache: 'no-store', // never cache — link state changes
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message ?? 'Link not found.' };
    return data;
  } catch {
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
}

function formatBytes(bytes: string | number): string {
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (b >= 1024 * 1024 * 1024) return `${(b / 1024 ** 3).toFixed(1)} GB`;
  if (b >= 1024 * 1024) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

function FileTypeIcon({ fileType }: { fileType: string }) {
  const cls = 'w-12 h-12';
  switch (fileType) {
    case 'IMAGE':
      return <ImageIcon className={`${cls} text-pink-500`} />;
    case 'VIDEO':
      return <Video className={`${cls} text-blue-500`} />;
    case 'AUDIO':
      return <FileAudio className={`${cls} text-yellow-500`} />;
    case 'PDF':
      return <FileText className={`${cls} text-red-500`} />;
    default:
      return <FileIcon className={`${cls} text-muted-foreground`} />;
  }
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await fetchShareInfo(token);

  if (!result.success || !result.info) {
    return <ShareErrorPage message={result.message ?? 'This link is no longer available.'} />;
  }

  const info = result.info;

  const expiryLabel = info.expiresAt
    ? `Expires ${new Date(info.expiresAt).toLocaleDateString()}`
    : 'No expiry';

  const usageLabel =
    info.maxUses != null
      ? `${info.useCount} of ${info.maxUses} downloads used`
      : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Cloud className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight">File Forge</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full rounded-2xl border bg-card p-8 shadow-sm space-y-6">
          {/* File icon + name */}
          <div className="flex flex-col items-center text-center gap-3">
            <FileTypeIcon fileType={info.fileType} />
            <div>
              <h1 className="text-xl font-bold text-foreground break-all">{info.fileName}</h1>
              <p className="text-sm text-muted-foreground mt-1">{formatBytes(info.size)}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-xl bg-muted/50 px-4 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Type</span>
              <span className="font-medium text-foreground">{info.mimeType}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Availability</span>
              <span className="font-medium text-foreground">{expiryLabel}</span>
            </div>
            {usageLabel && (
              <div className="flex justify-between text-muted-foreground">
                <span>Usage</span>
                <span className="font-medium text-foreground">{usageLabel}</span>
              </div>
            )}
          </div>

          {/*
            ShareDownloadSection is a 'use client' island.
            The server rendered the file info; the client handles the interactive
            password form and the download button click.
            This is the recommended App Router pattern for mixed SSR + interaction.
          */}
          <ShareDownloadSection token={token} hasPassword={info.hasPassword} />

          <p className="text-xs text-muted-foreground text-center">
            Shared via{' '}
            <Link href="/" className="text-primary hover:underline">
              File Forge
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
