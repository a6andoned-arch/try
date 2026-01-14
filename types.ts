export enum AppMode {
  CHAT = 'CHAT',
  LIVE = 'LIVE',
  IMAGE_GEN = 'IMAGE_GEN'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // base64
  isError?: boolean;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  messages: Message[];
}

export interface LiveConnectionState {
  isConnected: boolean;
  isSpeaking: boolean;
  volume: number;
}

export type VisionModel = 'gemini-3-flash-preview';
export type ImageGenModel = 'gemini-2.5-flash-image';
export type LiveModel = 'gemini-2.5-flash-native-audio-preview-12-2025';
