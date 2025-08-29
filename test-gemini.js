import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key:", apiKey);

const ai = new GoogleGenAI({ apiKey });

async function testGemini() {
  try {
    console.log("Testing Gemini API...");
    const model = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: "Hello, how are you?" }] }]
    });
    
    const response = await model;
    console.log("Response:", response.text);
    console.log("API is working correctly!");
  } catch (error) {
    console.error("Error testing Gemini API:", error);
  }
}

testGemini(); 