import Link from 'next/link';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import type { SubscriptionPackage } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const getStaticProps: GetStaticProps<{ packages: SubscriptionPackage[] }> = async () => {
  const response = await fetch(`${API_BASE_URL}/packages`);
  if (!response.ok) {
    throw new Error(`Failed to fetch packages: ${response.status}`);
  }
  const packages: SubscriptionPackage[] = await response.json();

  return {
    props: {
      packages,
    },
    revalidate: 3600,
  };
};

export default function PackagesIndexPage({ packages }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Subscription Packages</h1>
        <p className="mb-8 text-slate-600">
          This page is statically generated at build time using <strong>getStaticProps</strong>.
          It lists available packages and links to package detail pages generated with <strong>getStaticPaths</strong>.
        </p>

        {packages.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-600">No packages were available during build time.</p>
            <p className="mt-2 text-sm text-slate-500">Make sure the backend is running or provide valid API base URL.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {packages.map((pkg) => (
              <Link
                key={pkg.id}
                href={`/packages/${pkg.id}`}
                className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{pkg.name}</h2>
                    <p className="mt-2 text-slate-500">{pkg.description || 'No description available.'}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    ${
                      Number(pkg.price ?? 0).toFixed(2)
                    }
                  </span>
                </div>
                <div className="mt-4 text-sm text-slate-500">
                  {pkg.totalFileLimit} files · {pkg.maxFolders} folders · up to {pkg.maxFileSize} bytes/file
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
