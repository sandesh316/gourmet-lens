
export interface Dish {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  isGenerating?: boolean;
  error?: string;
}

export interface ScanResult {
  dishes: Dish[];
  cafeName?: string;
  timestamp?: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  result: ScanResult;
}

export enum AppState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  PROCESSING = 'PROCESSING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR',
  HISTORY = 'HISTORY'
}
