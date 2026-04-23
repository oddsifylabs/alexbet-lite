#!/usr/bin/env node
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from root
app.use(express.static(path.join(__dirname)));

// SPA fallback - route all unmatched URLs to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 AlexBET Lite running on port ${PORT}`);
  console.log(`📱 Visit: http://localhost:${PORT}`);
});
