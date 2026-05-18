import type { SearchResult } from '../vector-store/types';

const CAMARAL_SYSTEM_PROMPT = `Eres el asistente virtual de Camaral, una plataforma de AI Avatars para ventas y soporte empresarial.

Tu función es responder preguntas de prospectos sobre Camaral usando ÚNICAMENTE la información del contexto proporcionado.

Reglas:
- Responde siempre en español, de forma clara, concisa y profesional.
- Si la pregunta no tiene respuesta en el contexto, di: "No tengo información sobre eso. Para más detalles, contáctanos en contacto@camaral.ai."
- Nunca inventes información que no esté en el contexto.
- Cita las fuentes cuando sea útil usando el formato [Fuente: nombre-del-archivo].
- Si detectas intención de compra o contratación, muestra entusiasmo y ofrece conectarlos con el equipo comercial.`;

export function buildSystemPrompt(results: SearchResult[]): string {
  if (results.length === 0) {
    return CAMARAL_SYSTEM_PROMPT + '\n\nNo hay contexto relevante disponible para esta consulta.';
  }

  const contextBlocks = results.map((r) => {
    const { source, title } = r.chunk.metadata;
    return `[Fuente: ${source}] ${title}\n${r.chunk.content}`;
  });

  return `${CAMARAL_SYSTEM_PROMPT}

## Contexto relevante

${contextBlocks.join('\n\n---\n\n')}`;
}
