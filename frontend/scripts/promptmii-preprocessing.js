#!/usr/bin/env node

/**
 * PromptMII Preprocessing Script
 * 
 * Based on: https://github.com/millix19/promptmii/tree/main/scripts
 * 
 * This script handles the initial preprocessing of datasets for PromptMII training
 * Following the methodology from the original repository
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../lib/logger');

class PromptMIIPreprocessor {
  constructor(config = {}) {
    this.config = {
      inputDir: config.inputDir || './data/raw',
      outputDir: config.outputDir || './data/processed',
      maxExamples: config.maxExamples || 1000,
      minExamples: config.minExamples || 10,
      supportedFormats: ['json', 'jsonl', 'csv'],
      ...config
    };

    this.stats = {
      totalDatasets: 0,
      processedDatasets: 0,
      totalExamples: 0,
      skippedDatasets: 0,
      errors: []
    };
  }

  /**
   * Main preprocessing pipeline
   */
  async run() {
    logger.info('Starting PromptMII preprocessing', {
      operation: 'promptmii_preprocessing',
      metadata: {
        inputDir: this.config.inputDir,
        outputDir: this.config.outputDir
      }
    });

    try {
      // Step 1: Validate input directory
      await this.validateInputDirectory();

      // Step 2: Discover datasets
      const datasets = await this.discoverDatasets();

      // Step 3: Process each dataset
      for (const dataset of datasets) {
        await this.processDataset(dataset);
      }

      // Step 4: Generate metadata
      await this.generateMetadata();

      // Step 5: Report results
      this.reportResults();

      logger.info('PromptMII preprocessing completed successfully', {
        operation: 'promptmii_preprocessing',
        metadata: this.stats
      });

    } catch (error) {
      logger.error('PromptMII preprocessing failed', error, {
        operation: 'promptmii_preprocessing'
      });
      throw error;
    }
  }

  /**
   * Validate input directory exists and is accessible
   */
  async validateInputDirectory() {
    if (!fs.existsSync(this.config.inputDir)) {
      throw new Error(`Input directory does not exist: ${this.config.inputDir}`);
    }

    const stats = fs.statSync(this.config.inputDir);
    if (!stats.isDirectory()) {
      throw new Error(`Input path is not a directory: ${this.config.inputDir}`);
    }

    logger.info('Input directory validated', {
      operation: 'promptmii_validation',
      metadata: {
        inputDir: this.config.inputDir,
        accessible: true
      }
    });
  }

  /**
   * Discover all datasets in input directory
   */
  async discoverDatasets() {
    const files = fs.readdirSync(this.config.inputDir);
    const datasets = [];

    for (const file of files) {
      const filePath = path.join(this.config.inputDir, file);
      const ext = path.extname(file).toLowerCase().slice(1);

      if (this.config.supportedFormats.includes(ext)) {
        const stats = fs.statSync(filePath);
        datasets.push({
          name: path.basename(file, path.extname(file)),
          path: filePath,
          format: ext,
          size: stats.size,
          modified: stats.mtime
        });
      }
    }

    this.stats.totalDatasets = datasets.length;

    logger.info('Datasets discovered', {
      operation: 'promptmii_discovery',
      metadata: {
        totalDatasets: datasets.length,
        formats: [...new Set(datasets.map(d => d.format))]
      }
    });

    return datasets;
  }

  /**
   * Process individual dataset
   */
  async processDataset(dataset) {
    logger.info('Processing dataset', {
      operation: 'promptmii_dataset_processing',
      metadata: {
        name: dataset.name,
        format: dataset.format,
        size: dataset.size
      }
    });

    try {
      // Step 1: Load dataset
      const rawData = await this.loadDataset(dataset);

      // Step 2: Validate dataset structure
      const validation = this.validateDataset(rawData, dataset);
      if (!validation.valid) {
        logger.warn('Dataset validation failed, skipping', {
          operation: 'promptmii_validation',
          metadata: {
            dataset: dataset.name,
            errors: validation.errors
          }
        });
        this.stats.skippedDatasets++;
        return;
      }

      // Step 3: Clean and normalize data
      const cleanedData = this.cleanDataset(rawData);

      // Step 4: Split into train/test
      const splits = this.splitDataset(cleanedData);

      // Step 5: Generate examples for instruction induction
      const examples = this.generateExamples(splits);

      // Step 6: Save processed dataset
      await this.saveProcessedDataset(dataset.name, {
        train: splits.train,
        test: splits.test,
        examples: examples,
        metadata: {
          originalSize: rawData.length,
          processedSize: cleanedData.length,
          trainSize: splits.train.length,
          testSize: splits.test.length,
          exampleCount: examples.length,
          format: dataset.format,
          processedAt: new Date().toISOString()
        }
      });

      this.stats.processedDatasets++;
      this.stats.totalExamples += examples.length;

    } catch (error) {
      logger.error('Dataset processing failed', error, {
        operation: 'promptmii_dataset_processing',
        metadata: {
          dataset: dataset.name
        }
      });
      this.stats.errors.push({
        dataset: dataset.name,
        error: error.message
      });
    }
  }

  /**
   * Load dataset from file
   */
  async loadDataset(dataset) {
    const content = fs.readFileSync(dataset.path, 'utf8');
    
    switch (dataset.format) {
      case 'json':
        return JSON.parse(content);
      
      case 'jsonl':
        return content.trim().split('\n').map(line => JSON.parse(line));
      
      case 'csv':
        return this.parseCSV(content);
      
      default:
        throw new Error(`Unsupported format: ${dataset.format}`);
    }
  }

  /**
   * Parse CSV content
   */
  parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      return obj;
    });
  }

  /**
   * Validate dataset structure
   */
  validateDataset(data, dataset) {
    const errors = [];

    // Check if data is array
    if (!Array.isArray(data)) {
      errors.push('Dataset must be an array');
      return { valid: false, errors };
    }

    // Check minimum examples
    if (data.length < this.config.minExamples) {
      errors.push(`Dataset has ${data.length} examples, minimum required: ${this.config.minExamples}`);
    }

    // Check for required fields (text, label)
    const sample = data[0];
    if (!sample) {
      errors.push('Dataset is empty');
      return { valid: false, errors };
    }

    if (!sample.text && !sample.input && !sample.content) {
      errors.push('Dataset must have text/input/content field');
    }

    if (!sample.label && !sample.output && !sample.target) {
      errors.push('Dataset must have label/output/target field');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean and normalize dataset
   */
  cleanDataset(data) {
    return data
      .filter(item => {
        // Remove empty items
        const text = item.text || item.input || item.content;
        const label = item.label || item.output || item.target;
        return text && label && text.trim().length > 0;
      })
      .map(item => ({
        text: (item.text || item.input || item.content).trim(),
        label: (item.label || item.output || item.target).trim(),
        metadata: {
          originalIndex: data.indexOf(item),
          textLength: (item.text || item.input || item.content).length
        }
      }))
      .slice(0, this.config.maxExamples); // Limit examples
  }

  /**
   * Split dataset into train/test
   */
  splitDataset(data) {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(shuffled.length * 0.8);
    
    return {
      train: shuffled.slice(0, splitIndex),
      test: shuffled.slice(splitIndex)
    };
  }

  /**
   * Generate examples for instruction induction
   */
  generateExamples(splits) {
    const examples = [];
    const train = splits.train.slice(0, 5); // Use first 5 examples
    
    // Generate different example combinations
    for (let i = 1; i <= Math.min(5, train.length); i++) {
      examples.push({
        examples: train.slice(0, i),
        count: i,
        metadata: {
          generatedAt: new Date().toISOString(),
          source: 'train_split'
        }
      });
    }

    return examples;
  }

  /**
   * Save processed dataset
   */
  async saveProcessedDataset(name, data) {
    const outputPath = path.join(this.config.outputDir, `${name}.json`);
    
    // Ensure output directory exists
    fs.mkdirSync(this.config.outputDir, { recursive: true });
    
    // Save dataset
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    
    logger.info('Dataset saved', {
      operation: 'promptmii_save',
      metadata: {
        name,
        outputPath,
        trainSize: data.train.length,
        testSize: data.test.length,
        exampleCount: data.examples.length
      }
    });
  }

  /**
   * Generate metadata file
   */
  async generateMetadata() {
    const metadata = {
      preprocessing: {
        timestamp: new Date().toISOString(),
        config: this.config,
        stats: this.stats
      },
      datasets: []
    };

    // Collect dataset information
    if (fs.existsSync(this.config.outputDir)) {
      const files = fs.readdirSync(this.config.outputDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.config.outputDir, file);
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          metadata.datasets.push({
            name: path.basename(file, '.json'),
            trainSize: content.train?.length || 0,
            testSize: content.test?.length || 0,
            exampleCount: content.examples?.length || 0,
            metadata: content.metadata
          });
        }
      }
    }

    const metadataPath = path.join(this.config.outputDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    logger.info('Metadata generated', {
      operation: 'promptmii_metadata',
      metadata: {
        metadataPath,
        datasetCount: metadata.datasets.length
      }
    });
  }

  /**
   * Report final results
   */
  reportResults() {
    console.log('\n=== PromptMII Preprocessing Results ===');
    console.log(`Total datasets found: ${this.stats.totalDatasets}`);
    console.log(`Successfully processed: ${this.stats.processedDatasets}`);
    console.log(`Skipped datasets: ${this.stats.skippedDatasets}`);
    console.log(`Total examples generated: ${this.stats.totalExamples}`);
    console.log(`Errors encountered: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\nErrors:');
      this.stats.errors.forEach(error => {
        console.log(`  - ${error.dataset}: ${error.error}`);
      });
    }

    console.log(`\nOutput directory: ${this.config.outputDir}`);
    console.log('Preprocessing completed successfully! ✅\n');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const config = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'maxExamples' || key === 'minExamples') {
      config[key] = parseInt(value);
    } else {
      config[key] = value;
    }
  }

  const preprocessor = new PromptMIIPreprocessor(config);
  preprocessor.run().catch(error => {
    console.error('Preprocessing failed:', error.message);
    process.exit(1);
  });
}

module.exports = { PromptMIIPreprocessor };
