import Link from 'next/link';
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import type { SubscriptionPackage } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const getStaticPaths: GetStaticPaths = async () => {
  const response = await fetch(`${API_BASE_URL}/packages`);
  if (!response.ok) {
    throw new Error(`Failed to fetch packages: ${response.status}`);
  }
  const packages: SubscriptionPackage[] = await response.json();

  return {
    paths: packages.map((pkg) => ({ params: { id: pkg.id } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<{ pkg: SubscriptionPackage | null }> = async ({ params }) => {
  const packageId = String(params?.id || '');

  const response = await fetch(`${API_BASE_URL}/packages`);
  if (!response.ok) {
    throw new Error(`Failed to fetch packages: ${response.status}`);
  }
  const packages: SubscriptionPackage[] = await response.json();

  const pkg = packages.find((item) => item.id === packageId) ?? null;
  if (!pkg) {
    return { notFound: true };
  }

  return {
    props: {
      pkg,
    },
    revalidate: 3600,
  };
};

export default function PackageDetailPage({ pkg }: InferGetStaticPropsType<typeof getStaticProps>) {
  if (!pkg) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 py-16 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm text-center">
          <p className="text-lg font-medium">Package not found.</p>
          <Link href="/packages" className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Back to packages
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">{pkg.name}</h1>
          <p className="mt-3 text-slate-600">{pkg.description || 'A static package detail page created with getStaticPaths.'}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Storage limit</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{pkg.storageLimit ?? 'Unlimited'}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">File limit</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{pkg.totalFileLimit}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Max folders</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{pkg.maxFolders}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Allowed file types</p>
            <p className="mt-3 text-slate-900">{pkg.allowedFileTypes.join(', ')}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">This page is statically generated at build time using getStaticPaths + getStaticProps.</p>
          <Link href="/packages" className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Back to packages
          </Link>
        </div>
      </div>
    </main>
  );
}
