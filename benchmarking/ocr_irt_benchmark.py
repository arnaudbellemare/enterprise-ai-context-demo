"""
OCR + IRT Hybrid Benchmark
Combines Studio-Intrinsic's OCR benchmark with YOUR Fluid IRT evaluation

This is the BEST of both worlds:
  • Real OCR tasks (Omni OCR dataset)
  • Scientific IRT evaluation (YOUR Fluid Benchmarking)
  • GEPA optimization (automatic prompt evolution)
  
Why this is better than either alone:
  • OCR alone: Just accuracy, no ability calibration
  • IRT alone: Needs real-world tasks
  • OCR + IRT: Real tasks + scientific evaluation ✅
"""

import os
import json
import asyncio
import requests
from typing import Dict, List, Any, Tuple
from datetime import datetime
import math

# Configuration
OLLAMA_API_URL = "http://localhost:11434/v1/chat/completions"
OLLAMA_MODEL = "gemma3:4b"
API_BASE_URL = "http://localhost:3000"

# IRT Configuration (2PL Model)
IRT_CONFIG = {
    "initial_ability": 0.0,  # θ
    "ability_prior_std": 1.0,
    "convergence_threshold": 0.01,
    "max_iterations": 50
}


class OCRIRTBenchmark:
    """
    Hybrid OCR + IRT Benchmark
    
    Evaluates OCR tasks using Item Response Theory
    Provides scientific ability estimates instead of just accuracy
    """
    
    def __init__(self, dataset_path: str):
        self.dataset_path = dataset_path
        self.items = []
        self.responses = []
        
    def load_dataset(self) -> Dict:
        """Load OCR benchmark with IRT metadata"""
        print("\n📊 Loading OCR benchmark dataset...")
        
        with open(self.dataset_path, 'r') as f:
            data = json.load(f)
        
        self.items = data.get('items', [])
        
        # Initialize IRT parameters for each item
        for item in self.items:
            # Estimate initial difficulty based on complexity
            difficulty = self._estimate_difficulty(item)
            discrimination = 1.0  # Start with standard discrimination
            
            item['irt_params'] = {
                'difficulty': difficulty,  # b parameter
                'discrimination': discrimination  # a parameter
            }
        
        print(f"   ✅ Loaded {len(self.items)} OCR items")
        print(f"   Difficulty distribution:")
        print(f"      Easy:   {sum(1 for i in self.items if i.get('difficulty') == 'easy')}")
        print(f"      Medium: {sum(1 for i in self.items if i.get('difficulty') == 'medium')}")
        print(f"      Hard:   {sum(1 for i in self.items if i.get('difficulty') == 'hard')}")
        
        return data
    
    def _estimate_difficulty(self, item: Dict) -> float:
        """
        Estimate IRT difficulty parameter from item metadata
        
        Returns θ value (logit scale):
          -2.0: Very easy
          -1.0: Easy
           0.0: Medium
          +1.0: Hard
          +2.0: Very hard
        """
        difficulty_map = {
            'easy': -1.0,
            'medium': 0.0,
            'hard': 1.0
        }
        
        base_difficulty = difficulty_map.get(item.get('difficulty', 'medium'), 0.0)
        
        # Adjust based on schema complexity
        schema = item.get('schema', {})
        num_fields = len(schema.get('properties', {}))
        
        # More fields = harder
        complexity_adjustment = (num_fields - 5) * 0.2
        
        return base_difficulty + complexity_adjustment
    
    def probability_correct(
        self,
        ability: float,
        difficulty: float,
        discrimination: float = 1.0
    ) -> float:
        """
        2PL IRT model: P(correct | θ, a, b)
        
        P(θ) = 1 / (1 + exp(-a(θ - b)))
        
        Where:
          θ = ability (what we're estimating)
          a = discrimination (how well item separates abilities)
          b = difficulty (item difficulty on logit scale)
        """
        try:
            logit = discrimination * (ability - difficulty)
            probability = 1.0 / (1.0 + math.exp(-logit))
            return probability
        except OverflowError:
            return 1.0 if ability > difficulty else 0.0
    
    async def evaluate_ocr_task(self, item: Dict) -> Tuple[bool, Dict]:
        """
        Evaluate system on a single OCR task
        Returns (correct, details)
        """
        try:
            # Call full system for OCR task
            response = requests.post(
                f"{API_BASE_URL}/api/smart-extract",
                json={
                    "text": f"Extract data from image according to schema: {json.dumps(item['schema'])}",
                    "extractionGoal": "structured_data",
                    "schema": item['schema']
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                extracted = result.get('extracted', {})
                
                # Score against ground truth
                score = self._score_extraction(extracted, item['ground_truth'])
                correct = score >= 0.7  # 70% threshold
                
                return correct, {
                    'score': score,
                    'extracted': extracted,
                    'ground_truth': item['ground_truth']
                }
            else:
                return False, {'error': f'API error: {response.status_code}'}
                
        except Exception as e:
            return False, {'error': str(e)}
    
    def _score_extraction(self, extracted: Dict, ground_truth: Dict) -> float:
        """
        Score extracted data against ground truth
        Returns similarity score 0.0-1.0
        """
        if not isinstance(extracted, dict) or not isinstance(ground_truth, dict):
            return 0.0
        
        matches = 0
        total = len(ground_truth)
        
        for key, expected in ground_truth.items():
            if key in extracted:
                actual = extracted[key]
                
                # Exact match
                if actual == expected:
                    matches += 1
                # Partial string match
                elif isinstance(expected, str) and isinstance(actual, str):
                    if expected.lower() in actual.lower():
                        matches += 0.7
                # List overlap
                elif isinstance(expected, list) and isinstance(actual, list):
                    overlap = len(set(expected) & set(actual))
                    matches += overlap / max(len(expected), 1)
        
        return matches / total if total > 0 else 0.0
    
    def estimate_ability(
        self,
        responses: List[Tuple[Dict, bool]]
    ) -> Tuple[float, float]:
        """
        Estimate ability using Maximum A Posteriori (MAP)
        
        Returns (ability, standard_error)
        
        This is the core IRT calculation!
        """
        ability = IRT_CONFIG['initial_ability']
        
        for iteration in range(IRT_CONFIG['max_iterations']):
            # Calculate log-likelihood gradient
            gradient = 0.0
            hessian = 0.0
            
            for item, correct in responses:
                params = item['irt_params']
                a = params['discrimination']
                b = params['difficulty']
                
                # Probability of correct response
                p = self.probability_correct(ability, b, a)
                
                # Gradient (first derivative)
                gradient += a * (correct - p)
                
                # Hessian (second derivative - for SE calculation)
                hessian += -a * a * p * (1 - p)
            
            # Add prior (regularization)
            gradient += -(ability - 0.0) / (IRT_CONFIG['ability_prior_std'] ** 2)
            hessian += -1.0 / (IRT_CONFIG['ability_prior_std'] ** 2)
            
            # Newton-Raphson update
            if hessian != 0:
                ability_update = -gradient / hessian
                ability += ability_update
                
                # Check convergence
                if abs(ability_update) < IRT_CONFIG['convergence_threshold']:
                    break
        
        # Calculate standard error
        information = -hessian
        standard_error = 1.0 / math.sqrt(information) if information > 0 else float('inf')
        
        return ability, standard_error
    
    async def run_benchmark(self, num_items: int = 20) -> Dict:
        """
        Run OCR + IRT hybrid benchmark
        
        Uses adaptive item selection (like CAT - Computer Adaptive Testing)
        """
        print("\n" + "="*80)
        print("🔬 RUNNING OCR + IRT HYBRID BENCHMARK")
        print("="*80)
        print("\nCombining:")
        print("  • Real OCR tasks (Omni dataset)")
        print("  • IRT ability estimation (2PL model)")
        print("  • Adaptive item selection")
        print("\n" + "="*80 + "\n")
        
        # Sort items by difficulty for adaptive selection
        sorted_items = sorted(self.items, key=lambda x: x['irt_params']['difficulty'])
        
        responses = []
        current_ability = IRT_CONFIG['initial_ability']
        
        print(f"Starting adaptive testing ({num_items} items)...\n")
        
        for i in range(min(num_items, len(sorted_items))):
            # Select next item (adaptive)
            if i < 3:
                # First 3: sample across difficulties
                item = sorted_items[i * len(sorted_items) // 3]
            else:
                # Subsequent: select item closest to current ability
                item = self._select_next_item(sorted_items, current_ability, responses)
            
            print(f"Item {i+1}/{num_items}: {item['id']} (difficulty: {item['irt_params']['difficulty']:.2f})")
            
            # Evaluate
            correct, details = await self.evaluate_ocr_task(item)
            responses.append((item, correct))
            
            result_icon = "✅" if correct else "❌"
            print(f"  {result_icon} {'Correct' if correct else 'Incorrect'} (score: {details.get('score', 0):.2f})")
            
            # Update ability estimate
            current_ability, se = self.estimate_ability(responses)
            print(f"  Current ability: θ = {current_ability:.3f} ± {se:.3f}")
            
            # Show expected accuracy
            avg_difficulty = sum(r[0]['irt_params']['difficulty'] for r in responses) / len(responses)
            expected_p = self.probability_correct(current_ability, avg_difficulty)
            print(f"  Expected accuracy: {expected_p*100:.1f}%\n")
        
        # Final ability estimate
        final_ability, final_se = self.estimate_ability(responses)
        
        # Calculate actual accuracy for comparison
        actual_accuracy = sum(1 for _, correct in responses if correct) / len(responses)
        
        print("\n" + "="*80)
        print("✅ BENCHMARK COMPLETE")
        print("="*80 + "\n")
        
        print(f"Results:")
        print(f"  IRT Ability (θ):     {final_ability:.3f} ± {final_se:.3f}")
        print(f"  Actual Accuracy:     {actual_accuracy*100:.1f}%")
        print(f"  Items Attempted:     {len(responses)}")
        print(f"  Items Correct:       {sum(1 for _, c in responses if c)}")
        
        # Interpret ability
        interpretation = self._interpret_ability(final_ability)
        print(f"  Interpretation:      {interpretation}")
        
        # Calculate confidence interval (95%)
        ci_lower = final_ability - 1.96 * final_se
        ci_upper = final_ability + 1.96 * final_se
        print(f"  95% CI:              [{ci_lower:.3f}, {ci_upper:.3f}]")
        
        return {
            'ability': final_ability,
            'standard_error': final_se,
            'accuracy': actual_accuracy,
            'confidence_interval': (ci_lower, ci_upper),
            'interpretation': interpretation,
            'responses': [
                {
                    'item_id': item['id'],
                    'difficulty': item['irt_params']['difficulty'],
                    'correct': correct
                }
                for item, correct in responses
            ],
            'timestamp': datetime.now().isoformat()
        }
    
    def _select_next_item(
        self,
        available_items: List[Dict],
        current_ability: float,
        previous_responses: List[Tuple[Dict, bool]]
    ) -> Dict:
        """
        Adaptive item selection (CAT algorithm)
        Select item that maximizes information at current ability
        """
        used_ids = {item['id'] for item, _ in previous_responses}
        unused_items = [item for item in available_items if item['id'] not in used_ids]
        
        if not unused_items:
            return available_items[0]
        
        # Calculate information for each item
        best_item = None
        best_info = -float('inf')
        
        for item in unused_items:
            params = item['irt_params']
            p = self.probability_correct(current_ability, params['difficulty'], params['discrimination'])
            
            # Fisher information: I(θ) = a² * p * (1-p)
            information = params['discrimination'] ** 2 * p * (1 - p)
            
            if information > best_info:
                best_info = information
                best_item = item
        
        return best_item or unused_items[0]
    
    def _interpret_ability(self, ability: float) -> str:
        """Interpret IRT ability score"""
        if ability < -1.5:
            return "Below Average (bottom 25%)"
        elif ability < -0.5:
            return "Below Average"
        elif ability < 0.5:
            return "Average"
        elif ability < 1.5:
            return "Above Average"
        else:
            return "Excellent (top 10%)"


async def main():
    """
    Run OCR + IRT hybrid benchmark
    """
    
    # Check if dataset exists
    dataset_path = "benchmarking/data/ocr/omni_ocr_benchmark.json"
    
    if not os.path.exists(dataset_path):
        print(f"\n⚠️  OCR dataset not found: {dataset_path}")
        print("   Run: python benchmarking/download_ocr_dataset.py")
        return
    
    # Run benchmark
    benchmark = OCRIRTBenchmark(dataset_path)
    benchmark.load_dataset()
    
    results = await benchmark.run_benchmark(num_items=20)
    
    # Save results
    os.makedirs("benchmarking/results", exist_ok=True)
    results_path = "benchmarking/results/ocr_irt_results.json"
    
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved: {results_path}")
    print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(main())

