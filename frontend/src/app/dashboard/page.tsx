'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Shield, FolderOpen, FileText, Package, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  SF
                </span>
              </div>
              <span className="font-semibold text-foreground">
                File Forge
              </span>
            </div>
            <Link href="/" className="font-semibold text-foreground hover:underline flex items-center gap-1">
              <Home /> Home
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {user?.role === 'ADMIN' ? (
                  <Shield className="w-4 h-4 text-primary" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span>
                  {user?.firstName} {user?.lastName}
                </span>
                <Badge variant="secondary">{user?.role}</Badge>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Welcome, {user?.firstName}!
            </CardTitle>
            <CardDescription>
              {user?.role === 'ADMIN'
                ? 'You are logged in as an administrator. You can manage subscription packages from here.'
                : 'You are logged in as a user. Start managing your files and folders.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!user?.isEmailVerified && (
              <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800 [&>svg]:text-yellow-800">
                <AlertDescription>
                  <strong>Note:</strong> Your email is not verified yet. Please
                  check your inbox for a verification link.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="pt-6">
                  {user?.role === 'ADMIN' ? (
                    <Link href="/dashboard/packages" className="block">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">
                          Manage Packages
                        </h3>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Create and manage subscription packages.
                      </p>
                    </Link>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">
                          My Subscription
                        </h3>
                      </div>
                      <Link href="/" className="text-muted-foreground text-sm">
                        {user?.activePackage
                          ? `Current: ${user.activePackage.name}`
                          : 'No active subscription package. Please subscribe to a package.'}
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-purple-500/5 border-purple-500/10">
                <CardContent className="pt-6">
                  <Link href="/dashboard/files" className="block">
                    <div className="flex items-center gap-3 mb-2">
                      <FolderOpen className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-foreground">My Folders</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Manage your folder structure.
                    </p>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-pink-500/5 border-pink-500/10">
                <CardContent className="pt-6">
                  <Link href="/dashboard/files" className="block">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-pink-600" />
                      <h3 className="font-semibold text-foreground">My Files</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Upload, view, and manage your files.
                    </p>
                  </Link>
                </CardContent>
              </Card>

              {user?.role === 'ADMIN' && (
                <Card className="bg-blue-500/5 border-blue-500/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-foreground">Admin Info</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Admin has no restriction for folder creation and file uploading.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
