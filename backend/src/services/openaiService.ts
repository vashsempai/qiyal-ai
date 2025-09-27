import OpenAI from 'openai';
import { Prisma } from '@prisma/client';

let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn('OPENAI_API_KEY is not set. Chatbot features will be disabled.');
}

// Define a type for a single message in the conversation history
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * Gets a response from the OpenAI chatbot.
 * @param userMessage The latest message from the user.
 * @param history A list of previous messages in the conversation.
 * @returns The chatbot's response message as a string.
 */
export const getChatbotResponse = async (
  userMessage: string,
  history: ChatMessage[]
): Promise<string | null> => {
  if (!openai) {
    return 'The chatbot is currently disabled.';
  }

  // Combine the system prompt, history, and new user message
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'You are Qiyal AI, a helpful assistant for a freelance platform. You help clients write project briefs and assist freelancers in finding work. Be concise and helpful.',
    },
    ...history,
    {
      role: 'user',
      content: userMessage,
    },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('Error fetching response from OpenAI:', error);
    return 'There was an error communicating with the AI assistant.';
  }
};