import { type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';
import { verifyAdminAuth, unauthorizedResponse } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) return unauthorizedResponse();

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = 20;
  const from = (page - 1) * limit;

  const client = createServiceClient();
  const { data, error, count } = await client
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return Response.json({ leads: data, total: count, page, limit });
}
