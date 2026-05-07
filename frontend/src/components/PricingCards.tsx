"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  useSubscribePackageMutation,
  useUnsubscribePackageMutation,
} from "@/services/userApi";
import type { SubscriptionStatus } from "@/services/userApi";
import toast from "react-hot-toast";
import {
  FolderTree,
  HardDrive,
  Layers,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { SubscriptionPackage } from "@/types";

interface PricingCardsProps {
  packages: SubscriptionPackage[];
  initialSubscriptionStatus?: SubscriptionStatus | null;
}

export function PricingCards({ packages, initialSubscriptionStatus }: PricingCardsProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const subscriptionStatus = initialSubscriptionStatus ?? null;

  const [subscribePackage, { isLoading: subscribing }] =
    useSubscribePackageMutation();
  const [unsubscribePackage, { isLoading: unsubscribing }] =
    useUnsubscribePackageMutation();

  const handleSubscribe = async (pkgId: string) => {
    try {
      await subscribePackage({ packageId: pkgId }).unwrap();
      const msg = "Subscribed successfully.";
      setFeedback(msg);
      toast.success(msg);
      router.refresh(); // re-fetch subscription status from server
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Subscription failed.";
      setFeedback(msg);
      toast.error(msg);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribePackage().unwrap();
      const msg = "Subscription cancelled.";
      setFeedback(msg);
      toast.success(msg);
      router.refresh(); // re-fetch subscription status from server
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Unsubscribe failed.";
      setFeedback(msg);
      toast.error(msg);
    }
  };

  if (!mounted) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
            Pricing
          </p>
          <h2 className="text-3xl font-bold text-foreground mt-4 mb-3">
            Subscription Packages
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Choose the plan that best fits your needs. All plans include share
            links, file versioning, tags, audit logs, and real-time
            notifications.
          </p>
          {feedback && (
            <p className="mt-4 text-sm text-primary">{feedback}</p>
          )}
        </div>

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
                  index === 2
                    ? "border-primary shadow-lg relative bg-card/95"
                    : "relative bg-card/95"
                }
              >
                {index === 2 && (
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
                  {pkg.price !== undefined && (
                    <p className="text-2xl font-bold mt-1">
                      {Number(pkg.price) === 0 ? (
                        "Free"
                      ) : (
                        <>
                          ${Number(pkg.price).toFixed(2)}
                          <span className="text-sm font-normal text-muted-foreground">
                            /mo
                          </span>
                        </>
                      )}
                    </p>
                  )}
                  <CardDescription>
                    {pkg.description || "Manage your files with ease."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <FolderTree className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {pkg.maxFolders} Folders
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Up to {pkg.maxNestingLevel} nesting levels
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <HardDrive className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {pkg.maxFileSize} MB max file size
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pkg.totalFileLimit} total files
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {pkg.filesPerFolder} files per folder
                        </p>
                        {pkg.storageLimit && Number(pkg.storageLimit) > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {Number(pkg.storageLimit) >= 1073741824
                              ? `${(Number(pkg.storageLimit) / 1073741824).toFixed(0)} GB storage`
                              : `${(Number(pkg.storageLimit) / 1048576).toFixed(0)} MB storage`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <ul className="space-y-2">
                    {pkg.allowedFileTypes.map((ft) => (
                      <li
                        key={ft}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {ft.charAt(0) + ft.slice(1).toLowerCase()} files
                      </li>
                    ))}
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      Share links &amp; notifications
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      Audit logs &amp; file versioning
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  {isAuthenticated ? (
                    (() => {
                      const isCurrent =
                        subscriptionStatus?.hasActivePackage &&
                        subscriptionStatus.package?.id === pkg.id;
                      const hasAnother =
                        subscriptionStatus?.hasActivePackage && !isCurrent;
                      if (isCurrent) {
                        return (
                          <Button
                            className="w-full"
                            variant="destructive"
                            onClick={handleUnsubscribe}
                            disabled={unsubscribing}
                          >
                            {unsubscribing ? "Cancelling..." : "Cancel Plan"}
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
                          variant={index === 2 ? "default" : "outline"}
                          onClick={() => handleSubscribe(pkg.id)}
                          disabled={subscribing}
                        >
                          {subscribing
                            ? "Subscribing..."
                            : pkg.price === 0
                            ? "Start Free"
                            : "Subscribe"}
                        </Button>
                      );
                    })()
                  ) : (
                    <Link href="/register" className="w-full">
                      <Button
                        className="w-full"
                        variant={index === 2 ? "default" : "outline"}
                      >
                        {pkg.price === 0 ? "Start Free" : "Get Started"}
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
  );
}
