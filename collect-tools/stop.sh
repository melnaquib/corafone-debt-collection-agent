#!/bin/bash

echo "Stopping Collect Tools API..."

# Kill ts-node processes
pkill -f "ts-node src/main.ts"

# Also kill by port if needed
fuser -k 3000/tcp 2>/dev/null

sleep 1

# Verify stopped
if ps aux | grep -v grep | grep "ts-node src/main.ts" > /dev/null; then
    echo "✗ Failed to stop server"
    exit 1
else
    echo "✓ Server stopped successfully"
fi
