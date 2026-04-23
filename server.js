#!/usr/bin/env node
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

console.log('[AlexBET Lite] Starting server...');
console.log(`[AlexBET Lite] PORT: ${PORT}, HOST: ${HOST}`);
console.log(`[AlexBET Lite] CWD: ${process.cwd()}`);

// Check if index.html exists
const indexPath = path.join(__dirname, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(`[ERROR] index.html not found at ${indexPath}`);
  process.exit(1);
}
console.log(`[AlexBET Lite] Found index.html at ${indexPath}`);

// Serve static files from root
app.use(express.static(path.join(__dirname), {
  maxAge: '1h',
  etag: false
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback - route all unmatched URLs to index.html
app.get('*', (req, res) => {
  console.log(`[AlexBET Lite] Routing ${req.path} → index.html`);
  res.sendFile(indexPath);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, HOST, () => {
  console.log(`✅ [AlexBET Lite] Server running on http://${HOST}:${PORT}`);
  console.log(`✅ [AlexBET Lite] Ready to receive requests`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[AlexBET Lite] SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
