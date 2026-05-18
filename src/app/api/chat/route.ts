import { type NextRequest } from 'next/server';
import { ragChat } from '@/lib/rag/chat-service';
import { detectCommercialIntent } from '@/lib/leads/detector';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = body.messages ?? [];

  if (!messages.length) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const lastUserMessage = messages.filter(m => m.role === 'user').at(-1)?.content ?? '';
  const hasCommercialIntent = detectCommercialIntent(lastUserMessage);

  const { result, sources } = await ragChat(messages);

  return result.toUIMessageStreamResponse({
    headers: {
      'X-Sources': JSON.stringify(sources),
      'X-Commercial-Intent': String(hasCommercialIntent),
    },
  });
}
