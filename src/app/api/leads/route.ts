import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { saveLead } from '@/lib/leads/service';

const leadSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email().max(254),
  company: z.string().max(100).optional(),
  triggerMessage: z.string().min(1).max(500),
  conversation: z
    .array(z.object({ role: z.string().max(20), content: z.string().max(2000) }))
    .max(50)
    .optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await saveLead({
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company,
      triggerMessage: parsed.data.triggerMessage,
      conversation: parsed.data.conversation ?? [],
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
