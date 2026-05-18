# Camaral Chatbot — Estado del Proyecto

> Última actualización: 2026-05-17T19:35 UTC
> Fase actual: 4 de 8 (RAG Pipeline + Chat API)
> Último commit: (pendiente commit de fases 2-3)

---

## Visión rápida
Chatbot RAG para Camaral (plataforma de AI Avatars para ventas/soporte), prueba técnica para el CEO Samuel Santa. Responde preguntas de prospectos sobre Camaral con información verificada de 10 archivos `.md` en `knowledge-base/`, cita fuentes, captura leads, y tiene un admin panel mínimo. Deploy en Vercel.

## Arquitectura en 1 párrafo
Next.js 14 App Router con Vercel AI SDK **v6** para streaming. Tres capas de Provider abstraídas (LLM/Embeddings/VectorStore) con factory-based DI en `src/lib/container.ts`. La KB (10 `.md` en español) se chunkea por headings `##`, se embebe con OpenAI text-embedding-3-small, y se almacena en Supabase pgvector con índice HNSW. El pipeline RAG recupera top-5 chunks por similitud coseno, los inyecta en el system prompt, y hace stream de la respuesta con citations en cabecera `X-Sources`. Los leads se capturan con `X-Commercial-Intent: true` cuando se detecta intención comercial.

## Configuración actual (OpenAI-only)
- `LLM_PROVIDER=openai` → usa `gpt-4o-mini` via `@ai-sdk/openai`
- `EMBEDDINGS_PROVIDER=openai` → usa `text-embedding-3-small` via `openai` SDK directo
- `ANTHROPIC_API_KEY` no requerida (comentada en .env.local)
- Supabase configurado: `https://rbfxayrqmzrxafdhzspe.supabase.co`

---

## Estado por fase
- [x] Fase 0: Setup y planeación
- [x] Fase 1: Setup del proyecto + pgvector
- [x] Fase 2: Providers (LLM, Embeddings, VectorStore)
- [x] Fase 3: Pipeline de ingesta de knowledge base
- [ ] **Fase 4: API de chat con RAG + streaming** ← AQUÍ ESTAMOS
- [ ] Fase 5: UI del chat
- [ ] Fase 6: Admin panel + lead capture
- [ ] Fase 7: Eval suite + tests
- [ ] Fase 8: Deploy y polish

---

## Archivos implementados hasta Fase 3

```
src/lib/errors.ts                    ← LLMProviderError, EmbeddingsProviderError, KnowledgeBaseError, VectorStoreError
src/lib/supabase/client.ts           ← supabase singleton + createServiceClient()
src/lib/llm/types.ts                 ← interfaces LLMProvider, ChatMessage, ChatOptions, TextChunk
src/lib/llm/anthropic.ts             ← AnthropicProvider (streamText, maxOutputTokens)
src/lib/llm/openai.ts                ← OpenAIProvider (streamText, gpt-4o-mini default)
src/lib/llm/google.ts                ← GoogleGeminiProvider stub
src/lib/llm/factory.ts               ← createLLMProvider() reads LLM_PROVIDER env
src/lib/embeddings/types.ts          ← interface EmbeddingsProvider
src/lib/embeddings/openai.ts         ← OpenAIEmbeddings (text-embedding-3-small)
src/lib/embeddings/google.ts         ← GoogleEmbeddings stub
src/lib/embeddings/factory.ts        ← createEmbeddingsProvider()
src/lib/vector-store/types.ts        ← VectorStore, DocumentChunk (id: string), SearchResult
src/lib/vector-store/pgvector.ts     ← PgVectorStore con Supabase RPC match_document_chunks
src/lib/vector-store/factory.ts      ← createVectorStore()
src/lib/container.ts                 ← DI graph (lazy getters)
src/lib/rag/chunker.ts               ← chunkMarkdown() — split en ##, max 800 chars, 100 overlap
src/tests/chunker.test.ts            ← 8 tests unitarios (todos pasan)
src/tests/providers.test.ts          ← 9 tests unitarios (todos pasan)
scripts/ingest.ts                    ← lee KB, chunkea, embebe, upserta en Supabase
supabase/schema.sql                  ← schema completo (document_chunks + leads + RPC)
```

**Tests: 17/17 passing** | **TypeScript: 0 errores**

---

## Próximos pasos concretos (Fase 4)

1. `src/lib/rag/retriever.ts` — `retrieve(query, topK)` embebe query + similarity search
2. `src/lib/rag/prompt-builder.ts` — `buildSystemPrompt(chunks)` con instrucciones + contexto + citas
3. `src/lib/rag/chat-service.ts` — orquesta retrieve → prompt → LLM stream
4. `src/lib/leads/detector.ts` — `detectCommercialIntent(message)` keyword + LLM fallback
5. `src/lib/leads/service.ts` — `saveLead(data)` → Supabase
6. `src/app/api/chat/route.ts` — POST: parse, detect intent, RAG, stream con X-Sources + X-Commercial-Intent
7. Unit tests: retriever (mock VectorStore), prompt-builder, lead detector
8. `curl` test manual
9. Commit: `feat: RAG pipeline + streaming chat API`

---

## APIs críticas para Fase 4

### Chat API Route (Next.js App Router)
```typescript
// src/app/api/chat/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const lastUserMsg = messages.filter(m => m.role === 'user').at(-1)?.content ?? '';
  
  const [searchResults, hasIntent] = await Promise.all([
    retriever.retrieve(lastUserMsg),
    detectCommercialIntent(lastUserMsg),
  ]);

  const systemPrompt = buildSystemPrompt(searchResults);
  const sources = [...new Set(searchResults.map(r => r.chunk.metadata.source))];

  // Stream response via Vercel AI SDK v6 data stream
  const headers = {
    'X-Sources': JSON.stringify(sources),
    'X-Commercial-Intent': String(hasIntent),
  };
  // Use streamText + toDataStreamResponse
}
```

### streamText + toDataStreamResponse (AI SDK v6)
```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = streamText({
  model: openai('gpt-4o-mini'),
  system: systemPrompt,
  messages,
});
return result.toDataStreamResponse({ headers });
```

---

## Blockers / pendientes

- **IMPORTANTE**: El usuario debe correr `npm run ingest` manualmente cuando Supabase tenga el schema aplicado. El script ya está listo (`scripts/ingest.ts`).
- El `Agent` tool (subagentes aislados) falla en este entorno con error de worktree. **Trabajar directo en la sesión** usando Bash/Write/Edit.

---

## Cómo retomar este proyecto desde cero
1. Lee este archivo completo.
2. Lee `DECISIONS.md` para entender el por qué de las decisiones técnicas.
3. Verifica el estado con `npx tsc --noEmit` y `npm run test`.
4. Continúa en "Próximos pasos concretos" de arriba.
5. **IMPORTANTE**: El `Agent` tool falla con errores de worktree — implementar todo inline en la sesión.

## Comandos útiles
```bash
npm run dev       # levantar local (http://localhost:3000)
npm run ingest    # re-indexar knowledge base en pgvector (requiere .env.local + schema en Supabase)
npm run eval      # correr eval suite con LLM-as-judge
npm run test      # tests unitarios con Vitest (17 tests)
npx tsc --noEmit  # verificar TypeScript (0 errores)
```
