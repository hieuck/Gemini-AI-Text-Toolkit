import { GoogleGenAI, Chat } from "@google/genai";

// Fix: Per guideline, API key must come from process.env and client should be initialized with it directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chat: Chat | null = null;

function getChatInstance(): Chat {
    if (!chat) {
        // Fix: `history` is not a valid parameter for `chats.create`.
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
        });
    }
    return chat;
}

// Fix: Per guideline, API key must come from process.env and not be passed as an argument.
export async function getChatResponse(message: string): Promise<string> {
    try {
        const chatInstance = getChatInstance();
        const result = await chatInstance.sendMessage({ message });
        return result.text ?? '';
    } catch (error) {
        console.error("Error in getChatResponse:", error);
        throw error;
    }
}

// Fix: Per guideline, API key must come from process.env and not be passed as an argument.
export async function processText(prompt: string, textToProcess: string): Promise<string> {
    const fullPrompt = `${prompt}\n\n---\n\n${textToProcess}`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });
        return response.text ?? '';
    } catch (error) {
        console.error("Error in processText:", error);
        throw error;
    }
}