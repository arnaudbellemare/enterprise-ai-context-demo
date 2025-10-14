#!/bin/bash

echo "🧪 WORKFLOW API TESTING SUITE"
echo "=================================================="

BASE_URL="http://localhost:3000"

# Test 1: Memory Search API
echo ""
echo "📋 Test 1: Memory Search API"
echo "Query: 'What are the latest AI trends?'"
echo "--------------------------------------------------"

curl -X POST "$BASE_URL/api/search/indexed" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the latest AI trends?",
    "matchThreshold": 0.8,
    "matchCount": 5,
    "collection": "test"
  }' \
  --max-time 10 \
  --silent --show-error

echo ""
echo "✅ Memory Search API test completed"

# Test 2: Agent Chat API  
echo ""
echo "📋 Test 2: Agent Chat API"
echo "Task: 'Analyze customer sentiment'"
echo "--------------------------------------------------"

curl -X POST "$BASE_URL/api/agent/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user", 
        "content": "What are the key benefits of using AI in business?"
      }
    ],
    "taskDescription": "Analyze customer sentiment and extract key topics",
    "systemPrompt": "You are an expert business analyst.",
    "temperature": 0.3,
    "model": "claude-3-haiku",
    "maxTokens": 1024
  }' \
  --max-time 15 \
  --silent --show-error

echo ""
echo "✅ Agent Chat API test completed"

# Test 3: Answer Generation API
echo ""
echo "📋 Test 3: Answer Generation API"
echo "Query: 'Explain machine learning concepts'"
echo "--------------------------------------------------"

curl -X POST "$BASE_URL/api/answer" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Explain the key concepts of machine learning in simple terms",
    "documents": [
      {
        "content": "Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed.",
        "source": "AI Fundamentals"
      }
    ],
    "preferredModel": "claude-3-haiku",
    "temperature": 0.7,
    "maxTokens": 2048
  }' \
  --max-time 15 \
  --silent --show-error

echo ""
echo "✅ Answer Generation API test completed"

# Test 4: Web Search (Perplexity) API
echo ""
echo "📋 Test 4: Web Search (Perplexity) API"
echo "Query: 'Latest AI news 2024'"
echo "--------------------------------------------------"

curl -X POST "$BASE_URL/api/perplexity/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What are the latest AI developments in 2024?"
      }
    ],
    "searchRecencyFilter": "month"
  }' \
  --max-time 20 \
  --silent --show-error

echo ""
echo "✅ Web Search API test completed"

# Test 5: Context Assembly API
echo ""
echo "📋 Test 5: Context Assembly API"
echo "Merging multiple document sources"
echo "--------------------------------------------------"

curl -X POST "$BASE_URL/api/context/assemble" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "AI is transforming healthcare with diagnostic tools and treatment recommendations.",
        "source": "Healthcare Research",
        "relevance": 0.9
      },
      {
        "content": "Machine learning algorithms are improving financial fraud detection systems.",
        "source": "Finance Report", 
        "relevance": 0.8
      }
    ],
    "mergeStrategy": "hybrid",
    "maxResults": 10
  }' \
  --max-time 10 \
  --silent --show-error

echo ""
echo "✅ Context Assembly API test completed"

# Test 6: GEPA Optimization API
echo ""
echo "📋 Test 6: GEPA Optimization API"
echo "Optimizing prompt for better results"
echo "--------------------------------------------------"

curl -X POST "$BASE_URL/api/gepa/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing",
    "context": "The user is interested in understanding quantum computing basics for a business audience.",
    "iterations": 2,
    "goal": "clarity"
  }' \
  --max-time 15 \
  --silent --show-error

echo ""
echo "✅ GEPA Optimization API test completed"

echo ""
echo "🎉 All API tests completed!"
echo "=================================================="
echo ""
echo "📊 SUMMARY:"
echo "✅ Memory Search API - Tested"
echo "✅ Agent Chat API - Tested"  
echo "✅ Answer Generation API - Tested"
echo "✅ Web Search API - Tested"
echo "✅ Context Assembly API - Tested"
echo "✅ GEPA Optimization API - Tested"
echo ""
echo "🔗 Next: Test the visual workflow builder at http://localhost:3000/workflow"
