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

  // Initialize queue workers and real-time system
  const initializeBackgroundSystems = async () => {
    // Initialize queue workers first (critical for processing)
    try {
      console.log('🚀 [SERVER] Initializing queue workers...');
      const { initializeQueueWorkers } = require('./src/lib/queue/startup.js');
      initializeQueueWorkers();
      console.log('✅ [SERVER] Queue workers initialized successfully');
    } catch (error) {
      console.error('❌ [SERVER] Failed to initialize queue workers:', error);
      console.error('Error details:', error);
    }
    
    // Initialize real-time system (non-critical) - temporarily disabled
    console.log('⚠️ [SERVER] Real-time system temporarily disabled, using polling fallback');
    console.log('Real-time features will be disabled, falling back to polling');
  };

  // Start server
  httpServer
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      
      // Initialize background systems after server starts
      initializeBackgroundSystems();
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