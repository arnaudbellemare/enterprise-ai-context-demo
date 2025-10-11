/**
 * Fluid Benchmarking - TypeScript Implementation
 * Based on AllenAI's fluid-benchmarking (Python) adapted for our system
 * 
 * Reference: https://github.com/allenai/fluid-benchmarking
 * Paper: https://arxiv.org/abs/2509.11106
 * 
 * Use IRT to:
 * 1. Estimate extraction method ability
 * 2. Detect mislabeled test cases
 * 3. Adaptively select most informative test items
 * 4. Provide rigorous, scientific evaluation
 */

export interface IRTItem {
  id: string;
  text: string;
  expected_entities: Array<{
    type: string;
    name: string;
    properties?: Record<string, any>;
  }>;
  difficulty: number;       // -3 to 3 (0 = average difficulty)
  discrimination: number;   // 0 to 3 (higher = better separator)
  mislabeled_probability?: number;
}

export interface ExtractionAbility {
  method: string;
  theta: number;           // Ability estimate (-3 to 3)
  standard_error: number;  // Uncertainty in estimate
  num_items_tested: number;
  confidence_interval_95: [number, number];
}

export interface FluidBenchmarkingResult {
  method: string;
  final_ability: number;
  standard_error: number;
  items_administered: number;
  items_correct: number;
  accuracy: number;
  administered_items: string[];
  ability_estimate: ExtractionAbility;
  mislabeled_items?: IRTItem[];
  processing_time_ms: number;
}

export class FluidBenchmarking {
  private testItems: IRTItem[];
  private responseHistory: Map<string, Array<[IRTItem, boolean]>>;

  constructor(testItems: IRTItem[] = []) {
    this.testItems = testItems;
    this.responseHistory = new Map();
  }

  /**
   * 2PL IRT Model: Calculate probability of correct response
   * 
   * P(correct) = 1 / (1 + exp(-discrimination × (ability - difficulty)))
   * 
   * This is the mathematical foundation of IRT
   */
  probabilityCorrect(
    ability: number,
    difficulty: number,
    discrimination: number
  ): number {
    const exponent = -discrimination * (ability - difficulty);
    return 1.0 / (1.0 + Math.exp(exponent));
  }

  /**
   * Estimate ability using Maximum A Posteriori (MAP)
   * Uses Newton-Raphson optimization
   */
  estimateAbility(
    responses: Array<[IRTItem, boolean]>,
    method: 'map' | 'ml' = 'map'
  ): ExtractionAbility {
    if (responses.length === 0) {
      return {
        method: 'unknown',
        theta: 0.0,
        standard_error: 1.0,
        num_items_tested: 0,
        confidence_interval_95: [-1.96, 1.96]
      };
    }

    let theta = 0.0; // Start at average ability

    // Newton-Raphson optimization (max 20 iterations)
    for (let iteration = 0; iteration < 20; iteration++) {
      let gradient = 0.0;
      let hessian = 0.0;

      // Calculate gradient and hessian
      for (const [item, correct] of responses) {
        const p = this.probabilityCorrect(theta, item.difficulty, item.discrimination);

        // Gradient (first derivative of log-likelihood)
        if (correct) {
          gradient += item.discrimination * (1 - p);
        } else {
          gradient -= item.discrimination * p;
        }

        // Hessian (second derivative)
        hessian -= Math.pow(item.discrimination, 2) * p * (1 - p);
      }

      // Add prior for MAP estimation
      if (method === 'map') {
        gradient -= theta;  // Normal(0, 1) prior
        hessian -= 1.0;
      }

      // Newton-Raphson update
      if (Math.abs(hessian) > 1e-6) {
        const theta_new = theta - gradient / hessian;

        // Check convergence
        if (Math.abs(theta_new - theta) < 1e-4) {
          theta = theta_new;
          break;
        }

        theta = theta_new;
      }
    }

    // Calculate Fisher Information for standard error
    let fisherInfo = 0;
    for (const [item, _] of responses) {
      const p = this.probabilityCorrect(theta, item.difficulty, item.discrimination);
      fisherInfo += Math.pow(item.discrimination, 2) * p * (1 - p);
    }

    const standardError = fisherInfo > 0 ? 1.0 / Math.sqrt(fisherInfo) : 1.0;

    // 95% confidence interval
    const ci95: [number, number] = [
      theta - 1.96 * standardError,
      theta + 1.96 * standardError
    ];

    return {
      method: responses[0][0].id.split('-')[0],
      theta,
      standard_error: standardError,
      num_items_tested: responses.length,
      confidence_interval_95: ci95
    };
  }

  /**
   * Select next item for maximum information (Fisher Information)
   * 
   * Fisher Information is maximized when item difficulty ≈ current ability
   */
  selectNextItem(
    currentAbility: ExtractionAbility,
    administeredIds: string[]
  ): IRTItem | null {
    const availableItems = this.testItems.filter(
      item => !administeredIds.includes(item.id)
    );

    if (availableItems.length === 0) {
      return null;
    }

    // Calculate Fisher Information for each available item
    const itemInformation = availableItems.map(item => {
      const p = this.probabilityCorrect(
        currentAbility.theta,
        item.difficulty,
        item.discrimination
      );
      
      // Fisher Information: I(θ) = a² × p × (1-p)
      const info = Math.pow(item.discrimination, 2) * p * (1 - p);
      
      return { item, info };
    });

    // Sort by information (descending)
    itemInformation.sort((a, b) => b.info - a.info);

    // Return item with maximum information
    return itemInformation[0].item;
  }

  /**
   * Run adaptive fluid benchmarking
   */
  async fluidBenchmarking(
    extractionMethod: string,
    testFunction: (item: IRTItem) => Promise<boolean>,
    options: {
      start_ability?: number;
      n_max?: number;
      estimation_method?: 'map' | 'ml';
      early_stop_threshold?: number;
    } = {}
  ): Promise<FluidBenchmarkingResult> {
    const {
      start_ability = 0.0,
      n_max = 100,
      estimation_method = 'map',
      early_stop_threshold = 0.3
    } = options;

    const startTime = Date.now();

    console.log(`🧪 Starting Fluid Benchmarking for: ${extractionMethod}`);

    let currentAbility: ExtractionAbility = {
      method: extractionMethod,
      theta: start_ability,
      standard_error: 1.0,
      num_items_tested: 0,
      confidence_interval_95: [start_ability - 1.96, start_ability + 1.96]
    };

    const responses: Array<[IRTItem, boolean]> = [];
    const administeredIds: string[] = [];

    // Adaptive testing loop
    for (let i = 0; i < n_max; i++) {
      // Select next most informative item
      const nextItem = this.selectNextItem(currentAbility, administeredIds);

      if (nextItem === null) {
        console.log(`  All items exhausted at iteration ${i}`);
        break;
      }

      // Administer item (test extraction)
      const isCorrect = await testFunction(nextItem);

      responses.push([nextItem, isCorrect]);
      administeredIds.push(nextItem.id);

      // Update ability estimate
      currentAbility = this.estimateAbility(responses, estimation_method);

      console.log(
        `  Item ${i + 1}: ${nextItem.id} - ${isCorrect ? '✓' : '✗'} ` +
        `(difficulty: ${nextItem.difficulty.toFixed(2)}, ` +
        `ability: ${currentAbility.theta.toFixed(2)} ± ${currentAbility.standard_error.toFixed(2)})`
      );

      // Early stopping if high confidence
      if (currentAbility.standard_error < early_stop_threshold && i >= 10) {
        console.log(
          `  Early stop: High confidence achieved ` +
          `(SE: ${currentAbility.standard_error.toFixed(2)})`
        );
        break;
      }
    }

    const processingTime = Date.now() - startTime;

    // Store responses for mislabel detection
    this.responseHistory.set(extractionMethod, responses);

    return {
      method: extractionMethod,
      final_ability: currentAbility.theta,
      standard_error: currentAbility.standard_error,
      items_administered: administeredIds.length,
      items_correct: responses.filter(([_, correct]) => correct).length,
      accuracy: responses.filter(([_, c]) => c).length / responses.length,
      administered_items: administeredIds,
      ability_estimate: currentAbility,
      processing_time_ms: processingTime
    };
  }

  /**
   * Identify potentially mislabeled items
   * 
   * Mislabeled items show unexpected response patterns:
   * - Models fail when IRT predicts success
   * - Models succeed when IRT predicts failure
   */
  identifyMislabeledItems(threshold: number = 0.3): IRTItem[] {
    const mislabeled: IRTItem[] = [];

    for (const item of this.testItems) {
      const itemResponses: Array<[number, boolean]> = [];

      // Collect all responses to this item across methods
      for (const [method, responses] of this.responseHistory.entries()) {
        const ability = this.estimateAbility(responses);
        const response = responses.find(([r, _]) => r.id === item.id);
        
        if (response) {
          itemResponses.push([ability.theta, response[1]]);
        }
      }

      if (itemResponses.length === 0) continue;

      // Calculate expected vs actual discrepancy
      const discrepancies = itemResponses.map(([ability, correct]) => {
        const expectedP = this.probabilityCorrect(
          ability,
          item.difficulty,
          item.discrimination
        );
        const actual = correct ? 1 : 0;
        return Math.abs(expectedP - actual);
      });

      const avgDiscrepancy = 
        discrepancies.reduce((a, b) => a + b, 0) / discrepancies.length;

      // Flag if discrepancy exceeds threshold
      if (avgDiscrepancy > threshold) {
        mislabeled.push({
          ...item,
          mislabeled_probability: avgDiscrepancy
        });
      }
    }

    // Sort by mislabeling probability (descending)
    return mislabeled.sort(
      (a, b) => (b.mislabeled_probability || 0) - (a.mislabeled_probability || 0)
    );
  }

  /**
   * Get ability interpretation in plain English
   */
  interpretAbility(theta: number): string {
    if (theta > 2.0) return 'Exceptional (top 2%)';
    if (theta > 1.5) return 'Excellent (top 7%)';
    if (theta > 1.0) return 'Very Good (top 16%)';
    if (theta > 0.5) return 'Good (top 31%)';
    if (theta > 0.0) return 'Above Average (top 50%)';
    if (theta > -0.5) return 'Below Average (bottom 50%)';
    if (theta > -1.0) return 'Poor (bottom 31%)';
    return 'Very Poor (bottom 16%)';
  }

  /**
   * Calculate expected accuracy for given difficulty range
   */
  expectedAccuracy(
    ability: number,
    difficultyRange: [number, number],
    avgDiscrimination: number = 1.5
  ): number {
    // Sample difficulties in range
    const difficulties = [];
    for (let d = difficultyRange[0]; d <= difficultyRange[1]; d += 0.1) {
      difficulties.push(d);
    }

    // Calculate average probability
    const probabilities = difficulties.map(d =>
      this.probabilityCorrect(ability, d, avgDiscrimination)
    );

    return probabilities.reduce((a, b) => a + b, 0) / probabilities.length;
  }
}

/**
 * Create default test dataset for entity extraction
 */
export function createDefaultTestDataset(): IRTItem[] {
  return [
    // ===== EASY ITEMS (difficulty: -1.5 to -0.5) =====
    {
      id: 'easy-1',
      text: 'Sarah is working on the AI project.',
      expected_entities: [
        { type: 'person', name: 'Sarah' },
        { type: 'project', name: 'AI project' }
      ],
      difficulty: -1.0,
      discrimination: 1.5
    },
    {
      id: 'easy-2',
      text: 'John leads the Sales Dashboard project.',
      expected_entities: [
        { type: 'person', name: 'John' },
        { type: 'project', name: 'Sales Dashboard' }
      ],
      difficulty: -0.8,
      discrimination: 1.2
    },
    {
      id: 'easy-3',
      text: 'The Engineering team is implementing automation.',
      expected_entities: [
        { type: 'organization', name: 'Engineering team' },
        { type: 'concept', name: 'automation' }
      ],
      difficulty: -0.6,
      discrimination: 1.3
    },

    // ===== MEDIUM ITEMS (difficulty: -0.5 to 0.5) =====
    {
      id: 'medium-1',
      text: 'The Q3 2024 optimization initiative, led by Dr. Smith, improved efficiency by 40%.',
      expected_entities: [
        { type: 'person', name: 'Dr. Smith' },
        { type: 'project', name: 'optimization initiative' },
        { type: 'concept', name: 'efficiency' }
      ],
      difficulty: 0.0,
      discrimination: 1.8
    },
    {
      id: 'medium-2',
      text: 'Sarah collaborates with the engineering team on implementing machine learning algorithms for the analytics platform.',
      expected_entities: [
        { type: 'person', name: 'Sarah' },
        { type: 'organization', name: 'engineering team' },
        { type: 'concept', name: 'machine learning' },
        { type: 'project', name: 'analytics platform' }
      ],
      difficulty: 0.3,
      discrimination: 1.6
    },
    {
      id: 'medium-3',
      text: 'The API refactoring project started in January 2024 and is now 75% complete.',
      expected_entities: [
        { type: 'project', name: 'API refactoring' },
        { type: 'event', name: 'January 2024' }
      ],
      difficulty: 0.2,
      discrimination: 1.4
    },

    // ===== HARD ITEMS (difficulty: 0.5 to 1.5) =====
    {
      id: 'hard-1',
      text: 'Invoice #INV-2024-0045 dated January 15, 2024, from Acme Corporation (123 Business St, San Francisco, CA 94105) to TechStart Inc. for professional consulting services. Total amount: $12,450.75 (including $2,245.75 in taxes). Payment terms: Net 30 days.',
      expected_entities: [
        { type: 'document', name: 'INV-2024-0045' },
        { type: 'organization', name: 'Acme Corporation' },
        { type: 'organization', name: 'TechStart Inc' },
        { type: 'concept', name: 'consulting services' }
      ],
      difficulty: 1.0,
      discrimination: 2.0
    },
    {
      id: 'hard-2',
      text: 'Patient Jane Doe (DOB: 03/15/1985, MRN: 12345678) presents with progressive dyspnea on exertion. PMH: Type 2 Diabetes Mellitus (2015), Hypertension (2018). Medications: Metformin 1000mg BID, Lisinopril 20mg daily.',
      expected_entities: [
        { type: 'person', name: 'Jane Doe' },
        { type: 'concept', name: 'dyspnea' },
        { type: 'concept', name: 'Type 2 Diabetes Mellitus' },
        { type: 'concept', name: 'Hypertension' }
      ],
      difficulty: 1.2,
      discrimination: 2.1
    },
    {
      id: 'hard-3',
      text: 'The polymorphic implementation of the visitor pattern leverages dependency injection via the abstract factory, enabling runtime strategy selection for AST traversal.',
      expected_entities: [
        { type: 'concept', name: 'visitor pattern' },
        { type: 'concept', name: 'dependency injection' },
        { type: 'concept', name: 'abstract factory' },
        { type: 'concept', name: 'AST traversal' }
      ],
      difficulty: 1.5,
      discrimination: 2.2
    },

    // ===== VERY HARD ITEMS (difficulty: 1.5+) =====
    {
      id: 'very-hard-1',
      text: 'The heterogeneous computing paradigm necessitates abstraction layers that encapsulate SIMD vectorization, thread-level parallelism, and memory coalescing strategies within a unified programming model that maintains portability across CUDA, OpenCL, and SYCL backends.',
      expected_entities: [
        { type: 'concept', name: 'heterogeneous computing' },
        { type: 'concept', name: 'SIMD vectorization' },
        { type: 'concept', name: 'thread-level parallelism' },
        { type: 'concept', name: 'memory coalescing' },
        { type: 'concept', name: 'CUDA' },
        { type: 'concept', name: 'OpenCL' },
        { type: 'concept', name: 'SYCL' }
      ],
      difficulty: 2.0,
      discrimination: 1.8
    }
  ];
}

/**
 * Test extraction method on a specific item
 */
export async function testExtractionOnItem(
  method: 'knowledge_graph' | 'langstruct' | 'smart_extract',
  item: IRTItem,
  userId: string = 'eval-user'
): Promise<boolean> {
  try {
    const endpoint = method === 'knowledge_graph' 
      ? '/api/entities/extract'
      : method === 'langstruct'
      ? '/api/smart-extract'
      : '/api/smart-extract';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: item.text,
        userId,
        options: method === 'langstruct' ? { forceMethod: 'langstruct' } : {}
      })
    });

    if (!response.ok) {
      console.warn(`Extraction failed for ${item.id}: ${response.status}`);
      return false;
    }

    const result = await response.json();
    const extractedEntities = result.entities || [];

    // Calculate match score
    let matchCount = 0;
    for (const expected of item.expected_entities) {
      const found = extractedEntities.some((extracted: any) => {
        const typeMatch = extracted.type === expected.type;
        const nameMatch = extracted.name?.toLowerCase().includes(
          expected.name.toLowerCase()
        );
        return typeMatch && nameMatch;
      });

      if (found) matchCount++;
    }

    // Consider correct if >= 70% of expected entities found
    const matchRate = matchCount / item.expected_entities.length;
    return matchRate >= 0.7;

  } catch (error) {
    console.error(`Test extraction error for ${item.id}:`, error);
    return false;
  }
}

/**
 * Comprehensive evaluation comparing multiple methods
 */
export async function compareExtractionMethods(
  methods: string[],
  testDataset?: IRTItem[],
  n_max: number = 50
): Promise<{
  results: Record<string, FluidBenchmarkingResult>;
  comparison: {
    best_method: string;
    ability_ranking: Array<{ method: string; ability: number; se: number }>;
    mislabeled_items: IRTItem[];
  };
}> {
  const dataset = testDataset || createDefaultTestDataset();
  const evaluator = new FluidBenchmarking(dataset);
  const results: Record<string, FluidBenchmarkingResult> = {};

  // Evaluate each method
  for (const method of methods) {
    console.log(`\n📊 Evaluating: ${method}`);
    
    const testFn = async (item: IRTItem) => 
      await testExtractionOnItem(method as any, item);

    const result = await evaluator.fluidBenchmarking(method, testFn, { n_max });
    results[method] = result;
  }

  // Identify mislabeled items
  const mislabeled = evaluator.identifyMislabeledItems(0.3);

  // Rank methods by ability
  const ranking = methods
    .map(method => ({
      method,
      ability: results[method].final_ability,
      se: results[method].standard_error
    }))
    .sort((a, b) => b.ability - a.ability);

  return {
    results,
    comparison: {
      best_method: ranking[0].method,
      ability_ranking: ranking,
      mislabeled_items: mislabeled
    }
  };
}

