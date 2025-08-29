import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key:", apiKey);

async function testGeminiREST() {
  try {
    console.log("Testing Gemini API with REST approach...");
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Hello, how are you?"
              }
            ]
          }
        ]
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log("Response:", data.candidates[0].content.parts[0].text);
      console.log("API is working correctly!");
    } else {
      console.error("Error response:", data);
    }
  } catch (error) {
    console.error("Error testing Gemini API:", error);
  }
}

testGeminiREST(); 