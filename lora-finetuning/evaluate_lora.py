"""
Evaluate LoRA Adapters with Fluid IRT Benchmarking
Measures adapter performance and compares with baseline
"""

import os
import sys
import json
import yaml
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

try:
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel
    import torch
except ImportError:
    print("❌ Missing dependencies. Install with:")
    print("   pip install -r requirements.txt")
    sys.exit(1)


class LoRAEvaluator:
    """Evaluate LoRA adapters with IRT-based benchmarking"""
    
    def __init__(self, config_path: str = "lora_config.yaml"):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
    def load_adapter(self, adapter_path: str, base_model: Optional[str] = None):
        """Load LoRA adapter on top of base model"""
        
        base_model = base_model or self.config['base_model']['name']
        
        print(f"📦 Loading base model: {base_model}")
        base_model_obj = AutoModelForCausalLM.from_pretrained(
            base_model,
            torch_dtype=torch.bfloat16,
            device_map="auto"
        )
        
        print(f"🔧 Loading LoRA adapter: {adapter_path}")
        model = PeftModel.from_pretrained(base_model_obj, adapter_path)
        model = model.merge_and_unload()  # Merge for faster inference
        
        tokenizer = AutoTokenizer.from_pretrained(adapter_path)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        print(f"✅ Model loaded successfully")
        
        return model, tokenizer
    
    def evaluate_on_dataset(
        self,
        model,
        tokenizer,
        test_data_path: str,
        max_samples: int = 100
    ) -> Dict:
        """Evaluate model on test dataset"""
        
        print(f"\n📊 Evaluating on: {test_data_path}")
        
        # Load test data
        with open(test_data_path, 'r') as f:
            test_data = json.load(f)
        
        # Limit samples
        test_data = test_data[:max_samples]
        print(f"   Test samples: {len(test_data)}")
        
        # Evaluate
        correct = 0
        total = len(test_data)
        results = []
        
        model.eval()
        with torch.no_grad():
            for i, example in enumerate(test_data):
                # Format prompt
                prompt = f"### Instruction:\n{example['instruction']}\n\n"
                if example.get('input'):
                    prompt += f"### Input:\n{example['input']}\n\n"
                prompt += "### Response:\n"
                
                # Generate
                inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=512,
                    temperature=0.7,
                    do_sample=True,
                    top_p=0.9
                )
                
                generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
                response = generated.split("### Response:\n")[-1].strip()
                
                # Simple evaluation (check if key terms from expected output appear)
                expected = example['output'].lower()
                is_correct = self._evaluate_response(response.lower(), expected)
                
                if is_correct:
                    correct += 1
                
                results.append({
                    'id': example.get('id', i),
                    'instruction': example['instruction'],
                    'generated': response,
                    'expected': example['output'],
                    'correct': is_correct
                })
                
                if (i + 1) % 10 == 0:
                    print(f"   Progress: {i+1}/{total} ({correct}/{i+1} correct)")
        
        accuracy = correct / total if total > 0 else 0
        
        print(f"\n✅ Evaluation complete:")
        print(f"   Accuracy: {accuracy*100:.1f}% ({correct}/{total})")
        
        return {
            'accuracy': accuracy,
            'correct': correct,
            'total': total,
            'results': results
        }
    
    def _evaluate_response(self, generated: str, expected: str) -> bool:
        """Simple evaluation - check if key terms match"""
        
        # Extract key terms from expected (words longer than 4 chars)
        expected_terms = set([
            word for word in expected.split() 
            if len(word) > 4 and word.isalnum()
        ])
        
        # Count matches
        matches = sum(1 for term in expected_terms if term in generated)
        
        # Consider correct if >50% of key terms present
        return matches / len(expected_terms) > 0.5 if expected_terms else False
    
    def compare_with_baseline(
        self,
        adapter_path: str,
        domain: str,
        test_data_path: str,
        base_model: Optional[str] = None
    ):
        """Compare LoRA adapter with baseline model"""
        
        print(f"\n{'='*60}")
        print(f"🔬 Benchmarking LoRA Adapter vs Baseline")
        print(f"   Domain: {domain}")
        print(f"   Adapter: {adapter_path}")
        print(f"{'='*60}\n")
        
        # Evaluate baseline (base model without adapter)
        print("1️⃣ Evaluating baseline model...")
        base_model_name = base_model or self.config['base_model']['name']
        baseline_model, baseline_tokenizer = self._load_base_model(base_model_name)
        baseline_results = self.evaluate_on_dataset(
            baseline_model,
            baseline_tokenizer,
            test_data_path
        )
        
        # Clear memory
        del baseline_model
        torch.cuda.empty_cache()
        
        # Evaluate LoRA adapter
        print("\n2️⃣ Evaluating LoRA adapter...")
        lora_model, lora_tokenizer = self.load_adapter(adapter_path, base_model_name)
        lora_results = self.evaluate_on_dataset(
            lora_model,
            lora_tokenizer,
            test_data_path
        )
        
        # Calculate improvement
        improvement = lora_results['accuracy'] - baseline_results['accuracy']
        improvement_pct = (improvement / baseline_results['accuracy'] * 100) if baseline_results['accuracy'] > 0 else 0
        
        # Summary
        print(f"\n{'='*60}")
        print(f"📊 COMPARISON RESULTS")
        print(f"{'='*60}")
        print(f"\nBaseline Accuracy:    {baseline_results['accuracy']*100:.1f}%")
        print(f"LoRA Accuracy:        {lora_results['accuracy']*100:.1f}%")
        print(f"Improvement:          +{improvement*100:.1f}% ({improvement_pct:+.1f}%)")
        print(f"\n{'='*60}\n")
        
        # Save results
        results = {
            'domain': domain,
            'adapter_path': adapter_path,
            'evaluation_date': datetime.now().isoformat(),
            'baseline': {
                'accuracy': baseline_results['accuracy'],
                'correct': baseline_results['correct'],
                'total': baseline_results['total']
            },
            'lora': {
                'accuracy': lora_results['accuracy'],
                'correct': lora_results['correct'],
                'total': lora_results['total']
            },
            'improvement': {
                'absolute': improvement,
                'relative_percent': improvement_pct
            }
        }
        
        # Save to file
        results_dir = Path("results")
        results_dir.mkdir(exist_ok=True)
        results_path = results_dir / f"{domain}_eval_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"📝 Results saved: {results_path}")
        
        return results
    
    def _load_base_model(self, model_name: str):
        """Load base model without adapter"""
        
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.bfloat16,
            device_map="auto"
        )
        
        return model, tokenizer


def main():
    parser = argparse.ArgumentParser(description='Evaluate LoRA adapter')
    parser.add_argument('--domain', type=str, required=True, help='Domain name')
    parser.add_argument('--adapter-path', type=str, required=True, help='Path to LoRA adapter')
    parser.add_argument('--test-data', type=str, help='Path to test data')
    parser.add_argument('--base-model', type=str, help='Base model name')
    parser.add_argument('--max-samples', type=int, default=100, help='Max test samples')
    
    args = parser.parse_args()
    
    # Determine test data path
    test_data_path = args.test_data or f"data/{args.domain}/validation.json"
    
    if not os.path.exists(test_data_path):
        print(f"❌ Test data not found: {test_data_path}")
        print(f"\nPrepare data first:")
        print(f"  python prepare_training_data.py --domains {args.domain}")
        sys.exit(1)
    
    # Initialize evaluator
    evaluator = LoRAEvaluator()
    
    # Run comparison
    results = evaluator.compare_with_baseline(
        adapter_path=args.adapter_path,
        domain=args.domain,
        test_data_path=test_data_path,
        base_model=args.base_model
    )
    
    print("\n🎉 Evaluation complete!")
    
    # Provide recommendations
    if results['improvement']['absolute'] > 0.10:
        print("\n✅ Significant improvement detected!")
        print("   Recommendation: Deploy this adapter to production")
    elif results['improvement']['absolute'] > 0.05:
        print("\n⚠️  Moderate improvement")
        print("   Recommendation: Consider additional fine-tuning or more data")
    else:
        print("\n❌ Limited improvement")
        print("   Recommendation: Review training data quality and hyperparameters")


if __name__ == "__main__":
    main()

