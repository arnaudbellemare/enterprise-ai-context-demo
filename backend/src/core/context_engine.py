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
        user_preferences: Dict[str, Any] = None,
        referenced_files: List[str] = None,
        format_as_markdown: bool = True
    ) -> Dict[str, Any]:
        """
        Assemble dynamic context for AI agents with Grok-style structured formatting
        
        Grok Principle #4: Use Markdown/XML tags for clarity
        """
        if conversation_history is None:
            conversation_history = []
        if user_preferences is None:
            user_preferences = {}
        if referenced_files is None:
            referenced_files = []
        
        print(f"🧠 Assembling STRUCTURED context for query: {user_query[:50]}...")
        
        # Gather context from various sources
        context_items = []
        
        # 1. User query context
        context_items.append({
            "content": user_query,
            "source": "user_input",
            "relevance_score": 1.0,
            "metadata": {"timestamp": datetime.now().isoformat()}
        })
        
        # 2. Conversation history
        if conversation_history:
            for i, msg in enumerate(conversation_history[-3:]):  # Last 3 messages
                context_items.append({
                    "content": msg,
                    "source": "conversation_history",
                    "relevance_score": 0.8 - (i * 0.1),
                    "metadata": {"position": i, "timestamp": datetime.now().isoformat()}
                })
        
        # 3. User preferences
        if user_preferences:
            context_items.append({
                "content": json.dumps(user_preferences, indent=2),
                "source": "user_preferences",
                "relevance_score": 0.9,
                "metadata": {"preferences": user_preferences}
            })
        
        # 4. Referenced files (Grok Principle #1: Provide necessary context)
        if referenced_files:
            for file_path in referenced_files:
                context_items.append({
                    "content": f"Referenced file: {file_path}",
                    "source": "referenced_files",
                    "relevance_score": 0.95,
                    "metadata": {"file_path": file_path}
                })
        
        # 5. Enterprise knowledge
        enterprise_context = await self._get_enterprise_context(user_query)
        context_items.extend(enterprise_context)
        
        # 6. Real-time data
        realtime_context = await self._get_realtime_context(user_query)
        context_items.extend(realtime_context)
        
        # Sort by relevance and limit
        context_items.sort(key=lambda x: x['relevance_score'], reverse=True)
        context_items = context_items[:self.max_context_items]
        
        # Calculate total relevance
        total_relevance = sum(item['relevance_score'] for item in context_items) / len(context_items) if context_items else 0
        
        # Format as structured Markdown (Grok Principle #4)
        structured_context = ""
        if format_as_markdown:
            structured_context = self._format_as_markdown(
                user_query, 
                context_items, 
                conversation_history,
                user_preferences,
                referenced_files
            )
        
        return {
            "context_items": context_items,
            "structured_context": structured_context,
            "total_relevance_score": total_relevance,
            "assembly_time_ms": 150,
            "confidence_score": min(total_relevance, 1.0),
            "sources_used": list(set(item['source'] for item in context_items)),
            "grok_optimized": True
        }
    
    def _format_as_markdown(
        self,
        user_query: str,
        context_items: List[Dict[str, Any]],
        conversation_history: List[str],
        user_preferences: Dict[str, Any],
        referenced_files: List[str]
    ) -> str:
        """
        Format context as structured Markdown for optimal LLM consumption
        
        Grok Principle #4: Use Markdown headings and sections for clarity
        """
        sections = []
        
        # Main query section
        sections.append("# User Query")
        sections.append(f"{user_query}\n")
        
        # Referenced files section (Grok Principle #1)
        if referenced_files:
            sections.append("## Referenced Files")
            for file_path in referenced_files:
                sections.append(f"- `{file_path}`")
            sections.append("")
        
        # Conversation history section
        if conversation_history:
            sections.append("## Conversation History")
            for i, msg in enumerate(conversation_history[-3:]):
                sections.append(f"### Message {i+1}")
                sections.append(f"{msg}\n")
        
        # User preferences section
        if user_preferences:
            sections.append("## User Preferences")
            for key, value in user_preferences.items():
                sections.append(f"- **{key}**: {value}")
            sections.append("")
        
        # Retrieved knowledge section
        knowledge_items = [item for item in context_items if item['source'] == 'company_knowledge' or item['source'] == 'technical_knowledge']
        if knowledge_items:
            sections.append("## Relevant Knowledge Base")
            for item in knowledge_items[:3]:
                sections.append(f"### {item.get('metadata', {}).get('category', 'General')}")
                sections.append(f"{item['content']}")
                sections.append(f"*Relevance: {item['relevance_score']:.2f}*\n")
        
        # System context section
        system_items = [item for item in context_items if item['source'] == 'system_status']
        if system_items:
            sections.append("## System Context")
            for item in system_items:
                sections.append(f"- {item['content']}")
            sections.append("")
        
        return "\n".join(sections)
    
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
