import http from 'http';
import os from 'os';

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Test server is working!');
});

// Function to get local IP addresses
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
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

// Listen on port 5800 on all interfaces
const PORT = 5800;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  
  // Display all available local network addresses
  const localIps = getLocalIpAddresses();
  if (localIps.length > 0) {
    console.log('Available on your network at:');
    localIps.forEach(ip => {
      console.log(`http://${ip}:${PORT}`);
    });
  }
}); 