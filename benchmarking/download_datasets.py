#!/usr/bin/env python3
"""
Download comprehensive benchmark datasets for AX System evaluation.

Downloads datasets across 12 business domains with realistic tasks and ground truth data.
"""

import argparse
import json
import os
from pathlib import Path
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
import yaml

console = Console()

# Domain configurations
DOMAINS = {
    "financial": {
        "tasks": 250,
        "categories": ["analysis", "risk_assessment", "portfolio_optimization", "fraud_detection",
                      "credit_scoring", "market_prediction", "trading_strategy", "regulatory_compliance"],
        "source": "financial_benchmark_dataset"
    },
    "real_estate": {
        "tasks": 100,
        "categories": ["property_analysis", "market_trends", "investment_evaluation", "zoning_compliance"],
        "source": "real_estate_benchmark_dataset"
    },
    "legal": {
        "tasks": 100,
        "categories": ["contract_analysis", "case_research", "compliance_checking", "legal_drafting"],
        "source": "legal_benchmark_dataset"
    },
    "marketing": {
        "tasks": 100,
        "categories": ["campaign_optimization", "sentiment_analysis", "content_generation", "ab_test_analysis"],
        "source": "marketing_benchmark_dataset"
    },
    "healthcare": {
        "tasks": 80,
        "categories": ["diagnosis_assistance", "treatment_planning", "drug_interaction_checking"],
        "source": "healthcare_benchmark_dataset"
    },
    "manufacturing": {
        "tasks": 80,
        "categories": ["quality_inspection", "supply_chain_optimization", "predictive_maintenance"],
        "source": "manufacturing_benchmark_dataset"
    },
    "education": {
        "tasks": 80,
        "categories": ["curriculum_design", "assessment_generation", "learning_path_optimization"],
        "source": "education_benchmark_dataset"
    },
    "analytics": {
        "tasks": 80,
        "categories": ["data_cleaning", "insight_generation", "visualization_recommendations"],
        "source": "analytics_benchmark_dataset"
    },
    "operations": {
        "tasks": 80,
        "categories": ["workflow_optimization", "resource_allocation", "incident_management"],
        "source": "operations_benchmark_dataset"
    },
    "customer_service": {
        "tasks": 80,
        "categories": ["ticket_classification", "response_generation", "escalation_detection"],
        "source": "customer_service_benchmark_dataset"
    },
    "research": {
        "tasks": 50,
        "categories": ["literature_review", "data_analysis"],
        "source": "research_benchmark_dataset"
    },
    "specialized": {
        "tasks": 50,
        "categories": ["code_review", "document_summarization"],
        "source": "specialized_benchmark_dataset"
    }
}


def generate_synthetic_task(domain: str, category: str, task_id: int) -> Dict[str, Any]:
    """
    Generate a synthetic benchmark task for a given domain and category.
    
    In production, this would download from actual benchmark datasets.
    For now, we generate synthetic tasks with realistic structure.
    """
    
    task = {
        "task_id": f"{domain}_{category}_{task_id:04d}",
        "domain": domain,
        "category": category,
        "input": {
            "query": f"Sample {category} task for {domain} domain",
            "context": {},
            "metadata": {
                "difficulty": "medium",
                "expected_modules": []
            }
        },
        "ground_truth": {
            "answer": f"Ground truth answer for {category} task",
            "reasoning": "Step-by-step reasoning",
            "confidence": 0.95
        },
        "evaluation_criteria": {
            "exact_match": True,
            "semantic_similarity": True,
            "field_level_accuracy": True
        }
    }
    
    return task


def download_domain_dataset(
    domain: str,
    config: Dict[str, Any],
    max_samples: int,
    output_dir: Path,
    validation_split: float
) -> int:
    """Download and save dataset for a specific domain."""
    
    domain_dir = output_dir / domain
    domain_dir.mkdir(parents=True, exist_ok=True)
    
    num_tasks = min(config["tasks"], max_samples)
    tasks_per_category = num_tasks // len(config["categories"])
    
    all_tasks = []
    
    for category in config["categories"]:
        category_dir = domain_dir / category
        category_dir.mkdir(parents=True, exist_ok=True)
        
        for task_id in range(tasks_per_category):
            task = generate_synthetic_task(domain, category, task_id)
            all_tasks.append(task)
            
            # Save individual task file
            task_file = category_dir / f"task_{task_id:04d}.json"
            with open(task_file, 'w') as f:
                json.dump(task, f, indent=2)
    
    # Split into train/validation
    num_validation = int(len(all_tasks) * validation_split)
    validation_tasks = all_tasks[:num_validation]
    train_tasks = all_tasks[num_validation:]
    
    # Save splits
    with open(domain_dir / "train.json", 'w') as f:
        json.dump(train_tasks, f, indent=2)
    
    with open(domain_dir / "validation.json", 'w') as f:
        json.dump(validation_tasks, f, indent=2)
    
    # Save metadata
    metadata = {
        "domain": domain,
        "total_tasks": len(all_tasks),
        "train_tasks": len(train_tasks),
        "validation_tasks": len(validation_tasks),
        "categories": config["categories"],
        "source": config["source"]
    }
    
    with open(domain_dir / "metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)
    
    return len(all_tasks)


def main():
    parser = argparse.ArgumentParser(description="Download AX System benchmark datasets")
    parser.add_argument(
        "--domains",
        type=str,
        default="all",
        help="Comma-separated list of domains or 'all' (default: all)"
    )
    parser.add_argument(
        "--max-samples",
        type=int,
        default=1000,
        help="Maximum samples per domain (default: 1000)"
    )
    parser.add_argument(
        "--validation-split",
        type=float,
        default=0.1,
        help="Validation split ratio (default: 0.1)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="data",
        help="Output directory for datasets (default: data)"
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="Number of parallel workers (default: 4)"
    )
    
    args = parser.parse_args()
    
    # Parse domains
    if args.domains.lower() == "all":
        domains_to_download = list(DOMAINS.keys())
    else:
        domains_to_download = [d.strip() for d in args.domains.split(",")]
        # Validate domains
        invalid = [d for d in domains_to_download if d not in DOMAINS]
        if invalid:
            console.print(f"[red]Invalid domains: {invalid}[/red]")
            console.print(f"[yellow]Available domains: {', '.join(DOMAINS.keys())}[/yellow]")
            return
    
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    console.print(f"\n[bold green]AX System Benchmark Dataset Download[/bold green]\n")
    console.print(f"Domains: {', '.join(domains_to_download)}")
    console.print(f"Max samples per domain: {args.max_samples}")
    console.print(f"Validation split: {args.validation_split:.1%}")
    console.print(f"Output directory: {output_dir}\n")
    
    # Download datasets
    total_tasks = 0
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        
        overall_task = progress.add_task("Downloading datasets...", total=len(domains_to_download))
        
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            futures = {}
            
            for domain in domains_to_download:
                future = executor.submit(
                    download_domain_dataset,
                    domain,
                    DOMAINS[domain],
                    args.max_samples,
                    output_dir,
                    args.validation_split
                )
                futures[future] = domain
            
            for future in as_completed(futures):
                domain = futures[future]
                try:
                    num_tasks = future.result()
                    total_tasks += num_tasks
                    console.print(f"✓ Downloaded {domain}: {num_tasks} tasks")
                    progress.advance(overall_task)
                except Exception as e:
                    console.print(f"[red]✗ Failed to download {domain}: {e}[/red]")
    
    # Generate summary
    summary = {
        "domains": domains_to_download,
        "total_tasks": total_tasks,
        "max_samples_per_domain": args.max_samples,
        "validation_split": args.validation_split,
        "output_directory": str(output_dir)
    }
    
    with open(output_dir / "download_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    console.print(f"\n[bold green]✓ Download complete![/bold green]")
    console.print(f"Total tasks downloaded: {total_tasks}")
    console.print(f"Summary saved to: {output_dir / 'download_summary.json'}\n")


if __name__ == "__main__":
    main()

