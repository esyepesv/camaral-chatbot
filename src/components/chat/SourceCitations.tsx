'use client';

import { useState } from 'react';

interface SourceCitationsProps {
  sources: string[];
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  const [expanded, setExpanded] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(v => !v)}
        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
      >
        {expanded ? '▾' : '▸'} {sources.length === 1 ? '1 fuente' : `${sources.length} fuentes`}
      </button>
      {expanded && (
        <div className="mt-1 flex flex-wrap gap-1">
          {sources.map(source => (
            <span
              key={source}
              className="inline-block px-2 py-0.5 text-xs rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/40"
            >
              {source}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
