# PromptMII Scripts

This directory contains the complete PromptMII pipeline scripts, following the methodology from the [original PromptMII repository](https://github.com/millix19/promptmii/tree/main/scripts).

## Overview

PromptMII (Meta-Learning Instruction Induction for LLMs) automatically generates task-specific instructions, achieving **3-13× token reduction** while maintaining or improving performance compared to many-shot in-context learning.

## Scripts

### 1. `promptmii-preprocessing.js`
**Purpose**: Initial preprocessing of raw datasets for PromptMII training

**Features**:
- Supports JSON, JSONL, and CSV formats
- Validates dataset structure and requirements
- Cleans and normalizes data
- Splits datasets into train/test
- Generates examples for instruction induction
- Creates metadata for tracking

**Usage**:
```bash
# Basic usage
npm run promptmii:preprocess -- --inputDir ./data/raw --outputDir ./data/processed

# With custom parameters
npm run promptmii:preprocess -- \
  --inputDir ./data/raw \
  --outputDir ./data/processed \
  --maxExamples 2000 \
  --minExamples 20
```

**Parameters**:
- `--inputDir`: Raw data directory (default: `./data/raw`)
- `--outputDir`: Processed data directory (default: `./data/processed`)
- `--maxExamples`: Maximum examples per dataset (default: 1000)
- `--minExamples`: Minimum examples per dataset (default: 10)

### 2. `promptmii-postprocessing.js`
**Purpose**: Postprocessing of preprocessed datasets for final training format

**Features**:
- Creates task-specific datasets
- Generates train/validation/test splits
- Creates instruction templates
- Generates evaluation metrics
- Formats data for training

**Usage**:
```bash
# Basic usage
npm run promptmii:postprocess -- --inputDir ./data/processed --outputDir ./data/final

# With custom ratios
npm run promptmii:postprocess -- \
  --inputDir ./data/processed \
  --outputDir ./data/final \
  --trainRatio 0.8 \
  --validationRatio 0.1 \
  --testRatio 0.1
```

**Parameters**:
- `--inputDir`: Processed data directory (default: `./data/processed`)
- `--outputDir`: Final data directory (default: `./data/final`)
- `--trainRatio`: Training data ratio (default: 0.8)
- `--validationRatio`: Validation data ratio (default: 0.1)
- `--testRatio`: Test data ratio (default: 0.1)
- `--minExamplesPerTask`: Minimum examples per task (default: 5)
- `--maxExamplesPerTask`: Maximum examples per task (default: 100)

### 3. `promptmii-training.js`
**Purpose**: Training of PromptMII models using processed datasets

**Features**:
- Model initialization and configuration
- Training loop with metrics tracking
- Evaluation and checkpointing
- Performance monitoring
- Final model saving

**Usage**:
```bash
# Basic usage
npm run promptmii:train -- --dataDir ./data/final --outputDir ./models/promptmii

# With custom training parameters
npm run promptmii:train -- \
  --dataDir ./data/final \
  --outputDir ./models/promptmii \
  --baseModel meta-llama/Llama-3.1-70B-Instruct \
  --maxEpochs 5 \
  --batchSize 8 \
  --learningRate 1e-5
```

**Parameters**:
- `--dataDir`: Final data directory (default: `./data/final`)
- `--outputDir`: Output models directory (default: `./models/promptmii`)
- `--modelName`: Model name (default: `promptmii-model`)
- `--baseModel`: Base model name (default: `meta-llama/Llama-3.1-8B-Instruct`)
- `--maxEpochs`: Maximum training epochs (default: 3)
- `--batchSize`: Training batch size (default: 4)
- `--learningRate`: Learning rate (default: 2e-5)
- `--maxSteps`: Maximum training steps (default: 1000)
- `--saveSteps`: Steps between checkpoints (default: 500)
- `--evalSteps`: Steps between evaluations (default: 100)

### 4. `run-promptmii-pipeline.sh`
**Purpose**: Complete pipeline runner that executes all steps in sequence

**Features**:
- Runs preprocessing, postprocessing, and training
- Comprehensive error handling
- Progress logging and reporting
- Configuration validation
- Summary report generation

**Usage**:
```bash
# Run complete pipeline
npm run promptmii:pipeline

# With custom configuration
npm run promptmii:pipeline -- \
  --raw-data-dir ./data/raw \
  --output-models-dir ./models/promptmii \
  --max-examples 2000 \
  --base-model meta-llama/Llama-3.1-70B-Instruct \
  --max-epochs 5
```

**Parameters**:
- `--raw-data-dir`: Raw data directory (default: `./data/raw`)
- `--processed-data-dir`: Processed data directory (default: `./data/processed`)
- `--final-data-dir`: Final data directory (default: `./data/final`)
- `--output-models-dir`: Output models directory (default: `./models/promptmii`)
- `--max-examples`: Maximum examples per dataset (default: 1000)
- `--min-examples`: Minimum examples per dataset (default: 10)
- `--train-ratio`: Training data ratio (default: 0.8)
- `--validation-ratio`: Validation data ratio (default: 0.1)
- `--test-ratio`: Test data ratio (default: 0.1)
- `--base-model`: Base model name (default: `meta-llama/Llama-3.1-8B-Instruct`)
- `--model-name`: Model name (default: `promptmii-model`)
- `--max-epochs`: Maximum training epochs (default: 3)
- `--batch-size`: Training batch size (default: 4)
- `--learning-rate`: Learning rate (default: 2e-5)

## Data Format Requirements

### Input Data Format
Your raw datasets should be in one of these formats:

**JSON Format**:
```json
[
  {
    "text": "Great product, highly recommend!",
    "label": "positive"
  },
  {
    "text": "Poor quality, waste of money",
    "label": "negative"
  }
]
```

**JSONL Format**:
```jsonl
{"text": "Great product, highly recommend!", "label": "positive"}
{"text": "Poor quality, waste of money", "label": "negative"}
```

**CSV Format**:
```csv
text,label
"Great product, highly recommend!",positive
"Poor quality, waste of money",negative
```

### Required Fields
- **Text field**: `text`, `input`, or `content`
- **Label field**: `label`, `output`, or `target`

### Optional Fields
- `metadata`: Additional metadata for examples
- `domain`: Domain classification
- `complexity`: Task complexity score

## Directory Structure

```
data/
├── raw/                    # Raw datasets
│   ├── dataset1.json
│   ├── dataset2.jsonl
│   └── dataset3.csv
├── processed/              # Preprocessed data
│   ├── metadata.json
│   ├── dataset1.json
│   └── dataset2.json
└── final/                  # Final training data
    ├── train.json
    ├── validation.json
    ├── test.json
    ├── training_metadata.json
    └── evaluation_metrics.json

models/
└── promptmii/              # Trained models
    ├── model_config.json
    ├── training_metrics.json
    ├── evaluation_metrics.json
    ├── final_metrics.json
    ├── training_report.json
    ├── checkpoints/        # Model checkpoints
    └── final/             # Final model
        ├── model_info.json
        └── deployment_config.json
```

## Quick Start

1. **Prepare your data**:
   ```bash
   mkdir -p data/raw
   # Add your datasets to data/raw/
   ```

2. **Run the complete pipeline**:
   ```bash
   npm run promptmii:pipeline
   ```

3. **Check results**:
   ```bash
   ls -la models/promptmii/
   cat models/promptmii/training_report.json
   ```

## Advanced Usage

### Custom Preprocessing
```bash
npm run promptmii:preprocess -- \
  --inputDir ./custom/raw \
  --outputDir ./custom/processed \
  --maxExamples 5000 \
  --minExamples 50
```

### Custom Training
```bash
npm run promptmii:train -- \
  --dataDir ./data/final \
  --outputDir ./models/custom \
  --baseModel meta-llama/Llama-3.1-70B-Instruct \
  --maxEpochs 10 \
  --batchSize 16 \
  --learningRate 1e-5
```

### Step-by-Step Execution
```bash
# Step 1: Preprocessing
npm run promptmii:preprocess

# Step 2: Postprocessing  
npm run promptmii:postprocess

# Step 3: Training
npm run promptmii:train
```

## Monitoring and Debugging

### Log Files
All scripts generate detailed logs:
- Preprocessing: `logs/preprocessing.log`
- Postprocessing: `logs/postprocessing.log`
- Training: `logs/training.log`

### Metrics Files
- `training_metrics.json`: Training step metrics
- `evaluation_metrics.json`: Evaluation metrics
- `final_metrics.json`: Final model metrics
- `training_report.json`: Comprehensive training report

### Checkpoints
Model checkpoints are saved in `models/promptmii/checkpoints/`:
- `step_500/`: Checkpoint at step 500
- `step_1000/`: Checkpoint at step 1000
- etc.

## Troubleshooting

### Common Issues

1. **"Input directory does not exist"**
   - Create the raw data directory: `mkdir -p data/raw`
   - Add your datasets to the directory

2. **"Dataset validation failed"**
   - Check that your datasets have required fields (`text`, `label`)
   - Ensure minimum number of examples (default: 10)
   - Verify data format (JSON, JSONL, or CSV)

3. **"Training failed"**
   - Check available disk space
   - Verify model configuration
   - Check system resources (RAM, CPU)

4. **"Permission denied"**
   - Make scripts executable: `chmod +x scripts/*.sh`
   - Check file permissions

### Debug Mode
Run individual scripts with debug output:
```bash
DEBUG=1 npm run promptmii:preprocess
DEBUG=1 npm run promptmii:postprocess
DEBUG=1 npm run promptmii:train
```

## Performance Optimization

### For Large Datasets
- Increase `maxExamples` for more training data
- Use larger batch sizes if you have sufficient RAM
- Consider using a more powerful base model

### For Faster Training
- Reduce `maxEpochs` for quick experiments
- Increase `batchSize` if memory allows
- Use a smaller base model for faster training

### For Better Results
- Use more diverse training data
- Increase `minExamples` for higher quality
- Tune learning rate and other hyperparameters

## Integration with Brain Skills

The trained PromptMII models can be integrated with the brain skills system:

```typescript
import { getPromptMII } from '@/lib/promptmii-integration';

// Use trained model for instruction generation
const promptmii = getPromptMII({
  instructionModel: './models/promptmii/final',
  predictionModel: 'meta-llama/Llama-3.1-8B-Instruct'
});

const result = await promptmii.generateInstruction({
  task: 'legal_analysis',
  domain: 'legal',
  examples: trainingExamples
});
```

## References

- **Original Repository**: [https://github.com/millix19/promptmii](https://github.com/millix19/promptmii)
- **Paper**: PromptMII: Meta-Learning Instruction Induction for LLMs
- **Documentation**: `claudedocs/PROMPTMII_INTEGRATION.md`
- **API Endpoint**: `/api/promptmii/generate`

---

**Status**: ✅ Production Ready  
**Last Updated**: 2025-10-22  
**Maintained By**: AI Systems Team
