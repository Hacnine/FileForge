'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, Lock, Cloud } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Client island: handles the password form interaction.
// The server component passes hasPassword + downloadUrl; this handles the form.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function ShareDownloadSection({
  token,
  hasPassword,
}: {
  token: string;
  hasPassword: boolean;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const downloadUrl = hasPassword
    ? `${API_URL}/files/share/${token}?password=${encodeURIComponent(password)}`
    : `${API_URL}/files/share/${token}`;

  const handleDownload = () => {
    if (hasPassword && !password.trim()) {
      setError('Enter the password to download this file.');
      return;
    }
    setError('');
    window.location.href = downloadUrl;
  };

  return (
    <div className="space-y-4">
      {hasPassword && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Lock className="w-4 h-4 text-muted-foreground" />
            This file is password protected
          </label>
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
            className="max-w-xs"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      <Button onClick={handleDownload} className="gap-2">
        <Download className="w-4 h-4" />
        Download file
      </Button>
    </div>
  );
}

export function ShareErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <Cloud className="w-6 h-6 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Link unavailable</h1>
        <p className="text-muted-foreground text-sm mb-6">{message}</p>
        <Link href="/" className="text-sm text-primary hover:underline">
          Go to File Forge
        </Link>
      </div>
    </div>
  );
}
