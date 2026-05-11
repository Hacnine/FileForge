import React from "react";
import Link from "next/link";
import {
  FolderTree,
  HardDrive,
  Layers,
  ArrowRight,
  Check,
  ShieldCheck,
  Cloud,
  Sparkles,
  Link2,
  Tag,
  Bell,
  Users,
  ClipboardList,
  History,
  Building2,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cookies } from "next/headers";
import type { SubscriptionPackage } from "@/types";
import type { SubscriptionStatus } from "@/services/userApi";
import { PricingCards } from "@/components/PricingCards";

// Page is dynamic — subscription status is per-user (read from cookie)
export const dynamic = "force-dynamic";

async function fetchPackages(): Promise<SubscriptionPackage[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  try {
    const res = await fetch(`${apiUrl}/packages`, {
      next: { revalidate: 3600 }, // packages are public — still cache for 1 hour
    });
    if (!res.ok) throw new Error("Failed to fetch packages");
    return res.json();
  } catch (error) {
    console.error("Error fetching packages:", error);
    return [];
  }
}

async function fetchSubscriptionStatus(
  token: string
): Promise<SubscriptionStatus | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  try {
    const res = await fetch(`${apiUrl}/user/subscription-status`, {
      headers: { Cookie: `access_token=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const [packages, subscriptionStatus] = await Promise.all([
    fetchPackages(),
    token ? fetchSubscriptionStatus(token) : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex  gap-4 items-center justify-between py-5 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <Cloud className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-semibold tracking-tight">
                File Forge
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/login">
                <Button variant="ghost">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-56 bg-linear-to-b from-primary/20 to-transparent blur-3xl" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8">
              <Badge
                variant="secondary"
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground"
              >
                Cloud File Management Platform
              </Badge>
              <div className="space-y-6">
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
                  Manage files. Share securely.
                  <span className="text-primary block">
                    Collaborate with confidence.
                  </span>
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                  File Forge gives your team nested folder hierarchies,
                  versioned files, password-protected share links, tag-based
                  search, audit logs, real-time notifications, and
                  multi-organization role-based access — all in one workspace.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
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
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm shadow-slate-900/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                    Protected
                  </p>
                  <p className="mt-2 font-semibold">End-to-end security</p>
                </div>
                <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm shadow-slate-900/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <History className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                    Versioned
                  </p>
                  <p className="mt-2 font-semibold">Full file history</p>
                </div>
                <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm shadow-slate-900/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                    Team-ready
                  </p>
                  <p className="mt-2 font-semibold">Multi-org support</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card/90 p-8 shadow-2xl shadow-primary/10 backdrop-blur-lg">
              <div className="space-y-4">
                <div className="rounded-3xl bg-primary/5 p-6">
                  <p className="text-sm uppercase tracking-[0.2em] text-primary">
                    Built for scale
                  </p>
                  <p className="mt-3 text-2xl font-semibold">
                    From solo freelancers to large enterprises.
                  </p>
                </div>
                <div className="space-y-2">
                  {(
                    [
                      {
                        icon: (
                          <FolderTree className="h-4 w-4 text-primary shrink-0" />
                        ),
                        text: "Nested folders with configurable depth & count limits",
                      },
                      {
                        icon: (
                          <Link2 className="h-4 w-4 text-primary shrink-0" />
                        ),
                        text: "Share links with expiry, password & max-use limits",
                      },
                      {
                        icon: <Tag className="h-4 w-4 text-primary shrink-0" />,
                        text: "Color-coded tags & full-text search index",
                      },
                      {
                        icon: (
                          <Bell className="h-4 w-4 text-primary shrink-0" />
                        ),
                        text: "Real-time notifications for every action",
                      },
                      {
                        icon: (
                          <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                        ),
                        text: "Immutable audit logs for compliance",
                      },
                      {
                        icon: (
                          <Building2 className="h-4 w-4 text-primary shrink-0" />
                        ),
                        text: "Organizations with Owner / Admin / Member / Viewer roles",
                      },
                    ] as { icon: React.ReactNode; text: string }[]
                  ).map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-2xl bg-background/90 px-4 py-3 shadow-sm"
                    >
                      {item.icon}
                      <p className="text-sm text-muted-foreground">
                        {item.text}
                      </p>
                    </div>
                  ))}
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
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
              Platform Features
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Everything your team needs to stay organized.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Secure storage, flexible sharing, file versioning, audit trails,
              and team collaboration — all in one polished interface.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FolderTree className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">
                Hierarchical folders
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Deeply nested folder trees with per-plan nesting level and
                folder count limits. Move, rename, restore — all tracked.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Link2 className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">Secure share links</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Generate links with optional passwords, expiry dates, and
                max-use limits. Revoke any link instantly.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <History className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">File versioning</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Every upload creates a versioned snapshot with checksum
                verification. Restore any previous version at any time.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Tag className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">
                Tags &amp; search index
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Assign color-coded tags to any file. Full-text search index lets
                you find anything in seconds.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ClipboardList className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">Audit logs</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Every login, upload, delete, rename, share-link event, and
                subscription change is recorded with IP address and user agent.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">
                Organizations &amp; roles
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Create multiple organizations, invite members, and assign Owner,
                Admin, Member, or Viewer roles to control access.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* ========================= PRICING CARDS (CLIENT COMPONENT) ========================= */}
      <PricingCards packages={packages} initialSubscriptionStatus={subscriptionStatus} />

      {/* ========================= STATS SECTION ========================= */}
      <section className="py-14 px-4 border-y bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { value: "10M+", label: "Files Managed" },
              { value: "99.99%", label: "Platform Uptime" },
              { value: "5K+", label: "Active Teams" },
              { value: "120+", label: "Countries Served" },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-3xl border bg-card/80 backdrop-blur-xl p-8 text-center shadow-sm"
              >
                <h3 className="text-4xl font-black tracking-tight text-primary">
                  {stat.value}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================= DASHBOARD PREVIEW ========================= */}
      <section className="py-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4">Live Workspace</Badge>

            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Everything your team needs
              <span className="block text-primary">
                in one collaborative workspace.
              </span>
            </h2>

            <p className="mt-5 max-w-2xl mx-auto text-lg text-muted-foreground">
              Organize files, collaborate with your team, restore versions,
              manage permissions, and monitor every activity from a single
              dashboard.
            </p>
          </div>


        </div>
      </section>

      {/* ========================= SECURITY SECTION ========================= */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge className="mb-5">Enterprise Security</Badge>

              <h2 className="text-4xl font-black tracking-tight">
                Built with
                <span className="text-primary"> security first.</span>
              </h2>

              <p className="mt-6 text-lg text-muted-foreground">
                Every file upload, share action, login attempt, and workspace
                event is protected, encrypted, and fully auditable.
              </p>

              <div className="mt-10 space-y-5">
                {[
                  "End-to-end encrypted file storage",
                  "Role-based organization permissions",
                  "Immutable audit trail logging",
                  "IP & user-agent activity tracking",
                  "Password-protected secure share links",
                  "Realtime suspicious activity alerts",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Check className="h-5 w-5 text-primary" />
                    </div>

                    <p className="text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border bg-card/90 p-8 shadow-2xl">
              <div className="space-y-6">
                <div className="rounded-3xl border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Threat Detection
                      </p>
                      <h3 className="text-2xl font-bold mt-1">
                        Active Monitoring
                      </h3>
                    </div>

                    <ShieldCheck className="h-10 w-10 text-primary" />
                  </div>

                  <div className="mt-6 h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[92%] bg-primary rounded-full" />
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    92% suspicious activities blocked automatically.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border p-6">
                    <p className="text-sm text-muted-foreground">
                      Encrypted Files
                    </p>

                    <h3 className="text-3xl font-bold mt-2">18.2M</h3>
                  </div>

                  <div className="rounded-3xl border p-6">
                    <p className="text-sm text-muted-foreground">
                      Audit Events
                    </p>

                    <h3 className="text-3xl font-bold mt-2">2.4B</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= TESTIMONIALS ========================= */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4">Testimonials</Badge>

            <h2 className="text-4xl font-black tracking-tight">
              Loved by modern teams.
            </h2>

            <p className="mt-4 text-lg text-muted-foreground">
              Thousands of organizations rely on File Forge every day.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Sarah Mitchell",
                role: "Product Manager",
                text: "File Forge completely transformed how our teams manage collaborative assets.",
              },
              {
                name: "David Chen",
                role: "Engineering Lead",
                text: "Version history and audit logs saved us countless hours during compliance reviews.",
              },
              {
                name: "Emily Carter",
                role: "Creative Director",
                text: "The best file management experience we have used internally.",
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="rounded-[2rem] border bg-card p-8 shadow-sm"
              >
                <div className="flex items-center gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Sparkles key={idx} className="h-4 w-4 text-primary" />
                  ))}
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  "{testimonial.text}"
                </p>

                <div className="mt-8">
                  <h4 className="font-semibold">{testimonial.name}</h4>

                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================= FINAL CTA ========================= */}
      <section className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-[3rem] border bg-gradient-to-br from-primary to-accent p-14 text-white">
            <div className="absolute inset-0 bg-black/10" />

            <div className="relative text-center max-w-3xl mx-auto">
              <Badge className="bg-white/20 text-white border-0 mb-6">
                Start Today
              </Badge>

              <h2 className="text-5xl font-black tracking-tight">
                Ready to modernize your file workflow?
              </h2>

              <p className="mt-6 text-lg text-white/80">
                Join thousands of teams already managing files, permissions,
                version history, and secure sharing with File Forge.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-12 px-8 text-base"
                  >
                    Get Started Free
                  </Button>
                </Link>

                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 text-base border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

