#!/usr/bin/env python3
"""
LoRA Inference Script for PERMUTATION
Loads trained LoRA adapters and generates responses
"""

import os
import sys
import json
import argparse
import torch
from pathlib import Path
from typing import Optional, Dict, Any

try:
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        BitsAndBytesConfig
    )
    from peft import PeftModel, PeftConfig
except ImportError:
    print("❌ Missing dependencies. Install with:")
    print("   pip install transformers peft bitsandbytes")
    sys.exit(1)


class LoRAInference:
    """LoRA inference with optimized loading and generation"""
    
    def __init__(self, adapter_path: str, base_model: Optional[str] = None):
        self.adapter_path = adapter_path
        self.base_model = base_model
        self.model = None
        self.tokenizer = None
        
    def load_model(self):
        """Load base model and LoRA adapter"""
        print(f"🔄 Loading LoRA adapter from: {self.adapter_path}")
        
        # Load adapter config
        config = PeftConfig.from_pretrained(self.adapter_path)
        base_model_name = self.base_model or config.base_model_name_or_path
        
        print(f"📦 Base model: {base_model_name}")
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(base_model_name)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Load base model with quantization
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True
        )
        
        self.model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            quantization_config=quantization_config,
            device_map="auto",
            trust_remote_code=True
        )
        
        # Load LoRA adapter
        self.model = PeftModel.from_pretrained(self.model, self.adapter_path)
        
        print(f"✅ Model loaded successfully")
        print(f"   Trainable parameters: {sum(p.numel() for p in self.model.parameters() if p.requires_grad):,}")
        
    def generate(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 512,
        top_p: float = 0.9,
        do_sample: bool = True
    ) -> Dict[str, Any]:
        """Generate response using LoRA adapter"""
        
        if self.model is None or self.tokenizer is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        print(f"🎯 Generating response...")
        print(f"   Prompt: {prompt[:100]}...")
        print(f"   Temperature: {temperature}")
        print(f"   Max tokens: {max_tokens}")
        
        # Tokenize input
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=2048
        ).to(self.model.device)
        
        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                do_sample=do_sample,
                pad_token_id=self.tokenizer.eos_token_id,
                eos_token_id=self.tokenizer.eos_token_id
            )
        
        # Decode response
        full_response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract only the new tokens (response)
        prompt_length = len(self.tokenizer.decode(inputs['input_ids'][0], skip_special_tokens=True))
        response = full_response[prompt_length:].strip()
        
        # Count tokens
        tokens_generated = len(outputs[0]) - len(inputs['input_ids'][0])
        
        print(f"✅ Generation complete")
        print(f"   Tokens generated: {tokens_generated}")
        print(f"   Response length: {len(response)} chars")
        
        return {
            'response': response,
            'tokens_generated': tokens_generated,
            'full_response': full_response,
            'prompt_length': prompt_length
        }


def main():
    parser = argparse.ArgumentParser(description='LoRA Inference for PERMUTATION')
    parser.add_argument('--adapter-path', type=str, required=True, help='Path to LoRA adapter')
    parser.add_argument('--base-model', type=str, help='Base model name (overrides adapter config)')
    parser.add_argument('--prompt', type=str, required=True, help='Input prompt')
    parser.add_argument('--temperature', type=float, default=0.7, help='Generation temperature')
    parser.add_argument('--max-tokens', type=int, default=512, help='Maximum tokens to generate')
    parser.add_argument('--top-p', type=float, default=0.9, help='Top-p sampling')
    parser.add_argument('--output-format', type=str, default='json', choices=['json', 'text'], help='Output format')
    
    args = parser.parse_args()
    
    # Validate adapter path
    if not os.path.exists(args.adapter_path):
        print(f"❌ Adapter path not found: {args.adapter_path}")
        sys.exit(1)
    
    try:
        # Initialize inference
        inference = LoRAInference(args.adapter_path, args.base_model)
        
        # Load model
        inference.load_model()
        
        # Generate response
        result = inference.generate(
            prompt=args.prompt,
            temperature=args.temperature,
            max_tokens=args.max_tokens,
            top_p=args.top_p
        )
        
        # Output result
        if args.output_format == 'json':
            print(json.dumps(result, indent=2))
        else:
            print(result['response'])
            
    except Exception as e:
        print(f"❌ Inference failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
