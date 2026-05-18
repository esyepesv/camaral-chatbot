import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createLLMProvider } from '../lib/llm/factory';
import { createEmbeddingsProvider } from '../lib/embeddings/factory';
import { createVectorStore } from '../lib/vector-store/factory';
import { AnthropicProvider } from '../lib/llm/anthropic';
import { OpenAIProvider } from '../lib/llm/openai';
import { OpenAIEmbeddings } from '../lib/embeddings/openai';
import { PgVectorStore } from '../lib/vector-store/pgvector';
import { LLMProviderError, EmbeddingsProviderError, VectorStoreError } from '../lib/errors';

// Mock the Supabase client
vi.mock('../lib/supabase/client', () => ({
  createServiceClient: vi.fn(() => ({})),
}));

describe('Providers Layer', () => {
  beforeAll(() => {
    process.env.OPENAI_API_KEY = 'test_key';
  });
  describe('LLM Factory', () => {
    it('creates AnthropicProvider by default', () => {
      delete process.env.LLM_PROVIDER;
      const provider = createLLMProvider();
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it('creates OpenAIProvider when specified', () => {
      process.env.LLM_PROVIDER = 'openai';
      const provider = createLLMProvider();
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('throws LLMProviderError for unsupported provider', () => {
      process.env.LLM_PROVIDER = 'unsupported';
      expect(() => createLLMProvider()).toThrow(LLMProviderError);
    });
    
    it('Google provider throws error on chat', async () => {
      process.env.LLM_PROVIDER = 'google';
      const provider = createLLMProvider();
      const iterable = provider.chat([{ role: 'user', content: 'test' }]);
      const iterator = iterable[Symbol.asyncIterator]();
      await expect(iterator.next()).rejects.toThrow(LLMProviderError);
    });
  });

  describe('Embeddings Factory', () => {
    it('creates OpenAIEmbeddings by default', () => {
      delete process.env.EMBEDDINGS_PROVIDER;
      const provider = createEmbeddingsProvider();
      expect(provider).toBeInstanceOf(OpenAIEmbeddings);
    });

    it('throws EmbeddingsProviderError for unsupported provider', () => {
      process.env.EMBEDDINGS_PROVIDER = 'unsupported';
      expect(() => createEmbeddingsProvider()).toThrow(EmbeddingsProviderError);
    });

    it('Google provider throws error on embed', async () => {
      process.env.EMBEDDINGS_PROVIDER = 'google';
      const provider = createEmbeddingsProvider();
      await expect(provider.embed(['test'])).rejects.toThrow(EmbeddingsProviderError);
    });
  });

  describe('VectorStore Factory', () => {
    it('creates PgVectorStore by default', () => {
      delete process.env.VECTOR_STORE_PROVIDER;
      const provider = createVectorStore();
      expect(provider).toBeInstanceOf(PgVectorStore);
    });

    it('throws VectorStoreError for unsupported provider', () => {
      process.env.VECTOR_STORE_PROVIDER = 'unsupported';
      expect(() => createVectorStore()).toThrow(VectorStoreError);
    });
  });
});
