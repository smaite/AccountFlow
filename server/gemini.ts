import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface DocumentAnalysisResult {
  amount?: number;
  vendor?: string;
  category?: string;
  description?: string;
  date?: string;
  documentType?: 'receipt' | 'invoice' | 'expense';
}

export async function analyzeDocumentImage(base64Image: string, mimeType: string): Promise<DocumentAnalysisResult> {
  try {
    const systemPrompt = `You are an expert document processor. Extract financial information from receipts and invoices. 
Analyze the document and provide the data in JSON format with these fields:
- amount (number): The total amount from the document
- vendor (string): The business/vendor name  
- category (string): Use one of: Office Supplies, Travel, Meals & Entertainment, Equipment, Software, Other
- description (string): Brief description of the purchase
- date (string): Date in YYYY-MM-DD format

Return only valid JSON with these exact field names.`;

    const imageBytes = Buffer.from(base64Image, 'base64');

    const contents = [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      systemPrompt,
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            amount: { type: "number" },
            vendor: { type: "string" },
            category: { type: "string" },
            description: { type: "string" },
            date: { type: "string" },
          },
          required: ["amount", "vendor"],
        },
      },
      contents: contents,
    });

    const rawJson = response.text;

    console.log(`Gemini AI Response: ${rawJson}`);

    if (rawJson) {
      const data: DocumentAnalysisResult = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini model");
    }
  } catch (error) {
    console.error("Gemini AI processing failed:", error);
    throw new Error(`Failed to analyze document: ${error}`);
  }
}

export async function summarizeText(text: string): Promise<string> {
  const prompt = `Please summarize the following text concisely while maintaining key points:\n\n${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text || "Something went wrong";
}

export interface Sentiment {
  rating: number;
  confidence: number;
}

export async function analyzeSentiment(text: string): Promise<Sentiment> {
  try {
    const systemPrompt = `You are a sentiment analysis expert. 
Analyze the sentiment of the text and provide a rating
from 1 to 5 stars and a confidence score between 0 and 1.
Respond with JSON in this format: 
{'rating': number, 'confidence': number}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            rating: { type: "number" },
            confidence: { type: "number" },
          },
          required: ["rating", "confidence"],
        },
      },
      contents: text,
    });

    const rawJson = response.text;

    console.log(`Raw JSON: ${rawJson}`);

    if (rawJson) {
      const data: Sentiment = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error) {
    throw new Error(`Failed to analyze sentiment: ${error}`);
  }
}