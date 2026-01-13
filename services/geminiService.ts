
import { GoogleGenAI, Type } from "@google/genai";
import { Dish, ScanResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractDishesFromMenu = async (base64Image: string): Promise<ScanResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: "Extract dish names and descriptions from this menu. IMPORTANT: Completely ignore and exclude any prices or currency symbols. Focus on non-Indian international dishes. Return only valid JSON.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cafeName: { type: Type.STRING },
            dishes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ["name", "description", "category"],
              },
            },
          },
          required: ["dishes"],
        },
      },
    });

    const rawJson = response.text || "{}";
    const parsed = JSON.parse(rawJson);
    
    if (!parsed.dishes || parsed.dishes.length === 0) {
      throw new Error("EMPTY_MENU");
    }

    return {
      cafeName: parsed.cafeName,
      dishes: parsed.dishes.map((d: any, index: number) => ({
        ...d,
        id: `dish-${index}-${Date.now()}`
      }))
    };
  } catch (error: any) {
    if (error.message === "EMPTY_MENU") throw error;
    if (error.message?.includes("429")) throw new Error("RATE_LIMIT");
    if (error.message?.includes("safety")) throw new Error("SAFETY_BLOCKED");
    throw new Error("EXTRACTION_FAILED");
  }
};

export const generateVisualForDish = async (dishName: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A single, high-quality, professional food photography shot of ${dishName}. Served on a clean plate in a natural cafe setting. Bright, appetizing, 4k detail, no text on image.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate || candidate.finishReason === 'SAFETY') {
      throw new Error("VISUAL_SAFETY");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    console.error("Image generation failed:", error);
    if (error.message === "VISUAL_SAFETY") throw error;
    if (error.message?.includes("429")) throw new Error("RATE_LIMIT");
    throw new Error("GEN_FAILED");
  }
};
