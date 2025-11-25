import { GoogleGenAI, Chat } from "@google/genai";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a summary of the sales pipeline.
 */
export const generatePipelineSummary = async (): Promise<string> => {
  try {
    const prompt = `
      Analyze a sales pipeline and provide a concise summary with actionable insights.
      Focus on potential bottlenecks, high-value leads, and overall health.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text || "No insights available.";
  } catch (error) {
    console.error("Error generating pipeline summary with Gemini:", error);
    return "Unable to generate summary. Please check your API key.";
  }
};

/**
 * Drafts a follow-up email to a contact.
 */
export const draftEmail = async (contactName: string, context: string): Promise<string> => {
  try {
    const prompt = `
      Draft a professional and friendly email to ${contactName}.
      The purpose of the email is: ${context}.
      Keep it concise and end with a clear call to action.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text || "Could not generate draft.";
  } catch (error) {
    console.error("Error drafting email with Gemini:", error);
    return "Error drafting email. Please check your API key.";
  }
};

/**
 * Starts a new chat session with the Gemini model.
 */
export const startChat = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: 'You are a helpful assistant for a CRM application. Your name is ConnectAI. Be friendly, concise, and helpful.',
        }
    });
};
