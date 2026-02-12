
export interface LogEntry {
  id: string;
  type: 'system' | 'user' | 'ai' | 'action';
  message: string;
  timestamp: Date;
}

export interface TranscriptionPart {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export enum AppState {
  SETUP = 'setup',
  IDLE = 'idle',
  LISTENING = 'listening',
  SPEAKING = 'speaking',
  ERROR = 'error'
}

export interface AndroidPermissions {
  microphone: boolean;
  contacts: boolean;
  calls: boolean;
  whatsapp: boolean;
}
