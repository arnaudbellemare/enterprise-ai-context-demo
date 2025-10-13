"""
Download Omni OCR Benchmark Dataset
Same as Studio-Intrinsic uses: https://github.com/Studio-Intrinsic/benchmarking-ocr-gepa

This downloads REAL OCR examples from HuggingFace to test YOUR system on OCR tasks.
We'll then evaluate using IRT (Fluid Benchmarking) + GEPA optimization.

Hybrid Approach:
  • OCR Benchmark (Studio-Intrinsic dataset)
  • IRT Evaluation (Fluid Benchmarking)
  • GEPA Optimization (automatic)
  
Best of all worlds!
"""

import os
import json
import requests
from typing import List, Dict, Any
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm

# HuggingFace dataset
OMNI_OCR_DATASET = "Dataroma/omni-ocr-bench"
HUGGINGFACE_API = "https://datasets-server.huggingface.co/rows"

# Output directories
DATA_DIR = Path("data/ocr")
IMAGE_CACHE_DIR = Path("image-cache")

DATA_DIR.mkdir(parents=True, exist_ok=True)
IMAGE_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def download_dataset(max_rows: int = 1000, split: str = "test") -> List[Dict]:
    """
    Download Omni OCR Benchmark from HuggingFace
    Same dataset as Studio-Intrinsic OCR benchmark uses
    """
    print(f"\n📥 Downloading Omni OCR Benchmark from HuggingFace...")
    print(f"   Dataset: {OMNI_OCR_DATASET}")
    print(f"   Max rows: {max_rows}")
    
    all_data = []
    offset = 0
    batch_size = 100
    
    with tqdm(total=max_rows, desc="Downloading") as pbar:
        while len(all_data) < max_rows:
            try:
                response = requests.get(
                    HUGGINGFACE_API,
                    params={
                        "dataset": OMNI_OCR_DATASET,
                        "config": "default",
                        "split": split,
                        "offset": offset,
                        "length": min(batch_size, max_rows - len(all_data))
                    }
                )
                
                if response.status_code != 200:
                    print(f"\n   ⚠️  API returned {response.status_code}")
                    break
                
                data = response.json()
                rows = data.get("rows", [])
                
                if not rows:
                    break
                
                all_data.extend(rows)
                offset += len(rows)
                pbar.update(len(rows))
                
            except Exception as e:
                print(f"\n   ❌ Error downloading: {e}")
                break
    
    print(f"   ✅ Downloaded {len(all_data)} examples")
    return all_data


def process_example(row: Dict, index: int) -> Dict:
    """
    Process OCR example into format for benchmarking
    Converts HuggingFace format to our format
    """
    example_data = row.get("row", {})
    
    # Extract fields
    image_url = example_data.get("image", {}).get("src")
    image_bytes = example_data.get("image", {}).get("bytes")
    schema = example_data.get("json_schema", {})
    ground_truth = example_data.get("ground_truth", {})
    
    # Create example
    example = {
        "id": f"ocr_{index:04d}",
        "image_url": image_url,
        "schema": schema,
        "ground_truth": ground_truth,
        "domain": "ocr",
        "difficulty": estimate_difficulty(schema, ground_truth)
    }
    
    # Save image if available
    if image_bytes:
        image_path = IMAGE_CACHE_DIR / f"{example['id']}.png"
        with open(image_path, 'wb') as f:
            f.write(image_bytes)
        example["image_path"] = str(image_path)
    
    return example


def estimate_difficulty(schema: Dict, ground_truth: Dict) -> str:
    """
    Estimate difficulty based on schema complexity
    For IRT calibration
    """
    # Count fields
    num_fields = len(schema.get("properties", {}))
    
    # Check for nested structures
    has_nested = any(
        isinstance(v, dict) and "properties" in v
        for v in schema.get("properties", {}).values()
    )
    
    # Check for arrays
    has_arrays = any(
        v.get("type") == "array"
        for v in schema.get("properties", {}).values()
    )
    
    # Estimate difficulty
    if num_fields <= 3 and not has_nested and not has_arrays:
        return "easy"
    elif num_fields <= 6 or has_arrays:
        return "medium"
    else:
        return "hard"


def save_ocr_benchmark(examples: List[Dict], output_path: Path):
    """
    Save OCR benchmark in format compatible with IRT evaluation
    """
    print(f"\n💾 Saving OCR benchmark...")
    
    # Create IRT-compatible format
    benchmark_data = {
        "name": "Omni OCR Benchmark",
        "source": OMNI_OCR_DATASET,
        "total_items": len(examples),
        "difficulty_distribution": {
            "easy": sum(1 for e in examples if e["difficulty"] == "easy"),
            "medium": sum(1 for e in examples if e["difficulty"] == "medium"),
            "hard": sum(1 for e in examples if e["difficulty"] == "hard")
        },
        "items": examples
    }
    
    with open(output_path, 'w') as f:
        json.dump(benchmark_data, f, indent=2)
    
    print(f"   ✅ Saved {len(examples)} examples to {output_path}")
    print(f"\n   Difficulty Distribution:")
    print(f"      Easy:   {benchmark_data['difficulty_distribution']['easy']}")
    print(f"      Medium: {benchmark_data['difficulty_distribution']['medium']}")
    print(f"      Hard:   {benchmark_data['difficulty_distribution']['hard']}")


def main():
    """
    Download OCR benchmark for IRT evaluation
    Combines Studio-Intrinsic dataset with YOUR IRT methodology
    """
    print("\n" + "="*80)
    print("📥 DOWNLOADING OMNI OCR BENCHMARK FOR IRT EVALUATION")
    print("="*80)
    print("\nThis combines:")
    print("  • OCR Benchmark (Studio-Intrinsic dataset)")
    print("  • IRT Evaluation (YOUR Fluid Benchmarking)")
    print("  • GEPA Optimization (automatic)")
    print("\n" + "="*80 + "\n")
    
    # Download dataset
    raw_data = download_dataset(max_rows=100)  # Start with 100 examples
    
    if not raw_data:
        print("❌ No data downloaded. Check your internet connection.")
        return
    
    # Process examples
    print(f"\n🔄 Processing {len(raw_data)} examples...")
    examples = []
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [
            executor.submit(process_example, row, i)
            for i, row in enumerate(raw_data)
        ]
        
        for future in tqdm(futures, desc="Processing"):
            try:
                example = future.result()
                examples.append(example)
            except Exception as e:
                print(f"\n   ⚠️  Error processing example: {e}")
    
    print(f"   ✅ Processed {len(examples)} examples")
    
    # Save benchmark
    output_path = DATA_DIR / "omni_ocr_benchmark.json"
    save_ocr_benchmark(examples, output_path)
    
    print("\n" + "="*80)
    print("✅ OCR BENCHMARK READY FOR IRT EVALUATION")
    print("="*80)
    print(f"\nNext steps:")
    print(f"  1. Run IRT evaluation: npm run benchmark:ocr-irt")
    print(f"  2. Run GEPA optimization: npm run benchmark:gepa-ocr")
    print(f"  3. Compare results with other domains")
    print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    main()

