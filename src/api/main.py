"""
FastAPI main application for Enterprise AI Context Engineering
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from datetime import datetime
import asyncio

# Import our modules
from .health import router as health_router
from ..core.context_engine import ContextEngine
from ..core.gepa_optimizer import GEPAOptimizer
from ..core.perplexity_client import PerplexityClient
from ..enterprise.supabase_integrator import SupabaseIntegrator

# Create main FastAPI app
app = FastAPI(
    title="Enterprise AI Context Engineering API",
    description="Advanced AI context engineering platform with GEPA-DSPy optimization using Perplexity AI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include health check routes
app.include_router(health_router, prefix="/api", tags=["health"])

# Initialize components
context_engine = None
gepa_optimizer = None
perplexity_client = None
supabase_integrator = None

@app.on_event("startup")
async def startup_event():
    """Initialize components on startup"""
    global context_engine, gepa_optimizer, perplexity_client, supabase_integrator
    
    try:
        # Initialize Perplexity client
        perplexity_api_key = os.getenv("PERPLEXITY_API_KEY")
        if perplexity_api_key:
            perplexity_client = PerplexityClient(perplexity_api_key)
            print("✅ Perplexity client initialized")
        else:
            print("⚠️ PERPLEXITY_API_KEY not found, using mock responses")
        
        # Initialize context engine
        context_engine = ContextEngine({
            "cache_ttl": 3600,
            "max_context_items": 100,
            "relevance_threshold": 0.7
        })
        
        # Initialize GEPA optimizer
        gepa_optimizer = GEPAOptimizer({
            "model_name": os.getenv("DSPY_MODEL_NAME", "llama-3.1-sonar-large-128k-online"),
            "max_tokens": int(os.getenv("DSPY_MAX_TOKENS", "4000")),
            "temperature": float(os.getenv("DSPY_TEMPERATURE", "0.7"))
        })
        
        # Initialize Supabase integrator
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")
        if supabase_url and supabase_key:
            supabase_integrator = SupabaseIntegrator({
                "SUPABASE_URL": supabase_url,
                "SUPABASE_ANON_KEY": supabase_key,
                "SUPABASE_SERVICE_ROLE_KEY": os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            })
            print("✅ Supabase integrator initialized")
        else:
            print("⚠️ Supabase credentials not found, using mock responses")
        
        print("✅ All components initialized successfully")
        
    except Exception as e:
        print(f"❌ Error initializing components: {e}")

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

@app.get("/api/context/assemble")
async def assemble_context(
    user_id: str,
    session_id: str,
    query: str,
    max_items: int = 50
):
    """Assemble context for a user query"""
    if not context_engine:
        raise HTTPException(status_code=500, detail="Context engine not initialized")
    
    try:
        from ..core.context_engine import ContextQuery
        
        context_query = ContextQuery(
            user_id=user_id,
            session_id=session_id,
            query_text=query,
            max_items=max_items
        )
        
        result = await context_engine.assemble_context(context_query)
        
        return {
            "success": True,
            "context_items": [
                {
                    "content": item.content,
                    "source": item.source.value,
                    "relevance_score": item.relevance_score,
                    "metadata": item.metadata
                }
                for item in result.context_items
            ],
            "total_relevance_score": result.total_relevance_score,
            "assembly_time_ms": result.assembly_time_ms,
            "confidence_score": result.confidence_score
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Context assembly failed: {str(e)}")

@app.post("/api/perplexity/chat")
async def perplexity_chat(
    messages: list,
    model: str = "llama-3.1-sonar-large-128k-online",
    temperature: float = 0.7,
    max_tokens: int = 4000
):
    """Chat with Perplexity AI"""
    if not perplexity_client:
        raise HTTPException(status_code=500, detail="Perplexity client not initialized")
    
    try:
        response = await perplexity_client.chat_completion(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return {
            "success": True,
            "content": response.content,
            "sources": response.sources,
            "model": response.model,
            "usage": response.usage
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Perplexity chat failed: {str(e)}")

@app.post("/api/perplexity/search")
async def perplexity_search(
    query: str,
    context: str = None
):
    """Search and answer using Perplexity"""
    if not perplexity_client:
        raise HTTPException(status_code=500, detail="Perplexity client not initialized")
    
    try:
        response = await perplexity_client.search_and_answer(
            query=query,
            context=context
        )
        
        return {
            "success": True,
            "content": response.content,
            "sources": response.sources,
            "model": response.model
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Perplexity search failed: {str(e)}")

@app.post("/api/gepa/optimize")
async def optimize_prompt(
    prompt: str,
    max_iterations: int = 10,
    population_size: int = 20
):
    """Optimize a prompt using GEPA"""
    if not gepa_optimizer:
        raise HTTPException(status_code=500, detail="GEPA optimizer not initialized")
    
    try:
        # Mock evaluation function for demo
        async def mock_evaluation(prompt: str, data: list) -> dict:
            from ..core.gepa_optimizer import OptimizationMetric
            return {
                OptimizationMetric.ACCURACY: 0.8,
                OptimizationMetric.EFFICIENCY: 0.9,
                OptimizationMetric.RELEVANCE: 0.85
            }
        
        result = await gepa_optimizer.optimize(
            initial_prompt=prompt,
            evaluation_function=mock_evaluation,
            training_data=[],
            max_iterations=max_iterations,
            population_size=population_size
        )
        
        return {
            "success": True,
            "optimized_prompt": result.prompt_variant,
            "performance_scores": result.performance_scores,
            "iterations": result.iteration
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GEPA optimization failed: {str(e)}")

@app.get("/api/supabase/status")
async def supabase_status():
    """Check Supabase connection status"""
    if not supabase_integrator:
        return {
            "success": False,
            "status": "not_configured",
            "message": "Supabase credentials not provided"
        }
    
    try:
        status = supabase_integrator.get_connection_status()
        return {
            "success": True,
            "status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase status check failed: {str(e)}")

@app.get("/api/models")
async def get_available_models():
    """Get available Perplexity models"""
    if not perplexity_client:
        return {
            "success": False,
            "models": [],
            "message": "Perplexity client not initialized"
        }
    
    try:
        models = await perplexity_client.get_available_models()
        return {
            "success": True,
            "models": models
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get models: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
