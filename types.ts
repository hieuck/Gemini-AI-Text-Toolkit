
// Add Speech Recognition types
export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
export interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}
export interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}
export interface SpeechRecognitionErrorEvent {
  error: string;
}
export interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}