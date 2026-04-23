#!/usr/bin/env node
/**
 * AlexBET Lite - Express Server
 * Minimal, bulletproof Express server for static SPA
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Logging
console.log('[SERVER] Starting AlexBET Lite...');
console.log('[SERVER] NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('[SERVER] PORT:', PORT);
console.log('[SERVER] CWD:', process.cwd());

// Verify files exist
const indexHtmlPath = path.join(__dirname, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('[FATAL] index.html not found at:', indexHtmlPath);
  process.exit(1);
}
console.log('[SERVER] Found index.html');

// Serve static files with aggressive caching for assets
app.use(express.static(__dirname, {
  maxAge: '1d',
  etag: false,
  setHeaders: (res, filePath) => {
    // Don't cache HTML files
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'AlexBET Lite' });
});

// Catch-all: serve index.html for SPA routing
app.use((req, res) => {
  res.sendFile(indexHtmlPath);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] ✅ AlexBET Lite running on port ${PORT}`);
  console.log(`[SERVER] Ready for requests`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, shutting down...');
  server.close(() => {
    console.log('[SERVER] Server closed');
    process.exit(0);
  });
});

// Catch unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[ERROR] Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
