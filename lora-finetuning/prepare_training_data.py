"""
Prepare Training Data for LoRA Fine-Tuning
Downloads and formats datasets from benchmarking directory
"""

import os
import json
import argparse
from pathlib import Path
from typing import List, Dict


class TrainingDataPreparator:
    """Prepare domain-specific training data from benchmarks"""
    
    def __init__(self, benchmark_dir: str = "../benchmarking/data"):
        self.benchmark_dir = Path(benchmark_dir)
        
    def prepare_domain_data(
        self,
        domain: str,
        max_samples: int = 1000,
        train_split: float = 0.8,
        format: str = "instruction"
    ):
        """
        Prepare training data for specified domain
        
        Args:
            domain: Domain name (financial, legal, etc.)
            max_samples: Maximum number of samples
            train_split: Train/validation split ratio
            format: Data format (instruction, completion)
        """
        
        print(f"📊 Preparing training data for domain: {domain}")
        print(f"   Max samples: {max_samples}")
        print(f"   Train split: {train_split}")
        print(f"   Format: {format}")
        
        # Create output directory
        output_dir = Path(f"data/{domain}")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate sample data (in production, this would fetch from benchmarking)
        samples = self._generate_sample_data(domain, max_samples)
        
        # Split train/validation
        split_idx = int(len(samples) * train_split)
        train_data = samples[:split_idx]
        val_data = samples[split_idx:]
        
        # Format data
        if format == "instruction":
            train_formatted = self._format_instruction_data(train_data, domain)
            val_formatted = self._format_instruction_data(val_data, domain)
        else:
            train_formatted = train_data
            val_formatted = val_data
        
        # Save
        train_path = output_dir / "train.json"
        val_path = output_dir / "validation.json"
        
        with open(train_path, 'w') as f:
            json.dump(train_formatted, f, indent=2)
        
        with open(val_path, 'w') as f:
            json.dump(val_formatted, f, indent=2)
        
        print(f"\n✅ Data prepared:")
        print(f"   Training: {train_path} ({len(train_formatted)} samples)")
        print(f"   Validation: {val_path} ({len(val_formatted)} samples)")
        
        return train_path, val_path
    
    def _generate_sample_data(self, domain: str, max_samples: int) -> List[Dict]:
        """Generate domain-specific sample data"""
        
        templates = {
            'financial': [
                {
                    'task': 'financial_analysis',
                    'instruction': 'Analyze the following financial data',
                    'input_template': 'Company: {company}, Revenue: {revenue}, Profit: {profit}',
                    'output_template': 'Financial health is {health}. Key metrics: {metrics}. Recommendation: {recommendation}.'
                },
                {
                    'task': 'risk_assessment',
                    'instruction': 'Assess the investment risk',
                    'input_template': '{investment_type}: {details}',
                    'output_template': 'Risk level: {risk}. Factors: {factors}. Mitigation: {mitigation}.'
                }
            ],
            'legal': [
                {
                    'task': 'contract_review',
                    'instruction': 'Review the following contract clause',
                    'input_template': 'Clause type: {clause_type}. Content: {content}',
                    'output_template': 'Analysis: {analysis}. Risks: {risks}. Recommendations: {recommendations}.'
                }
            ],
            'healthcare': [
                {
                    'task': 'diagnosis_support',
                    'instruction': 'Analyze the following medical information',
                    'input_template': 'Symptoms: {symptoms}. History: {history}',
                    'output_template': 'Assessment: {assessment}. Tests recommended: {tests}. Follow-up: {followup}.'
                }
            ],
            'real_estate': [
                {
                    'task': 'property_analysis',
                    'instruction': 'Analyze the following property',
                    'input_template': 'Location: {location}, Price: {price}, Details: {details}',
                    'output_template': 'Market analysis: {analysis}. ROI estimate: {roi}. Recommendation: {recommendation}.'
                }
            ]
        }
        
        # Get templates for domain (or use financial as default)
        domain_templates = templates.get(domain, templates['financial'])
        
        # Generate samples
        samples = []
        for i in range(max_samples):
            template = domain_templates[i % len(domain_templates)]
            
            # Generate sample data (simplified for demonstration)
            sample = {
                'id': f"{domain}_{i}",
                'task': template['task'],
                'instruction': template['instruction'],
                'input': f"Sample input {i+1} for {domain} domain",
                'output': f"Sample output {i+1} with analysis and recommendations",
                'domain': domain
            }
            
            samples.append(sample)
        
        return samples
    
    def _format_instruction_data(self, samples: List[Dict], domain: str) -> List[Dict]:
        """Format data in instruction-following format"""
        
        formatted = []
        for sample in samples:
            formatted.append({
                'instruction': sample['instruction'],
                'input': sample.get('input', ''),
                'output': sample['output'],
                'domain': domain,
                'task': sample.get('task', 'general')
            })
        
        return formatted
    
    def prepare_all_domains(
        self,
        domains: List[str],
        max_samples: int = 1000
    ):
        """Prepare data for multiple domains"""
        
        print(f"📊 Preparing data for {len(domains)} domains...")
        print(f"   Domains: {', '.join(domains)}\n")
        
        results = {}
        for domain in domains:
            train_path, val_path = self.prepare_domain_data(
                domain=domain,
                max_samples=max_samples
            )
            results[domain] = {
                'train': str(train_path),
                'validation': str(val_path)
            }
            print("")
        
        # Save manifest
        manifest_path = Path("data/training_manifest.json")
        with open(manifest_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"✅ All domains prepared!")
        print(f"📝 Manifest saved: {manifest_path}")
        
        return results


def main():
    parser = argparse.ArgumentParser(description='Prepare training data for LoRA fine-tuning')
    parser.add_argument('--domains', type=str, required=True, help='Comma-separated domains (financial,legal,etc)')
    parser.add_argument('--max-samples', type=int, default=1000, help='Max samples per domain')
    parser.add_argument('--format', type=str, default='instruction', choices=['instruction', 'completion'])
    
    args = parser.parse_args()
    
    # Parse domains
    domains = [d.strip() for d in args.domains.split(',')]
    
    # Initialize preparator
    preparator = TrainingDataPreparator()
    
    # Prepare data
    if len(domains) == 1:
        preparator.prepare_domain_data(
            domain=domains[0],
            max_samples=args.max_samples,
            format=args.format
        )
    else:
        preparator.prepare_all_domains(
            domains=domains,
            max_samples=args.max_samples
        )
    
    print(f"\n🎉 Data preparation complete!")
    print(f"\nNext step:")
    print(f"  python train_lora.py --domain {domains[0]}")


if __name__ == "__main__":
    main()

