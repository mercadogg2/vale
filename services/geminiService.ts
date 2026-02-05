
import { GoogleGenAI } from "@google/genai";

// Always use process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartServiceEstimate = async (service: string, details: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Com base no serviço de "${service}" e nos detalhes "${details}", dê uma estimativa rápida de preço (em Reais) e tempo necessário no Vale do Ribeira. Responda em formato amigável para um cliente brasileiro.`,
    });
    // Use .text property instead of .text() method
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Não foi possível gerar uma estimativa automática agora.";
  }
};

export const getSmartProSearch = async (query: string) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `O usuário busca por: "${query}". Identifique as categorias de serviços domésticos relacionadas a isso (ex: Hidráulica, Elétrica, Pintura). Retorne apenas os nomes das categorias separados por vírgula.`,
        });
        // Use .text property instead of .text() method
        return response.text?.split(',').map(s => s.trim()) || [];
    } catch (error) {
        return [];
    }
};
