
'use server';
/**
 * @fileOverview AI Chatbot flow for EcoAICoach.
 *
 * - chatWithAICoach - A function that handles the chatbot conversation.
 * - ChatWithAICoachInput - The input type for the chatWithAICoach function.
 * - ChatWithAICoachOutput - The return type for the chatWithAICoach function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { FlowChatMessage } from '@/types';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']).describe("The role of the message sender, either 'user' or 'model' (for AI)."),
  content: z.string().describe("The text content of the message."),
});

const ChatWithAICoachInputSchema = z.object({
  userInput: z.string().describe("The latest message from the user."),
  chatHistory: z.array(ChatMessageSchema).optional().describe("The previous conversation history. Each message should have a role ('user' or 'model') and content."),
});
export type ChatWithAICoachInput = z.infer<typeof ChatWithAICoachInputSchema>;

const ChatWithAICoachOutputSchema = z.object({
  aiResponse: z.string().describe("The AI coach's response to the user's input, considering the history."),
});
export type ChatWithAICoachOutput = z.infer<typeof ChatWithAICoachOutputSchema>;

export async function chatWithAICoach(input: ChatWithAICoachInput): Promise<ChatWithAICoachOutput> {
  return chatWithAICoachFlow(input);
}

const SYSTEM_PROMPT = `You are EcoAICoach, a friendly, encouraging, and knowledgeable AI assistant for the "EcoAI Calorie Tracker" app.
Your primary goal is to help users with their nutrition, fitness goals, eco-friendly habits, and answer questions about using the app.
Provide clear, concise, and actionable advice when appropriate.
If you don't know something, it's okay to say so.
Keep responses relatively brief and conversational.
Available app features include: meal logging (manual & AI photo scan), calorie/macro tracking, nutrient breakdown, water intake, recipes, subscription plans (Free, Pro, EcoPro), AI coach recommendations, carbon footprint tracking (EcoPro), eco meal plans (EcoPro), and food-mood correlation (EcoPro).
Do not make up features that don't exist.`;

const chatWithAICoachFlow = ai.defineFlow(
  {
    name: 'chatWithAICoachFlow',
    inputSchema: ChatWithAICoachInputSchema,
    outputSchema: ChatWithAICoachOutputSchema,
  },
  async (input: ChatWithAICoachInput) => {
    const messagesForAI: Array<{ role: 'user' | 'model' | 'system'; content: Array<{text: string}> }> = [];

    messagesForAI.push({ role: 'system', content: [{text: SYSTEM_PROMPT}] });

    if (input.chatHistory) {
      input.chatHistory.forEach(msg => {
        messagesForAI.push({
          role: msg.role,
          content: [{ text: msg.content }],
        });
      });
    }

    messagesForAI.push({ role: 'user', content: [{ text: input.userInput }] });
    
    try {
      const response = await ai.generate({
        prompt: { messages: messagesForAI },
        // You might want to adjust safety settings for chat if needed
        // config: {
        //   safetySettings: [
        //     { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        //   ],
        // },
      });

      const aiTextResponse = response.text;
      if (!aiTextResponse) {
        throw new Error("AI did not return a text response for chat.");
      }
      return { aiResponse: aiTextResponse };

    } catch (error) {
      console.error("Error in chatWithAICoachFlow:", error);
      return { aiResponse: "Sorry, I encountered a problem trying to respond. Please try again." };
    }
  }
);
