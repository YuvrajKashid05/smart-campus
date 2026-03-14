import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "AIzaSyAOo6YaXah-jg9kR5Efkgfa1jd-wRqYd40",
});

export default ai;