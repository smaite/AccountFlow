import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Port for the server
const port = process.env.PORT || '5700';

// Start the server process
console.log('Starting server...');
const serverProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: port }
});

// Wait for the server to start
console.log('Waiting for server to start...');
setTimeout(() => {
  // Start Electron
  console.log('Starting Electron...');
  const electronProcess = spawn('electron', ['.'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Terminating processes...');
    electronProcess.kill();
    serverProcess.kill();
    process.exit(0);
  });

  // Handle Electron exit
  electronProcess.on('exit', (code) => {
    console.log(`Electron exited with code ${code}`);
    serverProcess.kill();
    process.exit(code || 0);
  });

  // Handle server exit
  serverProcess.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    electronProcess.kill();
    process.exit(code || 0);
  });
}, 5000); // Wait 5 seconds for the server to start