"""
Minimal FastAPI app for Enterprise AI Context Engineering
Optimized for Vercel deployment with size constraints
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import httpx
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
import json

# Create FastAPI app
app = FastAPI(
    title="Enterprise AI Context Engineering API",
    description="Minimal API for GEPA-DSPy powered context engineering",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Perplexity client
class PerplexityClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.perplexity.ai"
    
    async def chat(self, messages: List[Dict[str, str]], model: str = "llama-3.1-sonar-large-128k-online"):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 4000
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

# Initialize Perplexity client
perplexity_client = None
if os.getenv("PERPLEXITY_API_KEY"):
    perplexity_client = PerplexityClient(os.getenv("PERPLEXITY_API_KEY"))

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Enterprise AI Context Engineering API",
        "version": "1.0.0",
        "status": "healthy",
        "ai_provider": "Perplexity AI",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "API is healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/perplexity/chat")
async def perplexity_chat(
    messages: List[Dict[str, str]],
    model: str = "llama-3.1-sonar-large-128k-online"
):
    """Chat with Perplexity AI"""
    if not perplexity_client:
        raise HTTPException(status_code=500, detail="Perplexity client not initialized")
    
    try:
        response = await perplexity_client.chat(messages, model)
        return {
            "success": True,
            "content": response["choices"][0]["message"]["content"],
            "model": response["model"],
            "usage": response.get("usage", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Perplexity chat failed: {str(e)}")

@app.post("/api/context/assemble")
async def assemble_context(
    user_query: str,
    conversation_history: List[str] = None,
    user_preferences: Dict[str, Any] = None
):
    """Assemble context for a user query (mock implementation)"""
    if conversation_history is None:
        conversation_history = []
    if user_preferences is None:
        user_preferences = {}
    
    # Mock context assembly
    context_items = [
        {
            "content": f"User query: {user_query}",
            "source": "user_input",
            "relevance_score": 1.0,
            "metadata": {"timestamp": datetime.now().isoformat()}
        },
        {
            "content": "Enterprise AI context engineering provides dynamic context assembly from multiple sources.",
            "source": "knowledge_base",
            "relevance_score": 0.8,
            "metadata": {"category": "ai", "importance": "high"}
        }
    ]
    
    return {
        "success": True,
        "context_items": context_items,
        "total_relevance_score": 0.9,
        "assembly_time_ms": 150,
        "confidence_score": 0.85
    }

@app.post("/api/gepa/optimize")
async def optimize_prompt(
    prompt: str,
    max_iterations: int = 10
):
    """Optimize a prompt using GEPA (mock implementation)"""
    # Mock GEPA optimization
    optimized_prompt = f"{prompt}\n\n[Optimized with GEPA: Enhanced for better performance and accuracy]"
    
    return {
        "success": True,
        "optimized_prompt": optimized_prompt,
        "performance_scores": {
            "accuracy": 0.92,
            "efficiency": 0.88,
            "relevance": 0.95
        },
        "iterations": max_iterations
    }

@app.get("/api/analytics/metrics")
async def get_analytics_metrics():
    """Get analytics metrics (mock implementation)"""
    return {
        "success": True,
        "metrics": {
            "total_queries": 1250,
            "avg_response_time_ms": 250,
            "gepa_optimizations_run": 45,
            "rag_hit_rate": "92%",
            "user_satisfaction_score": "4.7/5"
        }
    }

@app.get("/api/supabase/status")
async def supabase_status():
    """Check Supabase connection status"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        return {
            "success": False,
            "status": "not_configured",
            "message": "Supabase credentials not provided"
        }
    
    return {
        "success": True,
        "status": "configured",
        "url": supabase_url
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
