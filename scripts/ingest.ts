import fs from 'fs';
import path from 'path';
import { chunkMarkdown } from '../src/lib/rag/chunker';
import { createEmbeddingsProvider } from '../src/lib/embeddings/factory';
import { createServiceClient } from '../src/lib/supabase/client';

const KB_DIR = path.join(process.cwd(), 'knowledge-base');
const EMBED_BATCH_SIZE = 20;
const UPSERT_BATCH_SIZE = 20;

async function ingest() {
  console.log('🚀 Starting knowledge base ingestion...\n');

  const supabase = createServiceClient();
  const embeddings = createEmbeddingsProvider();

  const files = fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort();

  if (files.length === 0) {
    console.error('No .md files found in knowledge-base/');
    process.exit(1);
  }

  console.log(`Found ${files.length} files to index:`);
  files.forEach((f) => console.log(`  - ${f}`));
  console.log();

  // Clear existing chunks
  const { error: deleteError } = await supabase
    .from('document_chunks')
    .delete()
    .neq('id', '___PLACEHOLDER___'); // deletes all rows
  if (deleteError) {
    console.error('Error clearing chunks:', deleteError.message);
    process.exit(1);
  }
  console.log('✓ Cleared existing chunks\n');

  // Chunk all files
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
    console.log(`  ${file}: ${chunks.length} chunks`);

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

  console.log(`\nTotal chunks: ${rows.length}`);
  console.log('Generating embeddings...');

  // Embed in batches
  const allEmbeddings: number[][] = [];
  for (let i = 0; i < rows.length; i += EMBED_BATCH_SIZE) {
    const batch = rows.slice(i, i + EMBED_BATCH_SIZE).map((r) => r.content);
    const batchEmbeddings = await embeddings.embed(batch);
    allEmbeddings.push(...batchEmbeddings);
    process.stdout.write(
      `  ${Math.min(i + EMBED_BATCH_SIZE, rows.length)}/${rows.length} embedded\r`
    );
  }
  console.log('\n✓ Embeddings generated');

  // Upsert in batches
  console.log('Upserting to Supabase...');
  const rowsWithEmbeddings = rows.map((row, i) => ({
    ...row,
    embedding: allEmbeddings[i],
  }));

  for (let i = 0; i < rowsWithEmbeddings.length; i += UPSERT_BATCH_SIZE) {
    const batch = rowsWithEmbeddings.slice(i, i + UPSERT_BATCH_SIZE);
    const { error } = await supabase.from('document_chunks').upsert(batch);
    if (error) {
      console.error('\nUpsert error:', error.message);
      process.exit(1);
    }
  }

  console.log(`\n✅ Successfully indexed ${rows.length} chunks from ${files.length} files`);
}

ingest().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
