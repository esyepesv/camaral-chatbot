# Architecture Decision Records

Technical decisions made during the design and implementation of this project.

---

## 1. Stack: Next.js 14 + Vercel AI SDK v6 + Supabase

**Decision:** Next.js 14 App Router, Vercel AI SDK v6, Supabase pgvector, OpenAI.

**Rationale:** Native Vercel integration for zero-config deployment. The AI SDK abstracts streaming across providers, making the LLM swappable via a single env variable. Supabase pgvector eliminates a separate vector database, keeping the infrastructure minimal.

**Alternatives considered:** FastAPI backend (higher setup overhead), Pinecone (additional paid service), LangChain (unnecessary abstraction for this scope).

---

## 2. Provider Pattern in exactly 3 places

**Decision:** `LLMProvider`, `EmbeddingsProvider`, `VectorStore` — each with an interface, concrete implementations, and a factory that reads from environment variables.

**Rationale:** Open/Closed principle — adding a new provider (e.g., Anthropic → OpenAI) requires a new file, not changes to existing consumers. Dependency injection via constructor parameters keeps things testable without IoC frameworks.

**Alternatives considered:** Hard-coding a single provider (not swappable), full IoC container (unnecessary overhead).

---

## 3. Functional modules over layered architecture

**Decision:** Modules organized by domain responsibility (`rag/`, `leads/`, `llm/`) with pure functions, rather than strict Clean Architecture layers.

**Rationale:** Clean Architecture's domain/application/infrastructure separation adds boilerplate that exceeds the benefit at this scale. YAGNI — three files changed together belong together.

**Alternatives considered:** Hexagonal Architecture, DDD (both over-engineered for a focused chatbot).

---

## 4. pgvector with HNSW index (not IVFFlat)

**Decision:** HNSW index (`m=16`, `ef_construction=64`) on the `embedding` column.

**Rationale:** IVFFlat requires a large dataset (~10K+ vectors) for effective clustering. With ~50–80 chunks, HNSW delivers better recall at negligible memory cost. No need for approximate search tuning at this scale.

---

## 5. Admin panel protected by Bearer token (not full auth)

**Decision:** `Authorization: Bearer <ADMIN_SECRET>` verified server-side on every admin route using `crypto.timingSafeEqual`.

**Rationale:** A single-admin, internal-only panel doesn't need multi-user auth. NextAuth.js or Supabase Auth would be the right choice for a production multi-user system.

---

## 6. OpenAI text-embedding-3-small for embeddings

**Decision:** `text-embedding-3-small` (1536 dimensions) as the embedding provider.

**Rationale:** Best cost/quality ratio for Spanish-language content. 1536d vectors are directly supported by pgvector with no dimension reduction needed.

**Alternatives considered:** `text-embedding-3-large` (unnecessary for ~80 chunks), Cohere (additional vendor dependency).

---

## 7. gpt-4o-mini as default LLM

**Decision:** `LLM_MODEL=gpt-4o-mini` by default, configurable via environment variable.

**Rationale:** Sufficient quality for RAG responses with rich context. Faster and cheaper than larger models. The provider pattern makes switching to GPT-4o, Claude, or Gemini a one-line env change.
