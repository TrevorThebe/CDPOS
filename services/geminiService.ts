import { GoogleGenAI } from "@google/genai";

// Initialize the API client
// Note: In a production environment, ensure API_KEY is set in your build/environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Write a short, appetizing, modern menu description (max 20 words) for a restaurant item. 
    Item Name: ${productName}
    Category: ${category}
    Style: Asian Fusion, Modern, Delicious.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Delicious homemade style.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Freshly prepared in our kitchen.";
  }
};

export const chatWithAssistant = async (message: string, history: string[]): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    // Simplified history handling for this demo
    const context = `You are a helpful AI assistant for Cosmo Dumplings restaurant staff. 
    You help with recipes, customer service tips, and stock advice. 
    Keep answers concise and professional.`;
    
    const response = await ai.models.generateContent({
        model: model,
        contents: `${context}\n\nUser Question: ${message}`,
    });

    return response.text || "I'm having trouble connecting to the brain right now.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I am offline momentarily.";
  }
};