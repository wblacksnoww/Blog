import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedBlogResponse } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateBlogPost = async (topic: string, tone: string = 'Professional'): Promise<GeneratedBlogResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const systemInstruction = `You are an expert blog writer. 
  Your goal is to write high-quality, engaging, and well-structured blog posts in Markdown format.
  The content should use standard Markdown: # for main title (though redundant if passed separately), ## for sections, **bold** for emphasis, etc.
  Do not include the main # Title in the 'content' field, as it is handled separately.
  Ensure the tone is ${tone}.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Write a comprehensive blog post about: "${topic}".`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "A catchy, SEO-friendly title." },
          excerpt: { type: Type.STRING, description: "A short summary (1-2 sentences) for the card preview." },
          content: { type: Type.STRING, description: "The full blog post body in Markdown format." },
          tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Relevant tags for the post." },
          categories: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Broad categories (e.g., Technology, Lifestyle) applicable to this post." },
          readTimeMinutes: { type: Type.INTEGER, description: "Estimated read time in minutes." }
        },
        required: ["title", "excerpt", "content", "tags", "categories", "readTimeMinutes"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to generate content from Gemini.");
  }

  try {
    return JSON.parse(text) as GeneratedBlogResponse;
  } catch (error) {
    console.error("JSON Parse Error:", error);
    throw new Error("Received invalid JSON from Gemini.");
  }
};