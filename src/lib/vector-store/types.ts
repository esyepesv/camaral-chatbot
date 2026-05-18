export interface DocumentChunk {
  id?: string;
  content: string;
  metadata: {
    source: string;
    title: string;
    topic: string;
    chunkIndex: number;
  };
}

export interface SearchResult {
  chunk: DocumentChunk;
  similarity: number;
}

export interface VectorStore {
  similaritySearch(embedding: number[], topK: number): Promise<SearchResult[]>;
  upsert?(chunks: DocumentChunk[], embeddings: number[][]): Promise<void>;
  delete?(source: string): Promise<void>;
}
