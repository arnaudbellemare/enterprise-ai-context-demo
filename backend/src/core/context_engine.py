"""
Context Engine - Lightweight implementation for Vercel
Dynamic context assembly for AI agents
"""

import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio

class ContextEngine:
    """
    Lightweight context engine optimized for serverless deployment
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.context_sources: Dict[str, Any] = {}
        self.cache_ttl = self.config.get('cache_ttl', 3600)
        self.max_context_items = self.config.get('max_context_items', 50)
        
    async def assemble_context(
        self, 
        user_query: str, 
        conversation_history: List[str] = None,
        user_preferences: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Assemble dynamic context for AI agents
        """
        if conversation_history is None:
            conversation_history = []
        if user_preferences is None:
            user_preferences = {}
        
        print(f"Assembling context for query: {user_query[:50]}...")
        
        # Gather context from various sources
        context_items = []
        
        # 1. User query context
        context_items.append({
            "content": f"User Query: {user_query}",
            "source": "user_input",
            "relevance_score": 1.0,
            "metadata": {"timestamp": datetime.now().isoformat()}
        })
        
        # 2. Conversation history
        if conversation_history:
            for i, msg in enumerate(conversation_history[-3:]):  # Last 3 messages
                context_items.append({
                    "content": f"Previous: {msg}",
                    "source": "conversation_history",
                    "relevance_score": 0.8 - (i * 0.1),
                    "metadata": {"position": i, "timestamp": datetime.now().isoformat()}
                })
        
        # 3. User preferences
        if user_preferences:
            context_items.append({
                "content": f"User Preferences: {json.dumps(user_preferences)}",
                "source": "user_preferences",
                "relevance_score": 0.9,
                "metadata": {"preferences": user_preferences}
            })
        
        # 4. Enterprise knowledge (mock)
        enterprise_context = await self._get_enterprise_context(user_query)
        context_items.extend(enterprise_context)
        
        # 5. Real-time data (mock)
        realtime_context = await self._get_realtime_context(user_query)
        context_items.extend(realtime_context)
        
        # Sort by relevance and limit
        context_items.sort(key=lambda x: x['relevance_score'], reverse=True)
        context_items = context_items[:self.max_context_items]
        
        # Calculate total relevance
        total_relevance = sum(item['relevance_score'] for item in context_items) / len(context_items) if context_items else 0
        
        return {
            "context_items": context_items,
            "total_relevance_score": total_relevance,
            "assembly_time_ms": 150,  # Mock timing
            "confidence_score": min(total_relevance, 1.0),
            "sources_used": list(set(item['source'] for item in context_items))
        }
    
    async def _get_enterprise_context(self, query: str) -> List[Dict[str, Any]]:
        """Get enterprise-specific context"""
        # Mock enterprise knowledge base
        enterprise_knowledge = [
            {
                "content": "Our company specializes in AI-powered enterprise solutions with focus on context engineering and optimization.",
                "source": "company_knowledge",
                "relevance_score": 0.7,
                "metadata": {"category": "company_info"}
            },
            {
                "content": "GEPA optimization framework provides genetic-pareto optimization for continuous AI improvement.",
                "source": "technical_knowledge",
                "relevance_score": 0.8,
                "metadata": {"category": "ai_technology"}
            }
        ]
        
        # Filter based on query relevance
        relevant_items = []
        query_lower = query.lower()
        
        for item in enterprise_knowledge:
            if any(keyword in item['content'].lower() for keyword in query_lower.split()):
                relevant_items.append(item)
        
        return relevant_items
    
    async def _get_realtime_context(self, query: str) -> List[Dict[str, Any]]:
        """Get real-time context data"""
        # Mock real-time data
        realtime_data = [
            {
                "content": f"Current system status: All AI services operational, response time: 250ms",
                "source": "system_status",
                "relevance_score": 0.6,
                "metadata": {"timestamp": datetime.now().isoformat()}
            }
        ]
        
        return realtime_data
    
    def add_context_source(self, name: str, source_data: Any):
        """Add a new context source"""
        self.context_sources[name] = source_data
        print(f"Added context source: {name}")
    
    def get_context_sources(self) -> Dict[str, Any]:
        """Get all context sources"""
        return self.context_sources
