import { NextRequest, NextResponse } from 'next/server';

// API Route: GET /api/share/[token]
//
// Why this exists (real reason, not a demo):
//   The browser should never know the Express backend's URL or internal structure.
//   This Next.js route handler acts as a proxy — the frontend calls /api/share/[token]
//   and Next.js calls the Express backend server-side.
//
//   Benefits:
//   - Backend URL (http://internal-backend:5000) never exposed to client
//   - Can add auth checks, rate limiting, or logging here without touching the backend
//   - CORS is not an issue (server-to-server call)
//   - One place to change if backend URL changes

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const backendRes = await fetch(`${API_BASE_URL}/files/share/${token}/info`, {
    cache: 'no-store', // always fresh — share links can expire or be revoked at any time
  });

  const data = await backendRes.json();

  return NextResponse.json(data, { status: backendRes.status });
}
