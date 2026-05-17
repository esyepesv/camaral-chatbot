# Camaral Chatbot — Decisiones Técnicas

## 1. Stack principal: Next.js 14 + Vercel AI SDK + Supabase + Anthropic
- **Fecha**: 2026-05-17
- **Contexto**: Prueba técnica con 2 días de desarrollo, deploy en Vercel
- **Decisión**: Next.js 14 App Router, Vercel AI SDK v6, Supabase + pgvector, Anthropic Claude
- **Razón**: Integración nativa con Vercel, AI SDK abstrae streaming multi-provider, pgvector evita infra adicional
- **Alternativas consideradas**: FastAPI backend (mayor overhead de setup), Pinecone (costo extra), LangChain (overkill para este scope)
- **Consecuencias**: Vendor lock-in a Vercel/Supabase, aceptable para demo

## 2. Patrón Provider en exactamente 3 lugares
- **Fecha**: 2026-05-17
- **Contexto**: Se necesita intercambiabilidad de proveedores sin reescribir consumidores
- **Decisión**: LLMProvider, EmbeddingsProvider, VectorStore — cada uno con interface + implementaciones + factory
- **Razón**: Open/Closed: agregar un nuevo proveedor no toca código existente. DI por parámetros.
- **Alternativas consideradas**: Hard-code Anthropic/OpenAI, IoC framework
- **Consecuencias**: Ligero overhead de indirección, compensado por testabilidad

## 3. Sin Clean Architecture pura
- **Fecha**: 2026-05-17
- **Contexto**: CA pura requiere domain/application/infrastructure + DTOs + use cases como clases
- **Decisión**: Módulos por responsabilidad funcional (rag/, leads/, llm/), funciones puras para lógica
- **Razón**: Para un chatbot RAG de este scope, CA pura es sobreingeniería. YAGNI.
- **Alternativas consideradas**: CA estricta (Hexagonal Architecture), DDD
- **Consecuencias**: Menos boilerplate, lógica más directa de leer

## 4. pgvector con índice HNSW (no IVFFlat)
- **Fecha**: 2026-05-17
- **Contexto**: ~50–80 chunks en la KB, dataset pequeño
- **Decisión**: HNSW con m=16, ef_construction=64
- **Razón**: IVFFlat requiere dataset grande (~10K+ vectores). HNSW es superior en datasets pequeños.
- **Alternativas consideradas**: IVFFlat (subóptimo para este volumen), sin índice
- **Consecuencias**: Mayor uso de memoria que IVFFlat, irrelevante a esta escala

## 5. Admin panel con protección por API secret
- **Fecha**: 2026-05-17
- **Contexto**: "Admin panel mínimo" en 2 días, no es un producto multi-usuario
- **Decisión**: Header `Authorization: Bearer ${ADMIN_SECRET}` verificado en cada ruta admin
- **Razón**: Suficiente seguridad para demo, cero overhead de implementación de auth completo
- **Alternativas consideradas**: NextAuth.js (overkill), Supabase Auth (correcto para producción)
- **Consecuencias**: No escala a múltiples admins, aceptable para prueba técnica

## 6. Embeddings: OpenAI text-embedding-3-small
- **Fecha**: 2026-05-17
- **Contexto**: Necesitamos vectores 1536d compatibles con pgvector
- **Decisión**: OpenAI text-embedding-3-small como proveedor principal
- **Razón**: Mejor relación costo/calidad para español, compatible con vector(1536)
- **Alternativas consideradas**: text-embedding-3-large (innecesario para ~80 chunks), Cohere
- **Consecuencias**: Dependencia de OpenAI para embeddings incluso si LLM es Anthropic

## 7. Modelo LLM: claude-haiku-4-5 por defecto
- **Fecha**: 2026-05-17
- **Contexto**: Optimizar costo en desarrollo, calidad cuando importe
- **Decisión**: LLM_MODEL=claude-haiku-4-5 por defecto, claude-sonnet-4-6 configurable
- **Razón**: Haiku es suficiente para RAG con contexto rico. Sonnet disponible para eval.
- **Alternativas consideradas**: Siempre sonnet (mayor costo), siempre haiku
- **Consecuencias**: Developer experience más económica, fácil swap para demo live

## 8. Inicialización manual del proyecto (sin create-next-app)
- **Fecha**: 2026-05-17
- **Contexto**: create-next-app falló por restricciones de nombre del directorio ("Reto Makers" con espacios y mayúsculas)
- **Decisión**: Crear todos los archivos de configuración manualmente
- **Razón**: El directorio de trabajo tiene un nombre no compatible con npm naming restrictions
- **Alternativas consideradas**: Crear en subdirectorio (complica referencia a knowledge-base), renombrar directorio
- **Consecuencias**: Mismo resultado funcional, mayor control sobre la configuración
