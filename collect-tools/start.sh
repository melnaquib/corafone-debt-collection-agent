#!/bin/bash
set -e

echo "Starting Collect Tools API..."
echo "================================"
echo ""
echo "Available endpoints:"
echo "  GET  http://localhost:3000         - Health check"
echo "  POST http://localhost:3000/negotiate_calc"
echo "  POST http://localhost:3000/send_outcome"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm start
