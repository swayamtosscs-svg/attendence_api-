// Load environment variables first (before requiring socket-server)
// Try .env.local first, then fallback to .env
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // This will load .env if .env.local doesn't exist

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { initializeSocket } = require("./src/lib/socket-server");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "8087", 10);
const externalIP = "103.14.120.163";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.io
  initializeSocket(server);

  server.listen(port, hostname, (err) => {
    if (err) {
      console.error('❌ Server failed to start:', err);
      process.exit(1);
    }
    console.log(`✅ Next.js server ready at http://${hostname}:${port}`);
    console.log(`🌍 External access: http://${externalIP}:${port}`);
    console.log(`🔧 Environment: ${dev ? 'development' : 'production'}`);
    console.log(`> Socket.io ready on ws://${externalIP}:${port}/socket.io`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Process terminated');
      process.exit(0);
    });
  });
}).catch((err) => {
  console.error('❌ Failed to prepare Next.js app:', err);
  process.exit(1);
});

