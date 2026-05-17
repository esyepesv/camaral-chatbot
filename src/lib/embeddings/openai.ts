import OpenAI from 'openai';
import type { EmbeddingsProvider } from './types';

export class OpenAIEmbeddings implements EmbeddingsProvider {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  async embed(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });
    return response.data.map(d => d.embedding);
  }
}
