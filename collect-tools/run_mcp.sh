#!/bin/bash
set -e

echo "Starting Collect Tools MCP Server..."
echo "======================================"
echo ""
echo "Transports: STDIO, SSE, Streamable HTTP"
echo "HTTP transports exposed on 0.0.0.0:${PORT:-8080}"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run mcp
