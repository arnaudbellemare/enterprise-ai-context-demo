"""
Merge Multiple LoRA Adapters
Create multi-domain models by merging adapters
"""

import argparse
from pathlib import Path
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel


def merge_lora_adapters(
    base_model_name: str,
    adapter_paths: list[str],
    output_path: str
):
    """Merge multiple LoRA adapters sequentially"""
    
    print(f"🔧 Merging {len(adapter_paths)} LoRA adapters")
    print(f"   Base model: {base_model_name}")
    print(f"   Output: {output_path}\n")
    
    # Load base model
    print("1️⃣ Loading base model...")
    model = AutoModelForCausalLM.from_pretrained(base_model_name, torch_dtype="auto")
    tokenizer = AutoTokenizer.from_pretrained(base_model_name)
    
    # Merge each adapter
    for i, adapter_path in enumerate(adapter_paths):
        print(f"{i+2}️⃣ Merging adapter: {adapter_path}")
        model = PeftModel.from_pretrained(model, adapter_path)
        model = model.merge_and_unload()
    
    # Save merged model
    print(f"\n💾 Saving merged model to: {output_path}")
    model.save_pretrained(output_path)
    tokenizer.save_pretrained(output_path)
    
    print("✅ Merge complete!")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-model', required=True)
    parser.add_argument('--adapters', required=True, help='Comma-separated adapter paths')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    
    adapters = [p.strip() for p in args.adapters.split(',')]
    merge_lora_adapters(args.base_model, adapters, args.output)


if __name__ == "__main__":
    main()

