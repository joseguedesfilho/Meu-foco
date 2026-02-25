export type AppScreen = 'splash' | 'home' | 'upload' | 'processing' | 'result' | 'history' | 'privacy' | 'zoom' | 'gallery';

export type StyleId = 
  | 'linkedin' | 'corporate' | 'profile' 
  | 'fragmentation' | 'half_fragmentation' | 'dual_concept' | 'cinematic_aura'
  | 'futuristic' | 'minimalist' | 'cyber_glitch' | 'oil_painting' | 'sketch_art';

export type StyleCategory = 'professional' | 'creative' | 'viral' | 'corporate' | 'futurist';

export interface ProcessedImage {
  id: string;
  originalUrl: string;
  processedUrl: string;
  timestamp: number;
  mode: 'light' | 'medium' | 'premium';
  style: StyleId;
}

export interface ProcessingOptions {
  intensity: 'light' | 'medium' | 'premium';
  style: StyleId;
}
