"""
GEPA Optimization for Full Integrated System
Similar to Studio-Intrinsic OCR benchmark but for multi-domain AI system

Based on: https://github.com/Studio-Intrinsic/benchmarking-ocr-gepa

This optimizes YOUR FULL SYSTEM:
  • Ax DSPy signatures
  • GEPA prompt evolution
  • ACE context engineering
  • ArcMemo learning patterns
  
GEPA automatically:
  1. Runs full system on benchmark dataset
  2. Analyzes failures (via Ollama reflection)
  3. Generates improved prompts/signatures
  4. Validates on held-out set
  5. Iterates until convergence
  
NO MANUAL PROMPT ENGINEERING!
"""

import os
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
import requests

# Configuration
OLLAMA_API_URL = "http://localhost:11434/v1/chat/completions"
OLLAMA_MODEL = "gemma3:4b"
API_BASE_URL = "http://localhost:3000"

# GEPA Configuration
GEPA_CONFIG = {
    "budget": 50,  # Maximum number of prompt candidates to try
    "minibatch_size": 10,  # Examples per evaluation
    "validation_split": 0.3,  # 30% held-out for validation
    "pareto_set_size": 5,  # Keep top 5 candidates
    "reflection_model": OLLAMA_MODEL,  # Use Ollama for reflection
    "convergence_threshold": 0.95  # Stop if 95% accuracy achieved
}


class FullSystemGEPAOptimizer:
    """
    GEPA optimizer for full integrated system
    Similar to OCR benchmark but for multi-domain AI tasks
    """
    
    def __init__(self, dataset_path: str, output_dir: str = "optimized_system"):
        self.dataset_path = dataset_path
        self.output_dir = output_dir
        self.candidate_pool = []
        self.optimization_history = []
        self.best_score = 0.0
        
        os.makedirs(output_dir, exist_ok=True)
        
    def load_dataset(self) -> Dict[str, List[Any]]:
        """Load benchmark dataset and split train/validation"""
        print("📊 Loading benchmark dataset...")
        
        with open(self.dataset_path, 'r') as f:
            full_dataset = json.load(f)
        
        # Split into train/validation
        split_idx = int(len(full_dataset) * (1 - GEPA_CONFIG['validation_split']))
        
        train_set = full_dataset[:split_idx]
        val_set = full_dataset[split_idx:]
        
        print(f"   Training examples: {len(train_set)}")
        print(f"   Validation examples: {len(val_set)}")
        
        return {
            'train': train_set,
            'validation': val_set,
            'full': full_dataset
        }
    
    async def evaluate_system(
        self,
        signature: str,
        examples: List[Dict],
        module_name: str = "data_synthesizer"
    ) -> Dict[str, Any]:
        """
        Evaluate full system (Ax+GEPA+ACE+ArcMemo) on examples
        Returns accuracy and failure analysis
        """
        print(f"\n🔄 Evaluating system with signature...")
        
        correct = 0
        total = len(examples)
        failures = []
        
        for i, example in enumerate(examples):
            try:
                # Call FULL INTEGRATED SYSTEM
                response = requests.post(
                    f"{API_BASE_URL}/api/ax-dspy",
                    json={
                        "moduleName": module_name,
                        "inputs": example['input'],
                        "provider": "ollama",
                        "optimize": False  # We handle optimization via GEPA
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    predicted = result.get('outputs', {})
                    expected = example['expected_output']
                    
                    # Score the output
                    score = self.score_output(predicted, expected)
                    
                    if score >= 0.7:  # 70% threshold
                        correct += 1
                    else:
                        failures.append({
                            'example_id': i,
                            'input': example['input'],
                            'predicted': predicted,
                            'expected': expected,
                            'score': score
                        })
                else:
                    failures.append({
                        'example_id': i,
                        'input': example['input'],
                        'error': f"API error: {response.status_code}"
                    })
                    
            except Exception as e:
                failures.append({
                    'example_id': i,
                    'input': example['input'],
                    'error': str(e)
                })
            
            if (i + 1) % 10 == 0:
                print(f"   Progress: {i+1}/{total} ({correct}/{i+1} correct)")
        
        accuracy = correct / total if total > 0 else 0
        
        print(f"\n📈 Evaluation Results:")
        print(f"   Accuracy: {accuracy*100:.1f}% ({correct}/{total})")
        print(f"   Failures: {len(failures)}")
        
        return {
            'accuracy': accuracy,
            'correct': correct,
            'total': total,
            'failures': failures
        }
    
    def score_output(self, predicted: Dict, expected: Dict) -> float:
        """
        Score predicted output against expected
        Similar to OCR benchmark's structural diff
        """
        if not isinstance(predicted, dict) or not isinstance(expected, dict):
            return 0.0
        
        # Count matching fields
        matches = 0
        total_fields = len(expected)
        
        for key, expected_value in expected.items():
            if key in predicted:
                pred_value = predicted[key]
                
                # Exact match
                if pred_value == expected_value:
                    matches += 1
                # Partial match for strings
                elif isinstance(expected_value, str) and isinstance(pred_value, str):
                    if expected_value.lower() in pred_value.lower():
                        matches += 0.7
                # List overlap
                elif isinstance(expected_value, list) and isinstance(pred_value, list):
                    overlap = len(set(expected_value) & set(pred_value))
                    matches += overlap / max(len(expected_value), 1)
        
        return matches / total_fields if total_fields > 0 else 0.0
    
    async def reflect_on_failures(self, failures: List[Dict]) -> str:
        """
        Use Ollama (like GPT-5 in OCR benchmark) to analyze failures
        Returns optimization suggestions
        """
        print("\n🤔 Reflecting on failures with Ollama...")
        
        # Sample failures for reflection
        sample_failures = failures[:5]  # Analyze top 5 failures
        
        reflection_prompt = f"""Analyze these {len(sample_failures)} failure cases and suggest how to improve the DSPy signature/prompt.

Failures:
{json.dumps(sample_failures, indent=2)}

Provide specific, actionable suggestions to improve:
1. The DSPy signature structure
2. Field descriptions
3. Output constraints
4. Reasoning approach

Focus on patterns in the failures, not individual cases."""

        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": "You are an expert at analyzing AI system failures and suggesting improvements."},
                    {"role": "user", "content": reflection_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 1000
            }
        )
        
        if response.status_code == 200:
            reflection = response.json()['choices'][0]['message']['content']
            print(f"   ✅ Reflection complete ({len(reflection)} chars)")
            return reflection
        else:
            print(f"   ❌ Reflection failed: {response.status_code}")
            return "Focus on clearer field descriptions and output structure."
    
    async def generate_improved_signature(
        self,
        current_signature: str,
        reflection: str
    ) -> str:
        """
        Generate improved DSPy signature based on reflection
        """
        print("\n🔄 Generating improved signature...")
        
        improvement_prompt = f"""Given this current DSPy signature:

{current_signature}

And this analysis of failures:
{reflection}

Generate an improved DSPy signature that addresses the identified issues.
Maintain the same input fields but improve output field descriptions and structure.
Return ONLY the improved signature in the same format."""

        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": "You are an expert at DSPy signature design."},
                    {"role": "user", "content": improvement_prompt}
                ],
                "temperature": 0.8,
                "max_tokens": 500
            }
        )
        
        if response.status_code == 200:
            improved = response.json()['choices'][0]['message']['content']
            # Extract just the signature part
            if '`' in improved:
                improved = improved.split('`')[1] if improved.count('`') > 1 else improved
            print(f"   ✅ Improved signature generated")
            return improved.strip()
        else:
            print(f"   ⚠️  Using current signature (generation failed)")
            return current_signature
    
    async def optimize(
        self,
        initial_signature: str,
        module_name: str = "data_synthesizer"
    ) -> Dict[str, Any]:
        """
        GEPA optimization loop - similar to OCR benchmark
        """
        print("\n" + "="*80)
        print("🚀 Starting GEPA Optimization (Like Studio-Intrinsic OCR Benchmark)")
        print("="*80 + "\n")
        
        # Load dataset
        dataset = self.load_dataset()
        train_examples = dataset['train'][:GEPA_CONFIG['minibatch_size']]  # Start with small batch
        val_examples = dataset['validation'][:10]  # Small validation set
        
        # Initialize candidate pool
        base_candidate = {
            'id': 'base_v0',
            'signature': initial_signature,
            'train_score': 0.0,
            'val_score': 0.0,
            'generation': 0
        }
        
        # Evaluate baseline
        print("\n📊 Step 1: Evaluate Baseline")
        baseline_eval = await self.evaluate_system(initial_signature, train_examples, module_name)
        base_candidate['train_score'] = baseline_eval['accuracy']
        
        baseline_val = await self.evaluate_system(initial_signature, val_examples, module_name)
        base_candidate['val_score'] = baseline_val['accuracy']
        
        self.candidate_pool.append(base_candidate)
        self.best_score = baseline_val['accuracy']
        
        print(f"\n   Baseline:")
        print(f"   Training:   {baseline_eval['accuracy']*100:.1f}%")
        print(f"   Validation: {baseline_val['accuracy']*100:.1f}%")
        
        # GEPA optimization loop
        current_signature = initial_signature
        current_failures = baseline_eval['failures']
        
        for generation in range(1, GEPA_CONFIG['budget'] + 1):
            print(f"\n{'='*80}")
            print(f"🔄 Generation {generation}/{GEPA_CONFIG['budget']}")
            print(f"{'='*80}")
            
            # Step 2: Reflect on failures (like GPT-5 in OCR benchmark)
            reflection = await self.reflect_on_failures(current_failures)
            
            # Step 3: Generate improved signature
            improved_signature = await self.generate_improved_signature(
                current_signature,
                reflection
            )
            
            # Step 4: Evaluate improved signature
            improved_eval = await self.evaluate_system(improved_signature, train_examples, module_name)
            improved_val = await self.evaluate_system(improved_signature, val_examples, module_name)
            
            # Step 5: Track candidate
            candidate = {
                'id': f'gen_{generation}',
                'signature': improved_signature,
                'train_score': improved_eval['accuracy'],
                'val_score': improved_val['accuracy'],
                'generation': generation,
                'reflection': reflection[:200]  # First 200 chars
            }
            
            self.candidate_pool.append(candidate)
            self.optimization_history.append({
                'generation': generation,
                'train_accuracy': improved_eval['accuracy'],
                'val_accuracy': improved_val['accuracy']
            })
            
            print(f"\n   Generation {generation} Results:")
            print(f"   Training:   {improved_eval['accuracy']*100:.1f}%")
            print(f"   Validation: {improved_val['accuracy']*100:.1f}%")
            
            # Update if improved
            if improved_val['accuracy'] > self.best_score:
                self.best_score = improved_val['accuracy']
                current_signature = improved_signature
                current_failures = improved_eval['failures']
                print(f"   ✅ NEW BEST! Validation: {self.best_score*100:.1f}%")
            else:
                print(f"   ⚠️  No improvement (best: {self.best_score*100:.1f}%)")
            
            # Early stopping if converged
            if self.best_score >= GEPA_CONFIG['convergence_threshold']:
                print(f"\n🎉 Converged at {self.best_score*100:.1f}%!")
                break
            
            # Save checkpoint
            self.save_checkpoint(generation)
        
        # Return best candidate
        best_candidate = max(self.candidate_pool, key=lambda c: c['val_score'])
        
        print("\n" + "="*80)
        print("✅ GEPA OPTIMIZATION COMPLETE")
        print("="*80 + "\n")
        print(f"Best Candidate: {best_candidate['id']}")
        print(f"Validation Accuracy: {best_candidate['val_score']*100:.1f}%")
        print(f"Improvement: {(best_candidate['val_score'] - base_candidate['val_score'])*100:.1f}%")
        
        # Save final results
        self.save_final_results(best_candidate)
        
        return best_candidate
    
    def save_checkpoint(self, generation: int):
        """Save optimization checkpoint"""
        checkpoint_path = os.path.join(self.output_dir, f"checkpoint_gen_{generation}.json")
        
        with open(checkpoint_path, 'w') as f:
            json.dump({
                'generation': generation,
                'candidate_pool': self.candidate_pool,
                'optimization_history': self.optimization_history,
                'best_score': self.best_score,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"   💾 Checkpoint saved: {checkpoint_path}")
    
    def save_final_results(self, best_candidate: Dict):
        """Save final optimized signature/prompts"""
        results_path = os.path.join(self.output_dir, "optimized_system_v1.json")
        
        results = {
            'optimized_signature': best_candidate['signature'],
            'validation_accuracy': best_candidate['val_score'],
            'training_accuracy': best_candidate['train_score'],
            'generation': best_candidate['generation'],
            'baseline_accuracy': self.candidate_pool[0]['val_score'],
            'improvement': best_candidate['val_score'] - self.candidate_pool[0]['val_score'],
            'optimization_history': self.optimization_history,
            'timestamp': datetime.now().isoformat(),
            'config': GEPA_CONFIG
        }
        
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n💾 Final results saved: {results_path}")
        
        # Also save just the signature for easy use
        sig_path = os.path.join(self.output_dir, "optimized_signature.txt")
        with open(sig_path, 'w') as f:
            f.write(best_candidate['signature'])
        
        print(f"💾 Optimized signature: {sig_path}")


async def main():
    """
    Main GEPA optimization workflow
    Similar to Studio-Intrinsic OCR benchmark
    """
    
    print("\n" + "="*80)
    print("🔬 GEPA OPTIMIZATION FOR FULL INTEGRATED SYSTEM")
    print("Similar to: https://github.com/Studio-Intrinsic/benchmarking-ocr-gepa")
    print("="*80 + "\n")
    
    # Initial DSPy signature (can be rough - GEPA will optimize!)
    initial_signature = """
dataSources:string[],
synthesisGoal:string ->
combinedInsights:string "Synthesized insights from all sources",
keyFindings:string[] "Most important findings",
contradictions:string[] "Any contradicting information found",
confidenceLevel:class "high, medium, low" "Confidence in synthesis"
"""
    
    print("📝 Initial Signature:")
    print(initial_signature)
    
    # Check if benchmark dataset exists
    dataset_path = "benchmarking/data/multi_domain_benchmark.json"
    
    if not os.path.exists(dataset_path):
        print(f"\n⚠️  Benchmark dataset not found: {dataset_path}")
        print("   Creating sample dataset...")
        
        # Create sample dataset
        os.makedirs("benchmarking/data", exist_ok=True)
        sample_dataset = create_sample_benchmark_dataset()
        
        with open(dataset_path, 'w') as f:
            json.dump(sample_dataset, f, indent=2)
        
        print(f"   ✅ Sample dataset created: {dataset_path}")
    
    # Initialize optimizer
    optimizer = FullSystemGEPAOptimizer(
        dataset_path=dataset_path,
        output_dir="optimized_system"
    )
    
    # Run GEPA optimization
    best_candidate = await optimizer.optimize(
        initial_signature=initial_signature,
        module_name="data_synthesizer"
    )
    
    print("\n🎉 Optimization complete!")
    print(f"\n   Best validation accuracy: {best_candidate['val_score']*100:.1f}%")
    print(f"   Improvement over baseline: {(best_candidate['val_score'] - optimizer.candidate_pool[0]['val_score'])*100:.1f}%")
    print(f"\n   Use optimized signature from: optimized_system/optimized_signature.txt")


def create_sample_benchmark_dataset() -> List[Dict]:
    """
    Create sample benchmark dataset for multi-domain tasks
    Similar to OCR benchmark's structure
    """
    return [
        # Financial analysis examples
        {
            'domain': 'financial',
            'input': {
                'dataSources': [
                    'Apple Q4 2024: Revenue $89.5B (+6% YoY)',
                    'Microsoft Q4 2024: Revenue $62.0B (+16% YoY)',
                    'Tech sector analysis: Strong growth in cloud services'
                ],
                'synthesisGoal': 'Compare tech giants performance'
            },
            'expected_output': {
                'combinedInsights': 'Tech sector showing strong growth led by cloud services',
                'keyFindings': [
                    'Microsoft outpacing Apple in growth rate',
                    'Cloud services driving revenue',
                    'Both companies showing positive trajectory'
                ],
                'contradictions': [],
                'confidenceLevel': 'high'
            }
        },
        # Real estate examples
        {
            'domain': 'real_estate',
            'input': {
                'dataSources': [
                    'Miami median home price: $550,000 (+8.2% YoY)',
                    'Miami rental yield: 6.5% average',
                    'Market forecast: Continued growth expected'
                ],
                'synthesisGoal': 'Evaluate Miami real estate investment'
            },
            'expected_output': {
                'combinedInsights': 'Miami real estate shows strong fundamentals for investment',
                'keyFindings': [
                    'Price appreciation of 8.2% YoY',
                    'Healthy rental yields at 6.5%',
                    'Positive market outlook'
                ],
                'contradictions': [],
                'confidenceLevel': 'high'
            }
        },
        # Legal analysis examples
        {
            'domain': 'legal',
            'input': {
                'dataSources': [
                    'GDPR requires explicit consent',
                    'CCPA allows opt-out mechanism',
                    'Company currently uses implied consent'
                ],
                'synthesisGoal': 'Assess compliance status'
            },
            'expected_output': {
                'combinedInsights': 'Company not compliant with GDPR, partially compliant with CCPA',
                'keyFindings': [
                    'GDPR requires explicit consent (currently implied)',
                    'CCPA opt-out may be sufficient',
                    'Action needed for GDPR compliance'
                ],
                'contradictions': [
                    'GDPR stricter than CCPA on consent'
                ],
                'confidenceLevel': 'high'
            }
        },
        # Add more examples...
    ] * 10  # Repeat to get 30 examples for train/val split


if __name__ == "__main__":
    asyncio.run(main())

