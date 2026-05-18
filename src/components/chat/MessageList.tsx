'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: UIMessage[];
  lastSources: string[];
  isLoading: boolean;
}

export function MessageList({ messages, lastSources, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-500 text-center">
        <div>
          <div className="text-4xl mb-4">💬</div>
          <p className="text-lg font-medium text-zinc-400">Hola, soy el asistente de Camaral</p>
          <p className="text-sm mt-1">Pregúntame sobre nuestra plataforma de AI Avatars</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.map((message, index) => {
        const isLastAssistant =
          message.role === 'assistant' && index === messages.length - 1;
        return (
          <MessageBubble
            key={message.id}
            message={message}
            sources={isLastAssistant ? lastSources : []}
          />
        );
      })}
      {isLoading && (
        <div className="flex justify-start mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mr-2 text-sm font-bold">
            C
          </div>
          <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-zinc-800 border border-zinc-700/50">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
