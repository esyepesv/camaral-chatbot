# Camaral AI Chatbot

RAG chatbot for Camaral — an AI Avatar platform for enterprise sales and support. Answers prospect questions from a Spanish knowledge base with source citations, lead capture on commercial intent detection, and an admin panel for KB management.

## Live Demo

https://reto-makers-three.vercel.app

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 App Router |
| AI Streaming | Vercel AI SDK v6 (`streamText` + `toUIMessageStreamResponse`) |
| LLM | OpenAI `gpt-4o-mini` (configurable via `LLM_MODEL`) |
| Embeddings | OpenAI `text-embedding-3-small` (1536d) |
| Vector Store | Supabase pgvector with HNSW index |
| UI | Tailwind CSS + React (dark theme, accent #6C47FF) |
| Tests | Vitest (28 unit tests) |

## Architecture

```
User query → /api/chat
  → embed query (OpenAI text-embedding-3-small)
  → similarity search (Supabase pgvector, top-5 chunks)
  → inject context into system prompt
  → streamText (gpt-4o-mini)
  → UI message stream + X-Sources + X-Commercial-Intent headers
  → LeadCaptureModal when commercial intent detected
```

Three abstracted Provider layers (LLM / Embeddings / VectorStore) with factory-based DI, each swappable via environment variables.

## Setup

### 1. Clone and install

```bash
git clone https://github.com/esyepesv/camaral-chatbot
cd camaral-chatbot
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Database → Extensions → enable `vector`
3. SQL Editor → run `supabase/schema.sql`

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Description |
|----------|-------------|
| `LLM_PROVIDER` | `openai` \| `anthropic` \| `google` |
| `LLM_MODEL` | Model name (e.g. `gpt-4o-mini`) |
| `OPENAI_API_KEY` | For LLM and embeddings |
| `EMBEDDINGS_PROVIDER` | `openai` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `ADMIN_SECRET` | Any string, used to protect `/admin` |

### 4. Ingest knowledge base

```bash
npm run ingest
```

This chunks the 10 `.md` files in `knowledge-base/`, generates embeddings, and upserts ~50–80 rows to Supabase pgvector.

### 5. Run

```bash
npm run dev   # http://localhost:3000
```

Admin panel: `http://localhost:3000/admin`

## Commands

```bash
npm run dev        # Dev server
npm run build      # Production build
npm run test       # Unit tests (Vitest) — 28 tests
npm run ingest     # Re-index knowledge base
npm run eval       # LLM-as-judge eval suite (requires dev server running)
npx tsc --noEmit   # Type check
```

## Key Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/chat` | — | Streaming RAG chat |
| POST | `/api/leads` | — | Save lead from modal |
| GET | `/api/admin/documents` | Bearer | List KB documents |
| DELETE | `/api/admin/documents` | Bearer | Delete document chunks |
| POST | `/api/admin/reindex` | Bearer | Trigger KB re-indexing |
| GET | `/api/admin/leads` | Bearer | List captured leads |

## Response Headers

The chat endpoint returns:
- `X-Sources`: JSON array of source filenames used for the response
- `X-Commercial-Intent`: `"true"` \| `"false"` — triggers lead capture modal in UI

## Deploy to Vercel

```bash
npm i -g vercel
vercel link
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ADMIN_SECRET
vercel --prod
```

## Testing

```bash
npm run test
# 3 test files, 28 tests
# - chunker: 8 tests (MAX_CHUNK_SIZE, metadata, overlap)
# - providers: 9 tests (factory selection, error types)
# - rag: 11 tests (prompt-builder, detector, retriever)
```
