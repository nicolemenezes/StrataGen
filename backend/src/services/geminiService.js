// /backend/src/services/geminiService.js

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model for conversational chat (more powerful)
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Model for generating structured JSON (fast and efficient)
const jsonModel = genAI.getGenerativeModel({
  model: "gemini-2.5-pro",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

/**
 * Generates a conversational text response.
 * @param {string} prompt - The full prompt including history.
 * @returns {Promise<string>} The AI's text response.
 */
export async function generateChatResponse(prompt) {
  try {
    const result = await chatModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating chat response with Gemini:", error);
    throw new Error("Failed to get chat response from AI service.");
  }
}

/**
 * Generates a structured JSON object.
 * @param {string} prompt - A prompt instructing the AI to create a JSON.
 * @returns {Promise<object>} The parsed JSON object.
 */
export async function generateJsonContent(prompt) {
  try {
    const result = await jsonModel.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating JSON content with Gemini:", error);
    throw new Error("Failed to generate JSON from AI service.");
  }
}