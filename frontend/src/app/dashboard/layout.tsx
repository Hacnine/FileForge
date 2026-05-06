'use client';

import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import DashboardShell from '@/components/DashboardShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Admin section has its own layout with sidebar — skip the shell there
  if (pathname.startsWith('/dashboard/admin')) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
