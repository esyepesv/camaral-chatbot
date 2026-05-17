import type { LLMProvider } from './types';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { GoogleGeminiProvider } from './google';
import { LLMProviderError } from '../errors';

export function createLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? 'anthropic';
  
  switch (provider.toLowerCase()) {
    case 'anthropic':
      return new AnthropicProvider();
    case 'openai':
      return new OpenAIProvider();
    case 'google':
      return new GoogleGeminiProvider();
    default:
      throw new LLMProviderError(`Unsupported LLM provider: ${provider}`);
  }
}
