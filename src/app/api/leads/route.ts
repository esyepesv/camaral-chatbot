import { type NextRequest } from 'next/server';
import { saveLead } from '@/lib/leads/service';

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.email || !body.triggerMessage) {
    return new Response(JSON.stringify({ error: 'email and triggerMessage are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await saveLead({
    name: body.name,
    email: body.email,
    company: body.company,
    triggerMessage: body.triggerMessage,
    conversation: body.conversation ?? [],
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}
