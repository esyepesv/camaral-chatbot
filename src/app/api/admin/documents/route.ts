import { type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';
import { verifyAdminAuth, unauthorizedResponse } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) return unauthorizedResponse();

  const client = createServiceClient();
  const { data, error } = await client
    .from('document_chunks')
    .select('source, title, created_at')
    .order('source');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Group by source
  const grouped = new Map<string, { source: string; title: string; chunkCount: number; createdAt: string }>();
  for (const row of data ?? []) {
    const existing = grouped.get(row.source);
    if (existing) {
      existing.chunkCount++;
    } else {
      grouped.set(row.source, {
        source: row.source,
        title: row.title,
        chunkCount: 1,
        createdAt: row.created_at,
      });
    }
  }

  return Response.json(Array.from(grouped.values()));
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdminAuth(req)) return unauthorizedResponse();

  const { source } = await req.json();
  if (!source) {
    return new Response(JSON.stringify({ error: 'source is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const client = createServiceClient();
  const { error } = await client.from('document_chunks').delete().eq('source', source);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return Response.json({ ok: true });
}
