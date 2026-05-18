import { type NextRequest } from 'next/server';
import { verifyAdminAuth, unauthorizedResponse } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) return unauthorizedResponse();

  try {
    // Import and run ingest inline to avoid child_process spawn issues
    const { runIngest } = await import('@/lib/ingest');
    await runIngest();
    return Response.json({ ok: true, message: 'Re-indexing complete' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
