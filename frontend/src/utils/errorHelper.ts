import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

/**
 * Extract a user-friendly message from an RTK Query error.
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong.',
): string {
  if (!error) return fallback;

  if (typeof error === 'object' && error !== null && 'status' in error) {
    // FetchBaseQueryError
    const data = (error as FetchBaseQueryError).data as
      | { message?: string }
      | undefined;
    return data?.message || fallback;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as SerializedError).message || fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}

