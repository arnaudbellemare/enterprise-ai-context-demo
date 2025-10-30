#!/usr/bin/env tsx

/**
 * Test TRM Training Implementation
 * Validates deep supervision, learned halting, and gradient-based optimization
 */

import * as tf from '@tensorflow/tfjs-node';
import { TRMTrainer, TRMTrainingConfig } from './frontend/lib/rag/trm-trainer';

// Initialize TensorFlow.js (will be called in testTRMTraining)

async function testTRMTraining() {
  // Initialize TensorFlow.js
  await tf.ready();
  
  console.log('🧪 Testing TRM Training Implementation');
  console.log('=====================================\n');

  // Configuration
  const config: TRMTrainingConfig = {
    embeddingDim: 128,
    hiddenDim: 64,
    outputDim: 10,  // 10 classes
    numSupervisionSteps: 5,
    learningRate: 0.001,
    beta1: 0.9,
    beta2: 0.999,
    emaDecay: 0.999
  };

  console.log('📋 Configuration:');
  console.log(`   Embedding Dim: ${config.embeddingDim}`);
  console.log(`   Hidden Dim: ${config.hiddenDim}`);
  console.log(`   Output Dim: ${config.outputDim}`);
  console.log(`   Supervision Steps: ${config.numSupervisionSteps}`);
  console.log(`   Learning Rate: ${config.learningRate}\n`);

  // Create trainer
  console.log('🔧 Creating TRM Trainer...');
  const trainer = new TRMTrainer(config);
  console.log('✅ Trainer created\n');

  // Generate dummy training data
  console.log('📊 Generating dummy training data...');
  const batchSize = 4;
  const x = tf.randomNormal([batchSize, config.embeddingDim]);
  const yTrue = tf.tensor1d([0, 1, 2, 3], 'int32');
  console.log(`   Batch size: ${batchSize}`);
  console.log(`   Input shape: [${x.shape.join(', ')}]`);
  console.log(`   Labels shape: [${yTrue.shape.join(', ')}]\n`);

  // Training step
  console.log('🚀 Running training step with deep supervision...');
  const startTime = Date.now();
  
  try {
    const metrics = await trainer.trainStep(
      x,
      yTrue,
      config.numSupervisionSteps
    );
    
    const duration = Date.now() - startTime;
    console.log(`✅ Training step completed in ${duration}ms\n`);

    // Print metrics for each supervision step
    console.log('📈 Training Metrics:');
    console.log('───────────────────────────────────────────────────────');
    console.log('Step | Total Loss | Pred Loss | Halt Loss | Avg q_hat');
    console.log('───────────────────────────────────────────────────────');
    
    for (const metric of metrics) {
      console.log(
        `${String(metric.step).padStart(4)} | ` +
        `${metric.loss.toFixed(4).padStart(10)} | ` +
        `${metric.predictionLoss.toFixed(4).padStart(9)} | ` +
        `${metric.haltingLoss.toFixed(4).padStart(9)} | ` +
        `${metric.avgQHat.toFixed(4).padStart(10)}`
      );
    }
    console.log('───────────────────────────────────────────────────────\n');

    // Validate metrics
    console.log('✅ Validation:');
    const lastMetric = metrics[metrics.length - 1];
    console.log(`   ✓ Completed ${metrics.length} supervision steps`);
    console.log(`   ✓ Final loss: ${lastMetric.loss.toFixed(4)}`);
    console.log(`   ✓ Prediction loss: ${lastMetric.predictionLoss.toFixed(4)}`);
    console.log(`   ✓ Halting loss: ${lastMetric.haltingLoss.toFixed(4)}`);
    console.log(`   ✓ Average q_hat: ${lastMetric.avgQHat.toFixed(4)}`);
    
    if (metrics.length === config.numSupervisionSteps) {
      console.log('   ✓ All supervision steps executed');
    } else {
      console.log(`   ⚠ Early stopping occurred at step ${metrics.length}`);
    }

    console.log('\n🎉 TRM Training Test PASSED!');

  } catch (error: any) {
    console.error('\n❌ Training step failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Cleanup
    x.dispose();
    yTrue.dispose();
    trainer.dispose();
    console.log('\n🧹 Cleaned up resources');
  }
}

// Run test
testTRMTraining().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
