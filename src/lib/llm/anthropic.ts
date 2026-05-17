import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import type { LLMProvider, ChatMessage, ChatOptions, TextChunk } from './types';

export class AnthropicProvider implements LLMProvider {
  async *chat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<TextChunk> {
    const model = options?.model ?? process.env.LLM_MODEL ?? 'claude-haiku-4-5';
    const { textStream } = streamText({
      model: anthropic(model),
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
