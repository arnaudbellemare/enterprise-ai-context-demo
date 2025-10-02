"""
Perplexity API Client for Enterprise AI Context Engineering

This module provides integration with Perplexity AI for advanced
context-aware AI capabilities and real-time information access.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, AsyncGenerator
from dataclasses import dataclass
import httpx
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class PerplexityResponse:
    """Response from Perplexity API"""
    content: str
    sources: List[Dict[str, Any]]
    model: str
    usage: Dict[str, int]
    timestamp: datetime


class PerplexityClient:
    """
    Perplexity API Client for Enterprise AI Applications
    
    Provides access to Perplexity's advanced AI models with real-time
    information access and context-aware responses.
    """
    
    def __init__(self, api_key: str, base_url: str = "https://api.perplexity.ai"):
        self.api_key = api_key
        self.base_url = base_url
        self.client = None
        self._setup_client()
    
    def _setup_client(self):
        """Initialize HTTP client"""
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama-3.1-sonar-large-128k-online",
        temperature: float = 0.7,
        max_tokens: int = 4000,
        stream: bool = False
    ) -> PerplexityResponse:
        """
        Send chat completion request to Perplexity
        
        Args:
            messages: List of message objects
            model: Perplexity model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response
            
        Returns:
            PerplexityResponse with content and metadata
        """
        try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": stream
            }
            
            response = await self.client.post("/chat/completions", json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract sources if available
            sources = []
            if "citations" in data:
                sources = data["citations"]
            
            return PerplexityResponse(
                content=data["choices"][0]["message"]["content"],
                sources=sources,
                model=data["model"],
                usage=data.get("usage", {}),
                timestamp=datetime.now()
            )
            
        except httpx.HTTPStatusError as e:
            logger.error("Perplexity API HTTP error", status_code=e.response.status_code, error=str(e))
            raise
        except Exception as e:
            logger.error("Perplexity API error", error=str(e))
            raise
    
    async def stream_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama-3.1-sonar-large-128k-online",
        temperature: float = 0.7,
        max_tokens: int = 4000
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat completion from Perplexity
        
        Args:
            messages: List of message objects
            model: Perplexity model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Yields:
            Chunks of the response as they arrive
        """
        try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True
            }
            
            async with self.client.stream("POST", "/chat/completions", json=payload) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]  # Remove "data: " prefix
                        
                        if data.strip() == "[DONE]":
                            break
                        
                        try:
                            chunk = json.loads(data)
                            if "choices" in chunk and len(chunk["choices"]) > 0:
                                delta = chunk["choices"][0].get("delta", {})
                                if "content" in delta:
                                    yield delta["content"]
                        except json.JSONDecodeError:
                            continue
                            
        except Exception as e:
            logger.error("Perplexity streaming error", error=str(e))
            raise
    
    async def search_and_answer(
        self,
        query: str,
        context: Optional[str] = None,
        model: str = "llama-3.1-sonar-large-128k-online"
    ) -> PerplexityResponse:
        """
        Search for information and provide an answer
        
        Args:
            query: Question or query to answer
            context: Optional context to include
            model: Perplexity model to use
            
        Returns:
            PerplexityResponse with answer and sources
        """
        messages = []
        
        if context:
            messages.append({
                "role": "system",
                "content": f"Context: {context}\n\nPlease answer the following question based on the provided context and your knowledge."
            })
        
        messages.append({
            "role": "user",
            "content": query
        })
        
        return await self.chat_completion(messages, model=model)
    
    async def analyze_context(
        self,
        context_items: List[Dict[str, Any]],
        query: str
    ) -> PerplexityResponse:
        """
        Analyze context items and provide insights
        
        Args:
            context_items: List of context items to analyze
            query: Query to analyze against the context
            
        Returns:
            PerplexityResponse with analysis
        """
        context_text = "\n\n".join([
            f"Source: {item.get('source', 'unknown')}\nContent: {item.get('content', '')}"
            for item in context_items
        ])
        
        messages = [
            {
                "role": "system",
                "content": "You are an AI assistant that analyzes context and provides insights. Analyze the provided context items and answer the user's query with specific references to the sources."
            },
            {
                "role": "user",
                "content": f"Context:\n{context_text}\n\nQuery: {query}"
            }
        ]
        
        return await self.chat_completion(messages)
    
    async def optimize_prompt(
        self,
        original_prompt: str,
        performance_feedback: Optional[str] = None
    ) -> str:
        """
        Optimize a prompt using Perplexity's capabilities
        
        Args:
            original_prompt: Original prompt to optimize
            performance_feedback: Optional feedback on performance
            
        Returns:
            Optimized prompt
        """
        messages = [
            {
                "role": "system",
                "content": "You are an expert at optimizing AI prompts. Analyze the given prompt and provide an improved version that will yield better results."
            },
            {
                "role": "user",
                "content": f"Original prompt: {original_prompt}\n\n{f'Performance feedback: {performance_feedback}' if performance_feedback else ''}\n\nPlease provide an optimized version of this prompt."
            }
        ]
        
        response = await self.chat_completion(messages)
        return response.content
    
    async def get_available_models(self) -> List[str]:
        """
        Get list of available Perplexity models
        
        Returns:
            List of available model names
        """
        try:
            response = await self.client.get("/models")
            response.raise_for_status()
            
            data = response.json()
            return [model["id"] for model in data.get("data", [])]
            
        except Exception as e:
            logger.error("Failed to get available models", error=str(e))
            return []
    
    async def close(self):
        """Close the HTTP client"""
        if self.client:
            await self.client.aclose()


# Example usage and testing
async def main():
    """Example usage of the Perplexity Client"""
    import os
    
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        print("Please set PERPLEXITY_API_KEY environment variable")
        return
    
    client = PerplexityClient(api_key)
    
    try:
        # Test basic chat completion
        messages = [
            {"role": "user", "content": "What are the latest trends in AI context engineering?"}
        ]
        
        response = await client.chat_completion(messages)
        print(f"Response: {response.content}")
        print(f"Sources: {len(response.sources)}")
        
        # Test search and answer
        search_response = await client.search_and_answer(
            "How does GEPA optimization work?",
            context="GEPA is a genetic-pareto optimization framework for AI systems."
        )
        print(f"Search Answer: {search_response.content}")
        
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
