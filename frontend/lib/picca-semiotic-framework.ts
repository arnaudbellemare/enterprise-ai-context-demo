/**
 * Picca's Semiotic Framework for LLMs
 * Based on: "Not Minds, but Signs: Reframing LLMs through Semiotics"
 * Paper: arXiv:2505.17080v2 [cs.CL] 1 Jul 2025
 * Author: Davide Picca, University of Lausanne
 * 
 * CORE THESIS:
 * LLMs should NOT be understood as cognitive systems or artificial minds.
 * Instead, they are SEMIOTIC MACHINES that manipulate and organize signs
 * within cultural and linguistic systems (the semiosphere).
 * 
 * THREE PHILOSOPHICAL FOUNDATIONS:
 * 1. Peircean Semiotics: Sign as triadic relation (representamen, object, interpretant)
 * 2. Eco's Open Work: Outputs invite interpretation, not encode fixed meaning
 * 3. Lotman's Semiosphere: Operation within ecology of cultural signs
 * 
 * KEY PRINCIPLES:
 * - LLMs manipulate signs, not meanings
 * - Prompts are semiotic acts creating interpretive contracts
 * - Outputs are polysemic representamens requiring interpretation
 * - Meaning emerges through situated, dialogic engagement
 * - No anthropomorphism: No "understanding", "thinking", or "minds"
 */

import { createLogger } from '../../lib/walt/logger';
import type { DSPySignature } from './dspy-signatures';

const logger = createLogger('PiccaSemioticFramework');

// ============================================================
// PEIRCEAN TRIADIC SEMIOTICS
// ============================================================

/**
 * Peirce's Triadic Sign Structure
 * 
 * Meaning emerges through THREE elements, not two:
 * 1. Representamen: The sign itself (e.g., LLM output text)
 * 2. Object: What the sign refers to (often NULL for LLMs - no grounding)
 * 3. Interpretant: The effect/understanding it produces in interpreter
 */
export interface PeirceanSign {
  representamen: string;          // The sign itself (LLM output)
  object: string | null;          // What it refers to (often null for LLMs)
  interpretant: string[];         // Multiple possible interpretations
  context: SemioticContext;       // Context of interpretation
  timestamp: number;
}

export interface SemioticContext {
  domain: string;                 // Domain (art, legal, science, etc.)
  semioticZone: string;          // Zone within semiosphere
  culturalFrame: string;         // Cultural/ideological frame
  rhetoricalMode: string;        // Rhetorical tradition (formal, colloquial, etc.)
  generationContext: any;        // Original generation context
}

export interface SemioticTriad {
  sign: PeirceanSign;
  interpretations: Interpretation[];
  semioticValue: number;         // How "rich" the sign is semiotically
}

export interface Interpretation {
  interpretant: string;          // The interpretation itself
  interpreter: string;           // Who/what produced this interpretation
  interpretiveFrame: string;     // Frame used for interpretation
  confidence: number;
  reasoning: string;
}

/**
 * Peircean Sign Analyzer
 * Treats LLM outputs as triadic signs requiring interpretation
 */
export class PeirceanSignAnalyzer {
  private signHistory: Map<string, PeirceanSign[]> = new Map();

  constructor() {
    logger.info('Peircean Sign Analyzer initialized');
  }

  /**
   * Analyze LLM Output as Peircean Sign
   * 
   * Key insight: LLMs do NOT have access to "object" (no grounding)
   * They produce REPRESENTAMENS that elicit INTERPRETANTS in humans
   */
  async analyzeAsSign(
    output: string,
    prompt: string,
    context: SemioticContext
  ): Promise<PeirceanSign> {
    logger.info('Analyzing output as Peircean sign', {
      outputLength: output.length,
      domain: context.domain
    });

    const sign: PeirceanSign = {
      representamen: output,
      
      // CRITICAL: LLMs have NO access to object (no experiential grounding)
      object: null,
      
      // Generate multiple possible interpretants
      interpretant: await this.generateInterpretants(output, prompt, context),
      
      context,
      timestamp: Date.now()
    };

    // Store in history
    if (!this.signHistory.has(context.domain)) {
      this.signHistory.set(context.domain, []);
    }
    this.signHistory.get(context.domain)!.push(sign);

    logger.info('Sign analysis completed', {
      interpretantCount: sign.interpretant.length,
      hasObject: sign.object !== null
    });

    return sign;
  }

  /**
   * Generate Multiple Interpretants (Polysemy)
   * 
   * Key insight: A sign doesn't have ONE meaning
   * It generates MULTIPLE interpretive effects
   */
  private async generateInterpretants(
    output: string,
    prompt: string,
    context: SemioticContext
  ): Promise<string[]> {
    // Simulate generation of multiple interpretive possibilities
    const interpretants: string[] = [];

    // Literal interpretation
    interpretants.push(`Literal: ${output.substring(0, 100)}...`);

    // Domain-specific interpretation
    interpretants.push(`${context.domain}-framed: Reading through ${context.domain} lens`);

    // Rhetorical interpretation
    interpretants.push(`Rhetorical: Uses ${context.rhetoricalMode} mode`);

    // Cultural interpretation
    interpretants.push(`Cultural: Embedded in ${context.culturalFrame} tradition`);

    // Intertextual interpretation
    interpretants.push(`Intertextual: Echoes other texts in ${context.semioticZone}`);

    return interpretants;
  }

  /**
   * Evaluate Semiotic Richness
   * 
   * How "polysemic" is this sign? How many interpretive possibilities?
   */
  async evaluateSemioticRichness(sign: PeirceanSign): Promise<number> {
    // More interpretants = more polysemic = richer sign
    const baseRichness = Math.min(1.0, sign.interpretant.length / 10);
    
    // Adjust for context diversity
    const contextRichness = this.assessContextDiversity(sign.context);
    
    return (baseRichness * 0.6) + (contextRichness * 0.4);
  }

  private assessContextDiversity(context: SemioticContext): number {
    // Simulate assessment of how diverse the semiotic context is
    return Math.random() * 0.4 + 0.6; // 0.6-1.0
  }
}

// ============================================================
// ECO'S OPEN WORK
// ============================================================

/**
 * Eco's Open Work Theory Applied to LLMs
 * 
 * Key insight: LLM outputs are like Berio's Sequenza I
 * - Not a fixed message
 * - A FIELD OF INTERPRETIVE POSSIBILITIES
 * - Activated by interpretive engagement
 * - Requires "Model Reader" cooperation
 */
export interface OpenWork {
  output: string;
  interpretivePossibilities: InterpretivePossibility[];
  modelReader: ModelReader;
  openness: number;              // How "open" to interpretation
  cooperationRequired: number;   // How much reader cooperation needed
}

export interface InterpretivePossibility {
  interpretation: string;
  frame: string;                 // Interpretive frame
  validityConditions: string[];  // When is this interpretation valid?
  culturalResonance: number;     // How culturally resonant?
}

export interface ModelReader {
  role: string;                  // Expected reader role
  competencies: string[];        // Required competencies
  culturalKnowledge: string[];   // Required cultural knowledge
  interpretiveStance: string;    // Expected interpretive stance
}

/**
 * Open Work Analyzer
 * Treats LLM outputs as open works requiring interpretive cooperation
 */
export class OpenWorkAnalyzer {
  constructor() {
    logger.info('Open Work Analyzer initialized');
  }

  /**
   * Analyze Output as Open Work
   * 
   * Key question: How much interpretive cooperation does this require?
   */
  async analyzeAsOpenWork(
    output: string,
    prompt: string,
    domain: string
  ): Promise<OpenWork> {
    logger.info('Analyzing output as open work', {
      outputLength: output.length,
      domain
    });

    const possibilities = await this.generateInterpretivePossibilities(output, domain);
    const modelReader = await this.constructModelReader(output, prompt, domain);

    const openWork: OpenWork = {
      output,
      interpretivePossibilities: possibilities,
      modelReader,
      openness: this.calculateOpenness(possibilities),
      cooperationRequired: this.calculateCooperationRequired(possibilities, modelReader)
    };

    logger.info('Open work analysis completed', {
      possibilities: possibilities.length,
      openness: openWork.openness,
      cooperation: openWork.cooperationRequired
    });

    return openWork;
  }

  /**
   * Generate Interpretive Possibilities
   * 
   * Each output can be read multiple ways depending on:
   * - Reader's cultural background
   * - Interpretive frame adopted
   * - Context of reading
   */
  private async generateInterpretivePossibilities(
    output: string,
    domain: string
  ): Promise<InterpretivePossibility[]> {
    const possibilities: InterpretivePossibility[] = [];

    // Formalist reading
    possibilities.push({
      interpretation: 'Formalist: Focus on structure and composition',
      frame: 'formalist',
      validityConditions: ['Reader trained in formal analysis'],
      culturalResonance: 0.6
    });

    // Ideological reading
    possibilities.push({
      interpretation: 'Ideological: Expose power relations and biases',
      frame: 'critical',
      validityConditions: ['Reader aware of ideological critique'],
      culturalResonance: 0.7
    });

    // Pragmatic reading
    possibilities.push({
      interpretation: 'Pragmatic: Extract actionable information',
      frame: 'pragmatic',
      validityConditions: ['Reader seeking practical application'],
      culturalResonance: 0.8
    });

    // Aesthetic reading
    possibilities.push({
      interpretation: 'Aesthetic: Appreciate style and rhetoric',
      frame: 'aesthetic',
      validityConditions: ['Reader attentive to stylistic features'],
      culturalResonance: 0.5
    });

    // Domain-specific reading
    possibilities.push({
      interpretation: `${domain}-specific: Domain expert interpretation`,
      frame: domain,
      validityConditions: [`Reader has ${domain} expertise`],
      culturalResonance: 0.9
    });

    return possibilities;
  }

  /**
   * Construct Model Reader
   * 
   * Eco's concept: Text constructs its own "model reader"
   * LLM output implicitly expects certain competencies
   */
  private async constructModelReader(
    output: string,
    prompt: string,
    domain: string
  ): Promise<ModelReader> {
    return {
      role: `${domain} interpreter`,
      competencies: [
        'Reading comprehension',
        'Domain knowledge',
        'Critical thinking',
        'Cultural literacy'
      ],
      culturalKnowledge: [
        `${domain} discourse traditions`,
        'Contemporary cultural references',
        'Rhetorical conventions'
      ],
      interpretiveStance: 'Cooperative but critical'
    };
  }

  private calculateOpenness(possibilities: InterpretivePossibility[]): number {
    // More possibilities = more open
    return Math.min(1.0, possibilities.length / 10);
  }

  private calculateCooperationRequired(
    possibilities: InterpretivePossibility[],
    reader: ModelReader
  ): number {
    // More competencies required = more cooperation needed
    return Math.min(1.0, reader.competencies.length / 10);
  }
}

// ============================================================
// LOTMAN'S SEMIOSPHERE
// ============================================================

/**
 * Lotman's Semiosphere Applied to LLMs
 * 
 * Key insight: Meaning doesn't arise in a vacuum
 * It's shaped by the SEMIOSPHERE - the cultural environment
 * where all signification occurs
 * 
 * LLMs trained on vast corpora = sampling the semiosphere
 * Prompts = navigating within the semiosphere
 * Outputs = reconfiguring fragments from the semiosphere
 */
export interface SemiosphereMap {
  zones: SemioticZone[];
  borders: SemioticBorder[];
  centerPeripheryStructure: CenterPeriphery;
  culturalHeterogeneity: number;
}

export interface SemioticZone {
  id: string;
  name: string;
  discourses: string[];          // Types of discourse in this zone
  genres: string[];              // Genres prevalent here
  codes: string[];               // Cultural codes
  centralityScore: number;       // How central/peripheral
  activity: number;              // How active/dynamic
}

export interface SemioticBorder {
  zone1: string;
  zone2: string;
  permeability: number;          // How easily crossed
  translationDifficulty: number; // Difficulty translating between zones
  hybridGenres: string[];        // Genres that exist at border
}

export interface CenterPeriphery {
  centerZones: string[];         // Dominant/central zones
  peripheryZones: string[];      // Marginal/peripheral zones
  tensionPoints: string[];       // Where tension exists
}

export interface SemiosphereNavigation {
  startZone: string;
  endZone: string;
  path: string[];
  bordersCrossed: number;
  translationEvents: Translation[];
  hybridizationScore: number;
}

export interface Translation {
  from: string;
  to: string;
  strategy: string;
  fidelity: number;
  novelty: number;
}

/**
 * Semiosphere Navigator
 * Analyzes how LLMs navigate between different zones of meaning
 */
export class SemiosphereNavigator {
  private semiosphereMap: SemiosphereMap;

  constructor() {
    this.semiosphereMap = this.initializeSemiosphere();
    logger.info('Semiosphere Navigator initialized', {
      zones: this.semiosphereMap.zones.length,
      borders: this.semiosphereMap.borders.length
    });
  }

  /**
   * Initialize Semiosphere Structure
   * 
   * Maps the cultural/discursive zones LLMs can navigate
   */
  private initializeSemiosphere(): SemiosphereMap {
    const zones: SemioticZone[] = [
      {
        id: 'scientific',
        name: 'Scientific Discourse',
        discourses: ['empirical', 'theoretical', 'methodological'],
        genres: ['research paper', 'abstract', 'review'],
        codes: ['objectivity', 'empiricism', 'peer-review'],
        centralityScore: 0.8,
        activity: 0.9
      },
      {
        id: 'literary',
        name: 'Literary/Artistic',
        discourses: ['narrative', 'poetic', 'aesthetic'],
        genres: ['novel', 'poetry', 'essay'],
        codes: ['metaphor', 'ambiguity', 'style'],
        centralityScore: 0.7,
        activity: 0.6
      },
      {
        id: 'legal',
        name: 'Legal Discourse',
        discourses: ['juridical', 'procedural', 'interpretive'],
        genres: ['statute', 'opinion', 'brief'],
        codes: ['precedent', 'formalism', 'equity'],
        centralityScore: 0.9,
        activity: 0.7
      },
      {
        id: 'vernacular',
        name: 'Everyday/Colloquial',
        discourses: ['conversational', 'informal', 'performative'],
        genres: ['chat', 'social media', 'meme'],
        codes: ['irony', 'slang', 'immediacy'],
        centralityScore: 0.5,
        activity: 0.95
      },
      {
        id: 'philosophical',
        name: 'Philosophical',
        discourses: ['analytical', 'continental', 'existential'],
        genres: ['treatise', 'dialogue', 'critique'],
        codes: ['argumentation', 'conceptual', 'reflexive'],
        centralityScore: 0.6,
        activity: 0.5
      },
      {
        id: 'business',
        name: 'Business/Commercial',
        discourses: ['managerial', 'marketing', 'strategic'],
        genres: ['report', 'memo', 'pitch'],
        codes: ['efficiency', 'growth', 'ROI'],
        centralityScore: 0.85,
        activity: 0.8
      }
    ];

    const borders: SemioticBorder[] = [
      {
        zone1: 'scientific',
        zone2: 'literary',
        permeability: 0.6,
        translationDifficulty: 0.7,
        hybridGenres: ['science fiction', 'creative non-fiction']
      },
      {
        zone1: 'scientific',
        zone2: 'vernacular',
        permeability: 0.8,
        translationDifficulty: 0.5,
        hybridGenres: ['science communication', 'explainer']
      },
      {
        zone1: 'legal',
        zone2: 'vernacular',
        permeability: 0.4,
        translationDifficulty: 0.9,
        hybridGenres: ['legal aid materials', 'plain language law']
      },
      {
        zone1: 'philosophical',
        zone2: 'literary',
        permeability: 0.9,
        translationDifficulty: 0.3,
        hybridGenres: ['philosophical fiction', 'essay']
      },
      {
        zone1: 'business',
        zone2: 'scientific',
        permeability: 0.7,
        translationDifficulty: 0.4,
        hybridGenres: ['white paper', 'technical report']
      }
    ];

    return {
      zones,
      borders,
      centerPeripheryStructure: {
        centerZones: ['scientific', 'legal', 'business'],
        peripheryZones: ['vernacular', 'literary', 'philosophical'],
        tensionPoints: ['academic vs public', 'formal vs informal', 'expert vs lay']
      },
      culturalHeterogeneity: 0.85
    };
  }

  /**
   * Analyze Semiospheric Navigation
   * 
   * How does a prompt-output pair navigate the semiosphere?
   * What zones does it traverse? What borders does it cross?
   */
  async analyzeNavigation(
    prompt: string,
    output: string,
    promptContext: SemioticContext,
    outputContext: SemioticContext
  ): Promise<SemiosphereNavigation> {
    logger.info('Analyzing semiospheric navigation', {
      from: promptContext.semioticZone,
      to: outputContext.semioticZone
    });

    const startZone = promptContext.semioticZone;
    const endZone = outputContext.semioticZone;

    // If same zone, no navigation
    if (startZone === endZone) {
      return {
        startZone,
        endZone,
        path: [startZone],
        bordersCrossed: 0,
        translationEvents: [],
        hybridizationScore: 0
      };
    }

    // Find path between zones
    const path = this.findPath(startZone, endZone);
    const bordersCrossed = path.length - 1;
    
    // Analyze translation events at each border
    const translationEvents = await this.analyzeTranslations(path, output);
    
    // Calculate hybridization (how much mixing occurred)
    const hybridizationScore = this.calculateHybridization(translationEvents);

    const navigation: SemiosphereNavigation = {
      startZone,
      endZone,
      path,
      bordersCrossed,
      translationEvents,
      hybridizationScore
    };

    logger.info('Semiospheric navigation analyzed', {
      bordersCrossed: navigation.bordersCrossed,
      hybridization: navigation.hybridizationScore
    });

    return navigation;
  }

  /**
   * Find Path Between Semiotic Zones
   * Simplified pathfinding (in reality, would use graph algorithms)
   */
  private findPath(start: string, end: string): string[] {
    // Simulate pathfinding through semiosphere
    // In real implementation, would use actual graph traversal
    return [start, end]; // Direct path for simplicity
  }

  /**
   * Analyze Translation Events
   * 
   * When crossing borders, how is meaning translated?
   * What's preserved? What's transformed?
   */
  private async analyzeTranslations(
    path: string[],
    output: string
  ): Promise<Translation[]> {
    const translations: Translation[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];

      translations.push({
        from,
        to,
        strategy: this.identifyTranslationStrategy(from, to),
        fidelity: Math.random() * 0.4 + 0.6, // 0.6-1.0
        novelty: Math.random() * 0.5 + 0.3   // 0.3-0.8
      });
    }

    return translations;
  }

  private identifyTranslationStrategy(from: string, to: string): string {
    const border = this.semiosphereMap.borders.find(
      b => (b.zone1 === from && b.zone2 === to) || (b.zone1 === to && b.zone2 === from)
    );

    if (!border) return 'direct';

    if (border.translationDifficulty > 0.7) return 'radical-transformation';
    if (border.translationDifficulty > 0.4) return 'adaptation';
    return 'literal-transfer';
  }

  private calculateHybridization(translations: Translation[]): number {
    if (translations.length === 0) return 0;
    
    // Average novelty across translations
    const avgNovelty = translations.reduce((sum, t) => sum + t.novelty, 0) / translations.length;
    return avgNovelty;
  }

  /**
   * Identify Semiotic Zone from Context
   */
  identifyZone(domain: string, rhetorical: string): string {
    // Map domain to semiotic zone
    const zoneMap: Record<string, string> = {
      'art': 'literary',
      'legal': 'legal',
      'business': 'business',
      'science': 'scientific',
      'philosophy': 'philosophical',
      'casual': 'vernacular'
    };

    return zoneMap[domain] || 'vernacular';
  }
}

// ============================================================
// SEMIOTIC FRAMEWORK ORCHESTRATOR
// ============================================================

/**
 * Complete Semiotic Analysis
 * Combines Peirce, Eco, and Lotman
 */
export interface CompleteSemioticAnalysis {
  peirceanAnalysis: PeirceanSign;
  openWorkAnalysis: OpenWork;
  semiosphereNavigation: SemiosphereNavigation;
  semioticQuality: SemioticQuality;
  recommendations: string[];
}

export interface SemioticQuality {
  polysemy: number;              // How many interpretations possible
  openness: number;              // How open to interpretation
  culturalResonance: number;     // How culturally resonant
  navigationalComplexity: number; // How complex the semiospheric navigation
  overallQuality: number;
}

/**
 * Main Semiotic Framework Orchestrator
 * Integrates all three philosophical foundations
 */
export class PiccaSemioticFramework {
  private peirceanAnalyzer: PeirceanSignAnalyzer;
  private openWorkAnalyzer: OpenWorkAnalyzer;
  private semiosphereNavigator: SemiosphereNavigator;

  constructor() {
    this.peirceanAnalyzer = new PeirceanSignAnalyzer();
    this.openWorkAnalyzer = new OpenWorkAnalyzer();
    this.semiosphereNavigator = new SemiosphereNavigator();
    
    logger.info('Picca Semiotic Framework initialized');
  }

  /**
   * Complete Semiotic Analysis of LLM Output
   * 
   * Applies all three frameworks:
   * 1. Peircean: Triadic sign structure
   * 2. Eco: Open work interpretation
   * 3. Lotman: Semiospheric navigation
   */
  async analyzeOutput(
    prompt: string,
    output: string,
    promptContext: SemioticContext,
    outputContext?: SemioticContext
  ): Promise<CompleteSemioticAnalysis> {
    logger.info('Beginning complete semiotic analysis', {
      promptLength: prompt.length,
      outputLength: output.length,
      domain: promptContext.domain
    });

    // If no output context provided, assume same as prompt context
    const finalOutputContext = outputContext || promptContext;

    // 1. Peircean Analysis
    const peirceanAnalysis = await this.peirceanAnalyzer.analyzeAsSign(
      output,
      prompt,
      finalOutputContext
    );

    // 2. Open Work Analysis
    const openWorkAnalysis = await this.openWorkAnalyzer.analyzeAsOpenWork(
      output,
      prompt,
      finalOutputContext.domain
    );

    // 3. Semiosphere Navigation
    const semiosphereNavigation = await this.semiosphereNavigator.analyzeNavigation(
      prompt,
      output,
      promptContext,
      finalOutputContext
    );

    // 4. Calculate Semiotic Quality
    const semioticQuality = await this.calculateSemioticQuality(
      peirceanAnalysis,
      openWorkAnalysis,
      semiosphereNavigation
    );

    // 5. Generate Recommendations
    const recommendations = await this.generateRecommendations(
      semioticQuality,
      semiosphereNavigation
    );

    const analysis: CompleteSemioticAnalysis = {
      peirceanAnalysis,
      openWorkAnalysis,
      semiosphereNavigation,
      semioticQuality,
      recommendations
    };

    logger.info('Complete semiotic analysis finished', {
      semioticQuality: semioticQuality.overallQuality,
      recommendationCount: recommendations.length
    });

    return analysis;
  }

  private async calculateSemioticQuality(
    peircean: PeirceanSign,
    openWork: OpenWork,
    navigation: SemiosphereNavigation
  ): Promise<SemioticQuality> {
    const polysemy = peircean.interpretant.length / 10;
    const openness = openWork.openness;
    const culturalResonance = openWork.interpretivePossibilities.reduce(
      (sum, p) => sum + p.culturalResonance, 0
    ) / openWork.interpretivePossibilities.length;
    const navigationalComplexity = Math.min(1.0, navigation.bordersCrossed / 5);

    const overallQuality = (polysemy * 0.3) + (openness * 0.25) + 
                          (culturalResonance * 0.25) + (navigationalComplexity * 0.2);

    return {
      polysemy,
      openness,
      culturalResonance,
      navigationalComplexity,
      overallQuality
    };
  }

  private async generateRecommendations(
    quality: SemioticQuality,
    navigation: SemiosphereNavigation
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (quality.polysemy < 0.5) {
      recommendations.push('Consider prompting for more interpretive richness');
    }

    if (quality.openness < 0.4) {
      recommendations.push('Output may be too closed/deterministic for rich interpretation');
    }

    if (quality.culturalResonance < 0.6) {
      recommendations.push('Consider invoking more culturally resonant frames');
    }

    if (navigation.bordersCrossed > 2) {
      recommendations.push('Complex semiospheric navigation - verify translation quality');
    }

    if (navigation.hybridizationScore > 0.7) {
      recommendations.push('High hybridization - novel genre/discourse creation');
    }

    return recommendations;
  }

  /**
   * Create Semiotic Context from DSPy Signature
   * Integration point with existing DSPy system
   */
  createContextFromSignature(signature: DSPySignature): SemioticContext {
    const domain = signature.domain || 'general';
    const semioticZone = this.semiosphereNavigator.identifyZone(domain, 'formal');

    return {
      domain,
      semioticZone,
      culturalFrame: 'academic',
      rhetoricalMode: 'formal',
      generationContext: {
        signature: signature.description,
        inputFields: Object.keys(signature.input),
        outputFields: Object.keys(signature.output)
      }
    };
  }

  /**
   * Evaluate Prompt as Semiotic Act
   * 
   * Key insight from paper: Prompts are not neutral commands
   * They are SEMIOTIC ACTS that create interpretive contracts
   */
  async evaluatePromptAsSemioticAct(
    prompt: string,
    context: SemioticContext
  ): Promise<{
    interpretiveContract: string[];
    framingEffects: string[];
    rhetoricalStance: string;
    expectedCooperation: number;
  }> {
    return {
      interpretiveContract: [
        'Sets domain expectations',
        'Establishes register/tone',
        'Invokes genre conventions',
        'Positions ideological frame'
      ],
      framingEffects: [
        `Frames within ${context.domain} discourse`,
        `Adopts ${context.rhetoricalMode} rhetoric`,
        `Operates in ${context.semioticZone} zone`
      ],
      rhetoricalStance: context.rhetoricalMode,
      expectedCooperation: 0.7
    };
  }
}

// ============================================================
// INTEGRATION WITH EXISTING PERMUTATION SYSTEMS
// ============================================================

/**
 * Integration Functions
 * Connect semiotic framework with existing systems
 */
export class SemioticIntegration {
  private framework: PiccaSemioticFramework;

  constructor() {
    this.framework = new PiccaSemioticFramework();
  }

  /**
   * Enhance DSPy Evaluation with Semiotic Analysis
   */
  async enhanceDSPyEvaluation(
    prompt: string,
    output: string,
    signature: DSPySignature
  ): Promise<{
    semioticAnalysis: CompleteSemioticAnalysis;
    dspyCompatibleScore: number;
    interpretiveRichness: number;
  }> {
    const context = this.framework.createContextFromSignature(signature);
    const analysis = await this.framework.analyzeOutput(prompt, output, context);

    return {
      semioticAnalysis: analysis,
      dspyCompatibleScore: analysis.semioticQuality.overallQuality,
      interpretiveRichness: analysis.semioticQuality.polysemy
    };
  }

  /**
   * Semiotic-Aware Prompt Enhancement
   */
  async enhancePromptSemiotically(
    prompt: string,
    desiredZone: string,
    desiredOpenness: number
  ): Promise<{
    enhancedPrompt: string;
    semioticGuidance: string[];
  }> {
    const guidance: string[] = [];

    // Add zone-specific framing
    guidance.push(`Navigate to ${desiredZone} semiotic zone`);

    // Add openness instructions
    if (desiredOpenness > 0.7) {
      guidance.push('Invite multiple interpretations');
      guidance.push('Use polysemic language');
    }

    const enhancedPrompt = `${prompt}\n\n[Semiotic Guidance: ${guidance.join(', ')}]`;

    return {
      enhancedPrompt,
      semioticGuidance: guidance
    };
  }
}

// ============================================================
// EXPORTS
// ============================================================

export {
  PiccaSemioticFramework,
  PeirceanSignAnalyzer,
  OpenWorkAnalyzer,
  SemiosphereNavigator,
  SemioticIntegration
};

export default PiccaSemioticFramework;

