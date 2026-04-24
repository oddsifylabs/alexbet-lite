#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Writing commit info..."
git rev-parse --short HEAD > /tmp/hash.txt 2>/dev/null || echo "unknown" > /tmp/hash.txt
git log -1 --format=%ai > /tmp/date.txt 2>/dev/null || echo "unknown" > /tmp/date.txt
git log -1 --format=%s > /tmp/msg.txt 2>/dev/null || echo "unavailable" > /tmp/msg.txt
git log -1 --format=%an > /tmp/author.txt 2>/dev/null || echo "unknown" > /tmp/author.txt

HASH=$(cat /tmp/hash.txt)
DATE=$(cat /tmp/date.txt)
MSG=$(cat /tmp/msg.txt)
AUTHOR=$(cat /tmp/author.txt)

echo "$HASH $DATE $MSG $AUTHOR" > .commit-info.txt
cat .commit-info.txt

echo "Build complete!"
