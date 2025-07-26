const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize real-time system
  const initializeRealtimeSystem = async () => {
    try {
      // Import and initialize our new real-time system
      const { initializeRealtimeSystem } = await import('./src/lib/realtime-startup.js');
      await initializeRealtimeSystem();
      console.log('✓ Real-time system (PostgreSQL + WebSocket) initialized');
    } catch (error) {
      console.error('Failed to initialize real-time system:', error);
      console.log('Real-time features will be disabled, falling back to polling');
    }
  };

  // Start server
  httpServer
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      
      // Initialize real-time system after server starts
      initializeRealtimeSystem();
    });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
});