export type AppScreen = 'splash' | 'home' | 'upload' | 'processing' | 'result' | 'history' | 'privacy' | 'zoom' | 'gallery';

export type StyleId = 
  | 'linkedin' | 'corporate' | 'profile' | 'editorial' | 'old_money'
  | 'fragmentation' | 'half_fragmentation' | 'dual_concept' | 'cinematic_aura'
  | 'futuristic' | 'minimalist' | 'cyber_glitch' | 'oil_painting' | 'sketch_art'
  | 'pop_art' | 'double_exposure';

export type StyleCategory = 'professional' | 'creative' | 'viral' | 'corporate' | 'futurist' | 'artistic';

export type EffectId = 'none' | 'noir' | 'vintage' | 'soft_glow' | 'cyber_neon' | 'golden_hour' | 'prism_light' | 'analog_film';

export interface ProcessedImage {
  id: string;
  originalUrl: string;
  processedUrl: string;
  timestamp: number;
  mode: 'light' | 'medium' | 'premium';
  style: StyleId;
  effect?: EffectId;
}

export interface ProcessingOptions {
  intensity: 'light' | 'medium' | 'premium';
  style: StyleId;
  effect: EffectId;
}
