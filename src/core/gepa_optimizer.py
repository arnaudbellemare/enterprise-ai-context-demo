"""
GEPA (Genetic-Pareto) Optimizer for Reflective Prompt Evolution

This module implements the GEPA optimization framework for continuous
improvement of AI prompts and system components through reflective evolution.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple, Callable
from dataclasses import dataclass, field
from enum import Enum
import random
import math

import dspy
import gepa
from pydantic import BaseModel, Field
import structlog

logger = structlog.get_logger(__name__)


class OptimizationMetric(Enum):
    """Available optimization metrics"""
    ACCURACY = "accuracy"
    EFFICIENCY = "efficiency"
    RELEVANCE = "relevance"
    USER_SATISFACTION = "user_satisfaction"
    COST_EFFECTIVENESS = "cost_effectiveness"


@dataclass
class OptimizationResult:
    """Result of an optimization iteration"""
    iteration: int
    candidate_id: str
    performance_scores: Dict[OptimizationMetric, float]
    prompt_variant: str
    execution_trace: Dict[str, Any]
    reflection_insights: List[str]
    improvement_direction: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class ParetoFrontier:
    """Maintains the Pareto frontier of optimization candidates"""
    candidates: List[OptimizationResult] = field(default_factory=list)
    max_size: int = 20
    
    def add_candidate(self, result: OptimizationResult):
        """Add a candidate to the frontier if it's Pareto optimal"""
        # Remove dominated candidates
        self.candidates = [
            c for c in self.candidates 
            if not self._dominates(result, c)
        ]
        
        # Add new candidate if not dominated
        if not any(self._dominates(c, result) for c in self.candidates):
            self.candidates.append(result)
            
        # Maintain size limit
        if len(self.candidates) > self.max_size:
            self.candidates = sorted(
                self.candidates, 
                key=lambda x: sum(x.performance_scores.values()),
                reverse=True
            )[:self.max_size]
    
    def _dominates(self, a: OptimizationResult, b: OptimizationResult) -> bool:
        """Check if candidate a dominates candidate b"""
        a_scores = [a.performance_scores.get(metric, 0) for metric in OptimizationMetric]
        b_scores = [b.performance_scores.get(metric, 0) for metric in OptimizationMetric]
        
        return all(a_s >= b_s for a_s, b_s in zip(a_scores, b_scores)) and any(a_s > b_s for a_s, b_s in zip(a_scores, b_scores))


class GEPAOptimizer:
    """
    GEPA (Genetic-Pareto) Optimizer for Reflective Prompt Evolution
    
    This optimizer uses LLM-based reflection to evolve prompts and system
    components, achieving significant performance gains with minimal evaluations.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.pareto_frontier = ParetoFrontier()
        self.optimization_history = []
        self.reflection_engine = None
        self.evaluation_metrics = []
        self._setup_optimizer()
    
    def _setup_optimizer(self):
        """Initialize the optimizer components"""
        self.reflection_engine = dspy.OpenAI(
            model=self.config.get("model_name", "gpt-4o-mini"),
            max_tokens=self.config.get("max_tokens", 2000),
            temperature=self.config.get("temperature", 0.7)
        )
        
        # Setup evaluation metrics
        self.evaluation_metrics = [
            OptimizationMetric.ACCURACY,
            OptimizationMetric.EFFICIENCY,
            OptimizationMetric.RELEVANCE
        ]
    
    async def optimize(
        self,
        initial_prompt: str,
        evaluation_function: Callable[[str, List[Any]], Dict[OptimizationMetric, float]],
        training_data: List[Any],
        max_iterations: int = 10,
        population_size: int = 20
    ) -> OptimizationResult:
        """
        Optimize a prompt using GEPA reflective evolution
        
        Args:
            initial_prompt: Starting prompt to optimize
            evaluation_function: Function to evaluate prompt performance
            training_data: Data for evaluation
            max_iterations: Maximum optimization iterations
            population_size: Size of candidate population
            
        Returns:
            Best optimization result
        """
        logger.info("Starting GEPA optimization", 
                   max_iterations=max_iterations, 
                   population_size=population_size)
        
        # Initialize with base prompt
        current_prompt = initial_prompt
        best_result = None
        
        for iteration in range(max_iterations):
            logger.info(f"GEPA iteration {iteration + 1}/{max_iterations}")
            
            # Generate candidate variants
            candidates = await self._generate_candidates(
                current_prompt, population_size, iteration
            )
            
            # Evaluate candidates
            evaluation_results = []
            for candidate in candidates:
                try:
                    scores = await evaluation_function(candidate, training_data)
                    result = OptimizationResult(
                        iteration=iteration,
                        candidate_id=f"iter_{iteration}_{random.randint(1000, 9999)}",
                        performance_scores=scores,
                        prompt_variant=candidate,
                        execution_trace={},
                        reflection_insights=[],
                        improvement_direction=""
                    )
                    evaluation_results.append(result)
                except Exception as e:
                    logger.error("Candidate evaluation failed", error=str(e))
                    continue
            
            # Update Pareto frontier
            for result in evaluation_results:
                self.pareto_frontier.add_candidate(result)
            
            # Select best candidates for reflection
            best_candidates = self._select_best_candidates(evaluation_results, 3)
            
            # Perform reflective analysis
            reflection_insights = await self._reflect_on_performance(best_candidates)
            
            # Generate next iteration prompt
            current_prompt = await self._evolve_prompt(
                current_prompt, 
                best_candidates, 
                reflection_insights
            )
            
            # Track best result
            if evaluation_results:
                iteration_best = max(evaluation_results, 
                                  key=lambda x: sum(x.performance_scores.values()))
                if best_result is None or sum(iteration_best.performance_scores.values()) > sum(best_result.performance_scores.values()):
                    best_result = iteration_best
            
            self.optimization_history.append({
                "iteration": iteration,
                "best_score": sum(iteration_best.performance_scores.values()) if evaluation_results else 0,
                "candidates_evaluated": len(evaluation_results),
                "pareto_frontier_size": len(self.pareto_frontier.candidates)
            })
            
            logger.info(f"Iteration {iteration + 1} completed",
                       best_score=sum(iteration_best.performance_scores.values()) if evaluation_results else 0,
                       pareto_size=len(self.pareto_frontier.candidates))
        
        logger.info("GEPA optimization completed", 
                   final_score=sum(best_result.performance_scores.values()) if best_result else 0)
        
        return best_result
    
    async def _generate_candidates(
        self, 
        base_prompt: str, 
        count: int, 
        iteration: int
    ) -> List[str]:
        """Generate candidate prompt variants"""
        candidates = [base_prompt]  # Include base prompt
        
        # Generate mutations
        for i in range(count - 1):
            mutation_type = random.choice([
                "semantic_expansion",
                "instruction_refinement", 
                "example_addition",
                "constraint_addition",
                "style_modification"
            ])
            
            candidate = await self._mutate_prompt(base_prompt, mutation_type, iteration)
            candidates.append(candidate)
        
        return candidates
    
    async def _mutate_prompt(
        self, 
        prompt: str, 
        mutation_type: str, 
        iteration: int
    ) -> str:
        """Apply a specific mutation to the prompt"""
        
        mutation_instructions = {
            "semantic_expansion": f"""
            Expand the following prompt with additional semantic context and detail:
            
            Original: {prompt}
            
            Add relevant context, examples, and clarifications to make the prompt more comprehensive.
            """,
            
            "instruction_refinement": f"""
            Refine the following prompt to be more precise and actionable:
            
            Original: {prompt}
            
            Make the instructions clearer, more specific, and easier to follow.
            """,
            
            "example_addition": f"""
            Add relevant examples to the following prompt:
            
            Original: {prompt}
            
            Include 2-3 concrete examples that illustrate the expected behavior.
            """,
            
            "constraint_addition": f"""
            Add appropriate constraints and guidelines to the following prompt:
            
            Original: {prompt}
            
            Include safety, quality, and scope constraints to improve reliability.
            """,
            
            "style_modification": f"""
            Modify the style and tone of the following prompt:
            
            Original: {prompt}
            
            Adjust the tone to be more professional, concise, or detailed as appropriate.
            """
        }
        
        try:
            response = await self.reflection_engine.forward(
                instruction=mutation_instructions[mutation_type]
            )
            return response.completions[0].text.strip()
        except Exception as e:
            logger.error("Prompt mutation failed", mutation_type=mutation_type, error=str(e))
            return prompt  # Return original if mutation fails
    
    def _select_best_candidates(
        self, 
        results: List[OptimizationResult], 
        count: int
    ) -> List[OptimizationResult]:
        """Select the best candidates for reflection"""
        # Sort by combined performance score
        sorted_results = sorted(
            results, 
            key=lambda x: sum(x.performance_scores.values()), 
            reverse=True
        )
        return sorted_results[:count]
    
    async def _reflect_on_performance(
        self, 
        candidates: List[OptimizationResult]
    ) -> List[str]:
        """Use LLM reflection to analyze performance and generate insights"""
        
        if not candidates:
            return []
        
        # Prepare reflection context
        performance_summary = []
        for i, candidate in enumerate(candidates):
            scores_str = ", ".join([f"{metric.value}: {score:.3f}" 
                                   for metric, score in candidate.performance_scores.items()])
            performance_summary.append(f"Candidate {i+1}: {scores_str}")
        
        reflection_prompt = f"""
        Analyze the performance of these prompt candidates and provide insights for improvement:
        
        Performance Summary:
        {chr(10).join(performance_summary)}
        
        Please provide:
        1. What makes the best candidates successful?
        2. What patterns lead to poor performance?
        3. Specific suggestions for the next iteration
        4. Areas where the prompts could be strengthened
        
        Focus on actionable insights that can guide prompt evolution.
        """
        
        try:
            response = await self.reflection_engine.forward(instruction=reflection_prompt)
            insights = response.completions[0].text.strip()
            
            # Parse insights into list
            insight_list = [line.strip() for line in insights.split('\n') 
                          if line.strip() and not line.strip().startswith(('Performance Summary:', 'Please provide:'))]
            
            return insight_list[:5]  # Limit to top 5 insights
            
        except Exception as e:
            logger.error("Reflection analysis failed", error=str(e))
            return ["Continue with current approach"]
    
    async def _evolve_prompt(
        self, 
        current_prompt: str, 
        best_candidates: List[OptimizationResult], 
        insights: List[str]
    ) -> str:
        """Evolve the prompt based on best candidates and insights"""
        
        if not best_candidates:
            return current_prompt
        
        # Use the best performing candidate as base
        best_candidate = max(best_candidates, 
                           key=lambda x: sum(x.performance_scores.values()))
        
        evolution_prompt = f"""
        Evolve the following prompt based on performance insights:
        
        Current Best Prompt:
        {best_candidate.prompt_variant}
        
        Performance Insights:
        {chr(10).join(f"- {insight}" for insight in insights)}
        
        Create an improved version that incorporates the insights while maintaining
        the strengths of the current best prompt. Focus on addressing identified
        weaknesses and building on successful patterns.
        """
        
        try:
            response = await self.reflection_engine.forward(instruction=evolution_prompt)
            evolved_prompt = response.completions[0].text.strip()
            
            # Ensure the evolved prompt is not empty
            if evolved_prompt and len(evolved_prompt) > 50:
                return evolved_prompt
            else:
                return best_candidate.prompt_variant
                
        except Exception as e:
            logger.error("Prompt evolution failed", error=str(e))
            return best_candidate.prompt_variant
    
    def get_optimization_summary(self) -> Dict[str, Any]:
        """Get summary of optimization progress"""
        if not self.optimization_history:
            return {"status": "not_started"}
        
        latest = self.optimization_history[-1]
        best_candidate = max(
            self.pareto_frontier.candidates,
            key=lambda x: sum(x.performance_scores.values())
        ) if self.pareto_frontier.candidates else None
        
        return {
            "iterations_completed": len(self.optimization_history),
            "best_score": sum(best_candidate.performance_scores.values()) if best_candidate else 0,
            "pareto_frontier_size": len(self.pareto_frontier.candidates),
            "improvement_trend": self._calculate_improvement_trend(),
            "optimization_efficiency": self._calculate_efficiency()
        }
    
    def _calculate_improvement_trend(self) -> float:
        """Calculate the improvement trend over iterations"""
        if len(self.optimization_history) < 2:
            return 0.0
        
        scores = [h["best_score"] for h in self.optimization_history]
        if len(scores) < 2:
            return 0.0
        
        # Simple linear trend calculation
        x = list(range(len(scores)))
        y = scores
        
        n = len(x)
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(x[i] * y[i] for i in range(n))
        sum_x2 = sum(x[i] ** 2 for i in range(n))
        
        if n * sum_x2 - sum_x ** 2 == 0:
            return 0.0
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
        return slope
    
    def _calculate_efficiency(self) -> float:
        """Calculate optimization efficiency (improvement per evaluation)"""
        if not self.optimization_history:
            return 0.0
        
        total_evaluations = sum(h["candidates_evaluated"] for h in self.optimization_history)
        if total_evaluations == 0:
            return 0.0
        
        initial_score = self.optimization_history[0]["best_score"]
        final_score = self.optimization_history[-1]["best_score"]
        improvement = final_score - initial_score
        
        return improvement / total_evaluations if total_evaluations > 0 else 0.0


# Example usage and testing
async def main():
    """Example usage of the GEPA Optimizer"""
    config = {
        "model_name": "gpt-4o-mini",
        "max_tokens": 2000,
        "temperature": 0.7
    }
    
    optimizer = GEPAOptimizer(config)
    
    # Mock evaluation function
    async def mock_evaluation(prompt: str, data: List[Any]) -> Dict[OptimizationMetric, float]:
        # Simulate evaluation based on prompt characteristics
        accuracy = min(1.0, len(prompt) / 1000 + random.random() * 0.3)
        efficiency = min(1.0, 1.0 - len(prompt) / 2000 + random.random() * 0.2)
        relevance = min(1.0, random.random() * 0.8 + 0.2)
        
        return {
            OptimizationMetric.ACCURACY: accuracy,
            OptimizationMetric.EFFICIENCY: efficiency,
            OptimizationMetric.RELEVANCE: relevance
        }
    
    # Initial prompt
    initial_prompt = """
    You are an AI assistant that helps with enterprise context engineering.
    Provide accurate, relevant, and helpful responses based on the given context.
    """
    
    # Training data
    training_data = [
        {"query": "What is GEPA?", "expected": "GEPA is a genetic-pareto optimization framework"},
        {"query": "How does context engineering work?", "expected": "Context engineering involves..."}
    ]
    
    # Run optimization
    result = await optimizer.optimize(
        initial_prompt=initial_prompt,
        evaluation_function=mock_evaluation,
        training_data=training_data,
        max_iterations=5,
        population_size=10
    )
    
    print(f"Optimization completed!")
    print(f"Best performance scores: {result.performance_scores}")
    print(f"Optimized prompt: {result.prompt_variant[:200]}...")
    
    # Get optimization summary
    summary = optimizer.get_optimization_summary()
    print(f"Optimization summary: {summary}")


if __name__ == "__main__":
    asyncio.run(main())
