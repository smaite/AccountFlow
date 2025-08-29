const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Keep a global reference of the window object
let mainWindow;
let serverPort = process.env.PORT || '5700';

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // Load the app once the server is ready
  mainWindow.loadURL(`http://localhost:${serverPort}`);

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startServer() {
  try {
    console.log('Starting server...');
    
    // In production, we use the bundled server
    if (process.env.NODE_ENV !== 'development') {
      // Path to the bundled server file
      const serverPath = path.join(__dirname, '../dist/index.js');
      
      // Ensure the server file exists
      if (!fs.existsSync(serverPath)) {
        console.error(`Server file not found at ${serverPath}`);
        throw new Error(`Server file not found at ${serverPath}`);
      }
      
      // Import and start the server
      const { createServer } = require(serverPath);
      await createServer();
      console.log(`Server started on port ${serverPort}`);
    } else {
      // In development, we assume the server is already running
      console.log('Development mode: assuming server is already running');
    }
    
    return true;
  } catch (err) {
    console.error('Failed to start server:', err);
    throw err;
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
  } catch (err) {
    console.error('Error starting app:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up when app is quitting
app.on('will-quit', () => {
  console.log('Application is quitting...');
}); 