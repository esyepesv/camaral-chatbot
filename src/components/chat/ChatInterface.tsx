'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { LeadCaptureModal } from './LeadCaptureModal';

export function ChatInterface() {
  const [lastSources, setLastSources] = useState<string[]>([]);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: async (url, options) => {
        const response = await fetch(url, options);
        const sources = JSON.parse(
          response.headers.get('X-Sources') ?? '[]',
        ) as string[];
        const hasIntent =
          response.headers.get('X-Commercial-Intent') === 'true';
        setLastSources(sources);
        if (hasIntent) setShowLeadModal(true);
        return response;
      },
    }),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleSend = (text: string) => {
    setLastUserMessage(text);
    sendMessage({ text });
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
          C
        </div>
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">Camaral AI</h1>
          <p className="text-xs text-zinc-500">Asistente virtual · Siempre disponible</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-zinc-500">En línea</span>
        </div>
      </header>

      <MessageList
        messages={messages}
        lastSources={lastSources}
        isLoading={isLoading}
      />

      <ChatInput onSend={handleSend} disabled={isLoading} />

      <LeadCaptureModal
        open={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        triggerMessage={lastUserMessage}
      />
    </div>
  );
}
