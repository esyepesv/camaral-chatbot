# Camaral AI Chatbot

> **Makers Fellowship — Coding Case: Chatbot Development for Client Trust & Adoption**  
> Challenge proposed by [Samuel Santa](https://www.linkedin.com/in/samuelsanta/), CEO & Co-founder at Camaral.

**Live demo:** https://reto-makers-three.vercel.app  
**Admin panel:** https://reto-makers-three.vercel.app/admin

---

## The Challenge

Camaral is an AI Avatar platform that takes your sales and support meetings on your behalf. Before enterprise clients adopt the technology, they have critical questions that need clear, reliable, real-time answers.

The challenge: build an interactive chatbot that answers prospect questions about Camaral's digital humans — what they do, how they work, and the business value they deliver — while demonstrating code quality, scalability, and an attractive user experience.

---

## Solution Overview

A production-grade **RAG (Retrieval-Augmented Generation) chatbot** that answers questions exclusively from a verified knowledge base of 10 Spanish-language documents about Camaral. It streams responses in real time, cites its sources, detects commercial intent to capture leads, and includes an admin panel for knowledge base management.

---

## Architecture

```
User question
    │
    ▼
/api/chat (POST)
    │
    ├─ embed query ──────────────► OpenAI text-embedding-3-small
    │                                        │
    │                              similarity search (top-5)
    │                                        │
    │                              Supabase pgvector (HNSW index)
    │                                        │
    ├─ build system prompt ◄─────── retrieved chunks + source metadata
    │
    ├─ detect commercial intent ──► keyword matching (Spanish)
    │
    ├─ streamText ───────────────► OpenAI gpt-4o-mini
    │
    └─ stream response ──────────► client
         + X-Sources header (JSON array of cited files)
         + X-Commercial-Intent header (triggers lead capture modal)
```

### Three abstracted Provider layers

Each layer has an interface, concrete implementations, and a factory that reads environment variables — swap any provider without touching the rest of the codebase:

| Layer | Interface | Default | Alternatives |
|-------|-----------|---------|--------------|
| LLM | `LLMProvider` | OpenAI gpt-4o-mini | Anthropic Claude, Google Gemini |
| Embeddings | `EmbeddingsProvider` | OpenAI text-embedding-3-small | Google |
| Vector Store | `VectorStore` | Supabase pgvector | Extensible |

---

## Features

| Feature | Details |
|---------|---------|
| **RAG pipeline** | Markdown chunker (heading-aware, max 800 chars, 100-char overlap) → embeddings → cosine similarity search |
| **Streaming** | Real-time token streaming via Vercel AI SDK v6 `toUIMessageStreamResponse` |
| **Source citations** | Every response links to the source files used, shown as collapsible chips in the UI |
| **Out-of-scope handling** | Questions unrelated to Camaral are refused without hallucinating answers |
| **Lead capture** | Spanish keyword detection triggers a contact modal; leads stored in Supabase |
| **Admin panel** | KB document management, re-indexing, and paginated lead list — protected by Bearer token |
| **Eval suite** | 20-question LLM-as-judge evaluation with 80% pass threshold (`npm run eval`) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| AI Streaming | Vercel AI SDK v6 + @ai-sdk/react |
| LLM | OpenAI gpt-4o-mini (configurable) |
| Embeddings | OpenAI text-embedding-3-small (1536d) |
| Vector DB | Supabase pgvector — HNSW index (m=16, ef_construction=64) |
| Database | Supabase (PostgreSQL) |
| UI | Tailwind CSS, React, dark theme |
| Tests | Vitest — 28 unit tests |
| Deploy | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Chat UI
│   ├── admin/page.tsx            # Admin panel
│   └── api/
│       ├── chat/route.ts         # Streaming RAG endpoint
│       ├── leads/route.ts        # Lead capture
│       └── admin/                # KB management + leads (auth required)
├── components/
│   ├── chat/                     # ChatInterface, MessageBubble, SourceCitations,
│   │                             #   ChatInput, LeadCaptureModal
│   └── admin/                    # DocumentList, LeadList
└── lib/
    ├── llm/                      # LLMProvider: types, openai, anthropic, google, factory
    ├── embeddings/               # EmbeddingsProvider: openai, google, factory
    ├── vector-store/             # VectorStore: pgvector, factory
    ├── rag/                      # chunker, retriever, prompt-builder, chat-service
    ├── leads/                    # detector (commercial intent), service (persistence)
    ├── ingest.ts                 # runIngest() — used by CLI and /api/admin/reindex
    └── admin-auth.ts             # Timing-safe Bearer token verification

knowledge-base/                   # 10 .md files — the RAG corpus
scripts/
├── ingest.ts                     # CLI: chunk → embed → upsert to pgvector
└── eval.ts                       # LLM-as-judge evaluation suite
evals/questions.json              # 20 Q&A pairs (in-scope, out-of-scope, edge cases)
supabase/schema.sql               # Full DB schema (run once in Supabase SQL Editor)
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/esyepesv/camaral-chatbot
cd camaral-chatbot
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. **Database → Extensions** → enable `vector`
3. **SQL Editor** → paste and run `supabase/schema.sql`

### 3. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `LLM_PROVIDER` | `openai` \| `anthropic` \| `google` |
| `LLM_MODEL` | e.g. `gpt-4o-mini`, `claude-haiku-4-5` |
| `OPENAI_API_KEY` | Required for LLM and embeddings |
| `EMBEDDINGS_PROVIDER` | `openai` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `ADMIN_SECRET` | Any strong random string for `/admin` access |

### 4. Index the knowledge base

```bash
npm run ingest
```

Chunks the 10 `.md` files, generates embeddings, and upserts ~50–80 rows to Supabase pgvector.

### 5. Run locally

```bash
npm run dev   # http://localhost:3000
```

---

## Commands

```bash
npm run dev        # Development server
npm run build      # Production build
npm run test       # Unit tests (28 tests, Vitest)
npm run ingest     # Index knowledge base into pgvector
npm run eval       # LLM-as-judge eval suite (requires running dev server)
npx tsc --noEmit   # Type check (0 errors)
```

---

## API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/chat` | — | Streaming RAG chat |
| `POST` | `/api/leads` | — | Save captured lead |
| `GET` | `/api/admin/documents` | Bearer | List KB documents + chunk counts |
| `DELETE` | `/api/admin/documents` | Bearer | Delete all chunks for a source |
| `POST` | `/api/admin/reindex` | Bearer | Trigger full KB re-indexing |
| `GET` | `/api/admin/leads` | Bearer | Paginated leads list |

### Response headers from `/api/chat`

```
X-Sources: ["00-overview","08-planes-y-precios"]
X-Commercial-Intent: true | false
```

`X-Commercial-Intent: true` triggers the lead capture modal in the UI.

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel link
# Add all env vars via Vercel dashboard or `vercel env add`
vercel --prod
```
