import type { EmbeddingsProvider } from './types';
import { EmbeddingsProviderError } from '../errors';

export class GoogleEmbeddings implements EmbeddingsProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async embed(texts: string[]): Promise<number[][]> {
    throw new EmbeddingsProviderError('Google embeddings provider is not yet implemented');
  }
}
