import { streamText, type ModelMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { retrieve } from './retriever';
import { buildSystemPrompt } from './prompt-builder';

export interface RAGContext {
  result: ReturnType<typeof streamText>;
  sources: string[];
}

export async function ragChat(
  messages: ModelMessage[],
  userQuery: string,
): Promise<RAGContext> {
  const results = await retrieve(userQuery);
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
