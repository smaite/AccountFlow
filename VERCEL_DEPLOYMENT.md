# Vercel Deployment Guide

This project has been configured to deploy on Vercel with the `npm run vercel` command.

## Prerequisites

1. Install Vercel CLI globally (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Make sure you have a Vercel account and are logged in:
   ```bash
   vercel login
   ```

## Environment Variables

Before deploying, you need to set up your environment variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add the following environment variable:
   - `GEMINI_API_KEY`: Your Google Gemini API key

## Deployment

To deploy your application to Vercel:

```bash
npm run vercel
```

This command will:
1. Build the project (both frontend and backend)
2. Deploy to Vercel in production mode

## Project Structure for Vercel

- **Frontend**: Built with Vite and served from `dist/public/`
- **Backend**: Serverless functions in `api/index.js`
- **Routes**: All API routes are prefixed with `/api/`

## Local Development

For local development, use:
```bash
npm run dev
```

This will start the development server with hot reloading.

## Build Process

The build process:
1. Builds the React frontend with Vite
2. Bundles the Express server with esbuild
3. Creates the necessary files for Vercel deployment

## Troubleshooting

If you encounter issues:

1. Make sure all environment variables are set in Vercel
2. Check that the build completes successfully
3. Verify that the API routes are working by testing `/api/dashboard/stats`

## Notes

- The application uses serverless functions for the backend
- Static files are served from the `dist/public` directory
- API routes are handled by the serverless function in `api/index.js`
- The maximum function duration is set to 30 seconds
