import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash-image";

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  private getAI() {
    if (this.ai) return this.ai;
    
    // In Vite, process.env.GEMINI_API_KEY is replaced at build time.
    // We use a fallback to check both process.env and a direct string check.
    let apiKey: string | undefined;
    
    try {
      apiKey = process.env.GEMINI_API_KEY;
    } catch (e) {
      // process.env might not be available
    }
    
    if (!apiKey) {
      throw new Error("Gemini API Key não encontrada. Verifique as configurações do ambiente.");
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

      const prompt = `
        This is a photo of a person. Your task is to keep the person's FACE, IDENTITY, POSE, and PERSONALITY 100% UNCHANGED while only upgrading the environment and clothing.
        
        CRITICAL RULES FOR AUTHENTICITY:
        1. FACE & IDENTITY: DO NOT modify the face, eyes, nose, mouth, or facial structure. The face must be a pixel-perfect match to the original person.
        2. POSE & BODY: Keep the person's original pose, posture, and body position exactly as they are in the photo. Do not rotate or move the subject.
        3. PERSONALITY: Do not "beautify", "smooth", or "filter" the face in a way that changes the person's character, age, or unique vibe.
        
        PROFESSIONAL UPGRADES:
        1. CLOTHING: Replace or enhance the current outfit with high-end, professional ${options.style} attire (e.g., a well-tailored suit, elegant blazer, or executive shirt) that fits the original pose.
        2. BACKGROUND: Place the person in a sophisticated studio setting or professional executive office background matching the ${options.style} style.
        3. LIGHTING: Apply professional studio lighting (soft box, rim light) that falls naturally on the subject.
        4. QUALITY: High resolution, sharp focus, and professional color grading.
        
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
