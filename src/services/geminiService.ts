import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash-image";

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  private getAI() {
    if (this.ai) return this.ai;
    
    // In Vite, process.env.GEMINI_API_KEY is replaced at build time via vite.config.ts
    let apiKey: string | undefined;
    
    try {
      // Primary method: replaced by Vite define plugin
      apiKey = process.env.GEMINI_API_KEY;
    } catch (e) {
      // process.env might not be available in some browser environments
    }
    
    // Fallback for some build configurations
    if (!apiKey) {
      try {
        apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
      } catch (e) {
        // import.meta.env might not be available
      }
    }
    
    if (!apiKey || apiKey === "undefined") {
      throw new Error(
        "Gemini API Key não encontrada. \n\n" +
        "Se você estiver no Netlify/Vercel: \n" +
        "1. Vá em Site Settings > Environment Variables\n" +
        "2. Adicione GEMINI_API_KEY com sua chave\n" +
        "3. FAÇA UM NOVO DEPLOY para aplicar as mudanças."
      );
    }
    
    this.ai = new GoogleGenAI({ apiKey });
    return this.ai;
  }

  async processImage(
    base64Image: string,
    mimeType: string,
    options: { intensity: string; style: string }
  ): Promise<string> {
    try {
      const ai = this.getAI();
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
        profile: "Creative professional style. Modern textures, clean lines, and a minimalist, high-contrast studio background."
      };

      const prompt = `
        This is a photo of a person. Your task is to keep the person's FACE, IDENTITY, POSE, and PERSONALITY 100% UNCHANGED while only upgrading the environment and clothing.
        
        CRITICAL RULES FOR AUTHENTICITY:
        1. FACE & IDENTITY: DO NOT modify the face, eyes, nose, mouth, or facial structure. The face must be a pixel-perfect match to the original person.
        2. POSE & BODY: Keep the person's original pose, posture, and body position exactly as they are in the photo. Do not rotate or move the subject.
        3. PERSONALITY: Do not "beautify", "smooth", or "filter" the face in a way that changes the person's character, age, or unique vibe.
        
        PROFESSIONAL UPGRADES (Style: ${options.style}, Intensity: ${options.intensity}):
        1. STYLE LOGIC: ${styleMap[options.style as keyof typeof styleMap]}
        2. INTENSITY LOGIC: ${intensityMap[options.intensity as keyof typeof intensityMap]}
        3. CLOTHING: Replace or enhance the current outfit with the specified style's attire that fits the original pose perfectly.
        4. LIGHTING: Apply professional studio lighting (soft box, rim light) as per the intensity level.
        5. QUALITY: High resolution, sharp focus, and professional color grading.
        
        The goal is to see the EXACT SAME PERSON in their EXACT SAME POSE, but in a much more professional and high-end context.
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
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
      if (error.message?.includes("safety")) {
        throw new Error("A imagem foi bloqueada pelos filtros de segurança. Tente uma foto diferente.");
      }
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
