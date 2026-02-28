export interface EssayRecord {
  id: string;
  title: string;
  content: string;
  feedback: string;
  score: number;
  date: string;
}

export interface OutlineRecord {
  id: string;
  topic: string;
  content: string;
  date: string;
}

export interface AnalysisRecord {
  id: string;
  workTitle: string;
  content: string;
  date: string;
}

export interface AppSettings {
  apiKey: string;
  model: string;
  theme: 'light' | 'dark';
}
