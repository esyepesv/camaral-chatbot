import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildSystemPrompt } from '../lib/rag/prompt-builder';
import { detectCommercialIntent } from '../lib/leads/detector';
import type { SearchResult } from '../lib/vector-store/types';

// Mock container for retriever tests
vi.mock('../lib/container', () => ({
  container: {
    embeddings: {
      embed: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    },
    vectorStore: {
      similaritySearch: vi.fn().mockResolvedValue([]),
    },
  },
}));

const mockResult = (source: string, content: string): SearchResult => ({
  chunk: {
    id: `${source}-0`,
    content,
    metadata: { source, title: `Title ${source}`, topic: 'general', chunkIndex: 0 },
  },
  similarity: 0.9,
});

describe('buildSystemPrompt', () => {
  it('includes base camaral instructions', () => {
    const prompt = buildSystemPrompt([]);
    expect(prompt).toContain('Camaral');
    expect(prompt).toContain('español');
  });

  it('includes chunk content in context', () => {
    const results = [mockResult('00-overview', 'Camaral es una plataforma de avatares.')];
    const prompt = buildSystemPrompt(results);
    expect(prompt).toContain('Camaral es una plataforma de avatares.');
  });

  it('includes source citation in context', () => {
    const results = [mockResult('08-planes-y-precios', 'Plan básico: $99/mes')];
    const prompt = buildSystemPrompt(results);
    expect(prompt).toContain('[Fuente: 08-planes-y-precios]');
  });

  it('handles multiple results with separators', () => {
    const results = [
      mockResult('00-overview', 'Texto A'),
      mockResult('01-avatares', 'Texto B'),
    ];
    const prompt = buildSystemPrompt(results);
    expect(prompt).toContain('Texto A');
    expect(prompt).toContain('Texto B');
  });

  it('handles empty results gracefully', () => {
    const prompt = buildSystemPrompt([]);
    expect(prompt).toContain('No hay contexto relevante');
  });
});

describe('detectCommercialIntent', () => {
  it('detects pricing keywords', () => {
    expect(detectCommercialIntent('¿Cuál es el precio?')).toBe(true);
    expect(detectCommercialIntent('quiero ver los planes')).toBe(true);
  });

  it('detects purchase intent keywords', () => {
    expect(detectCommercialIntent('me interesa contratar')).toBe(true);
    expect(detectCommercialIntent('quiero una demo')).toBe(true);
    expect(detectCommercialIntent('necesito presupuesto')).toBe(true);
  });

  it('returns false for general questions', () => {
    expect(detectCommercialIntent('¿Qué es Camaral?')).toBe(false);
    expect(detectCommercialIntent('¿Cómo funcionan los avatares?')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(detectCommercialIntent('PRECIO por favor')).toBe(true);
    expect(detectCommercialIntent('QuIeRo Una Demo')).toBe(true);
  });
});

describe('retrieve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('embeds query and calls similarity search', async () => {
    const { container } = await import('../lib/container');
    const { retrieve } = await import('../lib/rag/retriever');

    await retrieve('¿qué es Camaral?');

    expect(container.embeddings.embed).toHaveBeenCalledWith(['¿qué es Camaral?']);
    expect(container.vectorStore.similaritySearch).toHaveBeenCalledWith([0.1, 0.2, 0.3], 5);
  });

  it('uses custom topK', async () => {
    const { container } = await import('../lib/container');
    const { retrieve } = await import('../lib/rag/retriever');

    await retrieve('query', 3);

    expect(container.vectorStore.similaritySearch).toHaveBeenCalledWith([0.1, 0.2, 0.3], 3);
  });
});
