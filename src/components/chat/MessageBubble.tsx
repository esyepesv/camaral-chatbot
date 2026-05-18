'use client';

import type { UIMessage } from 'ai';
import { SourceCitations } from './SourceCitations';

interface MessageBubbleProps {
  message: UIMessage;
  sources?: string[];
}

export function MessageBubble({ message, sources = [] }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const textContent = message.parts
    .filter(p => p.type === 'text')
    .map(p => p.text)
    .join('');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mr-2 mt-0.5 text-sm font-bold">
          C
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'max-w-[70%]' : ''}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-purple-600 text-white rounded-tr-sm'
              : 'bg-zinc-800 text-zinc-100 rounded-tl-sm border border-zinc-700/50'
          }`}
        >
          {textContent}
        </div>
        {!isUser && <SourceCitations sources={sources} />}
      </div>
    </div>
  );
}
