import type { VectorStore } from './types';
import { PgVectorStore } from './pgvector';
import { createServiceClient } from '../supabase/client';
import { VectorStoreError } from '../errors';

export function createVectorStore(): VectorStore {
  const provider = process.env.VECTOR_STORE_PROVIDER ?? 'pgvector';
  
  switch (provider.toLowerCase()) {
    case 'pgvector': {
      const client = createServiceClient();
      return new PgVectorStore(client);
    }
    default:
      throw new VectorStoreError(`Unsupported vector store provider: ${provider}`);
  }
}
