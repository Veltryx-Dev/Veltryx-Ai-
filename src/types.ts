export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | any[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface Attachment {
  id: string;
  file: File;
  type: 'image' | 'document';
  dataUrl?: string; // For images
  parsedText?: string; // For documents
}
