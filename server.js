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

// Commit info endpoint
app.get('/api/commit', (req, res) => {
  try {
    // Try to read from file created during build
    const commitInfoPath = path.join(__dirname, '.commit-info.txt');
    if (fs.existsSync(commitInfoPath)) {
      const info = fs.readFileSync(commitInfoPath, 'utf8').trim();
      const parts = info.split(' ');
      if (parts.length >= 4) {
        const hash = parts[0];
        const dateTime = parts[1]; // ISO format
        const message = parts.slice(3).join(' '); // Everything after the date
        const author = parts[parts.length - 1]; // Last part is author
        
        res.json({
          hash,
          date: dateTime.split('T')[0],
          message,
          author
        });
        return;
      }
    }
    
    // Fallback: try git commands
    const { execSync } = require('child_process');
    const hash = execSync('git rev-parse --short HEAD', { cwd: __dirname }).toString().trim();
    const date = execSync('git log -1 --format=%ai', { cwd: __dirname }).toString().trim();
    const message = execSync('git log -1 --format=%s', { cwd: __dirname }).toString().trim();
    const author = execSync('git log -1 --format=%an', { cwd: __dirname }).toString().trim();
    
    res.json({
      hash,
      date: date.split(' ')[0],
      message,
      author
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch commit info',
      hash: '(unknown)',
      date: '(unknown)',
      message: '(unavailable)',
      author: 'Unknown'
    });
  }
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
