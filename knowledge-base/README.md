# Knowledge Base — Camaral RAG Chatbot

Esta carpeta contiene la base de conocimiento estructurada que alimenta un chatbot RAG (Retrieval-Augmented Generation) sobre **Camaral**, una plataforma de AI Avatars para ventas, soporte y onboarding.

## Para qué sirve esta KB

El chatbot que se alimenta de estos documentos tiene un objetivo concreto: **responder preguntas de prospectos B2B sobre Camaral de forma confiable, sin alucinar**. Por eso la KB está diseñada con dos principios duros:

1. **Solo información verificada.** Todo lo que está aquí proviene de una fuente verificada sobre Camaral. Cualquier cosa que no esté confirmada aparece marcada explícitamente bajo una sección "Información no disponible públicamente", para que el modelo aprenda a redirigir al usuario al equipo de Camaral en vez de inventar.
2. **Chunks bien definidos para RAG.** Cada documento está dividido con encabezados `##` y `###` para que cada sección sea recuperable de forma independiente sin perder contexto.

## Organización de archivos

Los documentos están numerados para reflejar un orden lógico de lectura, no una jerarquía estricta. Para retrieval, cada documento es independiente:

| Archivo | Tema |
|---|---|
| `00-overview.md` | Documento de primer contacto: qué es Camaral, problema que resuelve, fundadores. |
| `01-como-funcionan-los-avatares.md` | Tecnología del avatar: rendering, voz, idiomas, contexto, transcripts. |
| `02-casos-de-uso-ventas.md` | Uso de Camaral en procesos de venta. |
| `03-casos-de-uso-soporte.md` | Uso de Camaral en soporte y atención al cliente. |
| `04-casos-de-uso-onboarding.md` | Uso de Camaral en onboarding de nuevos clientes. |
| `05-modos-de-despliegue.md` | Los cinco modos de despliegue del avatar y cuándo usar cada uno. |
| `06-personalizacion-y-marca.md` | Cómo el avatar refleja la marca: cara, voz, conocimiento, tono. |
| `07-integraciones-y-tecnologia.md` | Integraciones con calendarios, CRMs y plataformas de video. |
| `08-planes-y-precios.md` | Estructura de tiers (SMB vs Enterprise). Precios redirigen a ventas. |
| `09-preguntas-frecuentes.md` | FAQ consolidada para prospectos B2B. |

## Convenciones de los documentos

### Frontmatter YAML

Cada archivo comienza con un bloque de frontmatter para hacer filtros y metadatos accesibles al retriever:

```yaml
---
title: [Título del documento]
topic: [tema corto, ej: "producto", "ventas", "pricing"]
last_updated: 2026-05-17
---
```

Los valores de `topic` que se usan en esta versión:

- `overview` — documento de primer contacto.
- `producto` — funcionalidad y mecánica del producto.
- `ventas`, `soporte`, `onboarding` — casos de uso por área.
- `personalizacion` — personalización y marca.
- `integraciones` — integraciones técnicas.
- `pricing` — planes y precios.
- `faq` — preguntas frecuentes consolidadas.

### Estructura interna

Cada documento sigue una estructura consistente: título `# H1` que coincide con `title`, cuerpo organizado con `##` y `###` (cada `##` es un chunk autocontenido), sección `## Información no disponible públicamente` cuando aplica, y sección final `## Preguntas que este documento responde` con 5-8 preguntas naturales que un prospecto haría (para mejorar retrieval semántico).

### Reglas de contenido

- **Tono**: profesional pero cercano, en español, segunda persona (`tú`).
- **Longitud**: 400-800 palabras por archivo.
- **Autocontenido**: alguien leyendo solo un archivo debe entender el tema. Hay repetición intencional de contexto breve entre documentos.
- **Sin invenciones**: si una información no está en la fuente verificada, no se incluye. Se marca como pendiente de confirmación.

## Cómo actualizar la KB

Si quieres modificar o agregar contenido:

1. **Verifica la fuente.** Cualquier afirmación nueva debe poder respaldarse con material oficial de Camaral.
2. **Mantén el frontmatter actualizado** — especialmente `last_updated`, que se usa para indicar frescura del contenido.
3. **Respeta la convención de chunks.** Cada `##` debe ser legible por sí solo. Si una sección crece demasiado y mezcla temas, divídela.
4. **Actualiza la sección de "Preguntas que este documento responde"** si agregaste contenido que abre nuevas preguntas.
5. **Si descubres una integración o capacidad que antes estaba en "Información no disponible públicamente"**, muévela al cuerpo del documento correspondiente y elimínala de la lista de pendientes.

## Cómo usar esta KB en el sistema RAG

Recomendaciones operativas:

- **Indexa cada `##` como un chunk separado** (o agrupa por `###` si el chunk queda muy grande). El frontmatter debería pasarse como metadata para permitir filtros por `topic`.
- **La sección "Preguntas que este documento responde"** está pensada como ayuda al retrieval semántico: indexar esas preguntas mejora la probabilidad de match con consultas reales de usuarios.
- **Para preguntas marcadas como "Información no disponible públicamente"**, el prompt del modelo debe instruir explícitamente: "si la respuesta no está en el contexto recuperado, dirige al usuario a contactar al equipo de Camaral en vez de inventar".
- **Refresca el índice** cada vez que cambien los archivos. El campo `last_updated` del frontmatter es útil para detectar archivos modificados.

## Próximas mejoras

Cuando se tenga información verificada adicional: llenar las secciones de "Información no disponible públicamente", agregar casos de estudio detallados, sumar copys/respuestas plantilla optimizadas en tono, y considerar versiones multilingües alineadas al alcance del producto.
