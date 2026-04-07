import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from "@google/genai";

const MAX_RETRIES = 5;
const INITIAL_DELAY = 2000;

export async function callGeminiWithRetry(
  params: GenerateContentParameters,
  retries = MAX_RETRIES,
  delay = INITIAL_DELAY
): Promise<GenerateContentResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent(params);
    return response;
  } catch (error: any) {
    const errorString = JSON.stringify(error).toLowerCase();
    const errorMessage = (error?.message || '').toLowerCase();
    
    const isRateLimit = 
      errorString.includes('429') || 
      error?.status === 429 || 
      errorString.includes('quota') ||
      errorString.includes('resource_exhausted') ||
      errorMessage.includes('429') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('resource_exhausted');
    
    if (isRateLimit && retries > 0) {
      console.warn(`Gemini API rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGeminiWithRetry(params, retries - 1, delay * 2);
    }
    
    throw error;
  }
}
