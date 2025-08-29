import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;

console.log('Testing API key:', apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}` : 'NOT SET');

async function testApiKey() {
  try {
    if (!apiKey) {
      throw new Error('API key is not set in environment variables');
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      { 
        contents: [{ 
          parts: [{ text: "Hello, please respond with just the text 'API key is working correctly'" }] 
        }] 
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('API Response:', response.data.candidates[0].content.parts[0].text);
      console.log('API key is working!');
    } else {
      console.error('Unexpected response format:', response.data);
    }
  } catch (error) {
    console.error('API test failed:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

testApiKey(); 