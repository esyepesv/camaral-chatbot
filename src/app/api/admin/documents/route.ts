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
    console.error('[admin/documents] GET error:', error.message);
    return new Response(JSON.stringify({ error: 'Database error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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

  let body: { source?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof body.source !== 'string' || !body.source.trim()) {
    return new Response(JSON.stringify({ error: 'source is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const client = createServiceClient();
  const { error } = await client.from('document_chunks').delete().eq('source', body.source);

  if (error) {
    console.error('[admin/documents] DELETE error:', error.message);
    return new Response(JSON.stringify({ error: 'Database error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return Response.json({ ok: true });
}
