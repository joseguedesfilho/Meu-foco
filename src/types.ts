export type AppScreen = 'splash' | 'home' | 'upload' | 'processing' | 'result' | 'history' | 'privacy' | 'zoom';

export interface ProcessedImage {
  id: string;
  originalUrl: string;
  processedUrl: string;
  timestamp: number;
  mode: 'light' | 'medium' | 'premium';
  style: 'linkedin' | 'corporate' | 'profile';
}

export interface ProcessingOptions {
  intensity: 'light' | 'medium' | 'premium';
  style: 'linkedin' | 'corporate' | 'profile';
}
