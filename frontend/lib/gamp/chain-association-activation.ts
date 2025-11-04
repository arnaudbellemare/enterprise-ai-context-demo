/**
 * Chain Association Activation System
 * 
 * Implements self-supervised learning with gradient optimization for chain association activation.
 * 
 * Features:
 * - Self-supervised learning from path performance
 * - Gradient-based convergence acceleration
 * - Chain association activation with transfer of activation values
 * - Adaptive transfer functions (linear vs nonlinear) determined through trial and error
 * 
 * Based on neural activation propagation principles adapted for knowledge graph paths.
 */

import type { KnowledgeGraph, GraphNode, GraphEdge, Path } from './graph-path-explorer';

export interface ActivationValue {
  nodeId: string;
  activation: number; // 0-1
  gradient: number;
  timestamp: number;
}

export interface ChainAssociation {
  path: Path;
  activationChain: ActivationValue[];
  transferFunction: 'linear' | 'nonlinear';
  performance: number;
  convergence: number;
}

export interface TransferFunctionConfig {
  type: 'linear' | 'nonlinear';
  params: {
    // Linear: y = ax + b
    linear?: {
      a: number; // slope
      b: number; // intercept
    };
    // Nonlinear: y = sigmoid(ax + b) or tanh(ax + b)
    nonlinear?: {
      function: 'sigmoid' | 'tanh' | 'relu';
      a: number;
      b: number;
      threshold?: number;
    };
  };
  performance: number; // Track which function performs better
}

export interface ChainActivationConfig {
  learningRate: number;
  convergenceThreshold: number;
  maxIterations: number;
  enableAdaptiveFunction: boolean;
  initialTransferFunction: 'linear' | 'nonlinear';
  gradientDecay: number;
}

/**
 * Chain Association Activation System
 * 
 * Propagates activation values through graph paths using gradient optimization
 * and adaptive transfer functions.
 */
export class ChainAssociationActivation {
  private config: Required<ChainActivationConfig>;
  private transferFunctions: Map<string, TransferFunctionConfig> = new Map();
  private activationHistory: Map<string, ActivationValue[]> = new Map();
  private performanceHistory: Map<string, number[]> = new Map();
  
  constructor(config: Partial<ChainActivationConfig> = {}) {
    this.config = {
      learningRate: config.learningRate ?? 0.01,
      convergenceThreshold: config.convergenceThreshold ?? 0.001,
      maxIterations: config.maxIterations ?? 100,
      enableAdaptiveFunction: config.enableAdaptiveFunction ?? true,
      initialTransferFunction: config.initialTransferFunction ?? 'linear',
      gradientDecay: config.gradientDecay ?? 0.9,
    };
  }
  
  /**
   * Activate chain associations through graph paths
   * Uses self-supervised learning with gradient optimization
   */
  async activateChainAssociations(
    paths: Path[],
    knowledgeGraph: KnowledgeGraph,
    query: string
  ): Promise<ChainAssociation[]> {
    console.log(`🔗 Chain Association Activation: Processing ${paths.length} paths...`);
    
    const chainAssociations: ChainAssociation[] = [];
    
    for (const path of paths) {
      // Initialize activation values for nodes in path
      const activationChain = this.initializeActivations(path.nodes);
      
      // Perform gradient optimization
      const optimizedChain = await this.optimizeWithGradient(
        activationChain,
        path,
        knowledgeGraph
      );
      
      // Determine optimal transfer function through trial and error
      const transferFunction = this.config.enableAdaptiveFunction
        ? await this.determineOptimalTransferFunction(
            optimizedChain,
            path,
            knowledgeGraph
          )
        : this.config.initialTransferFunction;
      
      // Apply transfer function to propagate activations
      const finalChain = this.applyTransferFunction(
        optimizedChain,
        transferFunction
      );
      
      // Calculate performance and convergence
      const performance = this.calculatePerformance(finalChain, path);
      const convergence = this.calculateConvergence(finalChain);
      
      // Store for self-supervised learning
      this.storeActivationHistory(path, finalChain, performance);
      
      chainAssociations.push({
        path,
        activationChain: finalChain,
        transferFunction,
        performance,
        convergence,
      });
    }
    
    // Self-supervised learning: Update transfer functions based on performance
    if (this.config.enableAdaptiveFunction) {
      this.updateTransferFunctionsFromPerformance(chainAssociations);
    }
    
    console.log(`✅ Chain Activation: ${chainAssociations.length} paths processed, avg convergence: ${chainAssociations.reduce((sum, c) => sum + c.convergence, 0) / chainAssociations.length}`);
    
    return chainAssociations;
  }
  
  /**
   * Initialize activation values for path nodes
   */
  private initializeActivations(nodes: GraphNode[]): ActivationValue[] {
    return nodes.map((node, index) => ({
      nodeId: node.id,
      activation: index === 0 ? 1.0 : 0.5, // Start node fully activated
      gradient: 0,
      timestamp: Date.now(),
    }));
  }
  
  /**
   * Optimize activation values using gradient descent
   * Accelerates convergence through self-supervised learning
   */
  private async optimizeWithGradient(
    activationChain: ActivationValue[],
    path: Path,
    knowledgeGraph: KnowledgeGraph
  ): Promise<ActivationValue[]> {
    let currentChain = [...activationChain];
    let previousPerformance = 0;
    let convergence = 1.0;
    let iterations = 0;
    
    while (convergence > this.config.convergenceThreshold && iterations < this.config.maxIterations) {
      // Calculate gradients for each node
      const gradients = this.calculateGradients(currentChain, path, knowledgeGraph);
      
      // Update activations using gradient descent
      const updatedChain = currentChain.map((activation, index) => {
        const gradient = gradients[index];
        const newActivation = Math.max(0, Math.min(1,
          activation.activation + (gradient * this.config.learningRate)
        ));
        
        return {
          ...activation,
          activation: newActivation,
          gradient: gradient * this.config.gradientDecay, // Decay gradient
        };
      });
      
      // Calculate convergence
      const currentPerformance = this.calculatePerformance(updatedChain, path);
      convergence = Math.abs(currentPerformance - previousPerformance);
      previousPerformance = currentPerformance;
      
      currentChain = updatedChain;
      iterations++;
    }
    
    console.log(`   ✓ Gradient optimization: ${iterations} iterations, convergence: ${convergence.toFixed(4)}`);
    
    return currentChain;
  }
  
  /**
   * Calculate gradients for gradient descent
   */
  private calculateGradients(
    activationChain: ActivationValue[],
    path: Path,
    knowledgeGraph: KnowledgeGraph
  ): number[] {
    const gradients: number[] = [];
    
    for (let i = 0; i < activationChain.length; i++) {
      const current = activationChain[i];
      const previous = i > 0 ? activationChain[i - 1] : null;
      const next = i < activationChain.length - 1 ? activationChain[i + 1] : null;
      
      // Gradient based on:
      // 1. Distance from optimal activation (0.8 for intermediate nodes)
      // 2. Consistency with neighbors (smooth propagation)
      // 3. Path relevance (from path score)
      
      const optimalActivation = i === 0 || i === activationChain.length - 1 ? 1.0 : 0.8;
      const distanceError = current.activation - optimalActivation;
      
      let neighborConsistency = 0;
      if (previous) {
        neighborConsistency += (current.activation - previous.activation) * 0.3;
      }
      if (next) {
        neighborConsistency += (next.activation - current.activation) * 0.3;
      }
      
      const pathRelevance = path.score || 0.5;
      const relevanceBonus = (pathRelevance - 0.5) * 0.2;
      
      // Combined gradient
      const gradient = -distanceError * 0.5 + neighborConsistency + relevanceBonus;
      
      gradients.push(gradient);
    }
    
    return gradients;
  }
  
  /**
   * Determine optimal transfer function through trial and error
   */
  private async determineOptimalTransferFunction(
    activationChain: ActivationValue[],
    path: Path,
    knowledgeGraph: KnowledgeGraph
  ): Promise<'linear' | 'nonlinear'> {
    const pathId = path.nodes.map(n => n.id).join('-');
    
    // Try both functions and compare performance
    const linearResult = this.applyTransferFunction(activationChain, 'linear');
    const nonlinearResult = this.applyTransferFunction(activationChain, 'nonlinear');
    
    const linearPerformance = this.calculatePerformance(linearResult, path);
    const nonlinearPerformance = this.calculatePerformance(nonlinearResult, path);
    
    // Store performance for learning
    if (!this.transferFunctions.has(pathId)) {
      this.transferFunctions.set(pathId, {
        type: 'linear',
        params: {
          linear: { a: 1.0, b: 0 },
          nonlinear: {
            function: 'sigmoid',
            a: 1.0,
            b: 0,
          },
        },
        performance: 0.5,
      });
    }
    
    const config = this.transferFunctions.get(pathId)!;
    
    // Update performance based on trial results
    if (linearPerformance > nonlinearPerformance) {
      config.type = 'linear';
      config.performance = linearPerformance;
    } else {
      config.type = 'nonlinear';
      config.performance = nonlinearPerformance;
    }
    
    console.log(`   🔬 Transfer function: ${config.type} (linear: ${linearPerformance.toFixed(3)}, nonlinear: ${nonlinearPerformance.toFixed(3)})`);
    
    return config.type;
  }
  
  /**
   * Apply transfer function to propagate activation values
   */
  private applyTransferFunction(
    activationChain: ActivationValue[],
    transferFunction: 'linear' | 'nonlinear'
  ): ActivationValue[] {
    return activationChain.map((activation, index) => {
      let transferredActivation = activation.activation;
      
      if (index > 0) {
        const previousActivation = activationChain[index - 1].activation;
        
        if (transferFunction === 'linear') {
          // Linear transfer: y = ax + b
          const a = 0.8; // Propagation factor
          const b = 0.1; // Base activation
          transferredActivation = a * previousActivation + b;
        } else {
          // Nonlinear transfer: sigmoid
          const a = 2.0; // Steepness
          const b = -1.0; // Offset
          const sigmoidInput = a * previousActivation + b;
          transferredActivation = 1 / (1 + Math.exp(-sigmoidInput));
        }
      }
      
      // Combine with current activation (weighted average)
      const combined = 0.7 * transferredActivation + 0.3 * activation.activation;
      
      return {
        ...activation,
        activation: Math.max(0, Math.min(1, combined)),
      };
    });
  }
  
  /**
   * Calculate performance metric for activation chain
   */
  private calculatePerformance(
    activationChain: ActivationValue[],
    path: Path
  ): number {
    // Performance based on:
    // 1. Activation strength (higher is better)
    // 2. Activation smoothness (gradual propagation)
    // 3. Path completeness (all nodes activated)
    
    const avgActivation = activationChain.reduce((sum, a) => sum + a.activation, 0) / activationChain.length;
    
    let smoothness = 1.0;
    for (let i = 1; i < activationChain.length; i++) {
      const diff = Math.abs(activationChain[i].activation - activationChain[i - 1].activation);
      smoothness -= diff * 0.2; // Penalize large jumps
    }
    smoothness = Math.max(0, smoothness);
    
    const completeness = activationChain.filter(a => a.activation > 0.3).length / activationChain.length;
    
    return (avgActivation * 0.4 + smoothness * 0.3 + completeness * 0.3);
  }
  
  /**
   * Calculate convergence metric
   */
  private calculateConvergence(activationChain: ActivationValue[]): number {
    // Convergence = variance in activation values (lower = more converged)
    const avg = activationChain.reduce((sum, a) => sum + a.activation, 0) / activationChain.length;
    const variance = activationChain.reduce((sum, a) => sum + Math.pow(a.activation - avg, 2), 0) / activationChain.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Store activation history for self-supervised learning
   */
  private storeActivationHistory(
    path: Path,
    activationChain: ActivationValue[],
    performance: number
  ): void {
    const pathId = path.nodes.map(n => n.id).join('-');
    
    if (!this.activationHistory.has(pathId)) {
      this.activationHistory.set(pathId, []);
      this.performanceHistory.set(pathId, []);
    }
    
    this.activationHistory.get(pathId)!.push(...activationChain);
    this.performanceHistory.get(pathId)!.push(performance);
    
    // Keep only recent history (last 100 activations)
    const history = this.activationHistory.get(pathId)!;
    if (history.length > 100) {
      this.activationHistory.set(pathId, history.slice(-100));
    }
  }
  
  /**
   * Update transfer functions based on performance history
   * Self-supervised learning component
   */
  private updateTransferFunctionsFromPerformance(
    chainAssociations: ChainAssociation[]
  ): void {
    for (const association of chainAssociations) {
      const pathId = association.path.nodes.map(n => n.id).join('-');
      
      if (!this.transferFunctions.has(pathId)) continue;
      
      const config = this.transferFunctions.get(pathId)!;
      const history = this.performanceHistory.get(pathId) || [];
      
      if (history.length > 10) {
        // Calculate average performance for current function type
        const recentPerformance = history.slice(-10).reduce((sum, p) => sum + p, 0) / 10;
        
        // Update function parameters based on performance
        if (config.type === 'linear') {
          // Adjust linear parameters
          if (recentPerformance < 0.6) {
            config.params.linear!.a += 0.05; // Increase slope
          } else if (recentPerformance > 0.9) {
            config.params.linear!.b += 0.02; // Increase intercept
          }
        } else {
          // Adjust nonlinear parameters
          if (recentPerformance < 0.6) {
            config.params.nonlinear!.a += 0.1; // Increase steepness
          }
        }
        
        config.performance = recentPerformance;
      }
    }
  }
  
  /**
   * Get activation statistics for a path
   */
  getActivationStats(path: Path): {
    avgActivation: number;
    maxActivation: number;
    minActivation: number;
    convergence: number;
    transferFunction: 'linear' | 'nonlinear';
  } {
    const pathId = path.nodes.map(n => n.id).join('-');
    const history = this.activationHistory.get(pathId) || [];
    
    if (history.length === 0) {
      return {
        avgActivation: 0,
        maxActivation: 0,
        minActivation: 0,
        convergence: 1.0,
        transferFunction: 'linear',
      };
    }
    
    const activations = history.map(a => a.activation);
    const config = this.transferFunctions.get(pathId);
    
    return {
      avgActivation: activations.reduce((sum, a) => sum + a, 0) / activations.length,
      maxActivation: Math.max(...activations),
      minActivation: Math.min(...activations),
      convergence: this.calculateConvergence(history),
      transferFunction: config?.type || 'linear',
    };
  }
}

export const chainAssociationActivation = new ChainAssociationActivation();

