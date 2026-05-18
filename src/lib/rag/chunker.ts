import matter from 'gray-matter';

export interface RawChunk {
  content: string;
  metadata: {
    source: string;
    title: string;
    topic: string;
    chunkIndex: number;
  };
}

const MAX_CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

function splitAtSentences(text: string): string[] {
  const chunks: string[] = [];
  let current = '';

  // Split on '. ', '.\n', '? ', '! '
  const sentences = text.split(/(?<=[.?!])\s+/);

  for (const sentence of sentences) {
    if (sentence.length > MAX_CHUNK_SIZE) {
      // Single sentence too long: hard-cut with overlap
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      for (let i = 0; i < sentence.length; i += MAX_CHUNK_SIZE - CHUNK_OVERLAP) {
        chunks.push(sentence.slice(i, i + MAX_CHUNK_SIZE).trim());
      }
      continue;
    }

    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > MAX_CHUNK_SIZE) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function splitSection(section: string): string[] {
  if (section.length <= MAX_CHUNK_SIZE) return [section];

  const result: string[] = [];
  const paragraphs = section.split(/\n\n+/);
  let current = '';

  for (const para of paragraphs) {
    if (para.length > MAX_CHUNK_SIZE) {
      // Flush current buffer first
      if (current.trim()) {
        result.push(current.trim());
        current = '';
      }
      // Split the large paragraph at sentence level
      const subchunks = splitAtSentences(para);
      result.push(...subchunks);
      continue;
    }

    const candidate = current ? `${current}\n\n${para}` : para;

    if (candidate.length > MAX_CHUNK_SIZE) {
      if (current.trim()) {
        result.push(current.trim());
        // Carry a short overlap into next chunk
        const overlap = current.length > CHUNK_OVERLAP
          ? current.slice(-CHUNK_OVERLAP).trimStart()
          : current;
        // Only use overlap if para + overlap still fits
        current = (overlap + '\n\n' + para).length <= MAX_CHUNK_SIZE
          ? overlap + '\n\n' + para
          : para;
      } else {
        current = para;
      }
    } else {
      current = candidate;
    }
  }

  if (current.trim()) result.push(current.trim());
  return result;
}

export function chunkMarkdown(rawContent: string, sourceFile: string): RawChunk[] {
  const { data: frontmatter, content } = matter(rawContent);
  const source = sourceFile.replace(/\.md$/, '');
  const title = (frontmatter.title as string | undefined) ?? source;
  const topic = (frontmatter.topic as string | undefined) ?? 'general';

  // Split on ## headings, keeping heading with its content
  const sections = content.split(/(?=^## )/m).filter((s) => s.trim().length > 0);

  const chunks: RawChunk[] = [];

  for (const section of sections) {
    const parts = splitSection(section.trim());
    for (const part of parts) {
      if (part.trim()) {
        chunks.push({
          content: part,
          metadata: { source, title, topic, chunkIndex: chunks.length },
        });
      }
    }
  }

  return chunks;
}
