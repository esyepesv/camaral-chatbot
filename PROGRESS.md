# Camaral Chatbot — Estado del Proyecto

> Última actualización: 2026-05-17T20:05 UTC
> Fase actual: 8 de 8 — Deploy
> Último commit: 45410ec — feat: eval suite + README

---

## Visión rápida
Chatbot RAG para Camaral (plataforma de AI Avatars para ventas/soporte), prueba técnica para el CEO Samuel Santa. Responde preguntas de prospectos con información verificada de 10 archivos `.md` en `knowledge-base/`, cita fuentes, captura leads, tiene un admin panel mínimo. Deploy pendiente en Vercel.

## Arquitectura
Next.js 14 App Router + Vercel AI SDK v6. Tres Provider layers (LLM/Embeddings/VectorStore) con factory DI. KB chunkeada por headings `##`, embebida con OpenAI text-embedding-3-small, almacenada en Supabase pgvector HNSW. Top-5 chunks por coseno → system prompt → streamText (gpt-4o-mini) → UI message stream con headers X-Sources y X-Commercial-Intent.

## Configuración actual
- `LLM_PROVIDER=openai`, `LLM_MODEL=gpt-4o-mini`
- `EMBEDDINGS_PROVIDER=openai` → `text-embedding-3-small`
- Supabase: `rbfxayrqmzrxafdhzspe.supabase.co`

---

## Estado por fase
- [x] Fase 0: Setup y planeación
- [x] Fase 1: Setup del proyecto + pgvector
- [x] Fase 2: Providers (LLM, Embeddings, VectorStore)
- [x] Fase 3: Pipeline de ingesta de knowledge base
- [x] Fase 4: API de chat con RAG + streaming
- [x] Fase 5: UI del chat
- [x] Fase 6: Admin panel + lead capture
- [x] Fase 7: Eval suite + tests
- [ ] **Fase 8: Deploy y polish** ← PENDIENTE

---

## Archivos clave

```
src/app/page.tsx                     ← Chat UI root
src/app/admin/page.tsx               ← Admin panel (password gate + tabs)
src/app/api/chat/route.ts            ← POST streaming RAG endpoint
src/app/api/leads/route.ts           ← POST save lead
src/app/api/admin/documents/route.ts ← GET list / DELETE
src/app/api/admin/reindex/route.ts   ← POST trigger re-index
src/app/api/admin/leads/route.ts     ← GET paginated leads
src/components/chat/                 ← ChatInterface, MessageList, MessageBubble,
                                        ChatInput, SourceCitations, LeadCaptureModal
src/components/admin/               ← DocumentList, LeadList
src/lib/rag/                        ← chunker, retriever, prompt-builder, chat-service
src/lib/leads/                      ← detector, service
src/lib/llm/                        ← types, anthropic, openai, google, factory
src/lib/embeddings/                 ← types, openai, google, factory
src/lib/vector-store/               ← types, pgvector, factory
src/lib/container.ts                ← DI graph (lazy getters)
src/lib/ingest.ts                   ← runIngest() usable from API + CLI
src/lib/admin-auth.ts               ← Bearer token auth helper
scripts/ingest.ts                   ← CLI wrapper for runIngest()
scripts/eval.ts                     ← LLM-as-judge eval suite
evals/questions.json                ← 20 eval Q&A pairs
supabase/schema.sql                 ← document_chunks + leads + match_document_chunks RPC
```

**Tests: 28/28 passing** | **TypeScript: 0 errores**

---

## Para hacer el deploy (Fase 8)

### Prerequisito: correr ingest
Si aún no lo has hecho:
```bash
npm run ingest
```
Indexa los 10 archivos en Supabase pgvector (~50-80 chunks).

### Deploy en Vercel

```bash
npm i -g vercel
vercel link          # conectar repo
```

Agregar env vars en Vercel Dashboard (Settings → Environment Variables):
- `LLM_PROVIDER=openai`
- `LLM_MODEL=gpt-4o-mini`
- `OPENAI_API_KEY=<tu key>`
- `EMBEDDINGS_PROVIDER=openai`
- `NEXT_PUBLIC_SUPABASE_URL=https://rbfxayrqmzrxafdhzspe.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<del .env.local>`
- `SUPABASE_SERVICE_ROLE_KEY=<del .env.local>`
- `ADMIN_SECRET=<del .env.local>`

```bash
vercel --prod
```

### Verificación post-deploy
1. `curl -X POST https://<url>/api/chat -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"¿Qué es Camaral?"}]}'`
2. Visitar `https://<url>` y chatear
3. Visitar `https://<url>/admin` con el ADMIN_SECRET
4. Probar "quiero contratar" — debe aparecer modal de lead capture

## Comandos útiles
```bash
npm run dev       # local (http://localhost:3000)
npm run ingest    # re-indexar KB
npm run test      # 28 tests unitarios
npm run eval      # eval suite (requiere servidor corriendo)
npx tsc --noEmit  # type check (0 errores)
```
