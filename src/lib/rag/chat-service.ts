import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { retrieve } from './retriever';
import { buildSystemPrompt } from './prompt-builder';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RAGContext {
  result: ReturnType<typeof streamText>;
  sources: string[];
}

export async function ragChat(messages: ChatMessage[]): Promise<RAGContext> {
  const lastUserMessage = messages.filter(m => m.role === 'user').at(-1)?.content ?? '';

  const results = await retrieve(lastUserMessage);
  const systemPrompt = buildSystemPrompt(results);
  const sources = [...new Set(results.map(r => r.chunk.metadata.source))];

  const model = process.env.LLM_MODEL ?? 'gpt-4o-mini';
  const result = streamText({
    model: openai(model),
    system: systemPrompt,
    messages,
    temperature: 0.3,
    maxOutputTokens: 1024,
  });

  return { result, sources };
}
