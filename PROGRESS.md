# Camaral Chatbot — Estado del Proyecto

> Última actualización: 2026-05-17
> Fase actual: 1 de 8

## Visión rápida
Chatbot RAG para Camaral (plataforma de AI Avatars para ventas/soporte), desarrollado como prueba técnica para el CEO Samuel Santa. Responde preguntas de prospectos con información verificada de 10 archivos de knowledge base, cita fuentes, captura leads, y ofrece un admin panel mínimo. Deploy en Vercel.

## Arquitectura en 1 párrafo
Next.js 14 App Router con Vercel AI SDK v6 para streaming. Tres capas de Provider abstraídas (LLM/Embeddings/VectorStore) con factory-based DI en `src/lib/container.ts`. La KB (10 `.md` en español) es chunkeada por headings markdown, embebida con OpenAI text-embedding-3-small, y almacenada en Supabase pgvector con índice HNSW. El pipeline RAG recupera los top-5 chunks más similares, los inyecta en el system prompt de Claude, y hace stream de la respuesta con citations. Los leads se capturan cuando se detecta intención comercial en el último mensaje del usuario.

## Estado por fase
- [x] Fase 0: Setup y planeación
- [x] Fase 1: Setup del proyecto + pgvector
- [ ] Fase 2: Providers (LLM, Embeddings, VectorStore)
- [ ] Fase 3: Pipeline de ingesta de knowledge base
- [ ] Fase 4: API de chat con RAG + streaming
- [ ] Fase 5: UI del chat
- [ ] Fase 6: Admin panel + lead capture
- [ ] Fase 7: Eval suite + tests
- [ ] Fase 8: Deploy y polish

## Estado detallado de la fase actual
Fase 1 completa. Proyecto Next.js 14 inicializado manualmente con todas las dependencias. Schema SQL de Supabase listo en `supabase/schema.sql`. Listos para Fase 2: Provider layer.

## Próximos pasos concretos (en orden)
1. **MANUAL**: Crear proyecto en Supabase, habilitar extensión vector, ejecutar `supabase/schema.sql`
2. **MANUAL**: Copiar `.env.example` → `.env.local` y rellenar todas las claves de API
3. Comenzar Fase 2: Implementar Provider layer (LLM, Embeddings, VectorStore)

## Blockers / pendientes / dudas
- PENDIENTE MANUAL: Crear proyecto en Supabase y correr schema SQL
- PENDIENTE MANUAL: Obtener y configurar API keys en .env.local

## Cómo retomar este proyecto desde cero
1. Lee este archivo completo.
2. Lee `DECISIONS.md` para entender el por qué de las decisiones.
3. Revisa el último commit en git para ver el estado del código.
4. Continúa en "Próximos pasos concretos".

## Comandos útiles
- `npm run dev`: levantar local (http://localhost:3000)
- `npm run ingest`: re-indexar knowledge base en pgvector
- `npm run eval`: correr eval suite con LLM-as-judge
- `npm run test`: tests unitarios con Vitest
