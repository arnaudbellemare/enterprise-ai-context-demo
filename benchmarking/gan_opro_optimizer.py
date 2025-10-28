#!/usr/bin/env python3
"""
GAN-OPRO: Adversarial Optimization by Prompting Framework

Integration of GAN principles with OPRO (Optimization by PROmpting) to enhance
DSPy optimization capabilities in PERMUTATION AI system.

Based on:
- OPRO: Optimization by PROmpting (Google DeepMind, 2023)
- GANPrompt: Adversarial prompt generation (2024)
- Adversarial In-Context Learning (adv-ICL, 2024)
- GAN Game for Prompt Engineering (2025)
"""

import asyncio
import json
import logging
import random
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any, Callable
import numpy as np
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OptimizationStrategy(Enum):
    """Optimization strategies for GAN-OPRO"""
    EXPLORATION = "exploration"
    EXPLOITATION = "exploitation"
    ADVERSARIAL = "adversarial"
    DIVERSITY = "diversity"

@dataclass
class PromptCandidate:
    """Represents a prompt candidate in the optimization process"""
    id: str
    prompt: str
    score: float
    generation: int
    parent_ids: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    diversity_score: float = 0.0
    robustness_score: float = 0.0
    adversarial_score: float = 0.0

@dataclass
class OptimizationTrajectory:
    """Represents the optimization trajectory for OPRO"""
    candidates: List[PromptCandidate]
    best_candidate: Optional[PromptCandidate]
    iteration: int
    convergence_threshold: float = 0.01
    max_iterations: int = 100

class GANOPROGenerator:
    """Generator component of GAN-OPRO framework"""
    
    def __init__(self, llm_client, config: Dict[str, Any] = None):
        self.llm_client = llm_client
        self.config = config or {}
        self.temperature = self.config.get('temperature', 0.7)
        self.max_candidates = self.config.get('max_candidates', 8)
        self.diversity_weight = self.config.get('diversity_weight', 0.3)
        
    async def generate_candidates(
        self, 
        trajectory: OptimizationTrajectory,
        strategy: OptimizationStrategy = OptimizationStrategy.EXPLORATION
    ) -> List[PromptCandidate]:
        """Generate new prompt candidates based on optimization strategy"""
        
        # Build meta-prompt for OPRO
        meta_prompt = self._build_meta_prompt(trajectory, strategy)
        
        # Generate candidates using LLM
        candidates = []
        for i in range(self.max_candidates):
            try:
                # Vary temperature for diversity
                temp = self.temperature + (i * 0.1) % 0.3
                
                response = await self.llm_client.generate(
                    prompt=meta_prompt,
                    temperature=temp,
                    max_tokens=200
                )
                
                # Extract prompt from response
                prompt = self._extract_prompt(response)
                
                candidate = PromptCandidate(
                    id=f"gen_{trajectory.iteration}_{i}",
                    prompt=prompt,
                    score=0.0,  # Will be evaluated later
                    generation=trajectory.iteration,
                    metadata={
                        "strategy": strategy.value,
                        "temperature": temp,
                        "generated_at": time.time()
                    }
                )
                
                candidates.append(candidate)
                
            except Exception as e:
                logger.error(f"Error generating candidate {i}: {e}")
                continue
        
        return candidates
    
    def _build_meta_prompt(
        self, 
        trajectory: OptimizationTrajectory, 
        strategy: OptimizationStrategy
    ) -> str:
        """Build meta-prompt for OPRO optimization"""
        
        # Get top performers for trajectory
        top_candidates = sorted(
            trajectory.candidates, 
            key=lambda x: x.score, 
            reverse=True
        )[:5]
        
        # Build trajectory description
        trajectory_desc = "\n".join([
            f"Score: {c.score:.3f} | Prompt: {c.prompt[:100]}..."
            for c in top_candidates
        ])
        
        # Strategy-specific instructions
        strategy_instructions = {
            OptimizationStrategy.EXPLORATION: "Generate diverse, novel prompts that explore new approaches",
            OptimizationStrategy.EXPLOITATION: "Generate prompts that build on the highest-scoring examples",
            OptimizationStrategy.ADVERSARIAL: "Generate prompts that challenge current assumptions and test robustness",
            OptimizationStrategy.DIVERSITY: "Generate prompts with varied structures while maintaining effectiveness"
        }
        
        meta_prompt = f"""
You are an expert prompt optimizer. Your task is to generate effective prompts for AI systems.

OPTIMIZATION TRAJECTORY (Top Performers):
{trajectory_desc}

STRATEGY: {strategy_instructions[strategy]}

TASK DESCRIPTION: Generate prompts that maximize performance on reasoning tasks while maintaining clarity and robustness.

INSTRUCTIONS:
1. Analyze the top-performing prompts above
2. Identify patterns that lead to success
3. Generate {self.max_candidates} new prompt variations
4. Each prompt should be concise but effective
5. Vary structure and approach while maintaining quality

FORMAT: Return each prompt on a new line, prefixed with "PROMPT:"

EXAMPLES:
PROMPT: Let's think step by step to solve this problem.
PROMPT: Break down the problem into smaller parts and solve each part systematically.
PROMPT: Consider multiple approaches and choose the most logical one.
"""
        
        return meta_prompt
    
    def _extract_prompt(self, response: str) -> str:
        """Extract prompt from LLM response"""
        lines = response.strip().split('\n')
        for line in lines:
            if line.startswith('PROMPT:'):
                return line.replace('PROMPT:', '').strip()
        
        # Fallback: return first line if no PROMPT: prefix found
        return lines[0].strip() if lines else "Let's solve this step by step."

class GANOPRODiscriminator:
    """Discriminator component of GAN-OPRO framework"""
    
    def __init__(self, llm_client, config: Dict[str, Any] = None):
        self.llm_client = llm_client
        self.config = config or {}
        self.realism_weight = self.config.get('realism_weight', 0.4)
        self.diversity_weight = self.config.get('diversity_weight', 0.3)
        self.robustness_weight = self.config.get('robustness_weight', 0.3)
        
    async def evaluate_candidates(
        self, 
        candidates: List[PromptCandidate],
        reference_candidates: List[PromptCandidate]
    ) -> List[PromptCandidate]:
        """Evaluate candidates using adversarial discrimination"""
        
        evaluated_candidates = []
        
        for candidate in candidates:
            # Evaluate realism (alignment with human-like instructions)
            realism_score = await self._evaluate_realism(candidate)
            
            # Evaluate diversity (uniqueness compared to reference set)
            diversity_score = self._evaluate_diversity(candidate, reference_candidates)
            
            # Evaluate robustness (resistance to variations)
            robustness_score = await self._evaluate_robustness(candidate)
            
            # Calculate adversarial score
            adversarial_score = (
                realism_score * self.realism_weight +
                diversity_score * self.diversity_weight +
                robustness_score * self.robustness_weight
            )
            
            # Update candidate with scores
            candidate.realism_score = realism_score
            candidate.diversity_score = diversity_score
            candidate.robustness_score = robustness_score
            candidate.adversarial_score = adversarial_score
            
            evaluated_candidates.append(candidate)
        
        return evaluated_candidates
    
    async def _evaluate_realism(self, candidate: PromptCandidate) -> float:
        """Evaluate how realistic/human-like the prompt is"""
        
        evaluation_prompt = f"""
Evaluate this prompt for realism and human-like quality on a scale of 0-1:

PROMPT: {candidate.prompt}

Consider:
- Natural language flow
- Appropriate complexity
- Human-like instruction style
- Clarity and coherence

Respond with only a number between 0 and 1.
"""
        
        try:
            response = await self.llm_client.generate(
                prompt=evaluation_prompt,
                temperature=0.1,
                max_tokens=10
            )
            
            # Extract score from response
            score = float(response.strip())
            return max(0.0, min(1.0, score))
            
        except Exception as e:
            logger.error(f"Error evaluating realism: {e}")
            return 0.5  # Default score
    
    def _evaluate_diversity(self, candidate: PromptCandidate, reference_candidates: List[PromptCandidate]) -> float:
        """Evaluate diversity compared to reference candidates"""
        
        if not reference_candidates:
            return 1.0  # Maximum diversity if no references
        
        # Simple diversity based on word overlap
        candidate_words = set(candidate.prompt.lower().split())
        
        similarities = []
        for ref in reference_candidates:
            ref_words = set(ref.prompt.lower().split())
            if len(candidate_words) > 0 and len(ref_words) > 0:
                similarity = len(candidate_words.intersection(ref_words)) / len(candidate_words.union(ref_words))
                similarities.append(similarity)
        
        if similarities:
            avg_similarity = np.mean(similarities)
            diversity_score = 1.0 - avg_similarity
        else:
            diversity_score = 1.0
        
        return max(0.0, min(1.0, diversity_score))
    
    async def _evaluate_robustness(self, candidate: PromptCandidate) -> float:
        """Evaluate robustness to variations"""
        
        # Generate variations of the prompt
        variations = self._generate_variations(candidate.prompt)
        
        robustness_scores = []
        for variation in variations:
            # Evaluate if variation maintains effectiveness
            robustness_prompt = f"""
Compare these two prompts for effectiveness:

ORIGINAL: {candidate.prompt}
VARIATION: {variation}

Rate the variation's effectiveness relative to the original (0-1):
- 1.0 = Equally effective
- 0.5 = Somewhat effective
- 0.0 = Not effective

Respond with only a number between 0 and 1.
"""
            
            try:
                response = await self.llm_client.generate(
                    prompt=robustness_prompt,
                    temperature=0.1,
                    max_tokens=10
                )
                
                score = float(response.strip())
                robustness_scores.append(max(0.0, min(1.0, score)))
                
            except Exception as e:
                logger.error(f"Error evaluating robustness variation: {e}")
                robustness_scores.append(0.5)
        
        return np.mean(robustness_scores) if robustness_scores else 0.5
    
    def _generate_variations(self, prompt: str) -> List[str]:
        """Generate variations of a prompt for robustness testing"""
        
        variations = []
        
        # Add/remove words
        words = prompt.split()
        if len(words) > 2:
            variations.append(' '.join(words[:-1]))  # Remove last word
            variations.append(' '.join(words[1:]))    # Remove first word
        
        # Change punctuation
        if prompt.endswith('.'):
            variations.append(prompt[:-1] + '!')
        elif prompt.endswith('!'):
            variations.append(prompt[:-1] + '.')
        
        # Add filler words
        variations.append(f"Please {prompt.lower()}")
        variations.append(f"Kindly {prompt.lower()}")
        
        return variations[:3]  # Limit to 3 variations

class GANOPROOptimizer:
    """Main GAN-OPRO optimizer combining generator and discriminator"""
    
    def __init__(self, generator: GANOPROGenerator, discriminator: GANOPRODiscriminator, config: Dict[str, Any] = None):
        self.generator = generator
        self.discriminator = discriminator
        self.config = config or {}
        self.max_iterations = self.config.get('max_iterations', 50)
        self.convergence_threshold = self.config.get('convergence_threshold', 0.01)
        self.gan_training_interval = self.config.get('gan_training_interval', 5)
        
    async def optimize(
        self,
        initial_prompt: str,
        evaluation_function: Callable[[str], float],
        training_data: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Run GAN-OPRO optimization"""
        
        logger.info(f"Starting GAN-OPRO optimization with initial prompt: {initial_prompt[:50]}...")
        
        # Initialize trajectory
        initial_candidate = PromptCandidate(
            id="initial",
            prompt=initial_prompt,
            score=await evaluation_function(initial_prompt),
            generation=0
        )
        
        trajectory = OptimizationTrajectory(
            candidates=[initial_candidate],
            best_candidate=initial_candidate,
            iteration=0
        )
        
        optimization_history = []
        best_score = initial_candidate.score
        
        for iteration in range(self.max_iterations):
            logger.info(f"GAN-OPRO Iteration {iteration + 1}/{self.max_iterations}")
            
            # Choose optimization strategy
            strategy = self._choose_strategy(iteration, trajectory)
            
            # Generate candidates using generator
            new_candidates = await self.generator.generate_candidates(trajectory, strategy)
            
            # Evaluate candidates using discriminator
            evaluated_candidates = await self.discriminator.evaluate_candidates(
                new_candidates, 
                trajectory.candidates
            )
            
            # Score candidates using evaluation function
            for candidate in evaluated_candidates:
                candidate.score = await evaluation_function(candidate.prompt)
            
            # Update trajectory
            trajectory.candidates.extend(evaluated_candidates)
            trajectory.iteration = iteration + 1
            
            # Find best candidate
            best_candidate = max(trajectory.candidates, key=lambda x: x.score)
            trajectory.best_candidate = best_candidate
            
            # Record optimization step
            optimization_history.append({
                "iteration": iteration + 1,
                "best_score": best_candidate.score,
                "best_prompt": best_candidate.prompt,
                "strategy": strategy.value,
                "candidates_generated": len(new_candidates),
                "adversarial_scores": [c.adversarial_score for c in evaluated_candidates],
                "timestamp": time.time()
            })
            
            # Check for convergence
            if abs(best_candidate.score - best_score) < self.convergence_threshold:
                logger.info(f"Converged at iteration {iteration + 1}")
                break
            
            best_score = best_candidate.score
            
            # GAN training every N iterations
            if (iteration + 1) % self.gan_training_interval == 0:
                await self._gan_training_step(trajectory)
        
        return {
            "optimized_prompt": trajectory.best_candidate.prompt,
            "final_score": trajectory.best_candidate.score,
            "iterations": trajectory.iteration,
            "optimization_history": optimization_history,
            "total_candidates": len(trajectory.candidates),
            "convergence_reached": trajectory.iteration < self.max_iterations
        }
    
    def _choose_strategy(self, iteration: int, trajectory: OptimizationTrajectory) -> OptimizationStrategy:
        """Choose optimization strategy based on iteration and trajectory"""
        
        # Early iterations: exploration
        if iteration < 10:
            return OptimizationStrategy.EXPLORATION
        
        # Middle iterations: adversarial
        elif iteration < 30:
            return OptimizationStrategy.ADVERSARIAL
        
        # Late iterations: exploitation
        else:
            return OptimizationStrategy.EXPLOITATION
    
    async def _gan_training_step(self, trajectory: OptimizationTrajectory):
        """Perform GAN training step to improve generator and discriminator"""
        
        logger.info("Performing GAN training step...")
        
        # Get recent candidates for training
        recent_candidates = trajectory.candidates[-20:]  # Last 20 candidates
        
        # Separate high and low performers
        high_performers = [c for c in recent_candidates if c.score > np.percentile([c.score for c in recent_candidates], 75)]
        low_performers = [c for c in recent_candidates if c.score < np.percentile([c.score for c in recent_candidates], 25)]
        
        # Update generator based on high performers
        if high_performers:
            # Generator learns from successful patterns
            await self._update_generator(high_performers)
        
        # Update discriminator based on performance differences
        if high_performers and low_performers:
            await self._update_discriminator(high_performers, low_performers)
    
    async def _update_generator(self, high_performers: List[PromptCandidate]):
        """Update generator based on high-performing candidates"""
        # In a real implementation, this would involve fine-tuning the generator LLM
        # For now, we'll update the generator's configuration
        logger.info(f"Updating generator based on {len(high_performers)} high performers")
        
        # Analyze patterns in high performers
        common_patterns = self._analyze_patterns(high_performers)
        
        # Update generator configuration
        self.generator.config.update({
            "learned_patterns": common_patterns,
            "last_update": time.time()
        })
    
    async def _update_discriminator(self, high_performers: List[PromptCandidate], low_performers: List[PromptCandidate]):
        """Update discriminator based on performance differences"""
        logger.info(f"Updating discriminator based on {len(high_performers)} high and {len(low_performers)} low performers")
        
        # Analyze differences between high and low performers
        performance_differences = self._analyze_performance_differences(high_performers, low_performers)
        
        # Update discriminator configuration
        self.discriminator.config.update({
            "performance_patterns": performance_differences,
            "last_update": time.time()
        })
    
    def _analyze_patterns(self, candidates: List[PromptCandidate]) -> Dict[str, Any]:
        """Analyze patterns in high-performing candidates"""
        
        patterns = {
            "common_words": {},
            "common_phrases": {},
            "length_distribution": [],
            "structure_patterns": []
        }
        
        for candidate in candidates:
            words = candidate.prompt.lower().split()
            patterns["length_distribution"].append(len(words))
            
            for word in words:
                patterns["common_words"][word] = patterns["common_words"].get(word, 0) + 1
        
        return patterns
    
    def _analyze_performance_differences(self, high_performers: List[PromptCandidate], low_performers: List[PromptCandidate]) -> Dict[str, Any]:
        """Analyze differences between high and low performers"""
        
        differences = {
            "score_gap": np.mean([c.score for c in high_performers]) - np.mean([c.score for c in low_performers]),
            "diversity_gap": np.mean([c.diversity_score for c in high_performers]) - np.mean([c.diversity_score for c in low_performers]),
            "robustness_gap": np.mean([c.robustness_score for c in high_performers]) - np.mean([c.robustness_score for c in low_performers])
        }
        
        return differences

# Example usage and testing
async def main():
    """Example usage of GAN-OPRO framework"""
    
    # Mock LLM client for demonstration
    class MockLLMClient:
        async def generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 200) -> str:
            # Simulate different responses based on prompt content
            if "diverse" in prompt.lower():
                return "PROMPT: Let's explore multiple approaches to solve this problem.\nPROMPT: Consider alternative methods and compare their effectiveness.\nPROMPT: Think creatively about different ways to approach this."
            elif "build on" in prompt.lower():
                return "PROMPT: Let's think step by step to solve this problem.\nPROMPT: Break down the problem systematically.\nPROMPT: Use logical reasoning to find the solution."
            else:
                return "PROMPT: Let's solve this step by step.\nPROMPT: Think through this carefully.\nPROMPT: Use systematic reasoning."
    
    # Mock evaluation function
    async def mock_evaluation_function(prompt: str) -> float:
        # Simulate evaluation based on prompt characteristics
        base_score = 0.5
        
        if "step by step" in prompt.lower():
            base_score += 0.2
        if "systematic" in prompt.lower():
            base_score += 0.15
        if "logical" in prompt.lower():
            base_score += 0.1
        if "think" in prompt.lower():
            base_score += 0.05
        
        # Add some randomness
        base_score += random.uniform(-0.1, 0.1)
        
        return max(0.0, min(1.0, base_score))
    
    # Initialize GAN-OPRO components
    llm_client = MockLLMClient()
    
    generator = GANOPROGenerator(llm_client, {
        'temperature': 0.7,
        'max_candidates': 5,
        'diversity_weight': 0.3
    })
    
    discriminator = GANOPRODiscriminator(llm_client, {
        'realism_weight': 0.4,
        'diversity_weight': 0.3,
        'robustness_weight': 0.3
    })
    
    optimizer = GANOPROOptimizer(generator, discriminator, {
        'max_iterations': 10,
        'convergence_threshold': 0.01,
        'gan_training_interval': 3
    })
    
    # Run optimization
    initial_prompt = "Solve this problem"
    result = await optimizer.optimize(initial_prompt, mock_evaluation_function)
    
    # Display results
    print("GAN-OPRO Optimization Results:")
    print(f"Initial Prompt: {initial_prompt}")
    print(f"Optimized Prompt: {result['optimized_prompt']}")
    print(f"Score Improvement: {result['final_score'] - 0.5:.3f}")
    print(f"Iterations: {result['iterations']}")
    print(f"Total Candidates: {result['total_candidates']}")
    
    # Save results
    with open("gan_opro_results.json", "w") as f:
        json.dump(result, f, indent=2)
    
    print("Results saved to gan_opro_results.json")

if __name__ == "__main__":
    asyncio.run(main())
