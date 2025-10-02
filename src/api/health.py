"""
Health check endpoints for the Enterprise AI Context Engineering API
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
import os
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("VERCEL_ENV", "development")
    })

@router.get("/api/health")
async def api_health():
    """API health check"""
    return JSONResponse({
        "status": "healthy",
        "api": "enterprise-ai-context",
        "timestamp": datetime.now().isoformat()
    })
