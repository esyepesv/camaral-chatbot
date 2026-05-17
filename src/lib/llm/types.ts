export interface TextChunk {
  text: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  chat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<TextChunk>;
}
