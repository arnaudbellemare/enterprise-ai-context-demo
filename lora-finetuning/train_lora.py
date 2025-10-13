"""
LoRA Fine-Tuning Script with Low Weight Decay
Trains domain-specific LoRA adapters for the AX system
"""

import os
import sys
import yaml
import torch
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

try:
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        TrainingArguments,
        Trainer,
        DataCollatorForLanguageModeling
    )
    from peft import (
        get_peft_model,
        LoraConfig,
        TaskType,
        PeftModel,
        prepare_model_for_kbit_training
    )
    from datasets import load_dataset, Dataset
except ImportError:
    print("❌ Missing dependencies. Install with:")
    print("   pip install -r requirements.txt")
    sys.exit(1)


class LoRATrainer:
    """LoRA training with low weight decay for domain-specific optimization"""
    
    def __init__(self, config_path: str = "lora_config.yaml"):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"🔧 Using device: {self.device}")
        
    def load_base_model(self, model_name: Optional[str] = None):
        """Load base model and tokenizer"""
        model_name = model_name or self.config['base_model']['name']
        
        print(f"📦 Loading base model: {model_name}")
        
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=getattr(torch, self.config['base_model']['torch_dtype']),
            device_map=self.config['base_model']['device_map'],
            trust_remote_code=self.config['base_model']['trust_remote_code']
        )
        
        # Prepare for k-bit training if using QLoRA
        if self.config['qlora'].get('enabled', False):
            model = prepare_model_for_kbit_training(model)
        
        print(f"✅ Model loaded: {model.num_parameters():,} parameters")
        
        return model, tokenizer
    
    def create_lora_config(self, domain: Optional[str] = None):
        """Create LoRA configuration with low weight decay"""
        
        # Use domain-specific config if available
        if domain and domain in self.config.get('domains', {}):
            lora_params = self.config['domains'][domain]
        else:
            lora_params = self.config['lora']
        
        lora_config = LoraConfig(
            r=lora_params['r'],
            lora_alpha=lora_params['lora_alpha'],
            target_modules=lora_params['target_modules'],
            lora_dropout=lora_params['lora_dropout'],
            bias=lora_params['bias'],
            task_type=TaskType[lora_params['task_type']],
            inference_mode=False,
            # Advanced LoRA techniques
            use_rslora=lora_params.get('use_rslora', True),
            use_dora=lora_params.get('use_dora', False)
        )
        
        print(f"🎯 LoRA Config: r={lora_config.r}, alpha={lora_config.lora_alpha}")
        print(f"   Target modules: {', '.join(lora_config.target_modules)}")
        print(f"   rsLoRA: {lora_config.use_rslora}, DoRA: {lora_config.use_dora}")
        
        return lora_config
    
    def prepare_training_data(self, data_path: str, tokenizer):
        """Prepare and tokenize training data"""
        
        print(f"📊 Loading training data: {data_path}")
        
        # Load dataset
        if data_path.endswith('.json'):
            dataset = load_dataset('json', data_files=data_path, split='train')
        elif data_path.endswith('.csv'):
            dataset = load_dataset('csv', data_files=data_path, split='train')
        else:
            raise ValueError(f"Unsupported file format: {data_path}")
        
        print(f"✅ Loaded {len(dataset)} examples")
        
        # Tokenize
        def tokenize_function(examples):
            # Format as instruction-following
            texts = []
            for i in range(len(examples['instruction'])):
                text = f"### Instruction:\n{examples['instruction'][i]}\n\n"
                if 'input' in examples and examples['input'][i]:
                    text += f"### Input:\n{examples['input'][i]}\n\n"
                text += f"### Response:\n{examples['output'][i]}"
                texts.append(text)
            
            return tokenizer(
                texts,
                truncation=True,
                max_length=2048,
                padding='max_length'
            )
        
        tokenized_dataset = dataset.map(
            tokenize_function,
            batched=True,
            remove_columns=dataset.column_names
        )
        
        return tokenized_dataset
    
    def train(
        self,
        domain: str,
        model_name: Optional[str] = None,
        output_dir: Optional[str] = None
    ):
        """Train LoRA adapter for specified domain"""
        
        print(f"\n{'='*60}")
        print(f"🚀 Starting LoRA Training for Domain: {domain.upper()}")
        print(f"{'='*60}\n")
        
        # Load model and tokenizer
        model, tokenizer = self.load_base_model(model_name)
        
        # Create LoRA config
        lora_config = self.create_lora_config(domain)
        
        # Apply LoRA
        model = get_peft_model(model, lora_config)
        model.print_trainable_parameters()
        
        # Load training data
        domain_config = self.config['domains'].get(domain, {})
        data_path = domain_config.get('training_data')
        
        if not data_path or not os.path.exists(data_path):
            print(f"⚠️  No training data found at: {data_path}")
            print(f"   Using default sample data for demonstration")
            # Create minimal sample dataset
            sample_data = self._create_sample_dataset(domain)
            train_dataset = Dataset.from_dict(sample_data)
            train_dataset = self.prepare_training_data_from_dict(train_dataset, tokenizer)
        else:
            train_dataset = self.prepare_training_data(data_path, tokenizer)
        
        # Training arguments with LOW weight decay
        training_config = self.config['training']
        output_dir = output_dir or f"adapters/{domain}_lora"
        
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=training_config.get('num_train_epochs', 3),
            max_steps=training_config.get('max_steps', 1000),
            per_device_train_batch_size=training_config['per_device_train_batch_size'],
            gradient_accumulation_steps=training_config['gradient_accumulation_steps'],
            learning_rate=training_config['learning_rate'],
            weight_decay=training_config['weight_decay'],  # LOW weight decay (1e-5)!
            logging_steps=training_config['logging_steps'],
            save_steps=training_config['save_steps'],
            bf16=training_config['bf16'],
            fp16=training_config['fp16'],
            lr_scheduler_type=training_config['lr_scheduler_type'],
            warmup_ratio=training_config.get('warmup_ratio', 0.1),
            save_total_limit=training_config.get('save_total_limit', 3),
            load_best_model_at_end=training_config.get('load_best_model_at_end', True),
            report_to=training_config.get('report_to', []),
            gradient_checkpointing=training_config.get('gradient_checkpointing', True),
            optim=training_config['optimizer']
        )
        
        print(f"\n📋 Training Configuration:")
        print(f"   Learning Rate: {training_args.learning_rate}")
        print(f"   Weight Decay: {training_args.weight_decay} (LOW!)")
        print(f"   Batch Size: {training_args.per_device_train_batch_size}")
        print(f"   Max Steps: {training_args.max_steps}")
        print(f"   Gradient Accumulation: {training_args.gradient_accumulation_steps}")
        print(f"   Output Dir: {output_dir}")
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=tokenizer,
            mlm=False
        )
        
        # Initialize trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            data_collator=data_collator
        )
        
        # Train!
        print(f"\n🔥 Starting training...\n")
        start_time = datetime.now()
        
        trainer.train()
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print(f"\n{'='*60}")
        print(f"✅ Training Complete!")
        print(f"   Duration: {duration/60:.2f} minutes")
        print(f"   Output: {output_dir}")
        print(f"{'='*60}\n")
        
        # Save final model
        trainer.save_model(output_dir)
        tokenizer.save_pretrained(output_dir)
        
        # Save training info
        self._save_training_info(domain, output_dir, duration, training_args)
        
        return output_dir
    
    def _create_sample_dataset(self, domain: str) -> Dict[str, List[str]]:
        """Create minimal sample dataset for demonstration"""
        samples = {
            'financial': [
                {
                    'instruction': 'Analyze the following financial report',
                    'input': 'Apple Q4 2024: Revenue $89.5B (+6% YoY), Net Income $22.9B',
                    'output': 'Strong financial performance with 6% revenue growth. Net income margin of 25.6% indicates healthy profitability. Key drivers: iPhone sales, Services growth.'
                },
                {
                    'instruction': 'Assess investment risk',
                    'input': 'Tech sector concentration: 60% portfolio allocation',
                    'output': 'High concentration risk. Recommendation: Diversify across sectors to reduce volatility. Target 30-40% tech allocation.'
                }
            ],
            'legal': [
                {
                    'instruction': 'Review contract clause',
                    'input': 'Termination: Either party may terminate with 30 days notice',
                    'output': 'Standard termination clause. Consider adding: (1) termination fees, (2) transition period, (3) data return provisions.'
                }
            ]
        }
        
        domain_samples = samples.get(domain, samples['financial'])
        
        return {
            'instruction': [s['instruction'] for s in domain_samples],
            'input': [s['input'] for s in domain_samples],
            'output': [s['output'] for s in domain_samples]
        }
    
    def prepare_training_data_from_dict(self, dataset: Dataset, tokenizer):
        """Tokenize dataset from dictionary"""
        def tokenize_function(examples):
            texts = []
            for i in range(len(examples['instruction'])):
                text = f"### Instruction:\n{examples['instruction'][i]}\n\n"
                if examples['input'][i]:
                    text += f"### Input:\n{examples['input'][i]}\n\n"
                text += f"### Response:\n{examples['output'][i]}"
                texts.append(text)
            
            return tokenizer(
                texts,
                truncation=True,
                max_length=2048,
                padding='max_length'
            )
        
        return dataset.map(tokenize_function, batched=True)
    
    def _save_training_info(self, domain: str, output_dir: str, duration: float, args):
        """Save training metadata"""
        info = {
            'domain': domain,
            'training_date': datetime.now().isoformat(),
            'duration_seconds': duration,
            'learning_rate': args.learning_rate,
            'weight_decay': args.weight_decay,
            'max_steps': args.max_steps,
            'batch_size': args.per_device_train_batch_size,
            'lora_config': {
                'r': self.config['lora']['r'],
                'alpha': self.config['lora']['lora_alpha'],
                'dropout': self.config['lora']['lora_dropout']
            }
        }
        
        info_path = os.path.join(output_dir, 'training_info.yaml')
        with open(info_path, 'w') as f:
            yaml.dump(info, f)
        
        print(f"📝 Training info saved: {info_path}")


def main():
    parser = argparse.ArgumentParser(description='Train LoRA adapter with low weight decay')
    parser.add_argument('--domain', type=str, required=True, help='Domain to train (financial, legal, etc.)')
    parser.add_argument('--base-model', type=str, help='Base model name (overrides config)')
    parser.add_argument('--config', type=str, default='lora_config.yaml', help='Path to config file')
    parser.add_argument('--output-dir', type=str, help='Output directory for adapter')
    
    args = parser.parse_args()
    
    # Initialize trainer
    trainer = LoRATrainer(config_path=args.config)
    
    # Train
    output_dir = trainer.train(
        domain=args.domain,
        model_name=args.base_model,
        output_dir=args.output_dir
    )
    
    print(f"\n🎉 LoRA adapter saved to: {output_dir}")
    print(f"\nNext steps:")
    print(f"  1. Evaluate: python evaluate_lora.py --domain {args.domain} --adapter-path {output_dir}")
    print(f"  2. Integrate: Update API to load this adapter")
    print(f"  3. Benchmark: Compare with baseline using Fluid IRT")


if __name__ == "__main__":
    main()

