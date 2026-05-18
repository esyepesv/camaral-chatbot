import type { EmbeddingsProvider } from './types';
import { OpenAIEmbeddings } from './openai';
import { GoogleEmbeddings } from './google';
import { EmbeddingsProviderError } from '../errors';

export function createEmbeddingsProvider(): EmbeddingsProvider {
  const provider = process.env.EMBEDDINGS_PROVIDER ?? 'openai';

  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIEmbeddings();
    case 'google':
      return new GoogleEmbeddings();
    default:
      throw new EmbeddingsProviderError(`Unsupported embeddings provider: ${provider}`, provider);
  }
}
