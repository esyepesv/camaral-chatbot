import { describe, it, expect } from 'vitest';
import { chunkMarkdown } from '@/lib/rag/chunker';

const SAMPLE_MD = `---
title: "Test Document"
topic: "testing"
last_updated: 2026-05-17
---

# Test Document

## Section One
This is the first section with some content about the topic at hand.

## Section Two
This is the second section with completely different content.

## Long Section
${'This is a very long paragraph with lots of repeated content to exceed the 800 char limit. '.repeat(10)}
`;

describe('chunkMarkdown', () => {
  it('creates one chunk per short ## section', () => {
    const simple = `---\ntitle: "T"\ntopic: "t"\n---\n\n## A\nContent A\n\n## B\nContent B\n`;
    const chunks = chunkMarkdown(simple, 'test.md');
    expect(chunks).toHaveLength(2);
  });

  it('splits oversized sections into multiple chunks', () => {
    const chunks = chunkMarkdown(SAMPLE_MD, 'test.md');
    const longChunks = chunks.filter((c) => c.metadata.source === 'test');
    // Long Section should produce more than 1 chunk
    expect(chunks.length).toBeGreaterThan(3);
  });

  it('respects MAX_CHUNK_SIZE of 800 chars per chunk', () => {
    const chunks = chunkMarkdown(SAMPLE_MD, 'test.md');
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(800);
    }
  });

  it('sets correct metadata from frontmatter', () => {
    const chunks = chunkMarkdown(SAMPLE_MD, '00-overview.md');
    expect(chunks[0].metadata.source).toBe('00-overview');
    expect(chunks[0].metadata.title).toBe('Test Document');
    expect(chunks[0].metadata.topic).toBe('testing');
  });

  it('assigns sequential chunkIndex starting at 0', () => {
    const chunks = chunkMarkdown(SAMPLE_MD, 'test.md');
    chunks.forEach((chunk, i) => {
      expect(chunk.metadata.chunkIndex).toBe(i);
    });
  });

  it('does not produce empty chunks', () => {
    const chunks = chunkMarkdown(SAMPLE_MD, 'test.md');
    for (const chunk of chunks) {
      expect(chunk.content.trim().length).toBeGreaterThan(0);
    }
  });

  it('uses source filename without .md extension', () => {
    const chunks = chunkMarkdown(SAMPLE_MD, '01-como-funcionan.md');
    expect(chunks[0].metadata.source).toBe('01-como-funcionan');
  });

  it('falls back gracefully when frontmatter is missing', () => {
    const noFrontmatter = `# Just Title\n\n## Section\nContent here\n`;
    const chunks = chunkMarkdown(noFrontmatter, 'bare.md');
    expect(chunks[0].metadata.source).toBe('bare');
    expect(chunks[0].metadata.topic).toBe('general');
  });
});
