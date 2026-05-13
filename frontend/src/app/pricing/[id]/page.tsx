import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Cloud, Check, FolderTree, HardDrive, Layers, FileIcon } from 'lucide-react';
import type { SubscriptionPackage } from '@/types';

// DSG + force-static
//
// DSG (Deferred Static Generation):
//   generateStaticParams pre-builds the first 2 packages at deploy time.
//   All other plan IDs (dynamicParams = true, the default) are generated on
//   the FIRST request and then cached as static HTML.
//   → Fast build: you don't need to build every possible plan ID upfront.
//   → Still static: once generated, the page is served from cache instantly.
//
// force-static:
//   Guarantees this page is ALWAYS statically rendered, even if a developer
//   later adds cookies() or headers() calls inside this component tree.
//   This is a safety net — pricing plan pages must never accidentally become
//   dynamic (that would increase server cost for a public, cacheable page).

export const dynamic = 'force-static'; // safety: always static, even for deferred pages
export const dynamicParams = true;      // DSG: generate unknown IDs on first request

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function generateStaticParams() {
  // Pre-build only the first 2 plans at deploy time.
  // All other plans are generated lazily on first request (DSG).
  try {
    const res = await fetch(`${API_URL}/packages`, { cache: 'force-cache' });
    if (!res.ok) return [];
    const packages: SubscriptionPackage[] = await res.json();
    return packages.slice(0, 2).map((pkg) => ({ id: pkg.id }));
  } catch {
    return [];
  }
}

async function getPackage(id: string): Promise<SubscriptionPackage | null> {
  try {
    // Note: the public backend only has GET /packages (all), not GET /packages/:id.
    // We fetch all and filter — this is fine at build/render time.
    const res = await fetch(`${API_URL}/packages`, { cache: 'force-cache' });
    if (!res.ok) return null;
    const packages: SubscriptionPackage[] = await res.json();
    return packages.find((p) => p.id === id) ?? null;
  } catch {
    return null;
  }
}

function formatBytes(bytes: number | string): string {
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (b >= 1024 * 1024 * 1024) return `${(b / (1024 ** 3)).toFixed(1)} GB`;
  if (b >= 1024 * 1024) return `${(b / (1024 ** 2)).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

export default async function PricingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = await getPackage(id);

  if (!pkg) notFound();

  const features = [
    { icon: FolderTree, label: 'Max folders', value: `${pkg.maxFolders} folders` },
    { icon: Layers, label: 'Max nesting depth', value: `${pkg.maxNestingLevel} levels deep` },
    { icon: FileIcon, label: 'Files per folder', value: `${pkg.filesPerFolder} files` },
    { icon: HardDrive, label: 'Max file size', value: formatBytes(pkg.maxFileSize) },
    { icon: HardDrive, label: 'Total file limit', value: `${pkg.totalFileLimit} files` },
    ...(pkg.storageLimit
      ? [{ icon: HardDrive, label: 'Storage limit', value: formatBytes(Number(pkg.storageLimit)) }]
      : []),
  ];

  const fileTypes = pkg.allowedFileTypes ?? [];

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
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← All plans
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{pkg.name}</h1>
              {pkg.description && (
                <p className="mt-2 text-muted-foreground">{pkg.description}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-4xl font-bold text-primary">
                ${Number(pkg.price ?? 0).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">/month</p>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {features.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              </div>
            ))}
          </div>

          {fileTypes.length > 0 && (
            <div className="mb-8">
              <p className="text-sm font-medium text-muted-foreground mb-2">Allowed file types</p>
              <div className="flex flex-wrap gap-2">
                {fileTypes.map((type) => (
                  <span
                    key={type}
                    className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 mb-8">
            {['Share links with password & expiry', 'Audit logs', 'Real-time notifications', 'Multi-organization support', 'Role-based access control'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <Link
            href="/register"
            className="block w-full rounded-xl bg-primary py-3 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Get started with {pkg.name}
          </Link>
          <Link
            href="/login"
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </main>
    </div>
  );
}
