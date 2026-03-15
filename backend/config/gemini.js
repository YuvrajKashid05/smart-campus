import { GoogleGenAI } from "@google/genai";

export function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  return new GoogleGenAI({ apiKey: key });
}

const ai = {
  models: {
    generateContent: (opts) => getAI().models.generateContent(opts),
  },
};
export default ai;
