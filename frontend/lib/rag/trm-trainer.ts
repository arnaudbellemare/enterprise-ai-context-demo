/**
 * TRM (Tiny Recursive Model) Trainer
 * Implements deep supervision training loop with learned halting as per TRM paper.
 * 
 * Architecture:
 * - deep_recursion(x, y, z) -> (y_new, z_new), y_hat, q_hat
 * - Binary cross-entropy loss for halting (q_hat)
 * - Softmax cross-entropy for predictions (y_hat)
 * - Exponential moving average for stability
 * - Early stopping when q_hat > 0
 */

import * as tf from '@tensorflow/tfjs-node';

export interface TRMTrainingConfig {
  embeddingDim: number;      // Dimension of input embeddings
  hiddenDim: number;         // Hidden dimension for MLP-Mixer
  outputDim: number;         // Output dimension (vocab size or class count)
  numSupervisionSteps: number; // N_supervision steps
  learningRate: number;
  beta1?: number;            // Adam optimizer beta1
  beta2?: number;            // Adam optimizer beta2
  emaDecay?: number;         // Exponential moving average decay
}

export interface TRMTrainingData {
  x: number[][];  // Input embeddings [batch_size, embedding_dim]
  y_true: number[];  // Ground truth labels [batch_size]
}

export interface TRMStepResult {
  y: tf.Tensor;   // Current answer state
  z: tf.Tensor;   // Latent state
  y_hat: tf.Tensor;  // Predicted output
  q_hat: tf.Tensor;  // Halting probability [batch_size, 1]
}

export interface TRMTrainingMetrics {
  step: number;
  loss: number;
  haltingLoss: number;
  predictionLoss: number;
  avgQHat: number;  // Probability of halting
}

/**
 * MLP-Mixer layer (attention-free architecture as per TRM paper)
 */
class MLPMixerLayer extends tf.layers.Layer {
  private hiddenDim: number;
  private expansionFactor: number;

  constructor(config: { hiddenDim: number; expansionFactor?: number; name?: string }) {
    super({ name: config.name || 'mlp_mixer' });
    this.hiddenDim = config.hiddenDim;
    this.expansionFactor = config.expansionFactor || 4;
  }

  build(inputShape: tf.Shape | tf.Shape[]): void {
    const inputDim = (inputShape as tf.Shape[])[0] ? (inputShape as tf.Shape[])[0][1] : (inputShape as tf.Shape)[1];
    if (!inputDim) {
      throw new Error('Cannot determine input dimension from shape');
    }
    
    // Token mixing MLP
    this.addWeight('token_mix_1', [this.hiddenDim, this.hiddenDim * this.expansionFactor], tf.initializers.glorotUniform({}) as any);
    this.addWeight('token_mix_2', [this.hiddenDim * this.expansionFactor, this.hiddenDim], tf.initializers.glorotUniform({}) as any);
    
    // Channel mixing MLP
    this.addWeight('channel_mix_1', [inputDim, inputDim * this.expansionFactor], tf.initializers.glorotUniform({}) as any);
    this.addWeight('channel_mix_2', [inputDim * this.expansionFactor, inputDim], tf.initializers.glorotUniform({}) as any);
    
    this.built = true;
  }

  call(inputs: tf.Tensor | tf.Tensor[], kwargs?: any): tf.Tensor | tf.Tensor[] {
    const input = Array.isArray(inputs) ? inputs[0] : inputs;
    
    // Token mixing (apply MLP to each token independently)
    const tokenMix1 = tf.matMul(input, this.getWeights()[0]);
    const tokenMix1Activated = tf.relu(tokenMix1);
    const tokenMix2 = tf.matMul(tokenMix1Activated, this.getWeights()[1]);
    const tokenMixed = tf.add(input, tokenMix2); // Residual
    
    // Channel mixing (apply MLP across channels)
    const channelMix1 = tf.matMul(tokenMixed, this.getWeights()[2]);
    const channelMix1Activated = tf.relu(channelMix1);
    const channelMix2 = tf.matMul(channelMix1Activated, this.getWeights()[3]);
    const channelMixed = tf.add(tokenMixed, channelMix2); // Residual
    
    return channelMixed;
  }

  getConfig(): tf.serialization.ConfigDict {
    return {
      hiddenDim: this.hiddenDim,
      expansionFactor: this.expansionFactor,
      ...super.getConfig()
    };
  }

  static get className(): string {
    return 'MLPMixerLayer';
  }
}

/**
 * Deep recursion step: (y, z) -> (y_new, z_new), y_hat, q_hat
 */
function deepRecursion(
  x: tf.Tensor,  // Input embedding [batch_size, embedding_dim]
  y: tf.Tensor,  // Current answer state [batch_size, hidden_dim]
  z: tf.Tensor,  // Latent state [batch_size, hidden_dim]
  mixerLayer: MLPMixerLayer,
  outputLayer: tf.layers.Layer,
  haltingLayer: tf.layers.Layer
): TRMStepResult {
  // Concatenate x, y, z
  const combined = tf.concat([x, y, z], 1);  // [batch_size, embedding_dim + 2*hidden_dim]
  
  // Apply MLP-Mixer
  const mixed = mixerLayer.call(combined) as tf.Tensor;
  
  // Split back into y and z updates
  const yzDim = y.shape[1] as number;
  const yUpdate = tf.slice(mixed, [0, 0], [-1, yzDim]);
  const zUpdate = tf.slice(mixed, [0, yzDim], [-1, yzDim]);
  
    // Gated update
    const gate = tf.sigmoid(tf.add(yUpdate, zUpdate));
    const oneMinusGate = tf.sub(tf.scalar(1), gate);
    const yNew = tf.add(tf.mul(gate, yUpdate), tf.mul(oneMinusGate, y));
    const zNew = tf.add(tf.mul(gate, zUpdate), tf.mul(oneMinusGate, z));
  
  // Predict output
  const yHat = outputLayer.call(yNew, {}) as tf.Tensor;
  
  // Predict halting probability
  const qHat = tf.sigmoid(haltingLayer.call(yNew, {}) as tf.Tensor);  // [batch_size, 1]
  
  return { y: yNew, z: zNew, y_hat: yHat, q_hat: qHat };
}

/**
 * TRM Trainer with deep supervision
 */
export class TRMTrainer {
  private config: Required<TRMTrainingConfig>;
  private mixerLayer: MLPMixerLayer;
  private outputLayer: tf.layers.Layer;
  private haltingLayer: tf.layers.Layer;
  private optimizer: tf.Optimizer;
  private emaWeights: Map<string, tf.Tensor> = new Map();
  private emaDecay: number;

  constructor(config: TRMTrainingConfig) {
    this.config = {
      beta1: 0.9,
      beta2: 0.999,
      emaDecay: 0.999,
      ...config
    };
    this.emaDecay = this.config.emaDecay!;

    // Build layers
    const inputDim = config.embeddingDim + 2 * config.hiddenDim;
    this.mixerLayer = new MLPMixerLayer({ hiddenDim: config.hiddenDim, name: 'trm_mixer' });
    this.mixerLayer.build([null, inputDim]);

    this.outputLayer = tf.layers.dense({
      units: config.outputDim,
      activation: 'softmax',
      name: 'trm_output'
    });
    this.outputLayer.build([null, config.hiddenDim]);

    this.haltingLayer = tf.layers.dense({
      units: 1,
      activation: 'linear',  // We apply sigmoid in deepRecursion
      name: 'trm_halting'
    });
    this.haltingLayer.build([null, config.hiddenDim]);

    // Optimizer
    this.optimizer = tf.train.adam(this.config.learningRate, this.config.beta1, this.config.beta2);
  }

  /**
   * Initialize y and z from input
   */
  private initializeState(x: tf.Tensor): { y: tf.Tensor; z: tf.Tensor } {
    const batchSize = x.shape[0] as number;
    const hiddenDim = this.config.hiddenDim;
    
    // Initialize y and z as zeros or small random values
    const y = tf.zeros([batchSize, hiddenDim]);
    const z = tf.zeros([batchSize, hiddenDim]);
    
    return { y, z };
  }

  /**
   * Training step with deep supervision
   */
  async trainStep(
    x: tf.Tensor,      // Input embeddings [batch_size, embedding_dim]
    yTrue: tf.Tensor,  // Ground truth labels [batch_size]
    nSupervision: number
  ): Promise<TRMTrainingMetrics[]> {
    const metrics: TRMTrainingMetrics[] = [];
    const { y: yInit, z: zInit } = this.initializeState(x);
    
    let y = yInit;
    let z = zInit;

    // Deep supervision: compute loss at each step
    for (let step = 0; step < nSupervision; step++) {
      // Forward pass
      const { y: yNew, z: zNew, y_hat, q_hat } = deepRecursion(
        x, y, z,
        this.mixerLayer,
        this.outputLayer,
        this.haltingLayer
      );

      // Convert y_true to one-hot if needed
      const yTrueOneHot = tf.oneHot(yTrue, this.config.outputDim);
      
      // Softmax cross-entropy loss for prediction
      const predictionLoss = tf.losses.softmaxCrossEntropy(yTrueOneHot, y_hat);
      
      // Binary cross-entropy loss for halting
      // Target: 1 if prediction is correct, 0 otherwise
      const isCorrect = tf.equal(tf.argMax(y_hat, 1), yTrue);
      const haltingTarget = tf.cast(isCorrect, 'float32');
      const haltingLoss = tf.losses.sigmoidCrossEntropy(
        haltingTarget,
        q_hat
      );

      // Total loss
      const totalLoss = tf.add(predictionLoss, haltingLoss);

      // Backward pass - compute gradients using tf.tidy
      const variables = [
        ...this.mixerLayer.trainableWeights,
        ...this.outputLayer.trainableWeights,
        ...this.haltingLayer.trainableWeights
      ];
      
      // Compute gradients using tape-based autograd
      // Get all trainable variables as tensors
      const varTensors = variables.map(v => v.read());
      
      // Use tf.grads to compute gradients w.r.t. variables
      const gradFn = tf.grads(() => totalLoss);
      const gradValues = gradFn(varTensors);
      
      // Map gradients to named tensor map
      const variableGrads: tf.NamedTensorMap = {};
      for (let i = 0; i < variables.length; i++) {
        if (gradValues[i]) {
          variableGrads[variables[i].name] = gradValues[i];
        }
        varTensors[i].dispose();
      }
      
      // Apply gradients
      this.optimizer.applyGradients(variableGrads);
      
      // Cleanup gradients
      for (const grad of gradValues) {
        if (grad) grad.dispose();
      }

      // Update EMA weights
      this.updateEMAWeights();

      // Update state
      y = yNew;
      z = zNew;

      // Record metrics
      const [lossVal, haltingLossVal, predLossVal, qHatVal] = await Promise.all([
        totalLoss.data(),
        haltingLoss.data(),
        predictionLoss.data(),
        q_hat.mean().data()
      ]);

      metrics.push({
        step,
        loss: Array.from(lossVal)[0],
        haltingLoss: Array.from(haltingLossVal)[0],
        predictionLoss: Array.from(predLossVal)[0],
        avgQHat: Array.from(qHatVal)[0]
      });

      // Early stopping if q_hat > threshold (halting predicted)
      const shouldHalt = Array.from(await q_hat.mean().data())[0] > 0.5;
      if (shouldHalt) break;

      // Cleanup
      y_hat.dispose();
      q_hat.dispose();
      totalLoss.dispose();
      haltingLoss.dispose();
      predictionLoss.dispose();
      yTrueOneHot.dispose();
    }

    y.dispose();
    z.dispose();
    yInit.dispose();
    zInit.dispose();

    return metrics;
  }

  /**
   * Compute gradients for all trainable variables
   */
  private computeGradients(loss: tf.Tensor): tf.NamedTensorMap {
    // Get all trainable variables
    const variables = [
      ...this.mixerLayer.trainableWeights,
      ...this.outputLayer.trainableWeights,
      ...this.haltingLayer.trainableWeights
    ];

    // Use tf.variableGrads to compute gradients w.r.t. variables
    const varList = variables.map(v => v.read());
    const gradFn = tf.grads(() => loss);
    const grads = gradFn(varList);
    
    const variableGrads: tf.NamedTensorMap = {};
    for (let i = 0; i < variables.length; i++) {
      if (grads[i]) {
        variableGrads[variables[i].name] = grads[i];
      }
      varList[i].dispose();
    }
    
    return variableGrads;
  }

  /**
   * Update exponential moving average of weights
   */
  private updateEMAWeights(): void {
    const variables = [
      ...this.mixerLayer.trainableWeights,
      ...this.outputLayer.trainableWeights,
      ...this.haltingLayer.trainableWeights
    ];

    for (const variable of variables) {
      const name = variable.name;
      const current = variable.read();
      
      if (!this.emaWeights.has(name)) {
        this.emaWeights.set(name, current.clone());
      } else {
        const ema = this.emaWeights.get(name)!;
        const updated = tf.add(
          tf.mul(ema, this.emaDecay),
          tf.mul(current, 1 - this.emaDecay)
        );
        ema.dispose();
        this.emaWeights.set(name, updated);
      }
      current.dispose();
    }
  }

  /**
   * Apply EMA weights (use for inference)
   */
  applyEMAWeights(): void {
    const variables = [
      ...this.mixerLayer.trainableWeights,
      ...this.outputLayer.trainableWeights,
      ...this.haltingLayer.trainableWeights
    ];

    for (const variable of variables) {
      const name = variable.name;
      if (this.emaWeights.has(name)) {
        variable.assign(this.emaWeights.get(name)!);
      }
    }
  }

  /**
   * Save model weights
   */
  async save(path: string): Promise<void> {
    await tf.node.saveModel(
      {
        model: this.buildModelForSave(),
        artifacts: { trainingConfig: this.config }
      },
      path
    );
  }

  /**
   * Build a model structure for saving (TensorFlow.js requires a model)
   */
  private buildModelForSave(): tf.LayersModel {
    const input = tf.input({ shape: [this.config.embeddingDim] });
    // Note: This is a simplified model structure for wake only
    // The actual recursion happens in trainStep
    const output = this.outputLayer.apply(input) as tf.SymbolicTensor;
    return tf.model({ inputs: input, outputs: output });
  }

  /**
   * Load model weights
   */
  async load(path: string): Promise<void> {
    const model = await tf.node.loadLayersModel(`${path}/model.json`);
    // Restore weights to layers
    // (simplified; full implementation would restore all layer weights)
    const outputWeights = model.getLayer('trm_output')?.getWeights();
    if (outputWeights) {
      this.outputLayer.setWeights(outputWeights);
    }
  }

  dispose(): void {
    this.mixerLayer.dispose();
    this.outputLayer.dispose();
    this.haltingLayer.dispose();
    this.optimizer.dispose();
    for (const weight of this.emaWeights.values()) {
      weight.dispose();
    }
    this.emaWeights.clear();
  }
}
