import OpenAI from 'openai';
import questions from '../evals/questions.json';

const BASE_URL = process.env.EVAL_BASE_URL ?? 'http://localhost:3000';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface EvalResult {
  question: string;
  category: string;
  answer: string;
  score: number; // 0 or 1
  reasoning: string;
}

async function askChatbot(question: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: question }] }),
  });

  if (!res.ok) throw new Error(`Chat API error: ${res.status}`);

  // Collect text from the UI message stream
  const text = await res.text();
  // Extract text chunks from SSE-style stream (format: data: {...})
  const lines = text.split('\n').filter(l => l.startsWith('data:'));
  const parts: string[] = [];
  for (const line of lines) {
    try {
      const json = JSON.parse(line.slice(5).trim());
      if (json.type === 'text-delta' && json.textDelta) {
        parts.push(json.textDelta);
      }
    } catch {
      // skip malformed lines
    }
  }
  return parts.join('');
}

async function judgeAnswer(
  question: string,
  answer: string,
  expectedHint: string,
  category: string,
): Promise<{ score: number; reasoning: string }> {
  const prompt = `Eres un evaluador de calidad para un chatbot de ventas B2B.

Pregunta: "${question}"
Categoría: ${category}
Respuesta esperada (pista): "${expectedHint}"
Respuesta del chatbot: "${answer}"

Evalúa si la respuesta del chatbot es:
1. Correcta y relevante para la pregunta
2. Sin alucinaciones (no inventa información)
3. Para preguntas out-of-scope: indica claramente que solo puede responder sobre Camaral

Responde SOLO con JSON: {"score": 1 o 0, "reasoning": "explicación breve en una oración"}
Score 1 = correcto, Score 0 = incorrecto o alucinación`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  const parsed = JSON.parse(response.choices[0].message.content ?? '{"score":0,"reasoning":"parse error"}');
  return { score: parsed.score, reasoning: parsed.reasoning };
}

async function runEval() {
  console.log(`\n🧪 Camaral Chatbot Eval Suite`);
  console.log(`📡 Target: ${BASE_URL}\n`);

  const results: EvalResult[] = [];

  for (const q of questions) {
    process.stdout.write(`  Testing: "${q.question.slice(0, 50)}..." `);
    try {
      const answer = await askChatbot(q.question);
      const { score, reasoning } = await judgeAnswer(q.question, answer, q.expectedAnswer, q.category);
      results.push({ question: q.question, category: q.category, answer, score, reasoning });
      console.log(score === 1 ? '✅' : '❌');
      if (score === 0) console.log(`     → ${reasoning}`);
    } catch (err) {
      console.log('💥 ERROR');
      console.log(`     → ${err instanceof Error ? err.message : String(err)}`);
      results.push({ question: q.question, category: q.category, answer: '', score: 0, reasoning: 'request failed' });
    }
  }

  const total = results.length;
  const passed = results.filter(r => r.score === 1).length;
  const byCategory = results.reduce<Record<string, { passed: number; total: number }>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = { passed: 0, total: 0 };
    acc[r.category].total++;
    if (r.score === 1) acc[r.category].passed++;
    return acc;
  }, {});

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 Results: ${passed}/${total} passed (${Math.round(passed/total*100)}%)\n`);
  for (const [cat, stats] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${stats.passed}/${stats.total}`);
  }

  const hallucinations = results.filter(r => r.category === 'out-of-scope' && r.score === 0);
  if (hallucinations.length > 0) {
    console.log(`\n⚠️  ${hallucinations.length} out-of-scope question(s) not handled correctly`);
  }

  console.log(`\n${passed/total >= 0.8 ? '✅' : '❌'} Overall: ${passed/total >= 0.8 ? 'PASS' : 'FAIL'} (threshold: 80%)\n`);
  process.exit(passed/total >= 0.8 ? 0 : 1);
}

runEval().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
