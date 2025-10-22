#!/bin/bash

# PromptMII Complete Pipeline Script
# 
# Based on: https://github.com/millix19/promptmii/tree/main/scripts
# 
# This script runs the complete PromptMII pipeline:
# 1. Preprocessing
# 2. Postprocessing  
# 3. Training
# 4. Evaluation
#
# Following the methodology from the original repository

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="$PROJECT_ROOT/data"
MODELS_DIR="$PROJECT_ROOT/models"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
RAW_DATA_DIR="$DATA_DIR/raw"
PROCESSED_DATA_DIR="$DATA_DIR/processed"
FINAL_DATA_DIR="$DATA_DIR/final"
OUTPUT_MODELS_DIR="$MODELS_DIR/promptmii"
MAX_EXAMPLES=1000
MIN_EXAMPLES=10
TRAIN_RATIO=0.8
VALIDATION_RATIO=0.1
TEST_RATIO=0.1
BASE_MODEL="meta-llama/Llama-3.1-8B-Instruct"
MODEL_NAME="promptmii-model"
MAX_EPOCHS=3
BATCH_SIZE=4
LEARNING_RATE=2e-5

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --raw-data-dir)
            RAW_DATA_DIR="$2"
            shift 2
            ;;
        --processed-data-dir)
            PROCESSED_DATA_DIR="$2"
            shift 2
            ;;
        --final-data-dir)
            FINAL_DATA_DIR="$2"
            shift 2
            ;;
        --output-models-dir)
            OUTPUT_MODELS_DIR="$2"
            shift 2
            ;;
        --max-examples)
            MAX_EXAMPLES="$2"
            shift 2
            ;;
        --min-examples)
            MIN_EXAMPLES="$2"
            shift 2
            ;;
        --train-ratio)
            TRAIN_RATIO="$2"
            shift 2
            ;;
        --validation-ratio)
            VALIDATION_RATIO="$2"
            shift 2
            ;;
        --test-ratio)
            TEST_RATIO="$2"
            shift 2
            ;;
        --base-model)
            BASE_MODEL="$2"
            shift 2
            ;;
        --model-name)
            MODEL_NAME="$2"
            shift 2
            ;;
        --max-epochs)
            MAX_EPOCHS="$2"
            shift 2
            ;;
        --batch-size)
            BATCH_SIZE="$2"
            shift 2
            ;;
        --learning-rate)
            LEARNING_RATE="$2"
            shift 2
            ;;
        --help)
            echo "PromptMII Pipeline Runner"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --raw-data-dir DIR          Raw data directory (default: $RAW_DATA_DIR)"
            echo "  --processed-data-dir DIR    Processed data directory (default: $PROCESSED_DATA_DIR)"
            echo "  --final-data-dir DIR        Final data directory (default: $FINAL_DATA_DIR)"
            echo "  --output-models-dir DIR     Output models directory (default: $OUTPUT_MODELS_DIR)"
            echo "  --max-examples NUM          Maximum examples per dataset (default: $MAX_EXAMPLES)"
            echo "  --min-examples NUM          Minimum examples per dataset (default: $MIN_EXAMPLES)"
            echo "  --train-ratio RATIO         Training data ratio (default: $TRAIN_RATIO)"
            echo "  --validation-ratio RATIO    Validation data ratio (default: $VALIDATION_RATIO)"
            echo "  --test-ratio RATIO          Test data ratio (default: $TEST_RATIO)"
            echo "  --base-model MODEL          Base model name (default: $BASE_MODEL)"
            echo "  --model-name NAME           Model name (default: $MODEL_NAME)"
            echo "  --max-epochs NUM            Maximum training epochs (default: $MAX_EPOCHS)"
            echo "  --batch-size NUM            Training batch size (default: $BATCH_SIZE)"
            echo "  --learning-rate RATE        Learning rate (default: $LEARNING_RATE)"
            echo "  --help                      Show this help message"
            echo ""
            echo "Example:"
            echo "  $0 --max-examples 2000 --base-model meta-llama/Llama-3.1-70B-Instruct"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Display configuration
log_info "PromptMII Pipeline Configuration:"
echo "  Raw Data Directory: $RAW_DATA_DIR"
echo "  Processed Data Directory: $PROCESSED_DATA_DIR"
echo "  Final Data Directory: $FINAL_DATA_DIR"
echo "  Output Models Directory: $OUTPUT_MODELS_DIR"
echo "  Max Examples: $MAX_EXAMPLES"
echo "  Min Examples: $MIN_EXAMPLES"
echo "  Train Ratio: $TRAIN_RATIO"
echo "  Validation Ratio: $VALIDATION_RATIO"
echo "  Test Ratio: $TEST_RATIO"
echo "  Base Model: $BASE_MODEL"
echo "  Model Name: $MODEL_NAME"
echo "  Max Epochs: $MAX_EPOCHS"
echo "  Batch Size: $BATCH_SIZE"
echo "  Learning Rate: $LEARNING_RATE"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed or not in PATH"
    exit 1
fi

# Check if required directories exist
if [ ! -d "$RAW_DATA_DIR" ]; then
    log_warning "Raw data directory does not exist: $RAW_DATA_DIR"
    log_info "Creating raw data directory..."
    mkdir -p "$RAW_DATA_DIR"
    log_info "Please add your raw datasets to: $RAW_DATA_DIR"
    log_info "Supported formats: JSON, JSONL, CSV"
    log_info "Required fields: text/input/content, label/output/target"
fi

# Create output directories
log_info "Creating output directories..."
mkdir -p "$PROCESSED_DATA_DIR"
mkdir -p "$FINAL_DATA_DIR"
mkdir -p "$OUTPUT_MODELS_DIR"

# Step 1: Preprocessing
log_info "Step 1: Preprocessing datasets..."
cd "$SCRIPT_DIR"
node promptmii-preprocessing.js \
    --inputDir "$RAW_DATA_DIR" \
    --outputDir "$PROCESSED_DATA_DIR" \
    --maxExamples "$MAX_EXAMPLES" \
    --minExamples "$MIN_EXAMPLES"

if [ $? -eq 0 ]; then
    log_success "Preprocessing completed successfully"
else
    log_error "Preprocessing failed"
    exit 1
fi

# Step 2: Postprocessing
log_info "Step 2: Postprocessing datasets..."
node promptmii-postprocessing.js \
    --inputDir "$PROCESSED_DATA_DIR" \
    --outputDir "$FINAL_DATA_DIR" \
    --trainRatio "$TRAIN_RATIO" \
    --validationRatio "$VALIDATION_RATIO" \
    --testRatio "$TEST_RATIO" \
    --minExamplesPerTask "$MIN_EXAMPLES" \
    --maxExamplesPerTask "$MAX_EXAMPLES"

if [ $? -eq 0 ]; then
    log_success "Postprocessing completed successfully"
else
    log_error "Postprocessing failed"
    exit 1
fi

# Step 3: Training
log_info "Step 3: Training PromptMII model..."
node promptmii-training.js \
    --dataDir "$FINAL_DATA_DIR" \
    --outputDir "$OUTPUT_MODELS_DIR" \
    --modelName "$MODEL_NAME" \
    --baseModel "$BASE_MODEL" \
    --maxEpochs "$MAX_EPOCHS" \
    --batchSize "$BATCH_SIZE" \
    --learningRate "$LEARNING_RATE"

if [ $? -eq 0 ]; then
    log_success "Training completed successfully"
else
    log_error "Training failed"
    exit 1
fi

# Step 4: Generate summary report
log_info "Step 4: Generating summary report..."

SUMMARY_REPORT="$OUTPUT_MODELS_DIR/pipeline_summary.json"
cat > "$SUMMARY_REPORT" << EOF
{
  "pipeline": {
    "name": "PromptMII Complete Pipeline",
    "version": "1.0.0",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": "completed"
  },
  "configuration": {
    "rawDataDir": "$RAW_DATA_DIR",
    "processedDataDir": "$PROCESSED_DATA_DIR",
    "finalDataDir": "$FINAL_DATA_DIR",
    "outputModelsDir": "$OUTPUT_MODELS_DIR",
    "maxExamples": $MAX_EXAMPLES,
    "minExamples": $MIN_EXAMPLES,
    "trainRatio": $TRAIN_RATIO,
    "validationRatio": $VALIDATION_RATIO,
    "testRatio": $TEST_RATIO,
    "baseModel": "$BASE_MODEL",
    "modelName": "$MODEL_NAME",
    "maxEpochs": $MAX_EPOCHS,
    "batchSize": $BATCH_SIZE,
    "learningRate": $LEARNING_RATE
  },
  "outputs": {
    "processedData": "$PROCESSED_DATA_DIR",
    "finalData": "$FINAL_DATA_DIR",
    "trainedModel": "$OUTPUT_MODELS_DIR",
    "checkpoints": "$OUTPUT_MODELS_DIR/checkpoints",
    "finalModel": "$OUTPUT_MODELS_DIR/final"
  },
  "files": {
    "preprocessing": [
      "metadata.json"
    ],
    "postprocessing": [
      "train.json",
      "validation.json", 
      "test.json",
      "training_metadata.json",
      "evaluation_metrics.json"
    ],
    "training": [
      "model_config.json",
      "training_metrics.json",
      "evaluation_metrics.json",
      "final_metrics.json",
      "training_report.json",
      "checkpoints/",
      "final/"
    ]
  }
}
EOF

log_success "Summary report generated: $SUMMARY_REPORT"

# Final success message
echo ""
log_success "🎉 PromptMII Pipeline Completed Successfully!"
echo ""
echo "📁 Output Directories:"
echo "  Processed Data: $PROCESSED_DATA_DIR"
echo "  Final Data: $FINAL_DATA_DIR"
echo "  Trained Model: $OUTPUT_MODELS_DIR"
echo ""
echo "📊 Key Files Generated:"
echo "  - Training data: $FINAL_DATA_DIR/train.json"
echo "  - Validation data: $FINAL_DATA_DIR/validation.json"
echo "  - Test data: $FINAL_DATA_DIR/test.json"
echo "  - Model checkpoints: $OUTPUT_MODELS_DIR/checkpoints/"
echo "  - Final model: $OUTPUT_MODELS_DIR/final/"
echo "  - Training report: $OUTPUT_MODELS_DIR/training_report.json"
echo ""
echo "🚀 Next Steps:"
echo "  1. Review the training report for model performance"
echo "  2. Test the trained model with your data"
echo "  3. Deploy the model for production use"
echo "  4. Monitor model performance in production"
echo ""
echo "📚 Documentation:"
echo "  - PromptMII Integration Guide: claudedocs/PROMPTMII_INTEGRATION.md"
echo "  - Original Repository: https://github.com/millix19/promptmii"
echo ""
log_success "Pipeline execution completed! ✅"
