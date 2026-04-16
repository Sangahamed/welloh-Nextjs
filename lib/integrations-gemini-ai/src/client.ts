import { GoogleGenAI } from "@google/genai";

let cached: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (cached) {
    return cached;
  }
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "AI_INTEGRATIONS_GEMINI_BASE_URL and AI_INTEGRATIONS_GEMINI_API_KEY must be set. Did you forget to provision the Gemini AI integration?",
    );
  }
  cached = new GoogleGenAI({
    apiKey,
    httpOptions: {
      apiVersion: "",
      baseUrl,
    },
  });
  return cached;
}

/** Lazy client so importing this module does not throw during Next.js build. */
export const ai = new Proxy({} as GoogleGenAI, {
  get(_target, prop, receiver) {
    return Reflect.get(getGeminiClient(), prop, receiver);
  },
});
