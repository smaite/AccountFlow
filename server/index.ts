import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import os from 'os';

// Function to get local IP addresses
function getLocalIpAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  
  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (!networkInterface) continue;
    
    for (const iface of networkInterface) {
      // Skip over non-IPv4 and internal (loopback) addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  
  return addresses;
}

// Create Express app
const app = express();

// Add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Handle errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

// Check if API key is loaded
if (!process.env.GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is not set in environment variables. AI features will not work.");
  console.error("Please check your .env file and ensure the API key is correctly set.");
} else {
  console.log("GEMINI_API_KEY is set correctly:", process.env.GEMINI_API_KEY.substring(0, 5) + '...' + process.env.GEMINI_API_KEY.substring(process.env.GEMINI_API_KEY.length - 4));
}

// Initialize the server
async function initializeServer() {
  const server = await registerRoutes(app);

  // In development, use Vite for serving client files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    // In production, serve static files
    serveStatic(app);
  }

  return server;
}

// Initialize routes for Vercel
initializeServer().catch(error => {
  console.error('Failed to initialize server:', error);
});

// For local development, start the server
if (process.env.NODE_ENV === "development") {
  initializeServer().then(server => {
    const port = parseInt(process.env.PORT || '5700', 10);
    server.listen(port, '0.0.0.0', () => {
      log(`Server running on port ${port}`);
      log(`Local access: http://localhost:${port}`);
      
      const localIps = getLocalIpAddresses();
      if (localIps.length > 0) {
        log('Available on your network at:');
        localIps.forEach(ip => {
          log(`http://${ip}:${port}`);
        });  
      }
    });
  }).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

// Export for Vercel serverless functions
export default app;
