import type { SearchResult } from '../vector-store/types';
import { container } from '../container';

export async function retrieve(query: string, topK = 5): Promise<SearchResult[]> {
  const [embedding] = await container.embeddings.embed([query]);
  return container.vectorStore.similaritySearch(embedding, topK);
}
