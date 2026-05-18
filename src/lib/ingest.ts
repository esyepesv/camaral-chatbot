import fs from 'fs';
import path from 'path';
import { chunkMarkdown } from './rag/chunker';
import { createEmbeddingsProvider } from './embeddings/factory';
import { createServiceClient } from './supabase/client';

const KB_DIR = path.join(process.cwd(), 'knowledge-base');
const EMBED_BATCH_SIZE = 20;
const UPSERT_BATCH_SIZE = 20;

export async function runIngest(): Promise<void> {
  const supabase = createServiceClient();
  const embeddings = createEmbeddingsProvider();

  const files = fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort();

  if (files.length === 0) throw new Error('No .md files found in knowledge-base/');

  // Clear existing chunks
  const { error: deleteError } = await supabase
    .from('document_chunks')
    .delete()
    .neq('id', '___PLACEHOLDER___');
  if (deleteError) throw new Error(`Clear failed: ${deleteError.message}`);

  const rows: {
    id: string;
    content: string;
    source: string;
    title: string;
    topic: string;
    chunk_index: number;
  }[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(KB_DIR, file), 'utf-8');
    const chunks = chunkMarkdown(content, file);
    for (const chunk of chunks) {
      rows.push({
        id: `${chunk.metadata.source}-${chunk.metadata.chunkIndex}`,
        content: chunk.content,
        source: chunk.metadata.source,
        title: chunk.metadata.title,
        topic: chunk.metadata.topic,
        chunk_index: chunk.metadata.chunkIndex,
      });
    }
  }

  const allEmbeddings: number[][] = [];
  for (let i = 0; i < rows.length; i += EMBED_BATCH_SIZE) {
    const batch = rows.slice(i, i + EMBED_BATCH_SIZE).map((r) => r.content);
    allEmbeddings.push(...(await embeddings.embed(batch)));
  }

  const rowsWithEmbeddings = rows.map((row, i) => ({
    ...row,
    embedding: allEmbeddings[i],
  }));

  for (let i = 0; i < rowsWithEmbeddings.length; i += UPSERT_BATCH_SIZE) {
    const { error } = await supabase
      .from('document_chunks')
      .upsert(rowsWithEmbeddings.slice(i, i + UPSERT_BATCH_SIZE));
    if (error) throw new Error(`Upsert failed: ${error.message}`);
  }
}
