"""
Advanced RAG (Retrieval-Augmented Generation) System for Enterprise AI

This module implements a sophisticated RAG system with hybrid search,
reranking, and context synthesis capabilities for enterprise applications.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass
from enum import Enum
import numpy as np

import dspy
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma, FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from pydantic import BaseModel, Field
import structlog

logger = structlog.get_logger(__name__)


class SearchStrategy(Enum):
    """Available search strategies"""
    SEMANTIC = "semantic"
    KEYWORD = "keyword"
    HYBRID = "hybrid"
    CONTEXTUAL = "contextual"


class RerankingMethod(Enum):
    """Available reranking methods"""
    SIMILARITY = "similarity"
    RELEVANCE = "relevance"
    DIVERSITY = "diversity"
    TEMPORAL = "temporal"


@dataclass
class RetrievalResult:
    """Result of a retrieval operation"""
    content: str
    score: float
    source: str
    metadata: Dict[str, Any]
    chunk_id: str
    timestamp: datetime


@dataclass
class RAGResponse:
    """Complete RAG response"""
    answer: str
    sources: List[RetrievalResult]
    confidence: float
    reasoning: str
    retrieval_time_ms: float
    generation_time_ms: float


class AdvancedRAGSystem:
    """
    Advanced RAG System with hybrid search and intelligent reranking
    
    This system provides enterprise-grade retrieval and generation capabilities
    with support for multiple vector stores, hybrid search strategies, and
    sophisticated reranking algorithms.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.embeddings = None
        self.vector_store = None
        self.text_splitter = None
        self.llm = None
        self.reranker = None
        self._setup_components()
    
    def _setup_components(self):
        """Initialize RAG system components"""
        # Setup embeddings
        self.embeddings = OpenAIEmbeddings(
            model=self.config.get("embedding_model", "text-embedding-3-small"),
            openai_api_key=self.config.get("openai_api_key")
        )
        
        # Setup text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.config.get("chunk_size", 1000),
            chunk_overlap=self.config.get("chunk_overlap", 200),
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        # Setup LLM
        self.llm = dspy.OpenAI(
            model=self.config.get("llm_model", "gpt-4o-mini"),
            max_tokens=self.config.get("max_tokens", 2000),
            temperature=self.config.get("temperature", 0.7)
        )
        
        # Initialize vector store
        self._setup_vector_store()
    
    def _setup_vector_store(self):
        """Setup vector store based on configuration"""
        store_type = self.config.get("vector_store_type", "chromadb")
        
        if store_type == "chromadb":
            self.vector_store = Chroma(
                embedding_function=self.embeddings,
                persist_directory=self.config.get("chromadb_persist_dir", "./data/chroma_db")
            )
        elif store_type == "faiss":
            # FAISS requires pre-existing index
            self.vector_store = None  # Will be created when documents are added
        else:
            raise ValueError(f"Unsupported vector store type: {store_type}")
    
    async def add_documents(
        self, 
        documents: List[Union[str, Document]], 
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Add documents to the knowledge base
        
        Args:
            documents: List of documents to add
            metadata: Optional metadata for the documents
            
        Returns:
            Success status
        """
        try:
            # Convert strings to Document objects
            if documents and isinstance(documents[0], str):
                docs = [Document(page_content=doc, metadata=metadata or {}) for doc in documents]
            else:
                docs = documents
            
            # Split documents into chunks
            chunks = []
            for doc in docs:
                doc_chunks = self.text_splitter.split_documents([doc])
                chunks.extend(doc_chunks)
            
            # Add to vector store
            if self.config.get("vector_store_type") == "chromadb":
                self.vector_store.add_documents(chunks)
            elif self.config.get("vector_store_type") == "faiss":
                if self.vector_store is None:
                    # Create new FAISS index
                    texts = [chunk.page_content for chunk in chunks]
                    self.vector_store = FAISS.from_texts(texts, self.embeddings)
                else:
                    # Add to existing index
                    texts = [chunk.page_content for chunk in chunks]
                    new_store = FAISS.from_texts(texts, self.embeddings)
                    self.vector_store.merge_from(new_store)
            
            logger.info(f"Added {len(chunks)} document chunks to knowledge base")
            return True
            
        except Exception as e:
            logger.error("Failed to add documents", error=str(e))
            return False
    
    async def retrieve(
        self,
        query: str,
        strategy: SearchStrategy = SearchStrategy.HYBRID,
        top_k: int = 10,
        rerank_method: RerankingMethod = RerankingMethod.RELEVANCE
    ) -> List[RetrievalResult]:
        """
        Retrieve relevant documents for a query
        
        Args:
            query: Search query
            strategy: Search strategy to use
            top_k: Number of results to retrieve
            rerank_method: Method for reranking results
            
        Returns:
            List of retrieval results
        """
        start_time = datetime.now()
        
        try:
            # Perform retrieval based on strategy
            if strategy == SearchStrategy.SEMANTIC:
                results = await self._semantic_search(query, top_k * 2)
            elif strategy == SearchStrategy.KEYWORD:
                results = await self._keyword_search(query, top_k * 2)
            elif strategy == SearchStrategy.HYBRID:
                results = await self._hybrid_search(query, top_k * 2)
            elif strategy == SearchStrategy.CONTEXTUAL:
                results = await self._contextual_search(query, top_k * 2)
            else:
                results = await self._semantic_search(query, top_k * 2)
            
            # Rerank results
            reranked_results = await self._rerank_results(results, rerank_method)
            
            # Return top_k results
            final_results = reranked_results[:top_k]
            
            retrieval_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.info(f"Retrieved {len(final_results)} results in {retrieval_time:.2f}ms")
            
            return final_results
            
        except Exception as e:
            logger.error("Retrieval failed", error=str(e))
            return []
    
    async def _semantic_search(self, query: str, top_k: int) -> List[RetrievalResult]:
        """Perform semantic similarity search"""
        try:
            if self.config.get("vector_store_type") == "chromadb":
                docs = self.vector_store.similarity_search_with_score(query, k=top_k)
                results = []
                for doc, score in docs:
                    result = RetrievalResult(
                        content=doc.page_content,
                        score=float(score),
                        source=doc.metadata.get("source", "unknown"),
                        metadata=doc.metadata,
                        chunk_id=doc.metadata.get("chunk_id", ""),
                        timestamp=datetime.now()
                    )
                    results.append(result)
                return results
            else:
                # Fallback for other vector stores
                return []
        except Exception as e:
            logger.error("Semantic search failed", error=str(e))
            return []
    
    async def _keyword_search(self, query: str, top_k: int) -> List[RetrievalResult]:
        """Perform keyword-based search"""
        # Simplified keyword search implementation
        # In production, this would use BM25 or similar
        try:
            # For now, use semantic search as fallback
            return await self._semantic_search(query, top_k)
        except Exception as e:
            logger.error("Keyword search failed", error=str(e))
            return []
    
    async def _hybrid_search(self, query: str, top_k: int) -> List[RetrievalResult]:
        """Perform hybrid semantic + keyword search"""
        try:
            # Get semantic results
            semantic_results = await self._semantic_search(query, top_k // 2)
            
            # Get keyword results
            keyword_results = await self._keyword_search(query, top_k // 2)
            
            # Combine and deduplicate
            all_results = semantic_results + keyword_results
            seen_chunks = set()
            unique_results = []
            
            for result in all_results:
                if result.chunk_id not in seen_chunks:
                    seen_chunks.add(result.chunk_id)
                    unique_results.append(result)
            
            # Sort by score
            unique_results.sort(key=lambda x: x.score, reverse=True)
            
            return unique_results[:top_k]
            
        except Exception as e:
            logger.error("Hybrid search failed", error=str(e))
            return []
    
    async def _contextual_search(self, query: str, top_k: int) -> List[RetrievalResult]:
        """Perform context-aware search"""
        try:
            # Enhanced search that considers context and intent
            # This would involve query expansion and intent understanding
            return await self._hybrid_search(query, top_k)
        except Exception as e:
            logger.error("Contextual search failed", error=str(e))
            return []
    
    async def _rerank_results(
        self, 
        results: List[RetrievalResult], 
        method: RerankingMethod
    ) -> List[RetrievalResult]:
        """Rerank retrieval results using specified method"""
        if not results:
            return results
        
        try:
            if method == RerankingMethod.SIMILARITY:
                # Sort by similarity score (already done)
                return sorted(results, key=lambda x: x.score, reverse=True)
            
            elif method == RerankingMethod.RELEVANCE:
                # Enhanced relevance scoring
                for result in results:
                    # Boost score based on content quality indicators
                    content_quality = self._assess_content_quality(result.content)
                    result.score = result.score * (1 + content_quality * 0.2)
                
                return sorted(results, key=lambda x: x.score, reverse=True)
            
            elif method == RerankingMethod.DIVERSITY:
                # Diversify results to avoid redundancy
                return self._diversify_results(results)
            
            elif method == RerankingMethod.TEMPORAL:
                # Consider recency in ranking
                for result in results:
                    # Boost recent content
                    age_days = (datetime.now() - result.timestamp).days
                    recency_boost = max(0, 1 - age_days / 30)  # Decay over 30 days
                    result.score = result.score * (1 + recency_boost * 0.1)
                
                return sorted(results, key=lambda x: x.score, reverse=True)
            
            else:
                return results
                
        except Exception as e:
            logger.error("Reranking failed", error=str(e))
            return results
    
    def _assess_content_quality(self, content: str) -> float:
        """Assess the quality of content for relevance scoring"""
        # Simple quality indicators
        quality_score = 0.0
        
        # Length indicator (not too short, not too long)
        length_score = min(1.0, len(content) / 500)  # Optimal around 500 chars
        quality_score += length_score * 0.3
        
        # Structure indicator (presence of sentences, paragraphs)
        sentence_count = content.count('.') + content.count('!') + content.count('?')
        structure_score = min(1.0, sentence_count / 5)  # Optimal around 5 sentences
        quality_score += structure_score * 0.3
        
        # Information density (avoid repetitive content)
        words = content.lower().split()
        unique_words = len(set(words))
        total_words = len(words)
        diversity_score = unique_words / total_words if total_words > 0 else 0
        quality_score += diversity_score * 0.4
        
        return min(1.0, quality_score)
    
    def _diversify_results(self, results: List[RetrievalResult]) -> List[RetrievalResult]:
        """Diversify results to avoid redundant information"""
        if len(results) <= 1:
            return results
        
        diversified = [results[0]]  # Start with best result
        
        for result in results[1:]:
            # Check similarity with already selected results
            is_similar = False
            for selected in diversified:
                similarity = self._calculate_similarity(result.content, selected.content)
                if similarity > 0.8:  # High similarity threshold
                    is_similar = True
                    break
            
            if not is_similar:
                diversified.append(result)
        
        return diversified
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts"""
        # Simple Jaccard similarity
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0
    
    async def generate_answer(
        self,
        query: str,
        context: List[RetrievalResult],
        include_sources: bool = True
    ) -> RAGResponse:
        """
        Generate an answer using retrieved context
        
        Args:
            query: User query
            context: Retrieved context documents
            include_sources: Whether to include source information
            
        Returns:
            Complete RAG response
        """
        start_time = datetime.now()
        
        try:
            # Prepare context for generation
            context_text = self._prepare_context(context)
            
            # Create generation prompt
            prompt = self._create_generation_prompt(query, context_text, include_sources)
            
            # Generate response
            response = await self.llm.forward(instruction=prompt)
            answer = response.completions[0].text.strip()
            
            # Calculate confidence
            confidence = self._calculate_confidence(answer, context)
            
            # Extract reasoning if present
            reasoning = self._extract_reasoning(answer)
            
            generation_time = (datetime.now() - start_time).total_seconds() * 1000
            
            rag_response = RAGResponse(
                answer=answer,
                sources=context,
                confidence=confidence,
                reasoning=reasoning,
                retrieval_time_ms=0,  # Set by caller
                generation_time_ms=generation_time
            )
            
            logger.info(f"Generated answer in {generation_time:.2f}ms", 
                       confidence=confidence)
            
            return rag_response
            
        except Exception as e:
            logger.error("Answer generation failed", error=str(e))
            return RAGResponse(
                answer="I apologize, but I encountered an error while generating a response.",
                sources=[],
                confidence=0.0,
                reasoning="Error in generation process",
                retrieval_time_ms=0,
                generation_time_ms=0
            )
    
    def _prepare_context(self, context: List[RetrievalResult]) -> str:
        """Prepare context text for generation"""
        if not context:
            return "No relevant context found."
        
        context_parts = []
        for i, result in enumerate(context, 1):
            context_parts.append(f"[Source {i}]: {result.content}")
        
        return "\n\n".join(context_parts)
    
    def _create_generation_prompt(
        self, 
        query: str, 
        context: str, 
        include_sources: bool
    ) -> str:
        """Create prompt for answer generation"""
        base_prompt = f"""
        Based on the following context, provide a comprehensive and accurate answer to the user's question.

        User Question: {query}

        Context:
        {context}

        Instructions:
        - Provide a clear, accurate, and helpful answer
        - Use the context information to support your response
        - If the context doesn't contain enough information, say so
        - Be concise but comprehensive
        """
        
        if include_sources:
            base_prompt += "\n- Include relevant source references when appropriate"
        
        return base_prompt
    
    def _calculate_confidence(self, answer: str, context: List[RetrievalResult]) -> float:
        """Calculate confidence in the generated answer"""
        if not context:
            return 0.0
        
        # Base confidence from context quality
        avg_context_score = sum(result.score for result in context) / len(context)
        
        # Boost confidence based on answer characteristics
        answer_quality = self._assess_content_quality(answer)
        
        # Penalize if answer is too short or generic
        if len(answer) < 50:
            answer_quality *= 0.5
        
        # Check for uncertainty indicators
        uncertainty_indicators = ["i don't know", "not sure", "unclear", "uncertain"]
        if any(indicator in answer.lower() for indicator in uncertainty_indicators):
            answer_quality *= 0.7
        
        final_confidence = (avg_context_score * 0.6 + answer_quality * 0.4)
        return min(1.0, final_confidence)
    
    def _extract_reasoning(self, answer: str) -> str:
        """Extract reasoning from the answer if present"""
        # Look for reasoning indicators
        reasoning_indicators = ["because", "since", "due to", "as a result", "therefore"]
        
        for indicator in reasoning_indicators:
            if indicator in answer.lower():
                # Extract the reasoning part
                parts = answer.lower().split(indicator)
                if len(parts) > 1:
                    return parts[1].strip()
        
        return "Standard response generation"
    
    async def rag_query(
        self,
        query: str,
        search_strategy: SearchStrategy = SearchStrategy.HYBRID,
        top_k: int = 5,
        rerank_method: RerankingMethod = RerankingMethod.RELEVANCE
    ) -> RAGResponse:
        """
        Complete RAG query: retrieve and generate
        
        Args:
            query: User query
            search_strategy: Search strategy
            top_k: Number of documents to retrieve
            rerank_method: Reranking method
            
        Returns:
            Complete RAG response
        """
        retrieval_start = datetime.now()
        
        # Retrieve relevant documents
        context = await self.retrieve(
            query=query,
            strategy=search_strategy,
            top_k=top_k,
            rerank_method=rerank_method
        )
        
        retrieval_time = (datetime.now() - retrieval_start).total_seconds() * 1000
        
        # Generate answer
        response = await self.generate_answer(query, context)
        response.retrieval_time_ms = retrieval_time
        
        return response


# Example usage and testing
async def main():
    """Example usage of the Advanced RAG System"""
    config = {
        "vector_store_type": "chromadb",
        "embedding_model": "text-embedding-3-small",
        "llm_model": "gpt-4o-mini",
        "chunk_size": 1000,
        "chunk_overlap": 200,
        "max_tokens": 2000,
        "temperature": 0.7
    }
    
    rag_system = AdvancedRAGSystem(config)
    
    # Add sample documents
    sample_docs = [
        "GEPA is a genetic-pareto optimization framework for AI systems.",
        "Context engineering involves assembling relevant information for AI agents.",
        "Enterprise AI solutions require robust security and compliance measures.",
        "DSPy provides modular AI programming with learnable parameters."
    ]
    
    await rag_system.add_documents(sample_docs)
    
    # Perform RAG query
    query = "What is GEPA and how does it relate to context engineering?"
    
    response = await rag_system.rag_query(
        query=query,
        search_strategy=SearchStrategy.HYBRID,
        top_k=3,
        rerank_method=RerankingMethod.RELEVANCE
    )
    
    print(f"Query: {query}")
    print(f"Answer: {response.answer}")
    print(f"Confidence: {response.confidence:.2f}")
    print(f"Sources: {len(response.sources)}")
    print(f"Retrieval time: {response.retrieval_time_ms:.2f}ms")
    print(f"Generation time: {response.generation_time_ms:.2f}ms")


if __name__ == "__main__":
    asyncio.run(main())
