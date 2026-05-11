'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useVerifyEmailQuery } from '@/services/authApi';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const { data, isLoading, isError } = useVerifyEmailQuery(token, {
    skip: !token,
  });

  const status = !token
    ? 'error'
    : isLoading
      ? 'loading'
      : isError
        ? 'error'
        : 'success';

  const message = !token
    ? 'Invalid verification link.'
    : isError
      ? 'Invalid or expired verification link.'
      : data?.message || 'Email verified successfully!';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-background to-purple-50 px-4">
      <div className="w-full max-w-md">
        <Card className="text-center">
          {status === 'loading' && (
            <>
              <CardHeader>
                <div className="mx-auto">
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                </div>
                <CardTitle className="text-xl">
                  Verifying your email...
                </CardTitle>
                <CardDescription>Please wait a moment.</CardDescription>
              </CardHeader>
            </>
          )}

          {status === 'success' && (
            <>
              <CardHeader>
                <div className="mx-auto inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <CardTitle className="text-xl">Email Verified!</CardTitle>
                <CardDescription>{message}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login">
                  <Button className="w-full">Go to Login</Button>
                </Link>
              </CardContent>
            </>
          )}

          {status === 'error' && (
            <>
              <CardHeader>
                <div className="mx-auto inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <CardTitle className="text-xl">Verification Failed</CardTitle>
                <CardDescription>{message}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login">
                  <Button className="w-full">Go to Login</Button>
                </Link>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

