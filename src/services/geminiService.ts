import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const MODELS = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash'];

export interface FilePart {
  mimeType: string;
  base64Data: string;
}

export class GeminiService {
  private static getApiKey(): string | null {
    return localStorage.getItem('vanhien_api_key');
  }

  private static getSelectedModel(): string {
    return localStorage.getItem('vanhien_model') || MODELS[0];
  }

  static async generateContent(prompt: string, systemInstruction?: string, files?: FilePart[]): Promise<string | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("Vui lòng cấu hình API Key trong phần Cài đặt.");
    }

    const selectedModel = this.getSelectedModel();

    // Build ordered model list: selected model first, then remaining models in order
    const orderedModels = [selectedModel, ...MODELS.filter(m => m !== selectedModel)];

    // Build content parts: text + optional file inline data
    const parts: any[] = [{ text: prompt }];
    if (files && files.length > 0) {
      for (const file of files) {
        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.base64Data,
          }
        });
      }
    }

    let lastError: any = null;

    for (const modelName of orderedModels) {
      try {
        console.log(`Trying model: ${modelName}...`);
        const ai = new GoogleGenAI({ apiKey });
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: modelName,
          contents: [{ parts }],
          config: {
            systemInstruction,
            temperature: 0.7,
          }
        });

        return response.text || null;
      } catch (error: any) {
        console.error(`Model ${modelName} failed:`, error);
        lastError = error;

        // If it's a rate limit or quota error, try next model
        const errorMsg = error.message || '';
        const isRetryable =
          errorMsg.includes('429') ||
          errorMsg.includes('quota') ||
          errorMsg.includes('RESOURCE_EXHAUSTED') ||
          errorMsg.includes('overloaded') ||
          errorMsg.includes('503') ||
          errorMsg.includes('500');

        if (isRetryable) {
          console.log(`Model ${modelName} unavailable, trying next fallback...`);
          continue;
        }

        // For non-retryable errors (invalid key, bad request, etc.), throw immediately
        throw error;
      }
    }

    // All models failed
    const errorMessage = lastError?.message || 'Unknown error';
    throw new Error(`Tất cả các model đều thất bại. Lỗi gần nhất: ${errorMessage}`);
  }
}
