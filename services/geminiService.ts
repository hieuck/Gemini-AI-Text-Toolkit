import { GoogleGenAI, Chat } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

let chat: Chat | null = null;

function getChatInstance(): Chat {
    if (!chat) {
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: [],
        });
    }
    return chat;
}

export function resetChat(): void {
    chat = null;
}

export async function getChatResponse(message: string): Promise<string> {
    try {
        const chatInstance = getChatInstance();
        const result = await chatInstance.sendMessage({ message });
        return result.text;
    } catch (error) {
        console.error("Error in getChatResponse:", error);
        // Fix: Re-throw error to allow UI components to handle it.
        throw error;
    }
}

export async function processText(prompt: string, textToProcess: string): Promise<string> {
    const fullPrompt = `${prompt}\n\n---\n\n${textToProcess}`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error in processText:", error);
        // Fix: Re-throw error to allow UI components to handle it.
        throw error;
    }
}
