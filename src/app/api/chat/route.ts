import { type NextRequest } from 'next/server';
import { convertToModelMessages, type UIMessage } from 'ai';
import { ragChat } from '@/lib/rag/chat-service';
import { detectCommercialIntent } from '@/lib/leads/detector';

export const runtime = 'nodejs';
export const maxDuration = 30;

function extractText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('');
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const uiMessages: UIMessage[] = body.messages ?? [];

  if (!uiMessages.length) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const lastUserMsg = uiMessages.filter(m => m.role === 'user').at(-1);
  const lastUserText = lastUserMsg ? extractText(lastUserMsg) : '';

  if (!lastUserText.trim()) {
    return new Response(JSON.stringify({ error: 'last user message cannot be empty' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const hasCommercialIntent = detectCommercialIntent(lastUserText);
  const modelMessages = await convertToModelMessages(uiMessages);

  const { result, sources } = await ragChat(modelMessages, lastUserText);

  return result.toUIMessageStreamResponse({
    headers: {
      'X-Sources': JSON.stringify(sources),
      'X-Commercial-Intent': String(hasCommercialIntent),
    },
  });
}
