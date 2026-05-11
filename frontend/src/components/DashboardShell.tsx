'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthStore';
import AuthGuard from '@/components/AuthGuard';
import NotificationBell from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  FolderOpen,
  Trash2,
  Building2,
  Settings,
  Shield,
  LogOut,
  Cloud,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/files', label: 'Files', icon: FolderOpen },
  { href: '/dashboard/trash', label: 'Trash', icon: Trash2 },
  { href: '/dashboard/organizations', label: 'Organizations', icon: Building2 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname() ?? '';
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';
  const labelClass = isCollapsed ? 'hidden' : 'block';
  const iconContainerClass = isCollapsed ? 'justify-center' : 'justify-start';

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className={`${sidebarWidth} shrink-0 border-r border-border/60 bg-card flex flex-col sticky top-0 h-screen transition-all duration-200`}>
          {/* Logo */}
          <div className={`${isCollapsed ? 'px-2 py-5' : 'p-5'} border-b border-border/60 flex items-center justify-between gap-2`}>
            <Link href="/dashboard" className={`flex items-center gap-2.5 ${iconContainerClass}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <Cloud className="w-4 h-4 text-white" />
              </div>
              <div className={labelClass}>
                <p className="font-bold text-foreground text-sm leading-none">FileVault Pro</p>
                <p className="text-xs text-muted-foreground mt-0.5">File Management</p>
              </div>
            </Link>
            <button
              type="button"
              className="rounded-full p-2 hover:bg-muted"
              onClick={() => setIsCollapsed((prev) => !prev)}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                  } ${iconContainerClass}`}
                  title={item.label}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className={labelClass}>{item.label}</span>
                </Link>
              );
            })}

            {user?.role === 'ADMIN' && (
              <>
                <Separator className="my-2" />
                <p className="px-3 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1">
                  Admin
                </p>
                <Link
                  href="/dashboard/admin"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  Admin Panel
                </Link>
              </>
            )}
          </nav>

          {/* User Info + Logout */}
          <div className="p-3 border-t border-border/60">
            <div className={`flex items-center gap-2 px-3 py-2 mb-1 ${iconContainerClass}`}>
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className={`flex-1 min-w-0 ${labelClass}`}>
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Badge variant="secondary" className={`text-xs shrink-0 ${labelClass}`}>
                {user?.role}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'} gap-2 text-muted-foreground hover:text-destructive flex`}
            >
              <LogOut className="w-4 h-4" />
              <span className={labelClass}>Sign out</span>
            </Button>
          </div>
        </aside>

        {/* ── Main content area ────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 border-b border-border/60 bg-card/50 backdrop-blur-sm flex items-center justify-end px-6 sticky top-0 z-40">
            <NotificationBell />
          </header>

          {/* Page content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

