// api/gemini.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel automatically provides process.env for environment variables
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests (you can expand to POST etc.)
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    return res.status(500).json({
      message: 'GEMINI_API_KEY is not set. AI features will not work.'
    });
  }

  // Respond with a success message
  return res.status(200).json({
    message: 'GEMINI_API_KEY is set correctly',
    keyPreview: geminiKey.substring(0, 5) + '...' + geminiKey.slice(-4)
  });
}
