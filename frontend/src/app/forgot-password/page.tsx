'use client';

import { useState } from 'react';
import Link from 'next/link';
import GuestGuard from '@/components/GuestGuard';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useForgotPasswordMutation } from '@/services/authApi';
import { getErrorMessage } from '@/utils/errorHelper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [forgotPassword, { isLoading: isSubmitting }] =
    useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await forgotPassword(email).unwrap();
      setIsSent(true);
      toast.success('Password reset email sent!');
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(
          error as FetchBaseQueryError,
          'Failed to send reset email.',
        ),
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-background to-purple-50 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-2">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <CardDescription>
              {isSent
                ? 'Check your email for a reset link'
                : "Enter your email and we'll send you a reset link"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!isSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent a password reset link to <strong>{email}</strong>.
                  Please check your inbox.
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="justify-center">
            <Link
              href="/login"
              className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <GuestGuard>
      <ForgotPasswordForm />
    </GuestGuard>
  );
}
