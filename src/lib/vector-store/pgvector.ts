import type { SupabaseClient } from '@supabase/supabase-js';
import type { VectorStore, SearchResult } from './types';
import { VectorStoreError } from '../errors';

export class PgVectorStore implements VectorStore {
  constructor(private client: SupabaseClient) {}
  
  async similaritySearch(embedding: number[], topK: number): Promise<SearchResult[]> {
    const { data, error } = await this.client.rpc('match_document_chunks', {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: topK,
    });
    
    if (error) throw new VectorStoreError(error.message, error);
    
    return data.map((row: any) => ({
      chunk: { 
        id: row.id, 
        content: row.content, 
        metadata: { 
          source: row.source, 
          title: row.title, 
          topic: row.topic, 
          chunkIndex: row.chunk_index 
        } 
      },
      similarity: row.similarity,
    }));
  }
}
