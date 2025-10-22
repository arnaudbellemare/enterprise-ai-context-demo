#!/usr/bin/env node

/**
 * PromptMII Postprocessing Script
 * 
 * Based on: https://github.com/millix19/promptmii/tree/main/scripts
 * 
 * This script handles postprocessing of preprocessed datasets for PromptMII training
 * Following the methodology from the original repository
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../lib/logger');

class PromptMIIPostprocessor {
  constructor(config = {}) {
    this.config = {
      inputDir: config.inputDir || './data/processed',
      outputDir: config.outputDir || './data/final',
      trainRatio: config.trainRatio || 0.8,
      validationRatio: config.validationRatio || 0.1,
      testRatio: config.testRatio || 0.1,
      minExamplesPerTask: config.minExamplesPerTask || 5,
      maxExamplesPerTask: config.maxExamplesPerTask || 100,
      ...config
    };

    this.stats = {
      totalDatasets: 0,
      processedDatasets: 0,
      totalTasks: 0,
      totalExamples: 0,
      skippedDatasets: 0,
      errors: []
    };
  }

  /**
   * Main postprocessing pipeline
   */
  async run() {
    logger.info('Starting PromptMII postprocessing', {
      operation: 'promptmii_postprocessing',
      metadata: {
        inputDir: this.config.inputDir,
        outputDir: this.config.outputDir
      }
    });

    try {
      // Step 1: Validate input directory
      await this.validateInputDirectory();

      // Step 2: Load metadata
      const metadata = await this.loadMetadata();

      // Step 3: Process datasets
      const processedData = await this.processDatasets(metadata);

      // Step 4: Generate final splits
      const finalSplits = this.generateFinalSplits(processedData);

      // Step 5: Create training format
      const trainingData = this.createTrainingFormat(finalSplits);

      // Step 6: Save final datasets
      await this.saveFinalDatasets(trainingData);

      // Step 7: Generate evaluation metrics
      await this.generateEvaluationMetrics(finalSplits);

      // Step 8: Report results
      this.reportResults();

      logger.info('PromptMII postprocessing completed successfully', {
        operation: 'promptmii_postprocessing',
        metadata: this.stats
      });

    } catch (error) {
      logger.error('PromptMII postprocessing failed', error, {
        operation: 'promptmii_postprocessing'
      });
      throw error;
    }
  }

  /**
   * Validate input directory and metadata
   */
  async validateInputDirectory() {
    if (!fs.existsSync(this.config.inputDir)) {
      throw new Error(`Input directory does not exist: ${this.config.inputDir}`);
    }

    const metadataPath = path.join(this.config.inputDir, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      throw new Error(`Metadata file not found: ${metadataPath}`);
    }

    logger.info('Input directory validated', {
      operation: 'promptmii_validation',
      metadata: {
        inputDir: this.config.inputDir,
        metadataExists: true
      }
    });
  }

  /**
   * Load preprocessing metadata
   */
  async loadMetadata() {
    const metadataPath = path.join(this.config.inputDir, 'metadata.json');
    const content = fs.readFileSync(metadataPath, 'utf8');
    const metadata = JSON.parse(content);

    logger.info('Metadata loaded', {
      operation: 'promptmii_metadata_load',
      metadata: {
        datasetCount: metadata.datasets?.length || 0,
        totalExamples: metadata.preprocessing?.stats?.totalExamples || 0
      }
    });

    return metadata;
  }

  /**
   * Process all datasets
   */
  async processDatasets(metadata) {
    const processedData = {
      tasks: [],
      allExamples: [],
      taskMetadata: {}
    };

    for (const datasetInfo of metadata.datasets || []) {
      try {
        const datasetPath = path.join(this.config.inputDir, `${datasetInfo.name}.json`);
        const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

        // Process dataset into tasks
        const tasks = this.createTasksFromDataset(dataset, datasetInfo.name);
        processedData.tasks.push(...tasks);

        // Collect all examples
        processedData.allExamples.push(...dataset.train || []);
        processedData.allExamples.push(...dataset.test || []);

        // Store task metadata
        processedData.taskMetadata[datasetInfo.name] = {
          taskCount: tasks.length,
          trainSize: dataset.train?.length || 0,
          testSize: dataset.test?.length || 0,
          examples: dataset.examples || []
        };

        this.stats.processedDatasets++;

      } catch (error) {
        logger.error('Dataset processing failed', error, {
          operation: 'promptmii_dataset_processing',
          metadata: {
            dataset: datasetInfo.name
          }
        });
        this.stats.errors.push({
          dataset: datasetInfo.name,
          error: error.message
        });
      }
    }

    this.stats.totalDatasets = metadata.datasets?.length || 0;
    this.stats.totalTasks = processedData.tasks.length;
    this.stats.totalExamples = processedData.allExamples.length;

    logger.info('Datasets processed', {
      operation: 'promptmii_datasets_processed',
      metadata: {
        totalTasks: processedData.tasks.length,
        totalExamples: processedData.allExamples.length
      }
    });

    return processedData;
  }

  /**
   * Create tasks from dataset
   */
  createTasksFromDataset(dataset, datasetName) {
    const tasks = [];

    // Create main task
    const mainTask = {
      id: `${datasetName}_main`,
      name: datasetName,
      domain: this.inferDomain(datasetName),
      train: dataset.train || [],
      test: dataset.test || [],
      examples: dataset.examples || [],
      metadata: {
        source: datasetName,
        type: 'main',
        createdAt: new Date().toISOString()
      }
    };

    tasks.push(mainTask);

    // Create sub-tasks based on examples
    if (dataset.examples && dataset.examples.length > 0) {
      dataset.examples.forEach((exampleSet, index) => {
        if (exampleSet.examples && exampleSet.examples.length >= this.config.minExamplesPerTask) {
          const subTask = {
            id: `${datasetName}_sub_${index}`,
            name: `${datasetName}_${exampleSet.count}_examples`,
            domain: this.inferDomain(datasetName),
            train: exampleSet.examples.slice(0, Math.floor(exampleSet.examples.length * 0.8)),
            test: exampleSet.examples.slice(Math.floor(exampleSet.examples.length * 0.8)),
            examples: [exampleSet],
            metadata: {
              source: datasetName,
              type: 'sub',
              exampleCount: exampleSet.count,
              createdAt: new Date().toISOString()
            }
          };

          tasks.push(subTask);
        }
      });
    }

    return tasks;
  }

  /**
   * Infer domain from dataset name
   */
  inferDomain(datasetName) {
    const domainKeywords = {
      'legal': ['legal', 'law', 'contract', 'clause'],
      'medical': ['medical', 'health', 'clinical', 'diagnosis'],
      'business': ['business', 'finance', 'corporate', 'market'],
      'technical': ['technical', 'code', 'programming', 'software'],
      'retrieval': ['retrieval', 'search', 'query', 'document'],
      'reasoning': ['reasoning', 'logic', 'inference', 'deduction']
    };

    const name = datasetName.toLowerCase();
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return domain;
      }
    }

    return 'general';
  }

  /**
   * Generate final train/validation/test splits
   */
  generateFinalSplits(processedData) {
    const allTasks = processedData.tasks;
    const shuffled = [...allTasks].sort(() => Math.random() - 0.5);

    const trainCount = Math.floor(shuffled.length * this.config.trainRatio);
    const validationCount = Math.floor(shuffled.length * this.config.validationRatio);

    const splits = {
      train: shuffled.slice(0, trainCount),
      validation: shuffled.slice(trainCount, trainCount + validationCount),
      test: shuffled.slice(trainCount + validationCount)
    };

    logger.info('Final splits generated', {
      operation: 'promptmii_splits',
      metadata: {
        trainTasks: splits.train.length,
        validationTasks: splits.validation.length,
        testTasks: splits.test.length
      }
    });

    return splits;
  }

  /**
   * Create training format for PromptMII
   */
  createTrainingFormat(splits) {
    const trainingData = {
      train: this.formatTasksForTraining(splits.train),
      validation: this.formatTasksForTraining(splits.validation),
      test: this.formatTasksForTraining(splits.test),
      metadata: {
        totalTasks: splits.train.length + splits.validation.length + splits.test.length,
        trainTasks: splits.train.length,
        validationTasks: splits.validation.length,
        testTasks: splits.test.length,
        generatedAt: new Date().toISOString(),
        format: 'promptmii_training'
      }
    };

    return trainingData;
  }

  /**
   * Format tasks for training
   */
  formatTasksForTraining(tasks) {
    return tasks.map(task => ({
      task_id: task.id,
      task_name: task.name,
      domain: task.domain,
      instruction: this.generateInstructionForTask(task),
      examples: task.examples || [],
      train_examples: task.train || [],
      test_examples: task.test || [],
      metadata: task.metadata
    }));
  }

  /**
   * Generate instruction for task
   */
  generateInstructionForTask(task) {
    const domainInstructions = {
      'legal': 'Analyze the legal document and classify it according to the specified categories.',
      'medical': 'Examine the medical text and identify the relevant medical information.',
      'business': 'Review the business document and extract key business insights.',
      'technical': 'Analyze the technical content and provide appropriate technical classification.',
      'retrieval': 'Process the query and retrieve the most relevant information.',
      'reasoning': 'Apply logical reasoning to solve the given problem.',
      'general': 'Analyze the input and provide the appropriate classification or response.'
    };

    return domainInstructions[task.domain] || domainInstructions['general'];
  }

  /**
   * Save final datasets
   */
  async saveFinalDatasets(trainingData) {
    // Ensure output directory exists
    fs.mkdirSync(this.config.outputDir, { recursive: true });

    // Save training data
    const trainPath = path.join(this.config.outputDir, 'train.json');
    fs.writeFileSync(trainPath, JSON.stringify(trainingData.train, null, 2));

    // Save validation data
    const validationPath = path.join(this.config.outputDir, 'validation.json');
    fs.writeFileSync(validationPath, JSON.stringify(trainingData.validation, null, 2));

    // Save test data
    const testPath = path.join(this.config.outputDir, 'test.json');
    fs.writeFileSync(testPath, JSON.stringify(trainingData.test, null, 2));

    // Save metadata
    const metadataPath = path.join(this.config.outputDir, 'training_metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(trainingData.metadata, null, 2));

    logger.info('Final datasets saved', {
      operation: 'promptmii_save_final',
      metadata: {
        outputDir: this.config.outputDir,
        trainTasks: trainingData.train.length,
        validationTasks: trainingData.validation.length,
        testTasks: trainingData.test.length
      }
    });
  }

  /**
   * Generate evaluation metrics
   */
  async generateEvaluationMetrics(splits) {
    const metrics = {
      dataset_metrics: {
        total_tasks: splits.train.length + splits.validation.length + splits.test.length,
        train_tasks: splits.train.length,
        validation_tasks: splits.validation.length,
        test_tasks: splits.test.length,
        train_ratio: this.config.trainRatio,
        validation_ratio: this.config.validationRatio,
        test_ratio: this.config.testRatio
      },
      task_distribution: this.calculateTaskDistribution(splits),
      domain_distribution: this.calculateDomainDistribution(splits),
      example_statistics: this.calculateExampleStatistics(splits),
      generated_at: new Date().toISOString()
    };

    const metricsPath = path.join(this.config.outputDir, 'evaluation_metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

    logger.info('Evaluation metrics generated', {
      operation: 'promptmii_metrics',
      metadata: {
        metricsPath,
        totalTasks: metrics.dataset_metrics.total_tasks
      }
    });
  }

  /**
   * Calculate task distribution
   */
  calculateTaskDistribution(splits) {
    const allTasks = [...splits.train, ...splits.validation, ...splits.test];
    const distribution = {};

    allTasks.forEach(task => {
      const type = task.metadata?.type || 'unknown';
      distribution[type] = (distribution[type] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Calculate domain distribution
   */
  calculateDomainDistribution(splits) {
    const allTasks = [...splits.train, ...splits.validation, ...splits.test];
    const distribution = {};

    allTasks.forEach(task => {
      const domain = task.domain || 'unknown';
      distribution[domain] = (distribution[domain] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Calculate example statistics
   */
  calculateExampleStatistics(splits) {
    const allTasks = [...splits.train, ...splits.validation, ...splits.test];
    
    const stats = {
      total_examples: 0,
      avg_examples_per_task: 0,
      min_examples: Infinity,
      max_examples: 0,
      tasks_with_examples: 0
    };

    allTasks.forEach(task => {
      const exampleCount = (task.train?.length || 0) + (task.test?.length || 0);
      stats.total_examples += exampleCount;
      stats.min_examples = Math.min(stats.min_examples, exampleCount);
      stats.max_examples = Math.max(stats.max_examples, exampleCount);
      
      if (exampleCount > 0) {
        stats.tasks_with_examples++;
      }
    });

    stats.avg_examples_per_task = stats.total_examples / allTasks.length;

    return stats;
  }

  /**
   * Report final results
   */
  reportResults() {
    console.log('\n=== PromptMII Postprocessing Results ===');
    console.log(`Total datasets processed: ${this.stats.processedDatasets}`);
    console.log(`Total tasks created: ${this.stats.totalTasks}`);
    console.log(`Total examples: ${this.stats.totalExamples}`);
    console.log(`Skipped datasets: ${this.stats.skippedDatasets}`);
    console.log(`Errors encountered: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\nErrors:');
      this.stats.errors.forEach(error => {
        console.log(`  - ${error.dataset}: ${error.error}`);
      });
    }

    console.log(`\nOutput directory: ${this.config.outputDir}`);
    console.log('Files generated:');
    console.log('  - train.json');
    console.log('  - validation.json');
    console.log('  - test.json');
    console.log('  - training_metadata.json');
    console.log('  - evaluation_metrics.json');
    console.log('\nPostprocessing completed successfully! ✅\n');
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
    
    if (key === 'trainRatio' || key === 'validationRatio' || key === 'testRatio') {
      config[key] = parseFloat(value);
    } else if (key === 'minExamplesPerTask' || key === 'maxExamplesPerTask') {
      config[key] = parseInt(value);
    } else {
      config[key] = value;
    }
  }

  const postprocessor = new PromptMIIPostprocessor(config);
  postprocessor.run().catch(error => {
    console.error('Postprocessing failed:', error.message);
    process.exit(1);
  });
}

module.exports = { PromptMIIPostprocessor };
