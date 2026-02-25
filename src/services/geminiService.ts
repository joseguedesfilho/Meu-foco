import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash-image";
const PREMIUM_MODEL = "gemini-3-pro-image-preview";

export class GeminiService {
  private getApiKey(): string {
    // Check for platform-selected API key first (injected into process.env.API_KEY)
    // or the standard GEMINI_API_KEY
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === "undefined") {
      throw new Error(
        "API_KEY_MISSING: Chave API não configurada. \n\n" +
        "Se você estiver no Netlify: \n" +
        "1. Em Site Settings > Environment Variables, adicione GEMINI_API_KEY.\n" +
        "2. Adicione também SECRETS_SCAN_OMIT_KEYS com o valor GEMINI_API_KEY.\n" +
        "3. Vá em Deploys > Trigger Deploy > Clear cache and deploy site."
      );
    }
    
    return apiKey;
  }

  async processImage(
    base64Image: string,
    mimeType: string,
    options: { intensity: string; style: string; effect: string }
  ): Promise<string> {
    try {
      const apiKey = this.getApiKey();
      const ai = new GoogleGenAI({ apiKey });
      
      // Use premium model if a personal key is selected (process.env.API_KEY is present), 
      // otherwise use standard
      const isPersonalKey = !!process.env.API_KEY;
      const modelToUse = isPersonalKey ? PREMIUM_MODEL : MODEL_NAME;

      // Remove data:image/xxx;base64, prefix if present
      const base64Data = base64Image.split(',')[1] || base64Image;

      const intensityMap = {
        light: "Subtle professional touch-ups. Keep the original lighting mostly intact but clean up the background and clothing slightly.",
        medium: "Standard high-end studio quality. Apply balanced softbox lighting and replace the outfit with a sharp professional look.",
        premium: "Elite executive portrait quality. Apply dramatic rim lighting, perfect skin texture preservation, and premium tailored attire for a magazine-cover look."
      };

      const styleMap = {
        corporate: "Formal executive style. Dark suits, white or light blue shirts, and a high-end office or neutral grey studio background.",
        linkedin: "Modern professional networking style. Business casual or smart casual attire with a clean, bright, and approachable studio background.",
        profile: "Creative professional style. Modern textures, clean lines, and a minimalist, high-contrast studio background.",
        fragmentation: "Modern Fragmentation Effect. The face remains 100% intact and clear. The person's body and clothing physically transform and disintegrate into realistic geometric particles, 3D cubes, or digital shards flutuating in the air. This is a physical transformation of the subject, not an overlay. High impact and evolutionary vibe.",
        half_fragmentation: "Half-Fragmentation Effect. Create a seamless, organic transition from reality to disintegration across the subject. One side remains perfectly realistic. The other side physically dissolves into artistic particles and digital dust. NO harsh vertical lines or visible borders between the two states; the transition must be smooth and blended.",
        dual_concept: "Creative Duality Effect. Artistically blend two concepts across the image. One side is realistic, the other is a conceptual masterpiece (e.g., digital futuristic, smoke dissolving). The transition between the two sides must be SEAMLESS and organic, with NO harsh dividing lines or visible borders.",
        cinematic_aura: "Cinematic Aura Style. Dark, moody background with dramatic rim lighting. Subtle smoke or fog enveloping the subject. High authority and strong personal brand presence. Cinema-grade color grading.",
        futuristic: "Futuristic Tech Style. Cybernetic accents in the background, neon highlights, and a high-tech laboratory or sci-fi city environment.",
        minimalist: "Ultra-Minimalist Style. Pure white or deep black background, extremely clean lines, and focus entirely on the subject's silhouette and face.",
        cyber_glitch: "Cyber Glitch Art. Apply digital distortion, chromatic aberration, and neon glitch artifacts to the background and clothing. The face remains clear but with subtle digital highlights. High-energy, tech-rebel vibe.",
        oil_painting: "Classical Oil Painting. Transform the entire image into a masterpiece of oil on canvas. Rich textures, visible brushstrokes, and warm, dramatic lighting like a Renaissance portrait. Maintain the person's likeness perfectly.",
        sketch_art: "Hand-Drawn Sketch. Convert the portrait into a sophisticated pencil and charcoal sketch. Detailed line work, artistic shading, and a paper texture background. Elegant and timeless artistic feel."
      };

      const effectMap = {
        none: "Natural colors and sharp professional clarity.",
        noir: "Dramatic Black and White (Noir style). High contrast, deep blacks, and elegant highlights. Classic timeless portrait feel.",
        vintage: "Vintage Film style. Subtle film grain, slightly desaturated warm tones, and a nostalgic high-end aesthetic (Leica look).",
        soft_glow: "Dreamy Soft Glow. Subtle light diffusion, glowing highlights, and smooth skin textures. Ethereal and premium vibe.",
        cyber_neon: "Cyber Neon accents. Reflective blue and magenta light highlights on the subject's face and shoulders. Futuristic and high-energy.",
        golden_hour: "Golden Hour lighting. Warm, rich sunset tones, long soft shadows, and a beautiful natural glow."
      };

      const prompt = `
        This is a photo of a person. Your task is to keep the person's FACE, IDENTITY, POSE, EXPRESSION, and PERSONALITY 100% UNCHANGED while only upgrading the environment, clothing, and applying a photographic effect.
        
        CRITICAL RULES FOR AUTHENTICITY:
        1. FACE & IDENTITY: DO NOT modify the face, eyes, nose, mouth, or facial structure. The face must be a pixel-perfect match to the original person.
        2. EXPRESSION: Keep the original facial expression EXACTLY as it is. Do not add smiles, change the gaze, or alter the mood of the face.
        3. POSE & BODY: Keep the person's original pose, posture, and body position exactly as they are in the photo. Do not rotate or move the subject.
        4. PERSONALITY: Do not "beautify", "smooth", or "filter" the face in a way that changes the person's character, age, or unique vibe.
        
        PROFESSIONAL UPGRADES (Style: ${options.style}, Intensity: ${options.intensity}, Effect: ${options.effect}):
        1. STYLE LOGIC: ${styleMap[options.style as keyof typeof styleMap]}
        2. INTENSITY LOGIC: ${intensityMap[options.intensity as keyof typeof intensityMap]}
        3. EFFECT LOGIC: ${effectMap[options.effect as keyof typeof effectMap]}
        4. CLOTHING: Replace or enhance the current outfit with the specified style's attire that fits the original pose perfectly.
        5. LIGHTING: Apply professional studio lighting (soft box, rim light) as per the intensity level and effect.
        6. QUALITY: High resolution, sharp focus, and professional color grading.
        
        The goal is to see the EXACT SAME PERSON with the EXACT SAME EXPRESSION in their EXACT SAME POSE, but in a much more professional and high-end context with the selected artistic effect.
      `;

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("A IA não gerou nenhuma resposta. Tente novamente com outra foto.");
      }

      let processedBase64 = "";
      let refusalReason = "";

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          processedBase64 = `data:image/png;base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          refusalReason += part.text;
        }
      }

      if (!processedBase64) {
        if (refusalReason) {
          console.warn("Gemini Refusal:", refusalReason);
          throw new Error(`A IA não conseguiu processar a imagem: ${refusalReason.slice(0, 100)}...`);
        }
        throw new Error("Não foi possível gerar a imagem processada. Tente uma foto com iluminação mais clara.");
      }

      return processedBase64;
    } catch (error: any) {
      console.error("Error processing image with Gemini:", error);
      
      let errorMessage = error.message || "";
      
      // Try to parse JSON error if message is a JSON string
      if (typeof errorMessage === 'string' && errorMessage.startsWith('{')) {
        try {
          const parsed = JSON.parse(errorMessage);
          if (parsed.error?.message) {
            errorMessage = parsed.error.message;
          }
        } catch (e) {
          // Not valid JSON or different structure
        }
      }
      
      if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("QUOTA_EXCEEDED: Limite de uso atingido. O Google permite apenas algumas gerações por minuto no plano gratuito. Por favor, aguarde 1 minuto e tente novamente.");
      }
      
      if (errorMessage.includes("permission") || errorMessage.includes("denied") || errorMessage.includes("not found") || errorMessage.includes("403")) {
        throw new Error("AUTH_ERROR: Acesso negado à API. Sua chave pode estar incorreta ou sem permissão para este modelo. Tente configurar uma nova chave.");
      }
      
      if (errorMessage.includes("safety")) {
        throw new Error("A imagem foi bloqueada pelos filtros de segurança. Tente uma foto diferente.");
      }
      
      throw new Error(errorMessage || "Ocorreu um erro inesperado ao processar a imagem.");
    }
  }

  async generateCaptions(style: string): Promise<string[]> {
    try {
      const apiKey = this.getApiKey();
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Com base no estilo de foto "${style}", gere 3 opções de legendas curtas e impactantes para redes sociais (LinkedIn e Instagram).
        As legendas devem ser em Português do Brasil.
        Formato de saída: Apenas os 3 textos separados por uma linha em branco. Sem números ou introdução.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text || "";
      return text.split('\n\n').filter(t => t.trim().length > 0).slice(0, 3);
    } catch (error) {
      console.error("Error generating captions:", error);
      return [
        "Nova fase, novo foco. 🚀",
        "A evolução é constante. #MeuFoco",
        "Pronto para os próximos desafios. #Professional"
      ];
    }
  }
}

export const geminiService = new GeminiService();
