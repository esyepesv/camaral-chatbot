import { type NextRequest } from 'next/server';
import { convertToModelMessages, type UIMessage } from 'ai';
import { ragChat } from '@/lib/rag/chat-service';
import { detectCommercialIntent } from '@/lib/leads/detector';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

function extractText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('');
}

export async function POST(req: NextRequest) {
  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (body.messages.length > MAX_MESSAGES) {
    return new Response(JSON.stringify({ error: 'Too many messages' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const uiMessages = body.messages as UIMessage[];
  const lastUserMsg = uiMessages.filter(m => m.role === 'user').at(-1);
  const lastUserText = lastUserMsg ? extractText(lastUserMsg) : '';

  if (!lastUserText.trim()) {
    return new Response(JSON.stringify({ error: 'Last user message cannot be empty' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (lastUserText.length > MAX_MESSAGE_LENGTH) {
    return new Response(JSON.stringify({ error: 'Message too long' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const hasCommercialIntent = detectCommercialIntent(lastUserText);
    const modelMessages = await convertToModelMessages(uiMessages);
    const { result, sources } = await ragChat(modelMessages, lastUserText);

    return result.toUIMessageStreamResponse({
      headers: {
        'X-Sources': JSON.stringify(sources),
        'X-Commercial-Intent': String(hasCommercialIntent),
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
