
import { GoogleGenAI, Type } from "@google/genai";
import { StudyRequestData, QuizQuestion } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GeminiService = {
  /**
   * Generates a summary for a specific chapter.
   */
  generateSummaryStream: async (data: StudyRequestData) => {
    const prompt = `
      Create a comprehensive, structured summary for the following study material.
      Use clear headings, bullet points for key concepts, and a bold conclusion.
      
      Subject: ${data.subject}
      Class/Grade: ${data.gradeClass}
      Education Board: ${data.board}
      Language: ${data.language}
      Chapter Name: ${data.chapterName}
      ${data.author ? `Author: ${data.author}` : ''}
    `;

    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert academic tutor creating high-quality study summaries.",
      }
    });

    return response;
  },

  /**
   * Generates an essay based on the chapter.
   */
  generateEssayStream: async (data: StudyRequestData) => {
    const prompt = `
      Write a detailed, academic essay based on the topics covered in this chapter.
      The essay should have a proper introduction, body paragraphs analyzing key themes, and a conclusion.
      
      Subject: ${data.subject}
      Class/Grade: ${data.gradeClass}
      Board: ${data.board}
      Language: ${data.language}
      Chapter: ${data.chapterName}
      ${data.author ? `Author: ${data.author}` : ''}
    `;

    // Using gemini-3-pro-preview for complex text generation tasks
    const response = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an academic essay writer. Maintain a formal and educational tone.",
      }
    });

    return response;
  },

  /**
   * Generates a quiz in JSON format.
   */
  generateQuiz: async (data: StudyRequestData): Promise<QuizQuestion[]> => {
    const count = data.questionCount || 5;
    const difficulty = data.difficulty || 'Medium';

    const prompt = `
      Create a ${count}-question multiple-choice quiz based on the following chapter details.
      The difficulty level of the questions should be: ${difficulty}.
      Return the result as a JSON array.
      
      IMPORTANT: Randomize the position of the correct answer for every question. Do not follow a pattern. ensure the correct answer is distributed across options A, B, C, and D randomly.
      
      Subject: ${data.subject}
      Chapter: ${data.chapterName}
      Class: ${data.gradeClass}
      Board: ${data.board}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswerIndex: { 
                type: Type.INTEGER,
                description: "Zero-based index of the correct option (0-3)"
              },
              explanation: { type: Type.STRING, description: "Explanation of why the answer is correct" }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as QuizQuestion[];
    }
    throw new Error("Failed to generate quiz data");
  },

  /**
   * Creates a chat session for the AI Tutor.
   */
  createTutorChat: () => {
    return ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are a helpful, encouraging, and knowledgeable AI Tutor. Help the student with their questions using the Socratic method where appropriate.",
      }
    });
  }
};
