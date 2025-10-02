"""
GEPA Optimizer - Lightweight implementation for Vercel
Genetic-Pareto optimization for prompt evolution
"""

import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio

class GEPAOptimizer:
    """
    Lightweight GEPA implementation optimized for serverless deployment
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.optimization_history: List[Dict[str, Any]] = []
        self.population_size = self.config.get('population_size', 10)
        self.max_iterations = self.config.get('max_iterations', 5)
        
    async def optimize_prompt(
        self, 
        initial_prompt: str, 
        evaluation_function: callable,
        training_data: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Optimize prompt using GEPA algorithm
        """
        print(f"Starting GEPA optimization for prompt: {initial_prompt[:50]}...")
        
        # Initialize population
        population = [initial_prompt]
        
        # Generate variations (simplified for serverless)
        for i in range(self.population_size - 1):
            variation = self._generate_variation(initial_prompt, i)
            population.append(variation)
        
        best_prompt = initial_prompt
        best_score = 0.0
        
        for iteration in range(self.max_iterations):
            print(f"GEPA Iteration {iteration + 1}/{self.max_iterations}")
            
            # Evaluate population
            scores = []
            for prompt in population:
                try:
                    score = await evaluation_function(prompt, training_data or [])
                    scores.append(score)
                    
                    if score > best_score:
                        best_score = score
                        best_prompt = prompt
                        
                except Exception as e:
                    print(f"Evaluation error: {e}")
                    scores.append(0.0)
            
            # Record optimization step
            self.optimization_history.append({
                "iteration": iteration + 1,
                "best_score": best_score,
                "best_prompt": best_prompt,
                "timestamp": datetime.now().isoformat()
            })
            
            # Generate next generation (simplified)
            if iteration < self.max_iterations - 1:
                population = self._evolve_population(population, scores)
        
        return {
            "optimized_prompt": best_prompt,
            "final_score": best_score,
            "iterations": self.max_iterations,
            "optimization_history": self.optimization_history
        }
    
    def _generate_variation(self, prompt: str, variation_id: int) -> str:
        """Generate prompt variation"""
        variations = [
            f"{prompt}\n\n[Enhanced with specific examples and detailed instructions]",
            f"Context: You are an expert AI assistant.\n\n{prompt}\n\nProvide accurate and helpful responses.",
            f"{prompt}\n\n[Optimized for clarity and precision]",
            f"Task: {prompt}\n\nInstructions: Be thorough and accurate in your response.",
            f"{prompt}\n\n[Enhanced with step-by-step reasoning]"
        ]
        return variations[variation_id % len(variations)]
    
    def _evolve_population(self, population: List[str], scores: List[float]) -> List[str]:
        """Evolve population based on scores"""
        # Simple selection: keep top 50% and generate new variations
        sorted_pop = sorted(zip(population, scores), key=lambda x: x[1], reverse=True)
        top_half = [item[0] for item in sorted_pop[:len(sorted_pop)//2]]
        
        new_population = top_half.copy()
        for i in range(len(population) - len(top_half)):
            if top_half:
                base_prompt = top_half[i % len(top_half)]
                new_population.append(self._generate_variation(base_prompt, i))
            else:
                new_population.append(population[i])
        
        return new_population
    
    def get_optimization_status(self) -> Dict[str, Any]:
        """Get current optimization status"""
        return {
            "total_iterations": len(self.optimization_history),
            "last_optimization": self.optimization_history[-1] if self.optimization_history else None,
            "active": True
        }
