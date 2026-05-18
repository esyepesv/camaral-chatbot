import type { LLMProvider, ChatMessage, ChatOptions, TextChunk } from './types';
import { LLMProviderError } from '../errors';

export class GoogleGeminiProvider implements LLMProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async *chat(_messages: ChatMessage[], _options?: ChatOptions): AsyncIterable<TextChunk> {
    throw new LLMProviderError('Google Gemini provider is not yet implemented', 'google');
    yield { text: '' };
  }
}
