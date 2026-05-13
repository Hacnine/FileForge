import Link from 'next/link';
import { Cloud } from 'lucide-react';
import { PricingCards } from '@/components/PricingCards';
import type { SubscriptionPackage } from '@/types';

// ISR: Incremental Static Regeneration
//
// Why ISR here?
//   Pricing packages are public data — the same for every visitor.
//   They rarely change (admin creates/updates plans occasionally).
//   ISR gives us static page speed with auto-refresh when packages change.
//
//   revalidate = 3600: page is rebuilt in the background at most once per hour.
//   When an admin adds a new plan, visitors will see it within 1 hour.
//   No need to force-dynamic and pay the SSR cost on every visitor request.

export const revalidate = 3600; // rebuild at most every hour

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function getPackages(): Promise<SubscriptionPackage[]> {
  try {
    const res = await fetch(`${API_URL}/packages`, {
      next: { revalidate: 3600 }, // same window as the page-level revalidate
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function PricingPage() {
  const packages = await getPackages();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Cloud className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-semibold tracking-tight">File Forge</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/*
          PricingCards is a Client Component — it handles subscribe/unsubscribe
          actions with RTK Query mutations and reads auth state from Redux.
          The package DATA is fetched server-side (ISR), but the interactive
          subscribe buttons run client-side.
          
          This pattern — server fetches data, client handles interactions —
          is the recommended hybrid approach in Next.js App Router.
        */}
        <PricingCards packages={packages} initialSubscriptionStatus={null} />
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          ← Back to home
        </Link>
      </footer>
    </div>
  );
}
