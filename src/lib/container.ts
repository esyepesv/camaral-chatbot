import { createLLMProvider } from './llm/factory';
import { createEmbeddingsProvider } from './embeddings/factory';
import { createVectorStore } from './vector-store/factory';

export const container = {
  get llm() {
    return createLLMProvider();
  },
  get embeddings() {
    return createEmbeddingsProvider();
  },
  get vectorStore() {
    return createVectorStore();
  }
};
