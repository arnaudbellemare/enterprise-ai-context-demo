"""
Search Enhancement System for AI Agents

This module provides advanced search optimization capabilities for AI agents,
including query understanding, intent recognition, and search result optimization.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass
from enum import Enum
import re

import dspy
from pydantic import BaseModel, Field
import structlog

logger = structlog.get_logger(__name__)


class SearchIntent(Enum):
    """Types of search intents"""
    FACTUAL = "factual"
    PROCEDURAL = "procedural"
    ANALYTICAL = "analytical"
    COMPARATIVE = "comparative"
    CREATIVE = "creative"
    TROUBLESHOOTING = "troubleshooting"


class QueryComplexity(Enum):
    """Query complexity levels"""
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    EXPERT = "expert"


@dataclass
class QueryAnalysis:
    """Analysis of a search query"""
    intent: SearchIntent
    complexity: QueryComplexity
    entities: List[str]
    keywords: List[str]
    context_clues: List[str]
    suggested_expansions: List[str]
    confidence: float


@dataclass
class SearchEnhancement:
    """Enhanced search configuration"""
    original_query: str
    enhanced_query: str
    search_strategies: List[str]
    filters: Dict[str, Any]
    boost_terms: List[str]
    context_requirements: List[str]


class SearchEnhancer:
    """
    Advanced Search Enhancement System
    
    This system analyzes queries, understands intent, and optimizes search
    strategies for better AI agent performance.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.llm = None
        self.intent_classifier = None
        self.query_expander = None
        self._setup_components()
    
    def _setup_components(self):
        """Initialize enhancement components"""
        self.llm = dspy.OpenAI(
            model=self.config.get("model_name", "gpt-4o-mini"),
            max_tokens=self.config.get("max_tokens", 1500),
            temperature=self.config.get("temperature", 0.3)
        )
        
        # Initialize specialized components
        self.intent_classifier = self._create_intent_classifier()
        self.query_expander = self._create_query_expander()
    
    def _create_intent_classifier(self):
        """Create intent classification component"""
        return dspy.Predict("query -> intent, complexity, entities, keywords")
    
    def _create_query_expander(self):
        """Create query expansion component"""
        return dspy.Predict("query, intent, context -> expanded_query, strategies")
    
    async def analyze_query(self, query: str, context: Optional[Dict[str, Any]] = None) -> QueryAnalysis:
        """
        Analyze a search query to understand intent and requirements
        
        Args:
            query: Search query to analyze
            context: Optional context information
            
        Returns:
            QueryAnalysis with intent, complexity, and other insights
        """
        try:
            # Prepare analysis prompt
            analysis_prompt = f"""
            Analyze the following search query and provide detailed insights:
            
            Query: "{query}"
            
            Context: {json.dumps(context or {})}
            
            Please provide:
            1. Intent type (factual, procedural, analytical, comparative, creative, troubleshooting)
            2. Complexity level (simple, moderate, complex, expert)
            3. Key entities mentioned
            4. Important keywords
            5. Context clues that might help
            6. Suggested query expansions
            7. Confidence in analysis (0-1)
            
            Format as JSON with these fields.
            """
            
            response = await self.llm.forward(instruction=analysis_prompt)
            analysis_text = response.completions[0].text.strip()
            
            # Parse the analysis
            analysis_data = self._parse_analysis(analysis_text)
            
            # Create QueryAnalysis object
            analysis = QueryAnalysis(
                intent=SearchIntent(analysis_data.get("intent", "factual")),
                complexity=QueryComplexity(analysis_data.get("complexity", "moderate")),
                entities=analysis_data.get("entities", []),
                keywords=analysis_data.get("keywords", []),
                context_clues=analysis_data.get("context_clues", []),
                suggested_expansions=analysis_data.get("suggested_expansions", []),
                confidence=analysis_data.get("confidence", 0.7)
            )
            
            logger.info("Query analysis completed", 
                       intent=analysis.intent.value,
                       complexity=analysis.complexity.value,
                       confidence=analysis.confidence)
            
            return analysis
            
        except Exception as e:
            logger.error("Query analysis failed", error=str(e))
            # Return default analysis
            return QueryAnalysis(
                intent=SearchIntent.FACTUAL,
                complexity=QueryComplexity.MODERATE,
                entities=[],
                keywords=query.split(),
                context_clues=[],
                suggested_expansions=[],
                confidence=0.5
            )
    
    def _parse_analysis(self, analysis_text: str) -> Dict[str, Any]:
        """Parse analysis text into structured data"""
        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                # Fallback parsing
                return self._fallback_parse(analysis_text)
        except Exception as e:
            logger.error("Analysis parsing failed", error=str(e))
            return {}
    
    def _fallback_parse(self, text: str) -> Dict[str, Any]:
        """Fallback parsing when JSON extraction fails"""
        # Simple keyword-based parsing
        result = {
            "intent": "factual",
            "complexity": "moderate",
            "entities": [],
            "keywords": [],
            "context_clues": [],
            "suggested_expansions": [],
            "confidence": 0.7
        }
        
        # Extract keywords (simple approach)
        words = text.lower().split()
        result["keywords"] = [word for word in words if len(word) > 3]
        
        return result
    
    async def enhance_query(
        self, 
        query: str, 
        analysis: QueryAnalysis,
        context: Optional[Dict[str, Any]] = None
    ) -> SearchEnhancement:
        """
        Enhance a search query based on analysis
        
        Args:
            query: Original query
            analysis: Query analysis results
            context: Optional context information
            
        Returns:
            SearchEnhancement with optimized search configuration
        """
        try:
            # Determine search strategies based on intent
            strategies = self._determine_search_strategies(analysis)
            
            # Create enhanced query
            enhanced_query = await self._create_enhanced_query(query, analysis, context)
            
            # Determine filters and boost terms
            filters = self._create_filters(analysis, context)
            boost_terms = self._extract_boost_terms(analysis)
            context_requirements = self._determine_context_requirements(analysis)
            
            enhancement = SearchEnhancement(
                original_query=query,
                enhanced_query=enhanced_query,
                search_strategies=strategies,
                filters=filters,
                boost_terms=boost_terms,
                context_requirements=context_requirements
            )
            
            logger.info("Query enhancement completed",
                       strategies=strategies,
                       boost_terms=boost_terms)
            
            return enhancement
            
        except Exception as e:
            logger.error("Query enhancement failed", error=str(e))
            # Return basic enhancement
            return SearchEnhancement(
                original_query=query,
                enhanced_query=query,
                search_strategies=["semantic"],
                filters={},
                boost_terms=[],
                context_requirements=[]
            )
    
    def _determine_search_strategies(self, analysis: QueryAnalysis) -> List[str]:
        """Determine appropriate search strategies based on analysis"""
        strategies = []
        
        # Base strategy
        strategies.append("semantic")
        
        # Add strategies based on intent
        if analysis.intent == SearchIntent.FACTUAL:
            strategies.extend(["keyword", "exact_match"])
        elif analysis.intent == SearchIntent.PROCEDURAL:
            strategies.extend(["step_by_step", "tutorial"])
        elif analysis.intent == SearchIntent.ANALYTICAL:
            strategies.extend(["analytical", "comparative"])
        elif analysis.intent == SearchIntent.COMPARATIVE:
            strategies.extend(["comparative", "pros_cons"])
        elif analysis.intent == SearchIntent.CREATIVE:
            strategies.extend(["creative", "inspirational"])
        elif analysis.intent == SearchIntent.TROUBLESHOOTING:
            strategies.extend(["troubleshooting", "error_specific"])
        
        # Add complexity-based strategies
        if analysis.complexity == QueryComplexity.EXPERT:
            strategies.extend(["technical", "advanced"])
        elif analysis.complexity == QueryComplexity.SIMPLE:
            strategies.extend(["beginner", "basic"])
        
        return list(set(strategies))  # Remove duplicates
    
    async def _create_enhanced_query(
        self, 
        query: str, 
        analysis: QueryAnalysis,
        context: Optional[Dict[str, Any]]
    ) -> str:
        """Create an enhanced version of the query"""
        try:
            enhancement_prompt = f"""
            Enhance the following search query to improve retrieval accuracy:
            
            Original Query: "{query}"
            Intent: {analysis.intent.value}
            Complexity: {analysis.complexity.value}
            Entities: {', '.join(analysis.entities)}
            Keywords: {', '.join(analysis.keywords)}
            
            Context: {json.dumps(context or {})}
            
            Create an enhanced query that:
            1. Maintains the original intent
            2. Adds relevant synonyms and related terms
            3. Includes context-specific refinements
            4. Optimizes for the identified complexity level
            
            Return only the enhanced query, not explanations.
            """
            
            response = await self.llm.forward(instruction=enhancement_prompt)
            enhanced_query = response.completions[0].text.strip()
            
            # Clean up the response
            enhanced_query = enhanced_query.strip('"').strip("'")
            
            return enhanced_query if enhanced_query else query
            
        except Exception as e:
            logger.error("Query enhancement failed", error=str(e))
            return query
    
    def _create_filters(self, analysis: QueryAnalysis, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Create search filters based on analysis"""
        filters = {}
        
        # Intent-based filters
        if analysis.intent == SearchIntent.FACTUAL:
            filters["content_type"] = ["documentation", "reference", "factual"]
        elif analysis.intent == SearchIntent.PROCEDURAL:
            filters["content_type"] = ["tutorial", "guide", "how-to"]
        elif analysis.intent == SearchIntent.TROUBLESHOOTING:
            filters["content_type"] = ["troubleshooting", "error", "solution"]
        
        # Complexity-based filters
        if analysis.complexity == QueryComplexity.EXPERT:
            filters["expertise_level"] = ["advanced", "expert"]
        elif analysis.complexity == QueryComplexity.SIMPLE:
            filters["expertise_level"] = ["beginner", "basic"]
        
        # Entity-based filters
        if analysis.entities:
            filters["entities"] = analysis.entities
        
        # Context-based filters
        if context:
            if "domain" in context:
                filters["domain"] = context["domain"]
            if "time_range" in context:
                filters["time_range"] = context["time_range"]
        
        return filters
    
    def _extract_boost_terms(self, analysis: QueryAnalysis) -> List[str]:
        """Extract terms that should be boosted in search"""
        boost_terms = []
        
        # Add keywords as boost terms
        boost_terms.extend(analysis.keywords)
        
        # Add entity-specific terms
        for entity in analysis.entities:
            if len(entity) > 2:  # Avoid very short terms
                boost_terms.append(entity)
        
        # Add intent-specific boost terms
        intent_boosts = {
            SearchIntent.FACTUAL: ["definition", "what is", "meaning"],
            SearchIntent.PROCEDURAL: ["how to", "steps", "process"],
            SearchIntent.ANALYTICAL: ["analysis", "insights", "trends"],
            SearchIntent.COMPARATIVE: ["vs", "compare", "difference"],
            SearchIntent.CREATIVE: ["ideas", "inspiration", "creative"],
            SearchIntent.TROUBLESHOOTING: ["error", "problem", "fix", "solution"]
        }
        
        if analysis.intent in intent_boosts:
            boost_terms.extend(intent_boosts[analysis.intent])
        
        return list(set(boost_terms))  # Remove duplicates
    
    def _determine_context_requirements(self, analysis: QueryAnalysis) -> List[str]:
        """Determine what context information is needed"""
        requirements = []
        
        # Intent-based requirements
        if analysis.intent == SearchIntent.ANALYTICAL:
            requirements.extend(["data_context", "trend_analysis", "metrics"])
        elif analysis.intent == SearchIntent.COMPARATIVE:
            requirements.extend(["comparison_data", "pros_cons", "alternatives"])
        elif analysis.intent == SearchIntent.TROUBLESHOOTING:
            requirements.extend(["error_context", "system_state", "recent_changes"])
        
        # Complexity-based requirements
        if analysis.complexity == QueryComplexity.EXPERT:
            requirements.extend(["technical_details", "advanced_concepts"])
        elif analysis.complexity == QueryComplexity.SIMPLE:
            requirements.extend(["basic_explanations", "simple_examples"])
        
        return list(set(requirements))
    
    async def optimize_search_results(
        self,
        results: List[Dict[str, Any]],
        enhancement: SearchEnhancement,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Optimize search results based on enhancement configuration
        
        Args:
            results: Raw search results
            enhancement: Search enhancement configuration
            max_results: Maximum number of results to return
            
        Returns:
            Optimized search results
        """
        try:
            if not results:
                return results
            
            # Apply boost terms
            boosted_results = self._apply_boost_terms(results, enhancement.boost_terms)
            
            # Apply filters
            filtered_results = self._apply_filters(boosted_results, enhancement.filters)
            
            # Re-rank based on enhancement criteria
            reranked_results = self._rerank_results(filtered_results, enhancement)
            
            # Limit to max results
            final_results = reranked_results[:max_results]
            
            logger.info(f"Optimized {len(results)} results to {len(final_results)}")
            
            return final_results
            
        except Exception as e:
            logger.error("Result optimization failed", error=str(e))
            return results[:max_results]
    
    def _apply_boost_terms(self, results: List[Dict[str, Any]], boost_terms: List[str]) -> List[Dict[str, Any]]:
        """Apply boost terms to search results"""
        if not boost_terms:
            return results
        
        for result in results:
            content = result.get("content", "").lower()
            boost_score = 0
            
            for term in boost_terms:
                if term.lower() in content:
                    boost_score += 1
            
            result["boost_score"] = boost_score
            result["original_score"] = result.get("score", 0)
            result["score"] = result.get("score", 0) + (boost_score * 0.1)
        
        return results
    
    def _apply_filters(self, results: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Apply filters to search results"""
        if not filters:
            return results
        
        filtered_results = []
        
        for result in results:
            include = True
            
            # Apply content type filter
            if "content_type" in filters:
                result_type = result.get("metadata", {}).get("content_type", "")
                if result_type not in filters["content_type"]:
                    include = False
            
            # Apply expertise level filter
            if "expertise_level" in filters and include:
                expertise = result.get("metadata", {}).get("expertise_level", "")
                if expertise and expertise not in filters["expertise_level"]:
                    include = False
            
            # Apply entity filter
            if "entities" in filters and include:
                result_entities = result.get("metadata", {}).get("entities", [])
                if not any(entity in result_entities for entity in filters["entities"]):
                    include = False
            
            if include:
                filtered_results.append(result)
        
        return filtered_results
    
    def _rerank_results(
        self, 
        results: List[Dict[str, Any]], 
        enhancement: SearchEnhancement
    ) -> List[Dict[str, Any]]:
        """Re-rank results based on enhancement criteria"""
        # Sort by score (descending)
        return sorted(results, key=lambda x: x.get("score", 0), reverse=True)
    
    async def get_search_recommendations(
        self, 
        query: str, 
        analysis: QueryAnalysis
    ) -> Dict[str, Any]:
        """
        Get recommendations for improving search performance
        
        Args:
            query: Original query
            analysis: Query analysis results
            
        Returns:
            Search recommendations
        """
        recommendations = {
            "query_improvements": [],
            "search_strategies": [],
            "context_suggestions": [],
            "expected_results": {}
        }
        
        # Query improvement suggestions
        if analysis.complexity == QueryComplexity.SIMPLE:
            recommendations["query_improvements"].append("Consider adding more specific terms")
        elif analysis.complexity == QueryComplexity.EXPERT:
            recommendations["query_improvements"].append("Query is highly technical - ensure sufficient context")
        
        # Search strategy recommendations
        if analysis.intent == SearchIntent.FACTUAL:
            recommendations["search_strategies"].append("Use exact match search for precise facts")
        elif analysis.intent == SearchIntent.PROCEDURAL:
            recommendations["search_strategies"].append("Look for step-by-step guides and tutorials")
        
        # Context suggestions
        if analysis.entities:
            recommendations["context_suggestions"].append(f"Focus on entities: {', '.join(analysis.entities)}")
        
        # Expected results
        recommendations["expected_results"] = {
            "intent": analysis.intent.value,
            "complexity": analysis.complexity.value,
            "confidence": analysis.confidence
        }
        
        return recommendations


# Example usage and testing
async def main():
    """Example usage of the Search Enhancer"""
    config = {
        "model_name": "gpt-4o-mini",
        "max_tokens": 1500,
        "temperature": 0.3
    }
    
    enhancer = SearchEnhancer(config)
    
    # Analyze a query
    query = "How to implement GEPA optimization for enterprise AI systems?"
    analysis = await enhancer.analyze_query(query)
    
    print(f"Query: {query}")
    print(f"Intent: {analysis.intent.value}")
    print(f"Complexity: {analysis.complexity.value}")
    print(f"Entities: {analysis.entities}")
    print(f"Keywords: {analysis.keywords}")
    print(f"Confidence: {analysis.confidence}")
    
    # Enhance the query
    enhancement = await enhancer.enhance_query(query, analysis)
    
    print(f"\nEnhanced Query: {enhancement.enhanced_query}")
    print(f"Search Strategies: {enhancement.search_strategies}")
    print(f"Boost Terms: {enhancement.boost_terms}")
    
    # Get recommendations
    recommendations = await enhancer.get_search_recommendations(query, analysis)
    print(f"\nRecommendations: {recommendations}")


if __name__ == "__main__":
    asyncio.run(main())
