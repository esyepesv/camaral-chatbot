'use client';

import { useState } from 'react';

interface Doc {
  source: string;
  title: string;
  chunkCount: number;
  createdAt: string;
}

interface DocumentListProps {
  docs: Doc[];
  secret: string;
  onRefresh: () => void;
}

export function DocumentList({ docs, secret, onRefresh }: DocumentListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [reindexing, setReindexing] = useState(false);
  const [message, setMessage] = useState('');

  const handleDelete = async (source: string) => {
    if (!confirm(`¿Eliminar todos los chunks de "${source}"?`)) return;
    setDeleting(source);
    try {
      await fetch('/api/admin/documents', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
      onRefresh();
    } finally {
      setDeleting(null);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/reindex', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      setMessage(res.ok ? '✅ Re-indexado correctamente' : `❌ Error: ${data.error}`);
      if (res.ok) onRefresh();
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">Knowledge Base</h2>
        <button
          onClick={handleReindex}
          disabled={reindexing}
          className="px-4 py-2 text-sm rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium transition-colors"
        >
          {reindexing ? 'Re-indexando…' : '↺ Re-indexar'}
        </button>
      </div>
      {message && <p className="text-sm mb-4 text-zinc-300">{message}</p>}
      <div className="rounded-xl border border-zinc-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/60">
            <tr>
              <th className="text-left px-4 py-3 text-zinc-400 font-medium">Archivo</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-medium">Título</th>
              <th className="text-right px-4 py-3 text-zinc-400 font-medium">Chunks</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {docs.map((doc, i) => (
              <tr key={doc.source} className={i % 2 === 0 ? 'bg-zinc-900/40' : ''}>
                <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{doc.source}</td>
                <td className="px-4 py-3 text-zinc-400">{doc.title}</td>
                <td className="px-4 py-3 text-right text-zinc-400">{doc.chunkCount}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(doc.source)}
                    disabled={deleting === doc.source}
                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
                  >
                    {deleting === doc.source ? '…' : 'Eliminar'}
                  </button>
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  No hay documentos indexados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
