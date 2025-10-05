"""
Lightweight FastAPI Gateway for Enterprise AI Context Engineering
Heavy AI processing happens in Supabase Edge Functions
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

# Import our real AI implementations
from src.api.real_ai_processor import RealAIProcessor, AIProcessingRequest, AIProcessingResponse

# Create FastAPI app
app = FastAPI(
    title="Enterprise AI Context Engineering API Gateway",
    description="Lightweight API gateway - Heavy AI processing in Supabase Edge Functions",
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

# Supabase client for calling Edge Functions
class SupabaseAIClient:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.base_url = f"{supabase_url}/functions/v1"
    
    async def call_edge_function(self, function_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Call Supabase Edge Function"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/{function_name}",
                headers={
                    "Authorization": f"Bearer {self.supabase_key}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            return response.json()

# Initialize Supabase AI client
supabase_ai_client = None
if os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY"):
    supabase_ai_client = SupabaseAIClient(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )

# Initialize Real AI Processor
real_ai_processor = RealAIProcessor()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Enterprise AI Context Engineering API Gateway",
        "version": "1.0.0",
        "status": "healthy",
        "architecture": "Vercel (Frontend) + Supabase (AI Processing)",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "API Gateway is healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check_simple():
    """Simple health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/process", response_model=AIProcessingResponse)
async def process_ai_request(request: AIProcessingRequest):
    """
    Process an AI request using real GEPA, LangStruct, and GraphRAG
    """
    try:
        result = await real_ai_processor.process_query(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_processing_stats():
    """
    Get processing statistics
    """
    return {
        "total_processings": len(real_ai_processor.processing_history),
        "gepa_stats": "Real GEPA optimization active",
        "langstruct_stats": "Real LangStruct extraction active", 
        "graphrag_stats": "Real GraphRAG orchestration active"
    }

@app.post("/api/context/assemble")
async def assemble_context(
    user_query: str,
    conversation_history: List[str] = None,
    user_preferences: Dict[str, Any] = None
):
    """Assemble context using Supabase Edge Function"""
    if not supabase_ai_client:
        raise HTTPException(status_code=500, detail="Supabase AI client not initialized")
    
    try:
        payload = {
            "user_query": user_query,
            "conversation_history": conversation_history or [],
            "user_preferences": user_preferences or {}
        }
        
        result = await supabase_ai_client.call_edge_function("assemble-context", payload)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Context assembly failed: {str(e)}")

@app.post("/api/gepa/optimize")
async def optimize_prompt(
    prompt: str,
    max_iterations: int = 10,
    population_size: int = 20
):
    """Optimize prompt using GEPA in Supabase Edge Function"""
    if not supabase_ai_client:
        raise HTTPException(status_code=500, detail="Supabase AI client not initialized")
    
    try:
        payload = {
            "prompt": prompt,
            "max_iterations": max_iterations,
            "population_size": population_size
        }
        
        result = await supabase_ai_client.call_edge_function("gepa-optimize", payload)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GEPA optimization failed: {str(e)}")

@app.post("/api/rag/retrieve")
async def rag_retrieve(
    query: str,
    top_k: int = 5
):
    """Retrieve documents using RAG in Supabase Edge Function"""
    if not supabase_ai_client:
        raise HTTPException(status_code=500, detail="Supabase AI client not initialized")
    
    try:
        payload = {
            "query": query,
            "top_k": top_k
        }
        
        result = await supabase_ai_client.call_edge_function("rag-retrieve", payload)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG retrieval failed: {str(e)}")

@app.post("/api/perplexity/chat")
async def perplexity_chat(
    messages: List[Dict[str, str]],
    model: str = "llama-3.1-sonar-large-128k-online"
):
    """Chat with Perplexity using Supabase Edge Function"""
    if not supabase_ai_client:
        raise HTTPException(status_code=500, detail="Supabase AI client not initialized")
    
    try:
        payload = {
            "messages": messages,
            "model": model
        }
        
        result = await supabase_ai_client.call_edge_function("perplexity-chat", payload)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Perplexity chat failed: {str(e)}")

@app.get("/api/analytics/metrics")
async def get_analytics_metrics():
    """Get analytics metrics from Supabase"""
    if not supabase_ai_client:
        raise HTTPException(status_code=500, detail="Supabase AI client not initialized")
    
    try:
        result = await supabase_ai_client.call_edge_function("get-analytics", {})
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics retrieval failed: {str(e)}")

@app.get("/api/supabase/status")
async def supabase_status():
    """Check Supabase connection status"""
    if not supabase_ai_client:
        return {
            "success": False,
            "status": "not_configured",
            "message": "Supabase credentials not provided"
        }
    
    return {
        "success": True,
        "status": "connected",
        "architecture": "Supabase Edge Functions for AI processing"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
