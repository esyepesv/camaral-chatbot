# Camaral Chatbot — Estado del Proyecto

> Última actualización: 2026-05-17T17:40 UTC
> Fase actual: 2 de 8 (Providers)
> Último commit: 183a923 — chore: project bootstrap + DB schema

---

## Visión rápida
Chatbot RAG para Camaral (plataforma de AI Avatars para ventas/soporte), prueba técnica para el CEO Samuel Santa. Responde preguntas de prospectos sobre Camaral con información verificada de 10 archivos `.md` en `knowledge-base/`, cita fuentes, captura leads, y tiene un admin panel mínimo. Deploy en Vercel.

## Arquitectura en 1 párrafo
Next.js 14 App Router con Vercel AI SDK **v6** para streaming. Tres capas de Provider abstraídas (LLM/Embeddings/VectorStore) con factory-based DI en `src/lib/container.ts` (pendiente). La KB (10 `.md` en español) se chunkea por headings `##`, se embebe con OpenAI text-embedding-3-small, y se almacena en Supabase pgvector con índice HNSW. El pipeline RAG recupera top-5 chunks por similitud coseno, los inyecta en el system prompt de Claude Haiku, y hace stream de la respuesta con citations en cabecera `X-Sources`. Los leads se capturan con `X-Commercial-Intent: true` cuando se detecta intención comercial.

---

## Estado por fase
- [x] Fase 0: Setup y planeación
- [x] Fase 1: Setup del proyecto + pgvector
- [ ] **Fase 2: Providers (LLM, Embeddings, VectorStore)** ← AQUÍ ESTAMOS
- [ ] Fase 3: Pipeline de ingesta de knowledge base
- [ ] Fase 4: API de chat con RAG + streaming
- [ ] Fase 5: UI del chat
- [ ] Fase 6: Admin panel + lead capture
- [ ] Fase 7: Eval suite + tests
- [ ] Fase 8: Deploy y polish

---

## Estado detallado de la fase actual (Fase 2)

### Qué está hecho (Fase 1 completa)

**Archivos creados en Fase 1:**
```
.env.example                    ← documentación de variables requeridas
.gitignore                      ← incluye .env.local
DECISIONS.md                    ← ADR log con 8 decisiones
PROGRESS.md                     ← este archivo
components.json                 ← configuración shadcn/ui
next.config.ts
package.json                    ← todas las dependencias instaladas
postcss.config.mjs
tailwind.config.ts
tsconfig.json                   ← strict: true, paths @/*
vitest.config.ts
src/app/globals.css             ← CSS variables tema oscuro Camaral
src/app/layout.tsx
src/app/page.tsx                ← placeholder
src/lib/errors.ts               ← LLMProviderError, EmbeddingsProviderError, KnowledgeBaseError, VectorStoreError
src/lib/supabase/client.ts      ← supabase + createServiceClient()
src/lib/utils.ts                ← cn() helper de shadcn
supabase/schema.sql             ← schema completo para correr en Supabase SQL Editor
```

**Dependencias instaladas en node_modules:**
- `ai@6.0.184` — Vercel AI SDK v6
- `@ai-sdk/anthropic@3.0.78`
- `@ai-sdk/openai@3.0.64`
- `@ai-sdk/google@3.0.75`
- `@supabase/supabase-js@2.x`
- `openai@4.x` — para embeddings directos
- `gray-matter@4.x` — para parsear frontmatter YAML de los .md
- `clsx`, `tailwind-merge`, `lucide-react` — para shadcn/ui
- `vitest@3.x`, `tsx@4.x`

### Pendiente MANUAL por el usuario (bloqueante para ingest)
1. Crear proyecto en [supabase.com](https://supabase.com)
2. En Dashboard → Database → Extensions → habilitar `vector`
3. En SQL Editor → correr `supabase/schema.sql`
4. Copiar `.env.example` → `.env.local` y rellenar:
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_SECRET`

### Qué falta en Fase 2 (próximo trabajo)

Crear todos los archivos del Provider layer:

```
src/lib/llm/
  types.ts        ← interfaces LLMProvider, TextChunk, ChatMessage, ChatOptions
  anthropic.ts    ← AnthropicProvider implementación
  openai.ts       ← OpenAIProvider implementación
  google.ts       ← GoogleGeminiProvider stub (lanza LLMProviderError)
  factory.ts      ← createLLMProvider() lee LLM_PROVIDER env

src/lib/embeddings/
  types.ts        ← interface EmbeddingsProvider
  openai.ts       ← OpenAIEmbeddings usando openai SDK directo
  google.ts       ← stub
  factory.ts      ← createEmbeddingsProvider()

src/lib/vector-store/
  types.ts        ← interfaces VectorStore, DocumentChunk, SearchResult
  pgvector.ts     ← PgVectorStore usando Supabase RPC match_document_chunks
  factory.ts      ← createVectorStore()

src/lib/container.ts ← DI graph: crea y exporta instancias configuradas

src/tests/
  providers.test.ts ← tests unitarios (factory selection, stub throws)
```

---

## Próximos pasos concretos (en orden)

1. Implementar `src/lib/llm/types.ts` con interfaces
2. Implementar `src/lib/llm/anthropic.ts`
3. Implementar `src/lib/llm/openai.ts`
4. Implementar `src/lib/llm/google.ts` (stub)
5. Implementar `src/lib/llm/factory.ts`
6. Repetir para `src/lib/embeddings/` (3 archivos + factory)
7. Repetir para `src/lib/vector-store/` (3 archivos + factory)
8. Crear `src/lib/container.ts`
9. Crear `src/tests/providers.test.ts`
10. Correr `npm run test` — debe pasar
11. Commit: `feat: provider layer — LLM, Embeddings, VectorStore`

---

## APIs críticas para Fase 2 (AI SDK v6)

### LLM Provider — AI SDK v6 streaming pattern
```typescript
// src/lib/llm/anthropic.ts
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import type { LLMProvider, ChatMessage, ChatOptions, TextChunk } from './types';

export class AnthropicProvider implements LLMProvider {
  async *chat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<TextChunk> {
    const model = options?.model ?? process.env.LLM_MODEL ?? 'claude-haiku-4-5';
    const { textStream } = streamText({
      model: anthropic(model),
      system: options?.system,
      messages: messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });
    for await (const text of textStream) {
      yield { text };
    }
  }
}
```

### Embeddings — OpenAI SDK directo (no AI SDK)
```typescript
// src/lib/embeddings/openai.ts
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
```

### VectorStore — Supabase RPC
```typescript
// src/lib/vector-store/pgvector.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { VectorStore, DocumentChunk, SearchResult } from './types';

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
      chunk: { id: row.id, content: row.content, metadata: { source: row.source, title: row.title, topic: row.topic, chunkIndex: row.chunk_index } },
      similarity: row.similarity,
    }));
  }
  // ... upsert y delete
}
```

---

## Blockers / pendientes / dudas
- **BLOCKER SOFT**: Supabase no configurado — ingest fallará hasta que el usuario corra el schema
- El `Agent` tool (subagentes aislados) falla en este entorno con error de worktree. **Trabajar directo en la sesión** usando Bash/Write/Edit.

---

## Cómo retomar este proyecto desde cero
1. Lee este archivo completo.
2. Lee `DECISIONS.md` para entender el por qué de las decisiones técnicas.
3. Lee el último commit: `git log --oneline`
4. Continúa en "Próximos pasos concretos" de arriba.
5. **IMPORTANTE**: El `Agent` tool falla con errores de worktree — implementar todo inline en la sesión.

## Comandos útiles
```bash
npm run dev       # levantar local (http://localhost:3000)
npm run ingest    # re-indexar knowledge base en pgvector (requiere .env.local)
npm run eval      # correr eval suite con LLM-as-judge (requiere .env.local)
npm run test      # tests unitarios con Vitest
npx tsc --noEmit  # verificar TypeScript sin compilar
```
