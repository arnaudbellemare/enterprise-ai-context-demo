/**
 * Comprehensive test suite for Advanced Learning Methods
 * Target Coverage: 90%+
 *
 * Tests cover:
 * - Self-Supervised Learning Framework
 * - Survival Analysis Engine
 * - Core learning methods (contrastive, generative, predictive)
 * - Error handling and edge cases
 * - Type safety validations
 */

// Mock logger - create singleton instance inside factory
jest.mock('../../../lib/walt/logger', () => {
  const mockInstance = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  };

  return {
    createLogger: jest.fn(() => mockInstance),
    __mockLoggerInstance: mockInstance // Export for testing
  };
});

// Then import modules
import {
  SelfSupervisedLearningFramework,
  SurvivalAnalysisEngine,
  type LearningTask,
  type SelfSupervisedConfig,
  type SurvivalData,
  type DataItem,
  type ContrastiveLearningResult,
  type GenerativeLearningResult,
  type PredictiveLearningResult
} from '../../../lib/advanced-learning-methods';

// Get the mock logger instance
const mockLogger = (require('../../../lib/walt/logger') as any).__mockLoggerInstance;

describe('SelfSupervisedLearningFramework', () => {
  let framework: SelfSupervisedLearningFramework;
  let config: SelfSupervisedConfig;
  let sampleTask: LearningTask;

  beforeEach(() => {
    jest.clearAllMocks();

    config = {
      learningRate: 0.001,
      batchSize: 32,
      epochs: 10,
      regularization: 0.01,
      augmentation: true
    };

    framework = new SelfSupervisedLearningFramework(config);

    sampleTask = {
      id: 'test-task-001',
      type: 'contrastive',
      data: [
        { id: 1, value: 'item1', features: [0.1, 0.2, 0.3] },
        { id: 2, value: 'item2', features: [0.4, 0.5, 0.6] },
        { id: 3, value: 'item3', features: [0.7, 0.8, 0.9] },
        { id: 4, value: 'item4', features: [1.0, 1.1, 1.2] }
      ],
      metadata: {
        created: Date.now(),
        version: '1.0'
      }
    };
  });

  describe('Initialization', () => {
    it('should initialize framework with provided config', () => {
      expect(framework).toBeInstanceOf(SelfSupervisedLearningFramework);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Self-Supervised Learning Framework initialized',
        { config }
      );
    });

    it('should handle different configuration values', () => {
      const customConfig: SelfSupervisedConfig = {
        learningRate: 0.01,
        batchSize: 64,
        epochs: 20,
        regularization: 0.05,
        augmentation: false
      };

      const customFramework = new SelfSupervisedLearningFramework(customConfig);

      expect(customFramework).toBeInstanceOf(SelfSupervisedLearningFramework);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Self-Supervised Learning Framework initialized',
        { config: customConfig }
      );
    });
  });

  describe('Contrastive Learning', () => {
    it('should successfully perform contrastive learning', async () => {
      // Act
      const result: ContrastiveLearningResult = await framework.contrastiveLearning(sampleTask);

      // Assert
      expect(result.taskId).toBe('test-task-001');
      expect(result.loss).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeGreaterThan(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
      expect(result.representations).toBeDefined();
      expect(result.representations.taskId).toBe('test-task-001');
      expect(result.representations.dimensions).toBe(128);
      expect(result.methodology).toHaveLength(4);
      expect(result.methodology[0]).toContain('Contrastive Learning');

      // Verify logger was called
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting contrastive learning',
        { taskId: 'test-task-001' }
      );
    });

    it('should handle empty data arrays in contrastive learning', async () => {
      // Arrange
      const emptyTask: LearningTask = {
        ...sampleTask,
        data: []
      };

      // Act
      const result = await framework.contrastiveLearning(emptyTask);

      // Assert
      expect(result.taskId).toBe('test-task-001');
      expect(result.loss).toBeGreaterThanOrEqual(0);
    });

    it('should handle single item in data array', async () => {
      // Arrange
      const singleItemTask: LearningTask = {
        ...sampleTask,
        data: [{ id: 1, value: 'single', features: [0.1] }]
      };

      // Act
      const result = await framework.contrastiveLearning(singleItemTask);

      // Assert
      expect(result.taskId).toBe('test-task-001');
      expect(result.representations).toBeDefined();
    });

    it('should produce valid representations for contrastive learning', async () => {
      // Act
      const result = await framework.contrastiveLearning(sampleTask);

      // Assert
      expect(result.representations.loss).toBe(result.loss);
      expect(result.representations.quality).toBe(1 - result.loss);
      expect(result.representations.quality).toBeGreaterThanOrEqual(0);
      expect(result.representations.quality).toBeLessThanOrEqual(1);
      expect(result.representations.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should include methodology explanation', async () => {
      // Act
      const result = await framework.contrastiveLearning(sampleTask);

      // Assert
      expect(result.methodology).toContain(
        'Contrastive Learning: Learn by contrasting positive/negative pairs'
      );
      expect(result.methodology).toContain('Representation Learning: Extract meaningful features');
      expect(result.methodology).toContain('Self-Supervision: No external labels required');
      expect(result.methodology).toContain('Similarity Learning: Optimize similarity metrics');
    });
  });

  describe('Generative Learning', () => {
    it('should successfully perform generative learning', async () => {
      // Act
      const result: GenerativeLearningResult = await framework.generativeLearning(sampleTask);

      // Assert
      expect(result.taskId).toBe('test-task-001');
      expect(result.reconstructionLoss).toBeGreaterThanOrEqual(0);
      expect(result.diversityScore).toBeGreaterThan(0);
      expect(result.diversityScore).toBeLessThanOrEqual(1);
      expect(result.representations).toBeDefined();
      expect(result.methodology).toHaveLength(4);
      expect(result.methodology[0]).toContain('Generative Learning');

      // Verify logger was called
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting generative learning',
        { taskId: 'test-task-001' }
      );
    });

    it('should handle empty data in generative learning', async () => {
      // Arrange
      const emptyTask: LearningTask = {
        ...sampleTask,
        data: []
      };

      // Act
      const result = await framework.generativeLearning(emptyTask);

      // Assert
      expect(result.taskId).toBe('test-task-001');
      expect(result.reconstructionLoss).toBeGreaterThanOrEqual(0);
    });

    it('should produce valid diversity scores', async () => {
      // Act
      const result = await framework.generativeLearning(sampleTask);

      // Assert
      // Diversity score should be high (0.2-1.0 range based on implementation)
      expect(result.diversityScore).toBeGreaterThanOrEqual(0.2);
      expect(result.diversityScore).toBeLessThanOrEqual(1.0);
    });

    it('should include methodology explanation for generative learning', async () => {
      // Act
      const result = await framework.generativeLearning(sampleTask);

      // Assert
      expect(result.methodology).toContain(
        'Generative Learning: Learn by generating and reconstructing'
      );
      expect(result.methodology).toContain('Autoencoder Architecture: Encoder-decoder framework');
      expect(result.methodology).toContain('Reconstruction Loss: Minimize reconstruction error');
      expect(result.methodology).toContain('Latent Space Learning: Learn compressed representations');
    });
  });

  describe('Predictive Learning', () => {
    it('should successfully perform predictive learning', async () => {
      // Act
      const result: PredictiveLearningResult = await framework.predictiveLearning(sampleTask);

      // Assert
      expect(result.taskId).toBe('test-task-001');
      expect(result.predictionLoss).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeGreaterThan(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
      expect(result.representations).toBeDefined();
      expect(result.methodology).toHaveLength(4);
      expect(result.methodology[0]).toContain('Predictive Learning');

      // Verify logger was called
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting predictive learning',
        { taskId: 'test-task-001' }
      );
    });

    it('should handle empty data in predictive learning', async () => {
      // Arrange
      const emptyTask: LearningTask = {
        ...sampleTask,
        data: []
      };

      // Act
      const result = await framework.predictiveLearning(emptyTask);

      // Assert
      expect(result.taskId).toBe('test-task-001');
      expect(result.predictionLoss).toBeGreaterThanOrEqual(0);
    });

    it('should produce high accuracy predictions', async () => {
      // Act
      const result = await framework.predictiveLearning(sampleTask);

      // Assert
      // Accuracy should be high (0.7-1.0 range based on implementation)
      expect(result.accuracy).toBeGreaterThanOrEqual(0.7);
      expect(result.accuracy).toBeLessThanOrEqual(1.0);
    });

    it('should include methodology explanation for predictive learning', async () => {
      // Act
      const result = await framework.predictiveLearning(sampleTask);

      // Assert
      expect(result.methodology).toContain(
        'Predictive Learning: Learn by predicting missing data'
      );
      expect(result.methodology).toContain('Masked Language Modeling: Predict masked tokens');
      expect(result.methodology).toContain('Future Prediction: Predict next sequences');
      expect(result.methodology).toContain('Self-Supervision: Use data itself as supervision');
    });
  });

  describe('Edge Cases and Data Handling', () => {
    it('should handle data items without features', async () => {
      // Arrange
      const noFeaturesTask: LearningTask = {
        ...sampleTask,
        data: [
          { id: 1, value: 'item1' },
          { id: 2, value: 'item2' }
        ]
      };

      // Act
      const result = await framework.contrastiveLearning(noFeaturesTask);

      // Assert
      expect(result.taskId).toBe('test-task-001');
      expect(result.loss).toBeGreaterThanOrEqual(0);
    });

    it('should handle data items with additional properties', async () => {
      // Arrange
      const extendedTask: LearningTask = {
        ...sampleTask,
        data: [
          { id: 1, value: 'item1', features: [0.1], customProp: 'custom', timestamp: Date.now() },
          { id: 2, value: 'item2', features: [0.2], customProp: 'custom2', timestamp: Date.now() }
        ]
      };

      // Act
      const result = await framework.generativeLearning(extendedTask);

      // Assert
      expect(result.taskId).toBe('test-task-001');
      expect(result.reconstructionLoss).toBeGreaterThanOrEqual(0);
    });

    it('should handle large datasets', async () => {
      // Arrange
      const largeDataTask: LearningTask = {
        ...sampleTask,
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: `item${i}`,
          features: Array.from({ length: 10 }, () => Math.random())
        }))
      };

      // Act
      const result = await framework.contrastiveLearning(largeDataTask);

      // Assert
      expect(result.taskId).toBe('test-task-001');
      expect(result.loss).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeGreaterThan(0);
    });

    it('should handle task metadata correctly', async () => {
      // Arrange
      const taskWithMetadata: LearningTask = {
        ...sampleTask,
        metadata: {
          created: Date.now() - 10000,
          updated: Date.now(),
          version: '2.1',
          author: 'test-system',
          customField: { nested: 'value' }
        }
      };

      // Act
      const result = await framework.predictiveLearning(taskWithMetadata);

      // Assert
      expect(result.taskId).toBe('test-task-001');
      expect(result.representations).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should maintain proper type structure for DataItem', () => {
      const item: DataItem = {
        id: 'test-id',
        value: 'test-value',
        features: [1, 2, 3],
        customProp: 'allowed'
      };

      expect(item.id).toBeDefined();
      expect(item.features).toHaveLength(3);
    });

    it('should maintain proper type structure for LearningTask', () => {
      const task: LearningTask = {
        id: 'task-id',
        type: 'contrastive',
        data: [{ id: 1 }],
        labels: ['label1', 'label2'],
        metadata: {
          created: Date.now()
        }
      };

      expect(task.type).toBe('contrastive');
      expect(task.labels).toHaveLength(2);
    });
  });
});

describe('SurvivalAnalysisEngine', () => {
  let engine: SurvivalAnalysisEngine;
  let sampleData: SurvivalData[];

  beforeEach(() => {
    jest.clearAllMocks();

    engine = new SurvivalAnalysisEngine();

    sampleData = [
      {
        id: 'patient-001',
        time: 12.5,
        event: true,
        covariates: { age: 45, treatment: 1, stage: 2 }
      },
      {
        id: 'patient-002',
        time: 24.3,
        event: false,
        covariates: { age: 62, treatment: 0, stage: 3 }
      },
      {
        id: 'patient-003',
        time: 8.7,
        event: true,
        covariates: { age: 38, treatment: 1, stage: 1 }
      },
      {
        id: 'patient-004',
        time: 36.2,
        event: false,
        covariates: { age: 55, treatment: 1, stage: 2 }
      }
    ];
  });

  describe('Initialization', () => {
    it('should initialize survival analysis engine', () => {
      expect(engine).toBeInstanceOf(SurvivalAnalysisEngine);
      expect(mockLogger.info).toHaveBeenCalledWith('Survival Analysis Engine initialized');
    });
  });

  describe('Cox Proportional Hazards Model', () => {
    it('should successfully fit Cox model', async () => {
      // Arrange
      const covariates = ['age', 'treatment', 'stage'];

      // Act
      const result = await engine.fitCoxModel(sampleData, covariates);

      // Assert
      expect(result.modelType).toBe('cox');
      expect(result.coefficients).toBeDefined();
      expect(result.hazardRatios).toBeDefined();
      expect(result.pValues).toBeDefined();
      expect(result.concordanceIndex).toBeDefined();
      expect(result.methodology).toHaveLength(4);
      expect(result.methodology[0]).toContain('Cox Regression');

      // Verify logger was called
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Fitting Cox Proportional Hazards model',
        {
          sampleSize: sampleData.length,
          covariates: covariates.length
        }
      );
    });

    it('should handle empty covariate list', async () => {
      // Act
      const result = await engine.fitCoxModel(sampleData, []);

      // Assert
      expect(result.modelType).toBe('cox');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Fitting Cox Proportional Hazards model',
        {
          sampleSize: sampleData.length,
          covariates: 0
        }
      );
    });

    it('should handle small datasets', async () => {
      // Arrange
      const smallData = [sampleData[0]];

      // Act
      const result = await engine.fitCoxModel(smallData, ['age']);

      // Assert
      expect(result.modelType).toBe('cox');
    });
  });

  describe('Kaplan-Meier Analysis', () => {
    it('should successfully perform Kaplan-Meier analysis', async () => {
      // Act
      const result = await engine.kaplanMeierAnalysis(sampleData);

      // Assert
      expect(result.survivalTimes).toBeDefined();
      expect(result.survivalProbabilities).toBeDefined();
      expect(result.medianSurvivalTime).toBeDefined();
      expect(result.confidenceIntervals).toBeDefined();
      expect(result.methodology).toHaveLength(4);
      expect(result.methodology[0]).toContain('Kaplan-Meier');

      // Verify logger was called
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Performing Kaplan-Meier survival analysis',
        { sampleSize: sampleData.length }
      );
    });

    it('should handle empty survival data', async () => {
      // Act
      const result = await engine.kaplanMeierAnalysis([]);

      // Assert
      expect(result.survivalTimes).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Performing Kaplan-Meier survival analysis',
        { sampleSize: 0 }
      );
    });
  });

  describe('Parametric Survival Models', () => {
    it('should fit Weibull distribution model', async () => {
      // Act
      const result = await engine.parametricSurvivalModel(sampleData, 'weibull');

      // Assert
      expect(result.distribution).toBe('weibull');
      expect(result.parameters).toBeDefined();
      expect(result.logLikelihood).toBeDefined();
      expect(result.aic).toBeDefined();
      expect(result.hazardFunction).toBeDefined();
      expect(result.survivalFunction).toBeDefined();
      expect(result.methodology).toHaveLength(4);

      // Verify logger was called
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Fitting parametric survival model',
        {
          distribution: 'weibull',
          sampleSize: sampleData.length
        }
      );
    });

    it('should fit exponential distribution model', async () => {
      // Act
      const result = await engine.parametricSurvivalModel(sampleData, 'exponential');

      // Assert
      expect(result.distribution).toBe('exponential');
      expect(result.parameters).toBeDefined();
    });

    it('should fit log-normal distribution model', async () => {
      // Act
      const result = await engine.parametricSurvivalModel(sampleData, 'log-normal');

      // Assert
      expect(result.distribution).toBe('log-normal');
      expect(result.parameters).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle all events occurred (no censoring)', async () => {
      // Arrange
      const allEventsData: SurvivalData[] = sampleData.map(d => ({
        ...d,
        event: true
      }));

      // Act
      const result = await engine.kaplanMeierAnalysis(allEventsData);

      // Assert
      expect(result.survivalProbabilities).toBeDefined();
    });

    it('should handle all censored (no events)', async () => {
      // Arrange
      const allCensoredData: SurvivalData[] = sampleData.map(d => ({
        ...d,
        event: false
      }));

      // Act
      const result = await engine.kaplanMeierAnalysis(allCensoredData);

      // Assert
      expect(result.survivalTimes).toBeDefined();
    });

    it('should handle survival data with many covariates', async () => {
      // Arrange
      const complexData: SurvivalData[] = sampleData.map((d, i) => ({
        ...d,
        covariates: {
          age: 40 + i * 5,
          treatment: i % 2,
          stage: (i % 3) + 1,
          biomarker1: Math.random(),
          biomarker2: Math.random(),
          biomarker3: Math.random()
        }
      }));

      const covariates = ['age', 'treatment', 'stage', 'biomarker1', 'biomarker2', 'biomarker3'];

      // Act
      const result = await engine.fitCoxModel(complexData, covariates);

      // Assert
      expect(result.coefficients).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Fitting Cox Proportional Hazards model',
        {
          sampleSize: complexData.length,
          covariates: 6
        }
      );
    });
  });

  describe('Type Safety', () => {
    it('should maintain proper type structure for SurvivalData', () => {
      const data: SurvivalData = {
        id: 'patient-id',
        time: 15.5,
        event: true,
        covariates: {
          age: 50,
          treatment: 1
        }
      };

      expect(data.time).toBeGreaterThan(0);
      expect(data.event).toBe(true);
      expect(Object.keys(data.covariates).length).toBe(2);
    });
  });
});

// Export for coverage reporting
export {
  SelfSupervisedLearningFramework,
  SurvivalAnalysisEngine
};
