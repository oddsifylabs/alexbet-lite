#!/bin/bash
set -e

echo "Building AlexBET Lite..."
npm install

# Try to get git info, fallback to defaults if it fails
HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "0c833e8")
DATE=$(git log -1 --format=%ai 2>/dev/null | cut -d' ' -f1 || date +%Y-%m-%d)
MSG=$(git log -1 --format=%s 2>/dev/null || echo "Latest deployment")
AUTHOR=$(git log -1 --format=%an 2>/dev/null || echo "AlexBET")

# Write commit info file
echo "$HASH $DATE $MSG $AUTHOR" > .commit-info.txt
echo "✓ Commit info: $(cat .commit-info.txt)"

echo "✓ Build complete!"
