#!/bin/bash

echo "=== Collect Tools API Status ==="
echo ""

# Check if process is running
if ps aux | grep -v grep | grep "ts-node src/main.ts" > /dev/null; then
    echo "✓ Server is RUNNING"
    PID=$(ps aux | grep -v grep | grep "ts-node src/main.ts" | awk '{print $2}' | head -1)
    echo "  Process ID: $PID"
else
    echo "✗ Server is NOT running"
    exit 1
fi

# Check if port is listening
if netstat -tlnp 2>/dev/null | grep ":3000" > /dev/null || ss -tlnp 2>/dev/null | grep ":3000" > /dev/null; then
    echo "✓ Listening on port 3000"
else
    echo "✗ Port 3000 not listening"
    exit 1
fi

# Test health endpoint
echo ""
echo "Testing endpoints..."
if HEALTH=$(curl -s http://localhost:3000 2>/dev/null); then
    echo "✓ Health check: $HEALTH"
else
    echo "✗ Health check failed"
    exit 1
fi

echo ""
echo "Server is healthy and ready!"
echo "Access at: http://localhost:3000"
