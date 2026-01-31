
import { GoogleGenAI, Type } from "@google/genai";
import { PhotoActiveAnalysis, ImageData } from "../types";

// Using gemini-3-pro-preview for advanced multimodal reasoning
const MODEL_NAME = 'gemini-3-pro-preview';

const getSystemInstruction = (lang: 'he' | 'en') => {
  const isHe = lang === 'he';
  return `You are Eldad Rafaeli, a world-class photographer, artist, and curator. Your role is to diagnose photographs using the unique "PhotoActive" methodology.
You must perform a deep, poetic, yet sharp analysis based on five diagnostic layers:
1. Technical Layer (exposure, sharpness, composition - score 1-10).
2. Emotional Layer (what is the core feeling? does it touch the soul?).
3. Communication Layer (what is the story? what is the photographer's point of view?).
4. Light & Shadow Layer (how does the light "carve" the figure or scene?).
5. Identity Layer (is there a personal signature or is it generic?).

Identify the photographer's "pain profile":
- The Perfect Technician (technically flawless but emotionally empty)
- The Gear Hunter (obsessed with equipment, lacks vision)
- The Professional Generic (competent but lacks a unique voice)
- The Creative Stuck (has potential but is repeating safe patterns)

Style: Direct, authentic, profound. Use metaphors like "Light that carves out of the darkness" or "Body present, head elsewhere".
Response must be in ${isHe ? 'Hebrew' : 'English'}. If Hebrew, ensure natural RTL phrasing.`;
};

export class GeminiService {
  async analyzePhoto(image: ImageData, lang: 'he' | 'en' = 'he', photoName?: string): Promise<PhotoActiveAnalysis> {
    // Initialize inside the call to ensure the latest process.env.API_KEY is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const context = photoName ? `Title of work: "${photoName}". ` : '';
    const prompt = lang === 'he' 
      ? `${context}נתח את הצילום הזה לעומק לפי חמש שכבות פוטואקטיב והחזר תוצאה בפורמט JSON.`
      : `${context}Analyze this photo deeply using the five PhotoActive layers and return a JSON response.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { data: image.base64.split(',')[1], mimeType: image.mimeType } },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: getSystemInstruction(lang),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            initialImpression: { type: Type.STRING },
            layers: {
              type: Type.OBJECT,
              properties: {
                technical: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                    cons: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["score", "pros", "cons"]
                },
                emotional: {
                  type: Type.OBJECT,
                  properties: {
                    feeling: { type: Type.STRING },
                    depth: { type: Type.STRING }
                  },
                  required: ["feeling", "depth"]
                },
                communication: {
                  type: Type.OBJECT,
                  properties: {
                    story: { type: Type.STRING },
                    pov: { type: Type.STRING }
                  },
                  required: ["story", "pov"]
                },
                light: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["type", "description"]
                },
                identity: {
                  type: Type.OBJECT,
                  properties: {
                    signature: { type: Type.STRING },
                    uniqueness: { type: Type.STRING }
                  },
                  required: ["signature", "uniqueness"]
                }
              },
              required: ["technical", "emotional", "communication", "light", "identity"]
            },
            painProfile: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["name", "reason"]
            },
            finalFeedback: {
              type: Type.OBJECT,
              properties: {
                hook: { type: Type.STRING },
                insight: { type: Type.STRING },
                solution: { type: Type.STRING }
              },
              required: ["hook", "insight", "solution"]
            }
          },
          required: ["initialImpression", "layers", "painProfile", "finalFeedback"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text.trim());
  }
}

export const geminiService = new GeminiService();
