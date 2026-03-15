import { GoogleGenAI } from "@google/genai";

// Factory — creates client at call time so dotenv is always loaded first
export function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  return new GoogleGenAI({ apiKey: key });
}

// Default export for backward compatibility
const ai = {
  models: {
    generateContent: (opts) => getAI().models.generateContent(opts),
  },
};
export default ai;
