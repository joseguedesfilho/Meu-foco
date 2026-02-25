import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  History, 
  ArrowRight, 
  ChevronLeft, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Maximize2,
  LayoutGrid,
  Columns,
  X,
  Trash2
} from 'lucide-react';
import { AppScreen, ProcessedImage, ProcessingOptions } from './types';
import { geminiService } from './services/geminiService';
import { compressImage } from './utils/imageUtils';
import Button from './components/Button';
import ImageSlider from './components/ImageSlider';
import { HistoryCard } from './components/HistoryCard';
import { StyleId, StyleCategory } from './types';

const STYLES: { id: StyleId; label: string; category: StyleCategory; desc: string; img: string }[] = [
  { id: 'corporate', label: 'Corporativo', category: 'corporate', desc: 'Terno e gravata, ambiente executivo.', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop' },
  { id: 'linkedin', label: 'LinkedIn', category: 'professional', desc: 'Business casual, fundo claro e nítido.', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop' },
  { id: 'profile', label: 'Perfil', category: 'professional', desc: 'Minimalista e moderno para redes sociais.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop' },
  { id: 'fragmentation', label: 'Fragmentação', category: 'viral', desc: 'Efeito de partículas e estilhaços digitais.', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop' },
  { id: 'half_fragmentation', label: 'Meia Desfragmentação', category: 'viral', desc: 'Metade real, metade desintegrando em partículas.', img: 'https://images.unsplash.com/photo-1550684847-75bdda21cc95?q=80&w=400&auto=format&fit=crop' },
  { id: 'dual_concept', label: 'Dualidade', category: 'creative', desc: 'Divisão artística entre real e digital.', img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop' },
  { id: 'cinematic_aura', label: 'Aura Cinema', category: 'viral', desc: 'Fumaça e iluminação dramática de cinema.', img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&auto=format&fit=crop' },
  { id: 'futuristic', label: 'Futurista', category: 'futurist', desc: 'Neon e tecnologia do futuro.', img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=400&auto=format&fit=crop' },
  { id: 'minimalist', label: 'Minimalista', category: 'creative', desc: 'Foco total no rosto e silhueta.', img: 'https://images.unsplash.com/photo-1552168324-d612d77725e3?q=80&w=400&auto=format&fit=crop' },
  { id: 'cyber_glitch', label: 'Cyber Glitch', category: 'viral', desc: 'Distorção digital e arte cyberpunk.', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop' },
  { id: 'oil_painting', label: 'Pintura a Óleo', category: 'creative', desc: 'Estilo clássico de pintura renascentista.', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=400&auto=format&fit=crop' },
  { id: 'sketch_art', label: 'Esboço Realista', category: 'creative', desc: 'Desenho artístico feito à mão.', img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400&auto=format&fit=crop' },
];

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [options, setOptions] = useState<ProcessingOptions>({
    intensity: 'medium',
    style: 'corporate'
  });
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('meu_foco_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('meu_foco_history', JSON.stringify(history));
    } catch (e) {
      console.warn("Failed to save history to localStorage", e);
    }
  }, [history]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("A imagem é muito grande. O limite é 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
        setScreen('upload');
      };
      reader.onerror = () => {
        setError("Erro ao ler o arquivo selecionado.");
      };
      reader.readAsDataURL(file);
    }
  };

  const startProcessing = async () => {
    if (!originalImage) return;
    
    setScreen('processing');
    setIsProcessing(true);
    setError(null);
    setProcessingStep(0);

    const steps = [
      "Analisando traços faciais...",
      "Ajustando iluminação de estúdio...",
      "Removendo fundo original...",
      "Aplicando balanço de branco...",
      "Refinando detalhes profissionais...",
      "Finalizando retrato..."
    ];

    const stepInterval = setInterval(() => {
      setProcessingStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);

    try {
      const compressed = await compressImage(originalImage);
      const mimeType = compressed.split(';')[0].split(':')[1];
      const result = await geminiService.processImage(compressed, mimeType, options);
      
      const generateId = () => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
          return crypto.randomUUID();
        }
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
      };

      const newProcessedImage: ProcessedImage = {
        id: generateId(),
        originalUrl: originalImage,
        processedUrl: result,
        timestamp: Date.now(),
        mode: options.intensity,
        style: options.style
      };

      setProcessedImage(result);
      setHistory(prev => [newProcessedImage, ...prev]);
      setScreen('result');
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao processar a imagem.");
      setScreen('upload');
    } finally {
      clearInterval(stepInterval);
      setIsProcessing(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteHistoryItem = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta foto do histórico?")) {
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  const clearHistory = () => {
    if (confirm("Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.")) {
      setHistory([]);
    }
  };

  const renderSplashScreen = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center premium-gradient">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-12"
      >
        <div className="w-24 h-24 bg-gold-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-[0_0_50px_rgba(197,141,50,0.4)]">
          <Camera size={48} className="text-black" />
        </div>
        <h1 className="text-5xl font-serif font-bold mb-2 tracking-tight">Meu Foco</h1>
        <p className="text-gold-400 font-medium tracking-[0.2em] uppercase text-sm">Portrait Studio AI</p>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="max-w-xs"
      >
        <p className="text-white/60 mb-10 leading-relaxed italic">
          “Transforme sua imagem. Eleve sua presença.”
        </p>
        <Button 
          onClick={() => setScreen('home')} 
          className="w-full py-4 text-lg"
          icon={ArrowRight}
        >
          Começar
        </Button>
      </motion.div>
    </div>
  );

  const renderHomeScreen = () => (
    <div className="min-h-screen pb-24">
      <header className="p-6 flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-lg z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
            <Camera size={18} className="text-black" />
          </div>
          <span className="font-serif font-bold text-xl">Meu Foco</span>
        </div>
        <button 
          onClick={() => setScreen('history')}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <History size={20} />
        </button>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        <section className="mb-12">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-serif font-bold mb-4 leading-tight"
          >
            Retratos profissionais <br />
            <span className="gold-text-gradient">em segundos.</span>
          </motion.h2>
          <p className="text-white/60 leading-relaxed mb-8">
            Meu Foco utiliza inteligência artificial para transformar suas fotos comuns em retratos profissionais com aparência de estúdio, mantendo sua identidade.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Sparkles, title: "Luz de Estúdio", desc: "Iluminação perfeita" },
              { icon: ShieldCheck, title: "Identidade", desc: "Fidelidade total" },
              { icon: CheckCircle2, title: "Fundo Neutro", desc: "Foco em você" }
            ].map((item, i) => (
              <div key={i} className="glass-panel p-4 rounded-2xl">
                <item.icon className="text-gold-400 mb-2" size={20} />
                <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                <p className="text-white/40 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>

          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-6 rounded-2xl text-xl"
            icon={Upload}
          >
            Enviar Foto
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
          />
        </section>

        <section className="mb-12">
          <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
            <LayoutGrid size={20} className="text-gold-500" />
            Exemplos Reais
          </h3>
          <div className="rounded-2xl overflow-hidden aspect-[3/4] border border-white/10 shadow-2xl relative group">
            <ImageSlider 
              before="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop" 
              after="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1000&auto=format&fit=crop" 
            />
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[8px] uppercase font-bold border border-white/10">Antes</div>
              <div className="px-2 py-1 bg-gold-500 text-black rounded text-[8px] uppercase font-bold">Depois</div>
            </div>
            <div className="absolute inset-0 pointer-events-none border-2 border-gold-500/20 rounded-2xl"></div>
          </div>
          <p className="text-[10px] text-white/30 mt-4 text-center uppercase tracking-widest">
            Arraste o controle deslizante para ver a transformação
          </p>
        </section>
      </main>

      <footer className="p-8 text-center border-t border-white/5">
        <button 
          onClick={() => setScreen('privacy')}
          className="text-white/30 text-xs hover:text-white/60 transition-colors"
        >
          Política de Privacidade & Segurança
        </button>
      </footer>
    </div>
  );

  const renderUploadScreen = () => (
    <div className="min-h-screen flex flex-col">
      <header className="p-6 flex items-center gap-4">
        <button onClick={() => setScreen('home')} className="p-2 rounded-full bg-white/5">
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-serif font-bold text-xl">Configurar Retrato</h2>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="mb-8 rounded-2xl overflow-hidden aspect-[3/4] glass-panel relative">
          {originalImage && (
            <img src={originalImage} alt="Original" className="w-full h-full object-cover" />
          )}
          <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] uppercase tracking-widest font-bold border border-white/10">
            Original
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs uppercase tracking-widest font-bold text-white/50 block">Estilo do Retrato</label>
              <button 
                onClick={() => setScreen('gallery')}
                className="text-gold-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-gold-300 transition-colors"
              >
                <LayoutGrid size={12} />
                Galeria Completa
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {STYLES.slice(0, 3).map(style => (
                <button
                  key={style.id}
                  onClick={() => setOptions(prev => ({ ...prev, style: style.id as any }))}
                  className={`relative flex flex-col items-center gap-2 p-1 rounded-2xl border-2 transition-all overflow-hidden ${
                    options.style === style.id 
                      ? 'border-gold-500 bg-gold-500/10' 
                      : 'border-white/5 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden">
                    <img src={style.img} alt={style.label} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${options.style === style.id ? 'text-gold-400' : 'text-white/40'}`}>
                    {style.label}
                  </span>
                  {options.style === style.id && (
                    <div className="absolute top-2 right-2 bg-gold-500 text-black rounded-full p-0.5">
                      <CheckCircle2 size={12} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-white/50 mb-4 block">Intensidade da IA</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Leve', desc: 'Natural' },
                { id: 'medium', label: 'Médio', desc: 'Estúdio' },
                { id: 'premium', label: 'Premium', desc: 'Elite' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setOptions(prev => ({ ...prev, intensity: mode.id as any }))}
                  className={`flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all ${
                    options.intensity === mode.id 
                      ? 'border-gold-500 bg-gold-500/10 text-gold-300' 
                      : 'border-white/5 bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-widest mb-1">{mode.label}</span>
                  <span className="text-[9px] opacity-50 uppercase tracking-tighter">{mode.desc}</span>
                  <div className="flex gap-0.5 mt-2">
                    {[1, 2, 3].map(dot => (
                      <div 
                        key={dot} 
                        className={`w-1.5 h-1.5 rounded-full ${
                          (mode.id === 'light' && dot === 1) || 
                          (mode.id === 'medium' && dot <= 2) || 
                          (mode.id === 'premium')
                            ? 'bg-gold-500' 
                            : 'bg-white/10'
                        }`} 
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={startProcessing}
              className="w-full py-4 text-lg"
              icon={Sparkles}
            >
              Processar Foto
            </Button>
            <p className="text-center text-white/30 text-[10px] mt-4 uppercase tracking-widest">
              Sua identidade será preservada integralmente.
            </p>
          </div>
        </div>
      </main>
    </div>
  );

  const renderGalleryScreen = () => {
    const categories: { id: StyleCategory; label: string }[] = [
      { id: 'professional', label: 'Profissional' },
      { id: 'corporate', label: 'Corporativo' },
      { id: 'creative', label: 'Criativo' },
      { id: 'viral', label: 'Viral' },
      { id: 'futurist', label: 'Futurista' }
    ];

    return (
      <div className="min-h-screen flex flex-col">
        <header className="p-6 flex items-center gap-4 sticky top-0 bg-black/80 backdrop-blur-lg z-50">
          <button onClick={() => setScreen('upload')} className="p-2 rounded-full bg-white/5">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-serif font-bold text-xl">Galeria de Estilos</h2>
        </header>

        <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
          {categories.map(cat => (
            <section key={cat.id} className="mb-10">
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-gold-500 mb-6 border-l-2 border-gold-500 pl-4">
                {cat.label}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {STYLES.filter(s => s.category === cat.id).map(style => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setOptions(prev => ({ ...prev, style: style.id }));
                      setScreen('upload');
                    }}
                    className={`group relative flex flex-col rounded-2xl border-2 transition-all overflow-hidden text-left ${
                      options.style === style.id 
                        ? 'border-gold-500 bg-gold-500/10' 
                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="aspect-[3/4] overflow-hidden relative">
                      <img src={style.img} alt={style.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="text-sm font-bold block mb-1">{style.label}</span>
                        <p className="text-[10px] text-white/60 leading-tight line-clamp-2">{style.desc}</p>
                      </div>
                    </div>
                    {options.style === style.id && (
                      <div className="absolute top-3 right-3 bg-gold-500 text-black rounded-full p-1 shadow-lg">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    );
  };

  const renderProcessingScreen = () => {
    const steps = [
      "Analisando traços faciais...",
      "Ajustando iluminação de estúdio...",
      "Removendo fundo original...",
      "Aplicando balanço de branco...",
      "Refinando detalhes profissionais...",
      "Finalizando retrato..."
    ];

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 premium-gradient">
        <div className="relative mb-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 rounded-full border-t-2 border-r-2 border-gold-500"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="text-gold-500 animate-pulse" size={32} />
          </div>
        </div>

        <div className="w-full max-w-xs text-center">
          <h2 className="text-2xl font-serif font-bold mb-6">Criando sua Obra</h2>
          
          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: i <= processingStep ? 1 : 0.2,
                  y: 0,
                  color: i === processingStep ? '#c58d32' : '#ffffff'
                }}
                className="flex items-center gap-3 text-sm font-medium"
              >
                {i < processingStep ? (
                  <CheckCircle2 size={16} className="text-green-500" />
                ) : i === processingStep ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/20" />
                )}
                <span>{step}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gold-500 shadow-[0_0_10px_rgba(197,141,50,0.5)]"
              initial={{ width: "0%" }}
              animate={{ width: `${((processingStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderResultScreen = () => (
    <div className="min-h-screen flex flex-col">
      <header className="p-6 flex items-center justify-between">
        <button onClick={() => setScreen('home')} className="p-2 rounded-full bg-white/5">
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-serif font-bold text-xl">Resultado</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('slider')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'slider' ? 'bg-gold-500 text-black' : 'bg-white/5 text-white/60'}`}
          >
            <Maximize2 size={18} />
          </button>
          <button 
            onClick={() => setViewMode('side-by-side')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'side-by-side' ? 'bg-gold-500 text-black' : 'bg-white/5 text-white/60'}`}
          >
            <Columns size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="mb-8 relative group">
          {viewMode === 'slider' ? (
            <ImageSlider 
              before={originalImage || ''} 
              after={processedImage || ''} 
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="aspect-[3/4] rounded-xl overflow-hidden glass-panel relative">
                <img src={originalImage || ''} alt="Original" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-[8px] uppercase font-bold rounded">Antes</div>
              </div>
              <div className="aspect-[3/4] rounded-xl overflow-hidden glass-panel relative border border-gold-500/30">
                <img src={processedImage || ''} alt="Depois" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-gold-500 text-black text-[8px] uppercase font-bold rounded">Depois</div>
              </div>
            </div>
          )}
          <button 
            onClick={() => {
              setZoomImage(processedImage);
              setScreen('zoom');
            }}
            className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-20"
          >
            <Maximize2 size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline"
            onClick={() => setScreen('home')}
            icon={RefreshCw}
          >
            Nova Foto
          </Button>
          <Button 
            onClick={() => downloadImage(processedImage!, `meu-foco-${Date.now()}.png`)}
            icon={Download}
          >
            Download
          </Button>
        </div>

        <div className="mt-8 glass-panel p-4 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="text-gold-400 shrink-0" size={20} />
          <div>
            <h4 className="text-sm font-bold mb-1">Garantia de Identidade</h4>
            <p className="text-white/40 text-xs leading-relaxed">
              Nossa IA foi configurada para não alterar seus traços faciais. Apenas a iluminação, fundo e nitidez foram aprimorados profissionalmente.
            </p>
          </div>
        </div>
      </main>
    </div>
  );

  const renderHistoryScreen = () => (
    <div className="min-h-screen flex flex-col">
      <header className="p-6 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-lg z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setScreen('home')} className="p-2 rounded-full bg-white/5">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-serif font-bold text-xl">Seu Histórico</h2>
        </div>
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="text-red-400 text-xs font-bold uppercase tracking-widest hover:text-red-300 transition-colors flex items-center gap-1"
          >
            <Trash2 size={14} />
            Limpar
          </button>
        )}
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {history.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <History size={32} className="text-white/20" />
            </div>
            <h3 className="text-xl font-serif font-bold mb-2">Sem histórico ainda</h3>
            <p className="text-white/40 text-sm max-w-xs mb-8">
              Suas fotos processadas aparecerão aqui para que você possa baixá-las novamente.
            </p>
            <Button onClick={() => setScreen('home')}>Criar Primeiro Retrato</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {history.map(item => (
              <HistoryCard 
                key={item.id} 
                item={item} 
                onDownload={(i) => downloadImage(i.processedUrl, `meu-foco-${i.timestamp}.png`)}
                onDelete={deleteHistoryItem}
                onClick={(i) => {
                  setOriginalImage(i.originalUrl);
                  setProcessedImage(i.processedUrl);
                  setOptions({ intensity: i.mode, style: i.style });
                  setScreen('result');
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );

  const renderPrivacyScreen = () => (
    <div className="min-h-screen flex flex-col">
      <header className="p-6 flex items-center gap-4">
        <button onClick={() => setScreen('home')} className="p-2 rounded-full bg-white/5">
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-serif font-bold text-xl">Privacidade & Segurança</h2>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full prose prose-invert">
        <div className="glass-panel p-8 rounded-3xl space-y-6">
          <section>
            <h3 className="text-gold-400 font-serif text-xl mb-4">Sua Privacidade em Primeiro Lugar</h3>
            <p className="text-white/60 leading-relaxed">
              No <strong>Meu Foco</strong>, levamos a segurança dos seus dados e sua imagem muito a sério. Nossa tecnologia foi desenhada para ser efêmera e segura.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-gold-500" size={20} />
              </div>
              <div>
                <h4 className="font-bold mb-1">Processamento Local</h4>
                <p className="text-white/40 text-sm">Suas imagens originais são processadas e o resultado é armazenado apenas no seu dispositivo (LocalStorage).</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="text-gold-500" size={20} />
              </div>
              <div>
                <h4 className="font-bold mb-1">Sem Armazenamento em Nuvem</h4>
                <p className="text-white/40 text-sm">Não mantemos cópias das suas fotos em nossos servidores após o processamento ser concluído.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="text-gold-500" size={20} />
              </div>
              <div>
                <h4 className="font-bold mb-1">Fidelidade de Identidade</h4>
                <p className="text-white/40 text-sm">Nossa IA é proibida de alterar traços faciais, garantindo que você sempre se pareça com você mesmo.</p>
              </div>
            </div>
          </section>

          <p className="text-white/30 text-xs italic pt-6 border-t border-white/5">
            Ao usar o Meu Foco, você concorda que suas imagens serão enviadas para a API do Google Gemini apenas para fins de processamento e aprimoramento estético.
          </p>
        </div>
      </main>
    </div>
  );

  const renderZoomScreen = () => (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      <header className="p-6 flex items-center justify-between absolute top-0 left-0 right-0 z-10">
        <button 
          onClick={() => setScreen('result')} 
          className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10"
        >
          <X size={24} />
        </button>
        <Button 
          variant="primary"
          onClick={() => downloadImage(zoomImage!, `meu-foco-zoom.png`)}
          icon={Download}
          className="py-2 px-4 text-sm"
        >
          Salvar
        </Button>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.img 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          src={zoomImage || ''} 
          alt="Zoom" 
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gold-500/30">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {screen === 'splash' && renderSplashScreen()}
          {screen === 'home' && renderHomeScreen()}
          {screen === 'upload' && renderUploadScreen()}
          {screen === 'gallery' && renderGalleryScreen()}
          {screen === 'processing' && renderProcessingScreen()}
          {screen === 'result' && renderResultScreen()}
          {screen === 'history' && renderHistoryScreen()}
          {screen === 'privacy' && renderPrivacyScreen()}
          {screen === 'zoom' && renderZoomScreen()}
        </motion.div>
      </AnimatePresence>

      {error && (
        <div className="fixed bottom-6 left-6 right-6 z-[100]">
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className={`${error.startsWith('QUOTA_EXCEEDED') ? 'bg-amber-600' : 'bg-red-500'} text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4`}
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">
                {error.startsWith('QUOTA_EXCEEDED') ? error.replace('QUOTA_EXCEEDED: ', '') : error}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setError(null);
                  if (error.startsWith('QUOTA_EXCEEDED')) {
                    startProcessing();
                  }
                }} 
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase"
              >
                <RefreshCw size={14} />
                {error.startsWith('QUOTA_EXCEEDED') ? 'Tentar Agora' : 'Fechar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
