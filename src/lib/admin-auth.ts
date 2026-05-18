import { timingSafeEqual } from 'crypto';
import { type NextRequest } from 'next/server';

export function verifyAdminAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('Authorization');
  if (!auth) return false;
  try {
    const expected = `Bearer ${secret}`;
    return (
      auth.length === expected.length &&
      timingSafeEqual(Buffer.from(auth), Buffer.from(expected))
    );
  } catch {
    return false;
  }
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
