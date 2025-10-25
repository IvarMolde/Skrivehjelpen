
export enum CEFRLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
}

export interface BotMessage {
  id: string;
  response: string;
  isEvaluating: boolean;
  audioState: 'idle' | 'generating' | 'playing' | 'error';
}
