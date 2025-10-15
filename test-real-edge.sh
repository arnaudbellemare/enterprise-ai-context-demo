#!/bin/bash

echo "🔥 Testing REAL EDGE TEST API..."
echo "=================================="
echo ""

# Test the real edge test endpoint
echo "📡 Calling: POST http://localhost:3005/api/benchmark/real-edge-test"
echo ""

curl -X POST http://localhost:3005/api/benchmark/real-edge-test \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  2>&1

echo ""
echo "=================================="
echo "Test complete!"

