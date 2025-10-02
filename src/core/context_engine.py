"""
Dynamic Context Assembly Engine for Enterprise AI

This module implements the core context engineering capabilities that enable
real-time assembly of relevant context from multiple sources for AI agents.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

import dspy
from pydantic import BaseModel, Field
import structlog

logger = structlog.get_logger(__name__)


class ContextSource(Enum):
    """Types of context sources available"""
    USER_PREFERENCES = "user_preferences"
    CONVERSATION_HISTORY = "conversation_history"
    BUSINESS_DATA = "business_data"
    KNOWLEDGE_BASE = "knowledge_base"
    REAL_TIME_FEEDS = "real_time_feeds"
    CRM_DATA = "crm_data"
    DOCUMENT_REPOSITORY = "document_repository"


@dataclass
class ContextItem:
    """Represents a single piece of context information"""
    source: ContextSource
    content: str
    relevance_score: float
    timestamp: datetime
    metadata: Dict[str, Any]
    priority: int = 0


class ContextQuery(BaseModel):
    """Query for context retrieval"""
    user_id: str
    session_id: str
    query_text: str
    context_types: List[ContextSource] = Field(default_factory=list)
    max_items: int = 50
    relevance_threshold: float = 0.7
    time_window_hours: int = 24


class ContextResponse(BaseModel):
    """Response containing assembled context"""
    context_items: List[ContextItem]
    total_relevance_score: float
    assembly_time_ms: float
    sources_used: List[ContextSource]
    confidence_score: float


class ContextEngine:
    """
    Dynamic Context Assembly Engine
    
    This engine orchestrates the assembly of relevant context from multiple
    sources to provide comprehensive, real-time context for AI agents.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.context_cache = {}
        self.source_handlers = {}
        self.relevance_scorer = None
        self._setup_handlers()
        
    def _setup_handlers(self):
        """Initialize context source handlers"""
        self.source_handlers = {
            ContextSource.USER_PREFERENCES: self._get_user_preferences,
            ContextSource.CONVERSATION_HISTORY: self._get_conversation_history,
            ContextSource.BUSINESS_DATA: self._get_business_data,
            ContextSource.KNOWLEDGE_BASE: self._get_knowledge_base,
            ContextSource.REAL_TIME_FEEDS: self._get_real_time_feeds,
            ContextSource.CRM_DATA: self._get_crm_data,
            ContextSource.DOCUMENT_REPOSITORY: self._get_document_repository,
        }
    
    async def assemble_context(self, query: ContextQuery) -> ContextResponse:
        """
        Assemble relevant context from multiple sources
        
        Args:
            query: Context query specifying what context to retrieve
            
        Returns:
            ContextResponse with assembled context items
        """
        start_time = datetime.now()
        
        try:
            # Determine which sources to query
            sources_to_query = (
                query.context_types 
                if query.context_types 
                else list(ContextSource)
            )
            
            # Fetch context from all sources in parallel
            context_tasks = []
            for source in sources_to_query:
                if source in self.source_handlers:
                    task = self._fetch_from_source(source, query)
                    context_tasks.append(task)
            
            # Wait for all context retrieval to complete
            context_results = await asyncio.gather(*context_tasks, return_exceptions=True)
            
            # Process and filter results
            all_context_items = []
            for result in context_results:
                if isinstance(result, Exception):
                    logger.error("Context source error", error=str(result))
                    continue
                if result:
                    all_context_items.extend(result)
            
            # Score and rank context items
            scored_items = await self._score_and_rank_context(
                all_context_items, query
            )
            
            # Filter by relevance threshold
            filtered_items = [
                item for item in scored_items 
                if item.relevance_score >= query.relevance_threshold
            ]
            
            # Limit to max items
            final_items = filtered_items[:query.max_items]
            
            # Calculate metrics
            total_relevance = sum(item.relevance_score for item in final_items)
            confidence_score = self._calculate_confidence(final_items)
            assembly_time = (datetime.now() - start_time).total_seconds() * 1000
            
            sources_used = list(set(item.source for item in final_items))
            
            response = ContextResponse(
                context_items=final_items,
                total_relevance_score=total_relevance,
                assembly_time_ms=assembly_time,
                sources_used=sources_used,
                confidence_score=confidence_score
            )
            
            logger.info(
                "Context assembled",
                items_count=len(final_items),
                sources_used=len(sources_used),
                assembly_time_ms=assembly_time,
                confidence_score=confidence_score
            )
            
            return response
            
        except Exception as e:
            logger.error("Context assembly failed", error=str(e))
            raise
    
    async def _fetch_from_source(
        self, 
        source: ContextSource, 
        query: ContextQuery
    ) -> List[ContextItem]:
        """Fetch context from a specific source"""
        try:
            handler = self.source_handlers[source]
            return await handler(query)
        except Exception as e:
            logger.error("Source fetch failed", source=source.value, error=str(e))
            return []
    
    async def _get_user_preferences(self, query: ContextQuery) -> List[ContextItem]:
        """Retrieve user preferences and settings"""
        # Mock implementation - in production, this would query user database
        preferences = {
            "language": "en",
            "timezone": "UTC",
            "preferred_communication_style": "professional",
            "expertise_level": "intermediate",
            "interests": ["AI", "technology", "business"]
        }
        
        return [ContextItem(
            source=ContextSource.USER_PREFERENCES,
            content=json.dumps(preferences),
            relevance_score=0.9,
            timestamp=datetime.now(),
            metadata={"user_id": query.user_id},
            priority=1
        )]
    
    async def _get_conversation_history(
        self, 
        query: ContextQuery
    ) -> List[ContextItem]:
        """Retrieve recent conversation history"""
        # Mock implementation - in production, this would query conversation database
        history = [
            "User asked about AI implementation strategies",
            "Discussed GEPA optimization benefits",
            "Explored enterprise context engineering solutions"
        ]
        
        items = []
        for i, message in enumerate(history):
            items.append(ContextItem(
                source=ContextSource.CONVERSATION_HISTORY,
                content=message,
                relevance_score=0.8 - (i * 0.1),
                timestamp=datetime.now() - timedelta(minutes=i * 10),
                metadata={"message_index": i},
                priority=2
            ))
        
        return items
    
    async def _get_business_data(self, query: ContextQuery) -> List[ContextItem]:
        """Retrieve relevant business data"""
        # Mock implementation - in production, this would query business databases
        business_data = {
            "company_size": "enterprise",
            "industry": "technology",
            "current_projects": ["AI implementation", "Context engineering"],
            "budget_range": "$100k-$500k",
            "timeline": "Q1 2025"
        }
        
        return [ContextItem(
            source=ContextSource.BUSINESS_DATA,
            content=json.dumps(business_data),
            relevance_score=0.85,
            timestamp=datetime.now(),
            metadata={"data_type": "company_profile"},
            priority=1
        )]
    
    async def _get_knowledge_base(self, query: ContextQuery) -> List[ContextItem]:
        """Retrieve relevant knowledge base entries"""
        # Mock implementation - in production, this would query vector database
        knowledge_entries = [
            "GEPA optimization can improve AI performance by 35x",
            "Context engineering reduces information retrieval time by 40%",
            "Enterprise AI solutions require robust security measures"
        ]
        
        items = []
        for i, entry in enumerate(knowledge_entries):
            items.append(ContextItem(
                source=ContextSource.KNOWLEDGE_BASE,
                content=entry,
                relevance_score=0.9 - (i * 0.1),
                timestamp=datetime.now(),
                metadata={"entry_id": f"kb_{i}"},
                priority=1
            ))
        
        return items
    
    async def _get_real_time_feeds(self, query: ContextQuery) -> List[ContextItem]:
        """Retrieve real-time data feeds"""
        # Mock implementation - in production, this would query real-time APIs
        feeds = [
            "Market trends show increased AI adoption",
            "New regulations affecting enterprise AI deployment",
            "Latest GEPA research published in top-tier conference"
        ]
        
        items = []
        for i, feed in enumerate(feeds):
            items.append(ContextItem(
                source=ContextSource.REAL_TIME_FEEDS,
                content=feed,
                relevance_score=0.7 - (i * 0.1),
                timestamp=datetime.now() - timedelta(minutes=i * 5),
                metadata={"feed_type": "market_intelligence"},
                priority=3
            ))
        
        return items
    
    async def _get_crm_data(self, query: ContextQuery) -> List[ContextItem]:
        """Retrieve CRM data"""
        # Mock implementation - in production, this would query CRM system
        crm_data = {
            "customer_tier": "enterprise",
            "recent_interactions": ["demo_request", "technical_consultation"],
            "pain_points": ["context_management", "ai_optimization"],
            "decision_makers": ["CTO", "VP Engineering"]
        }
        
        return [ContextItem(
            source=ContextSource.CRM_DATA,
            content=json.dumps(crm_data),
            relevance_score=0.8,
            timestamp=datetime.now(),
            metadata={"customer_id": query.user_id},
            priority=1
        )]
    
    async def _get_document_repository(self, query: ContextQuery) -> List[ContextItem]:
        """Retrieve relevant documents"""
        # Mock implementation - in production, this would query document store
        documents = [
            "Enterprise AI Implementation Guide",
            "GEPA Optimization Best Practices",
            "Context Engineering Architecture"
        ]
        
        items = []
        for i, doc in enumerate(documents):
            items.append(ContextItem(
                source=ContextSource.DOCUMENT_REPOSITORY,
                content=doc,
                relevance_score=0.75 - (i * 0.05),
                timestamp=datetime.now(),
                metadata={"document_id": f"doc_{i}"},
                priority=2
            ))
        
        return items
    
    async def _score_and_rank_context(
        self, 
        items: List[ContextItem], 
        query: ContextQuery
    ) -> List[ContextItem]:
        """Score and rank context items by relevance"""
        # Enhanced scoring based on multiple factors
        for item in items:
            # Base relevance from source
            base_score = item.relevance_score
            
            # Boost for recency
            age_hours = (datetime.now() - item.timestamp).total_seconds() / 3600
            recency_boost = max(0, 1 - (age_hours / 24))  # Decay over 24 hours
            
            # Boost for priority
            priority_boost = item.priority * 0.1
            
            # Boost for query text relevance (simplified)
            query_relevance = self._calculate_query_relevance(item.content, query.query_text)
            
            # Combine scores
            final_score = (
                base_score * 0.4 +
                recency_boost * 0.3 +
                priority_boost * 0.2 +
                query_relevance * 0.1
            )
            
            item.relevance_score = min(1.0, final_score)
        
        # Sort by relevance score (descending)
        return sorted(items, key=lambda x: x.relevance_score, reverse=True)
    
    def _calculate_query_relevance(self, content: str, query_text: str) -> float:
        """Calculate relevance between content and query text"""
        # Simplified implementation - in production, use semantic similarity
        query_words = set(query_text.lower().split())
        content_words = set(content.lower().split())
        
        if not query_words:
            return 0.0
        
        overlap = len(query_words.intersection(content_words))
        return overlap / len(query_words)
    
    def _calculate_confidence(self, items: List[ContextItem]) -> float:
        """Calculate overall confidence in the assembled context"""
        if not items:
            return 0.0
        
        # Weight by relevance and source diversity
        relevance_confidence = sum(item.relevance_score for item in items) / len(items)
        source_diversity = len(set(item.source for item in items)) / len(ContextSource)
        
        return (relevance_confidence * 0.7 + source_diversity * 0.3)
    
    async def update_context_cache(self, user_id: str, context: ContextResponse):
        """Update context cache for faster retrieval"""
        cache_key = f"{user_id}_{datetime.now().strftime('%Y%m%d_%H')}"
        self.context_cache[cache_key] = context
        
        # Clean old cache entries
        cutoff_time = datetime.now() - timedelta(hours=1)
        self.context_cache = {
            k: v for k, v in self.context_cache.items()
            if not k.endswith(cutoff_time.strftime('%Y%m%d_%H'))
        }
    
    async def get_cached_context(self, user_id: str) -> Optional[ContextResponse]:
        """Retrieve cached context if available"""
        current_hour = datetime.now().strftime('%Y%m%d_%H')
        cache_key = f"{user_id}_{current_hour}"
        return self.context_cache.get(cache_key)


# Example usage and testing
async def main():
    """Example usage of the Context Engine"""
    config = {
        "cache_ttl": 3600,
        "max_context_items": 100,
        "relevance_threshold": 0.7
    }
    
    engine = ContextEngine(config)
    
    # Create a sample query
    query = ContextQuery(
        user_id="user_123",
        session_id="session_456",
        query_text="How can GEPA optimize our AI context engineering?",
        max_items=20,
        relevance_threshold=0.7
    )
    
    # Assemble context
    context = await engine.assemble_context(query)
    
    print(f"Assembled {len(context.context_items)} context items")
    print(f"Total relevance score: {context.total_relevance_score}")
    print(f"Assembly time: {context.assembly_time_ms}ms")
    print(f"Confidence score: {context.confidence_score}")
    
    for item in context.context_items[:5]:  # Show top 5 items
        print(f"- {item.source.value}: {item.content[:100]}... (score: {item.relevance_score:.2f})")


if __name__ == "__main__":
    asyncio.run(main())
