import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import type { LLMProvider, ChatMessage, ChatOptions, TextChunk } from './types';

export class OpenAIProvider implements LLMProvider {
  async *chat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<TextChunk> {
    const model = options?.model ?? process.env.LLM_MODEL ?? 'gpt-4o-mini';
    const { textStream } = streamText({
      model: openai(model),
      system: options?.system,
      messages: messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });
    for await (const text of textStream) {
      yield { text };
    }
  }
}
