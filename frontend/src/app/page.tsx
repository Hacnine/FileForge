'use client';

import React from 'react';
import Link from 'next/link';
import { useGetPublicPackagesQuery } from '@/services/publicPackagesApi';
import { useAuth } from '@/contexts/AuthContext';
import {
  useGetSubscriptionStatusQuery,
  useSubscribePackageMutation,
  useUnsubscribePackageMutation,
} from '@/services/userApi';
import toast from 'react-hot-toast';
import {
  FolderTree,
  FileText,
  HardDrive,
  Layers,
  ArrowRight,
  Loader2,
  Check,
  LogIn,
  ShieldCheck,
  Cloud,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  const { data: packages, isLoading, isError } = useGetPublicPackagesQuery();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const {
    data: subscriptionStatus,
    isLoading: statusLoading,
  } = useGetSubscriptionStatusQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [subscribePackage, { isLoading: subscribing }] =
    useSubscribePackageMutation();
  const [unsubscribePackage, { isLoading: unsubscribing }] =
    useUnsubscribePackageMutation();

  const [feedback, setFeedback] = React.useState<string | null>(null);

  const handleSubscribe = async (pkgId: string) => {
    try {
      await subscribePackage({ packageId: pkgId }).unwrap();
      const msg = 'Subscribed successfully.';
      setFeedback(msg);
      toast.success(msg);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || 'Subscription failed.';
      setFeedback(msg);
      toast.error(msg);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribePackage().unwrap();
      const msg = 'Subscription cancelled.';
      setFeedback(msg);
      toast.success(msg);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || 'Unsubscribe failed.';
      setFeedback(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 items-center justify-between py-5 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm shadow-primary/20">
                <span className="text-primary-foreground font-bold text-sm">FF</span>
              </div>
              <span className="text-base font-semibold tracking-tight">File Forge</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {mounted && isAuthenticated ? (
                <Link href="/dashboard">
                  <Button>
                    Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-56 bg-linear-to-b from-primary/20 to-transparent blur-3xl" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8">
              <Badge variant="secondary" className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Cloud File Management
              </Badge>
              <div className="space-y-6">
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
                  Secure file access, smarter workflows,
                  <span className="text-primary block">and a dashboard you’ll love.</span>
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                  Manage your documents, organize folders, and safeguard your team’s files with an intuitive cloud workspace built for growing businesses.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {mounted && isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg">
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register">
                      <Button size="lg">
                        Get Started Free
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm shadow-slate-900/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">Protected</p>
                  <p className="mt-2 font-semibold">256-bit encryption</p>
                </div>
                <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm shadow-slate-900/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">Available</p>
                  <p className="mt-2 font-semibold">Access from anywhere</p>
                </div>
                <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm shadow-slate-900/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">Efficient</p>
                  <p className="mt-2 font-semibold">Built for fast workflows</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card/90 p-8 shadow-2xl shadow-primary/10 backdrop-blur-lg">
              <div className="space-y-6">
                <div className="rounded-3xl bg-primary/5 p-6">
                  <p className="text-sm uppercase tracking-[0.2em] text-primary">Fast setup</p>
                  <p className="mt-3 text-2xl font-semibold">Deploy in minutes, manage instantly.</p>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-3xl bg-background/90 p-5 shadow-sm shadow-slate-900/5">
                    <p className="text-sm text-muted-foreground">Trusted by teams and freelancers for secure file management.</p>
                  </div>
                  <div className="rounded-3xl bg-background/90 p-5 shadow-sm shadow-slate-900/5">
                    <p className="text-sm text-muted-foreground">Smart folder controls, package upgrades, and full audit history.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Why File Forge</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">Everything your team needs to stay organized.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Secure storage, flexible access rules, and easy collaboration in one polished interface.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm shadow-slate-900/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">Reliable security</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Keep important documents safe with enterprise-grade protection and access controls.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm shadow-slate-900/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Cloud className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">Always available</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Access your files anytime, from any device, with fast and reliable cloud storage.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm shadow-slate-900/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">Easy setup</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Start with a free plan, upgrade anytime, and get to work right away.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Subscription Packages</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Choose the plan that best fits your file management needs. All plans include secure cloud storage and easy access.
            </p>
            {feedback && (
              <p className="mt-4 text-sm text-primary">{feedback}</p>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <div className="text-center py-16">
              <p className="text-destructive">
                Failed to load packages. Please try again later.
              </p>
            </div>
          )}

          {packages && packages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                No subscription packages available at the moment.
              </p>
            </div>
          )}

          {packages && packages.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {packages.map((pkg, index) => (
                <Card
                  key={pkg.id}
                  className={
                    index === 1
                      ? 'border-primary shadow-lg relative bg-card/95'
                      : 'relative bg-card/95'
                  }
                >
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle className="text-xl">{pkg.name}</CardTitle>
                      {subscriptionStatus?.hasActivePackage &&
                        subscriptionStatus.package?.id === pkg.id && (
                          <Badge variant="secondary" className="text-xs">
                            Your plan
                          </Badge>
                        )}
                    </div>
                    <CardDescription>
                      Everything you need to manage your files effectively.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <FolderTree className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{pkg.maxFolders} Folders</p>
                          <p className="text-xs text-muted-foreground">Up to {pkg.maxNestingLevel} nesting levels</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <HardDrive className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{pkg.maxFileSize} MB max file size</p>
                          <p className="text-xs text-muted-foreground">{pkg.totalFileLimit} total files</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{pkg.filesPerFolder} files per folder</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        Secure cloud storage
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        Access from anywhere
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        Folder organization
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {mounted && isAuthenticated ? (
                      (() => {
                        const isCurrent =
                          subscriptionStatus?.hasActivePackage &&
                          subscriptionStatus.package?.id === pkg.id;
                        const hasAnother =
                          subscriptionStatus?.hasActivePackage && !isCurrent;
                        if (statusLoading) {
                          return (
                            <Button className="w-full" disabled>
                              Loading...
                            </Button>
                          );
                        }
                        if (isCurrent) {
                          return (
                            <Button
                              className="w-full"
                              variant="destructive"
                              onClick={handleUnsubscribe}
                              disabled={unsubscribing}
                            >
                              {unsubscribing ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          );
                        }
                        if (hasAnother) {
                          return (
                            <Button
                              className="w-full"
                              variant="outline"
                              disabled
                              title="Unsubscribe from current plan first"
                            >
                              Subscribe
                            </Button>
                          );
                        }
                        return (
                          <Button
                            className="w-full"
                            variant={index === 1 ? 'default' : 'outline'}
                            onClick={() => handleSubscribe(pkg.id)}
                            disabled={subscribing}
                          >
                            {subscribing ? 'Subscribing...' : 'Subscribe'}
                          </Button>
                        );
                      })()
                    ) : (
                      <Link href="/register" className="w-full">
                        <Button
                          className="w-full"
                          variant={index === 1 ? 'default' : 'outline'}
                        >
                          Get Started
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t py-10 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} File Forge. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
