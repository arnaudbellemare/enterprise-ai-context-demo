# PERMUTATION AI - Cursor TypeScript Rules

**Rule Name:** PERMUTATION AI Enterprise TypeScript Guidelines
**Version:** 2.0 (Updated from Code Analysis Report)
**Last Updated:** 2025-10-29
**Applies To:** All TypeScript/TSX files in `frontend/`, `lib/`, `app/`, `components/`

---

## Core Philosophy

Enterprise-grade TypeScript for research AI systems. Prioritize **type safety**, **security**, **performance**, and **maintainability** for production deployment. This codebase implements academic research (ACE, GEPA, DSPy, IRT, MoE) and must maintain research fidelity while following enterprise patterns.

---

## 1. Planning & Implementation Flow

### 1.1 Before Coding: Plan-Confirm-Implement

**Step 1: Pseudocode Plan**
```typescript
/**
 * PLAN: Implement GEPA Prompt Evolution
 *
 * 1. Define interface PromptCandidate { prompt: string; fitness: number }
 * 2. Initialize population: generateRandomPrompts(size: number)
 * 3. Selection: selectParents(population, topK: number)
 * 4. Crossover: crossover(parent1, parent2) -> offspring
 * 5. Mutation: mutate(candidate, rate: number)
 * 6. Evaluation: evaluateFitness(candidate) -> score
 * 7. Return Pareto frontier: filterNonDominated(population)
 *
 * Edge cases:
 * - Empty population -> initialize with defaults
 * - Fitness evaluation failure -> skip candidate
 * - All candidates dominated -> return best single candidate
 */
```

**Step 2: Confirm Logic**
- Review assumptions explicitly in comments
- Validate against research paper if implementing algorithm
- Confirm types cover all edge cases

**Step 3: Fully Implement**
- **NO TODO comments** for core functionality
- **NO placeholders** like `throw new Error("Not implemented")`
- **Complete error handling** for all async operations
- **Verify edge cases** with guards/validation

### 1.2 Enforcement Rules

❌ **Forbidden**:
```typescript
// BAD: Incomplete implementation
function optimizePrompt(prompt: string): OptimizedPrompt {
  // TODO: Implement GEPA algorithm
  throw new Error("Not implemented");
}

// BAD: Partial feature
async function executeSkill(query: string) {
  const result = await callLLM(query);
  // TODO: Add caching and metrics
  return result;
}
```

✅ **Required**:
```typescript
// GOOD: Complete implementation
async function executeSkill(
  query: string,
  context: BrainContext
): Promise<SkillExecutionResult> {
  try {
    // Check cache first
    const cached = await skillCache.get(query);
    if (cached) {
      await recordMetric('cache_hit', { skill: 'gepa' });
      return cached;
    }

    // Execute skill
    const startTime = Date.now();
    const result = await callLLM(query, context);
    const executionTime = Date.now() - startTime;

    // Record metrics
    await recordMetric('execution_time', { time: executionTime });

    // Cache result
    await skillCache.set(query, result);

    return {
      skillName: 'gepa',
      result,
      executionTime,
      success: true,
      cost: calculateCost(result),
      quality: evaluateQuality(result)
    };
  } catch (error) {
    logger.error('Skill execution failed', { error, query });
    return {
      skillName: 'gepa',
      result: { response: '', confidence: 0, cost: 0, latency: 0 },
      executionTime: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

---

## 2. Code Structure & Architecture

### 2.1 Pattern Selection: Functional vs OOP

**Use Classes For:**
- Complex state management (e.g., `MoEBrainOrchestrator`, `BrainEvaluationSystem`)
- Services with initialization lifecycle (e.g., `ContinualLearningSystem`)
- Systems with multiple related methods operating on shared state

**Use Functions For:**
- Utilities and helpers (e.g., `calculateIRT`, `parseQuery`)
- Pure transformations (e.g., `normalizeScores`, `filterResults`)
- React components and hooks

**Example: When to use each**
```typescript
// GOOD: Class for complex orchestration
export class MoEBrainOrchestrator {
  private router: SkillRouter;
  private cache: SkillCache;
  private metrics: MetricsTracker;

  constructor(config: MoEConfiguration) {
    this.router = new SkillRouter(config);
    this.cache = new SkillCache(config.cacheTTL);
    this.metrics = new MetricsTracker();
  }

  async execute(request: MoERequest): Promise<MoEResponse> {
    // Complex multi-step orchestration
  }
}

// GOOD: Function for pure transformation
export function calculateIRTDifficulty(
  query: string,
  domain: string,
  complexity: number
): number {
  const domainWeight = domainComplexity[domain] ?? 0.5;
  const lengthWeight = Math.min(query.length / 200, 1.0);
  return 0.4 * domainWeight + 0.3 * complexity + 0.3 * lengthWeight;
}
```

### 2.2 File Organization

**Standard Structure:**
```typescript
// 1. Imports (grouped: React, Next.js, external, internal, types)
import { useCallback, useMemo } from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import type { BrainContext, SkillResult } from './moe-types';

// 2. Type definitions (interfaces, types, constants)
export interface SkillExecutor {
  execute: (query: string, context: BrainContext) => Promise<SkillResult>;
}

const SKILL_PRIORITIES = {
  trm: 1,
  ace: 1,
  gepa: 2,
  kimiK2: 3
} as const;

// 3. Main export (component, class, or primary function)
export class SkillRegistry {
  // Implementation
}

// 4. Helper functions (not exported unless needed elsewhere)
function validateSkillResult(result: SkillResult): boolean {
  return result.confidence > 0 && result.latency > 0;
}

// 5. Utilities (can be extracted to separate file if >3 functions)
```

**Directory Naming:**
- `kebab-case` for directories: `brain-skills/`, `moe-orchestrator/`
- `PascalCase` for React components: `BrainOrchestrator.tsx`
- `camelCase` for utilities: `irtCalculator.ts`

### 2.3 DRY Principles

**Extract Shared Logic:**
```typescript
// BAD: Repeated logic
async function executeACE(query: string) {
  const startTime = Date.now();
  const result = await callACE(query);
  logger.info('ACE executed', { time: Date.now() - startTime });
  return result;
}

async function executeGEPA(query: string) {
  const startTime = Date.now();
  const result = await callGEPA(query);
  logger.info('GEPA executed', { time: Date.now() - startTime });
  return result;
}

// GOOD: Extracted helper
async function executeWithTiming<T>(
  skillName: string,
  executor: () => Promise<T>
): Promise<{ result: T; executionTime: number }> {
  const startTime = Date.now();
  const result = await executor();
  const executionTime = Date.now() - startTime;
  logger.info(`${skillName} executed`, { executionTime });
  return { result, executionTime };
}

async function executeACE(query: string) {
  return executeWithTiming('ACE', () => callACE(query));
}
```

---

## 3. TypeScript Strictness (CRITICAL)

### 3.1 Zero `any` Policy

**Current Status:** 135 `any` occurrences (Target: <50)

❌ **Forbidden:**
```typescript
// BAD: Lazy any
function processResults(data: any): any {
  return data.map((item: any) => item.value);
}

// BAD: any in catch blocks
catch (error: any) {
  console.log(error.message);
}
```

✅ **Required:**
```typescript
// GOOD: Proper types
interface DataItem {
  value: string | number;
  metadata?: Record<string, unknown>;
}

function processResults(data: DataItem[]): Array<string | number> {
  return data.map(item => item.value);
}

// GOOD: Typed error handling
catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Processing failed', { error: message });
}
```

### 3.2 Interface Design

**Use `interface` over `type` for objects:**
```typescript
// GOOD: Interface for extensibility
export interface BrainContext {
  domain?: string;
  skillsRequired?: string[];
  metadata?: Record<string, unknown>;
  [key: string]: unknown; // Allow extensions
}

// GOOD: Type for unions/primitives
export type Priority = 'low' | 'normal' | 'high';
export type SkillName = 'trm' | 'ace' | 'gepa' | 'kimiK2';
```

**No enums - use const objects:**
```typescript
// BAD: Enum
enum SkillPriority {
  High = 1,
  Medium = 2,
  Low = 3
}

// GOOD: Const object
export const SkillPriority = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
} as const;

export type SkillPriorityValue = typeof SkillPriority[keyof typeof SkillPriority];
```

### 3.3 Type Safety Guards

**Avoid type assertions - use guards:**
```typescript
// BAD: Type assertion
const result = data as SkillResult;

// GOOD: Type guard
function isSkillResult(data: unknown): data is SkillResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    'response' in data &&
    'confidence' in data &&
    typeof (data as SkillResult).confidence === 'number'
  );
}

if (isSkillResult(data)) {
  // TypeScript knows data is SkillResult here
  console.log(data.confidence);
}
```

**Optional chaining over non-null assertions:**
```typescript
// BAD: Non-null assertion
const score = result.metadata!.quality!;

// GOOD: Optional chaining with fallback
const score = result.metadata?.quality ?? 0;
```

### 3.4 Environment Variables

**Type safely with validation:**
```typescript
// BAD: Unsafe env access
const apiKey = process.env.OPENAI_API_KEY;

// GOOD: Validated env with Zod
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),
}).refine(
  (data) => data.OPENAI_API_KEY || data.PERPLEXITY_API_KEY,
  { message: "At least one LLM provider required" }
);

export const env = envSchema.parse(process.env);

// Usage
const apiKey = env.OPENAI_API_KEY; // Type: string | undefined
```

---

## 4. Security Rules (CRITICAL)

### 4.1 No Dynamic Code Execution

**Current Issue:** 19 files use `eval()`, `Function()`, or `innerHTML`

❌ **Strictly Forbidden:**
```typescript
// FORBIDDEN: eval()
const result = eval(userInput);

// FORBIDDEN: Function constructor
const fn = new Function('x', userInput);

// FORBIDDEN: Unsafe innerHTML
element.innerHTML = userResponse;
```

✅ **Required Alternatives:**
```typescript
// GOOD: Safe parsing
import { z } from 'zod';

const ResultSchema = z.object({
  value: z.number(),
  message: z.string()
});

try {
  const result = ResultSchema.parse(JSON.parse(userInput));
  // Safe to use result
} catch (error) {
  logger.error('Invalid input', { error });
  return { error: 'Invalid data format' };
}

// GOOD: Safe DOM manipulation
import DOMPurify from 'dompurify';

element.textContent = userResponse; // Preferred
// OR
element.innerHTML = DOMPurify.sanitize(userResponse); // If HTML needed
```

### 4.2 Input Validation

**Validate ALL external inputs:**
```typescript
// GOOD: API route with validation
export async function POST(req: NextRequest) {
  const bodySchema = z.object({
    query: z.string().min(1).max(1000),
    domain: z.enum(['financial', 'medical', 'legal', 'general']),
    sessionId: z.string().uuid().optional()
  });

  try {
    const body = await req.json();
    const validated = bodySchema.parse(body);

    const result = await executeQuery(validated);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Query execution failed', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.3 No Hardcoded Secrets

**Always use environment variables:**
```typescript
// BAD: Hardcoded
const apiKey = "sk-1234567890abcdef";

// GOOD: Environment variable
const apiKey = env.OPENAI_API_KEY;

// GOOD: Fail fast if missing
if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}
```

---

## 5. Performance Patterns

### 5.1 Parallel Execution (REQUIRED)

**Current Status:** 20 `Promise.all` usages (Excellent)

✅ **Always parallelize independent operations:**
```typescript
// BAD: Sequential
async function executeSkills(query: string, skills: string[]) {
  const results = [];
  for (const skill of skills) {
    results.push(await executeSkill(query, skill)); // SLOW!
  }
  return results;
}

// GOOD: Parallel
async function executeSkills(query: string, skills: string[]) {
  return Promise.all(
    skills.map(skill => executeSkill(query, skill))
  );
}

// GOOD: Parallel with error isolation
async function executeSkillsSafely(query: string, skills: string[]) {
  const results = await Promise.allSettled(
    skills.map(skill => executeSkill(query, skill))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    logger.error('Skill failed', { skill: skills[index], error: result.reason });
    return createErrorResult(skills[index], result.reason);
  });
}
```

### 5.2 Caching Strategy

**Current Status:** 120 cache references (Comprehensive)

**Multi-layer caching:**
```typescript
// 1. Memory cache (LRU) for hot paths
import LRU from 'lru-cache';

const memoryCache = new LRU<string, SkillResult>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

// 2. Redis cache for distributed
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// 3. Semantic cache for similar queries
async function getCachedResult(
  query: string,
  context: BrainContext
): Promise<SkillResult | null> {
  // Check memory cache first (fastest)
  const cacheKey = `${query}:${context.domain}`;
  const memResult = memoryCache.get(cacheKey);
  if (memResult) {
    await recordMetric('cache_hit_memory');
    return memResult;
  }

  // Check Redis (fast)
  const redisResult = await redis.get(cacheKey);
  if (redisResult) {
    const parsed = JSON.parse(redisResult) as SkillResult;
    memoryCache.set(cacheKey, parsed); // Warm memory cache
    await recordMetric('cache_hit_redis');
    return parsed;
  }

  // Check semantic cache (slower but catches similar queries)
  const semanticResult = await findSimilarQuery(query);
  if (semanticResult) {
    await recordMetric('cache_hit_semantic');
    return semanticResult;
  }

  return null;
}
```

### 5.3 React Optimization

**Memoization for expensive operations:**
```typescript
// GOOD: Memoize expensive calculations
const ReasoningViz = React.memo(function ReasoningViz({
  steps
}: {
  steps: ReasoningStep[]
}) {
  const scoredSteps = useMemo(
    () => steps.map(step => ({
      ...step,
      quality: calculateQualityScore(step)
    })),
    [steps]
  );

  return (
    <div>
      {scoredSteps.map(step => (
        <StepCard key={step.id} step={step} />
      ))}
    </div>
  );
});

// GOOD: Lazy load heavy components
const BenchmarkChart = dynamic(
  () => import('./BenchmarkChart'),
  {
    loading: () => <div>Loading chart...</div>,
    ssr: false
  }
);
```

---

## 6. PERMUTATION AI Specific Patterns

### 6.1 MoE (Mixture of Experts) Integration

**Skill Execution Pattern:**
```typescript
// Type-safe skill execution
export interface SkillExecutor {
  execute(query: string, context: BrainContext): Promise<SkillResult>;
  executeBatch?(queries: string[], context: BrainContext): Promise<SkillResult[]>;
  supportsBatching?: boolean;
}

// Register skills with type safety
export const skillRegistry = new Map<string, SkillExecutor>([
  ['trm', new TRMSkill()],
  ['ace', new ACESkill()],
  ['gepa', new GEPASkill()],
  ['kimiK2', new KimiK2Skill()]
]);

// Type-safe skill routing
export async function routeToSkills(
  query: string,
  context: BrainContext
): Promise<SkillExecutionResult[]> {
  const selectedSkills = await selectExperts(query, context);

  return Promise.all(
    selectedSkills.map(async ({ name, skill, score }) => {
      const startTime = Date.now();
      try {
        const result = await skill.execute(query, context);
        return {
          skillName: name,
          result,
          executionTime: Date.now() - startTime,
          success: true,
          cost: result.cost,
          quality: result.confidence * score
        };
      } catch (error) {
        return createErrorResult(name, error);
      }
    })
  );
}
```

### 6.2 Teacher-Student Routing (IRT)

**IRT-based model selection:**
```typescript
// Calculate IRT difficulty
export function calculateIRTDifficulty(
  query: string,
  domain: string,
  metadata: QueryMetadata
): number {
  const domainComplexity: Record<string, number> = {
    financial: 0.7,
    medical: 0.8,
    legal: 0.9,
    general: 0.5
  };

  const baseComplexity = domainComplexity[domain] ?? 0.5;
  const lengthFactor = Math.min(query.length / 200, 1.0);
  const multiStepBonus = metadata.requiresMultiStep ? 0.2 : 0;

  return Math.min(
    0.4 * baseComplexity +
    0.3 * lengthFactor +
    0.3 * multiStepBonus,
    1.0
  );
}

// Route to teacher/student based on IRT
export async function routeQuery(
  query: string,
  context: BrainContext
): Promise<QueryResult> {
  const irtDifficulty = calculateIRTDifficulty(
    query,
    context.domain ?? 'general',
    { requiresMultiStep: query.includes('and') || query.includes('then') }
  );

  const model = irtDifficulty > 0.7
    ? 'teacher' // Perplexity for hard queries
    : 'student'; // Ollama for easy queries

  logger.info('Query routed', { irtDifficulty, model });

  return model === 'teacher'
    ? executeTeacherModel(query, context)
    : executeStudentModel(query, context);
}
```

### 6.3 ACE Framework Integration

**Playbook-driven prompting:**
```typescript
// Type-safe ACE playbook
export interface ACEPlaybook {
  section: string;
  bullets: PlaybookBullet[];
}

export interface PlaybookBullet {
  id: string;
  content: string;
  helpfulCount: number;
  harmfulCount: number;
  tags: string[];
}

// Apply ACE playbook to query
export async function applyACEPlaybook(
  query: string,
  domain: string
): Promise<string> {
  const playbook = await loadPlaybook(domain);
  const relevantBullets = playbook.bullets
    .filter(bullet => bullet.tags.includes(domain))
    .sort((a, b) =>
      (b.helpfulCount - b.harmfulCount) -
      (a.helpfulCount - a.harmfulCount)
    )
    .slice(0, 5);

  const context = relevantBullets
    .map(bullet => `- ${bullet.content}`)
    .join('\n');

  return `${context}\n\nQuery: ${query}`;
}
```

### 6.4 GEPA Optimization

**Prompt evolution with Pareto frontier:**
```typescript
// Type-safe GEPA candidate
export interface PromptCandidate {
  prompt: string;
  quality: number;
  cost: number;
  latency: number;
  generation: number;
}

// Multi-objective optimization
export function computeParetoFrontier(
  candidates: PromptCandidate[]
): PromptCandidate[] {
  return candidates.filter(candidate => {
    // A candidate is on Pareto frontier if no other candidate dominates it
    return !candidates.some(other =>
      other !== candidate &&
      other.quality >= candidate.quality &&
      other.cost <= candidate.cost &&
      other.latency <= candidate.latency &&
      (other.quality > candidate.quality ||
       other.cost < candidate.cost ||
       other.latency < candidate.latency)
    );
  });
}
```

### 6.5 DSPy Integration (Declarative AI Programming)

**Core Philosophy:** Don't hand-tune variable names; specify WHAT each component is supposed to be.

❌ **Anti-Pattern - Hand-tuning variable names (prompt engineering):**
```typescript
// BAD: Over-engineered variable names (this is traditional prompt engineering)
const signature = "detailed_reasoning_step_1: str, comprehensive_context_v2: str -> final_answer_optimized: str";

// BAD: Trying to control LLM behavior through naming
const ragSignature = "highly_relevant_context: str, user_question_detailed: str -> accurate_answer_with_citations: str";
```

✅ **Correct Pattern - Semantic specification (DSPy way):**
```typescript
// GOOD: Specify WHAT each component IS, not HOW to name it
const signature = "query: question to answer, context: relevant background information -> answer: final response";

// GOOD: Focus on semantic meaning, not variable names
interface DSPyRAGSignature {
  query: string;      // What: The user's question
  context: string;    // What: Retrieved relevant documents
  answer: string;     // What: Generated response to the query
}

// GOOD: Let DSPy handle the optimization of HOW to prompt
const ragModule = new ChainOfThought(
  "query: user question, context: relevant documents -> answer: response with citations"
);
```

**Type-Safe DSPy Signatures:**
```typescript
import { AX } from '@ax-llm/ax';
import { z } from 'zod';

// GOOD: Define semantic purpose in types
const QuerySchema = z.object({
  query: z.string().describe("The user's question to answer"),
  domain: z.string().describe("Domain context (financial, medical, legal, general)"),
  context: z.string().optional().describe("Additional background information")
});

const AnswerSchema = z.object({
  answer: z.string().describe("Direct response to the query"),
  confidence: z.number().describe("Confidence score 0-1"),
  citations: z.array(z.string()).optional().describe("Source references used")
});

// GOOD: DSPy module with semantic specification
export async function executeWithDSPy(
  query: string,
  context: string
): Promise<{ answer: string; confidence: number }> {
  const ax = new AX({ apiKey: env.OPENAI_API_KEY });

  // Specify WHAT we want, not HOW to prompt for it
  const result = await ax.generate({
    // Semantic specification: query + context -> answer + confidence
    prompt: "query: str, context: str -> answer: str, confidence: float",
    input: { query, context },
    outputSchema: AnswerSchema
  });

  return result;
}
```

**DSPy with ACE Framework Integration:**
```typescript
// GOOD: Combine DSPy declarative style with ACE playbooks
export async function executeACEWithDSPy(
  query: string,
  domain: string
): Promise<SkillResult> {
  // 1. Get ACE playbook context (specifies WHAT context to use)
  const playbook = await loadPlaybook(domain);
  const contextBullets = playbook.bullets
    .filter(b => b.tags.includes(domain))
    .map(b => b.content)
    .join('\n');

  // 2. Use DSPy to execute with semantic specification
  const ax = new AX({ apiKey: env.OPENAI_API_KEY });

  // Specify semantic roles, not prompt engineering
  const result = await ax.generate({
    prompt: `
      domain_context: relevant domain-specific guidelines,
      query: user's question,
      ->
      reasoning: step-by-step thought process,
      answer: final response,
      confidence: certainty level
    `,
    input: {
      domain_context: contextBullets,
      query: query
    },
    outputSchema: z.object({
      reasoning: z.string().describe("Explanation of how answer was derived"),
      answer: z.string().describe("Direct response to query"),
      confidence: z.number().describe("0-1 confidence score")
    })
  });

  return {
    response: result.answer,
    confidence: result.confidence,
    metadata: { reasoning: result.reasoning }
  };
}
```

**Key DSPy Principles:**

1. **Semantic Over Syntactic**
   - ✅ Do: Specify what each field represents semantically
   - ❌ Don't: Engineer variable names to control LLM behavior

2. **Declarative Over Imperative**
   - ✅ Do: Declare input/output relationships
   - ❌ Don't: Write procedural prompt instructions

3. **Type-Driven Development**
   - ✅ Do: Use Zod schemas to specify structure and meaning
   - ❌ Don't: Rely on string-based prompt templates

4. **Optimization Through Evaluation**
   - ✅ Do: Define clear success metrics, let DSPy optimize
   - ❌ Don't: Hand-tune prompts based on guesswork

**Example: DSPy for GEPA Optimization**
```typescript
// GOOD: DSPy signature for prompt evolution evaluation
const evaluationSignature = `
  prompt_candidate: candidate prompt to evaluate,
  test_queries: array of test cases,
  quality_metrics: quality/cost/latency goals
  ->
  fitness_score: overall quality score,
  strengths: what works well,
  weaknesses: areas for improvement
`;

// Let DSPy handle the optimization, not manual prompt engineering
export async function evaluatePromptCandidate(
  candidate: PromptCandidate,
  testQueries: string[]
): Promise<{ fitness: number; feedback: string }> {
  const ax = new AX({ apiKey: env.OPENAI_API_KEY });

  const result = await ax.generate({
    prompt: evaluationSignature,
    input: {
      prompt_candidate: candidate.prompt,
      test_queries: testQueries,
      quality_metrics: { quality: 0.8, cost: 0.01, latency: 2000 }
    },
    outputSchema: z.object({
      fitness_score: z.number(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string())
    })
  });

  return {
    fitness: result.fitness_score,
    feedback: `Strengths: ${result.strengths.join(', ')}. Weaknesses: ${result.weaknesses.join(', ')}`
  };
}
```

**Remember:** DSPy is about building AI systems declaratively. Focus on:
- **WHAT** each component should do (semantic specification)
- **NOT HOW** to prompt engineer it (variable naming)

Let the framework handle optimization through evaluation, not manual tuning.

---

## 7. Logging & Error Handling

### 7.1 Use Logger (Never console)

**Current Status:** 90 logger calls, 90 console calls (need migration)

❌ **Forbidden:**
```typescript
console.log('Query executed', { query, result });
console.error('Execution failed', error);
```

✅ **Required:**
```typescript
import { logger } from '@/lib/logger';

logger.info('Query executed', { query, result });
logger.error('Execution failed', { error, query, context });
logger.warn('Cache miss', { cacheKey });
logger.debug('IRT calculated', { difficulty: 0.75 });
```

### 7.2 Comprehensive Error Handling

**Try-catch for all async operations:**
```typescript
// GOOD: Complete error handling
export async function executeQuery(
  query: string,
  context: BrainContext
): Promise<QueryResult> {
  try {
    // Validate inputs
    if (!query?.trim()) {
      throw new Error('Query cannot be empty');
    }

    // Execute with timeout
    const result = await Promise.race([
      performQuery(query, context),
      timeout(30000, 'Query timeout after 30s')
    ]);

    // Validate output
    if (!isValidResult(result)) {
      throw new Error('Invalid query result format');
    }

    logger.info('Query succeeded', {
      query,
      domain: context.domain,
      quality: result.quality
    });

    return result;
  } catch (error) {
    logger.error('Query failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      query,
      context
    });

    // Return fallback instead of throwing
    return {
      response: 'Query execution failed. Please try again.',
      confidence: 0,
      cost: 0,
      latency: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper: Timeout promise
function timeout(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
}
```

---

## 8. Testing Requirements

### 8.1 Test Structure

**Write tests for:**
- All exported functions
- All API routes
- All custom hooks
- Complex business logic (IRT, GEPA, ACE)

```typescript
// GOOD: Comprehensive test
import { describe, it, expect, beforeEach } from '@jest/globals';
import { calculateIRTDifficulty } from '../irtCalculator';

describe('IRT Difficulty Calculator', () => {
  it('should calculate difficulty for financial domain', () => {
    const difficulty = calculateIRTDifficulty(
      'Analyze M&A trends in tech sector',
      'financial',
      { requiresMultiStep: false }
    );

    expect(difficulty).toBeGreaterThan(0.6);
    expect(difficulty).toBeLessThanOrEqual(1.0);
  });

  it('should increase difficulty for multi-step queries', () => {
    const singleStep = calculateIRTDifficulty(
      'Stock price of AAPL',
      'financial',
      { requiresMultiStep: false }
    );

    const multiStep = calculateIRTDifficulty(
      'Stock price of AAPL and compare to MSFT',
      'financial',
      { requiresMultiStep: true }
    );

    expect(multiStep).toBeGreaterThan(singleStep);
  });

  it('should handle unknown domains gracefully', () => {
    const difficulty = calculateIRTDifficulty(
      'Random query',
      'unknown_domain',
      { requiresMultiStep: false }
    );

    expect(difficulty).toBe(0.5); // Default fallback
  });
});
```

---

## 9. UI/Styling & Accessibility

### 9.1 Tailwind Only (No CSS Modules)

```typescript
// GOOD: Tailwind with clsx for conditionals
import clsx from 'clsx';

export function QueryStatus({ isLoading, error }: QueryStatusProps) {
  return (
    <div className={clsx(
      'rounded-lg p-4 transition-all',
      isLoading && 'bg-blue-50 animate-pulse',
      error && 'bg-red-50 border border-red-200',
      !isLoading && !error && 'bg-green-50'
    )}>
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}
      {!isLoading && !error && <SuccessIndicator />}
    </div>
  );
}
```

### 9.2 Accessibility (A11y)

**Every interactive element needs:**
```typescript
// GOOD: Accessible button
export function ExecuteButton({
  onClick,
  disabled
}: ExecuteButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Execute AI query"
      aria-disabled={disabled}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={clsx(
        'px-4 py-2 rounded-md font-medium',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        disabled
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      )}
    >
      Execute Query
    </button>
  );
}

// GOOD: Semantic structure
export function ReasoningSteps({ steps }: ReasoningStepsProps) {
  return (
    <section aria-labelledby="reasoning-title">
      <h2 id="reasoning-title" className="text-2xl font-bold mb-4">
        Reasoning Steps
      </h2>
      <ol className="space-y-2" role="list">
        {steps.map((step, index) => (
          <li
            key={step.id}
            role="listitem"
            aria-label={`Step ${index + 1}: ${step.description}`}
          >
            <StepCard step={step} />
          </li>
        ))}
      </ol>
    </section>
  );
}
```

---

## 10. Next.js 14 App Router Patterns

### 10.1 Server vs Client Components

```typescript
// SERVER COMPONENT (default - no 'use client')
// Good for: Data fetching, static content, SEO
export default async function BenchmarkPage() {
  const results = await fetchBenchmarkResults(); // Server-side fetch

  return (
    <div>
      <h1>Benchmark Results</h1>
      <BenchmarkChart data={results} /> {/* Client component */}
    </div>
  );
}

// CLIENT COMPONENT (needs 'use client')
// Good for: Interactivity, hooks, browser APIs
'use client';

import { useState, useCallback } from 'react';

export function QueryExecutor() {
  const [query, setQuery] = useState('');

  const handleExecute = useCallback(async () => {
    const result = await fetch('/api/execute', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
    // Handle result
  }, [query]);

  return (
    <form onSubmit={handleExecute}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Execute</button>
    </form>
  );
}
```

### 10.2 API Routes

```typescript
// app/api/execute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { executeQuery } from '@/lib/permutation-engine';

const RequestSchema = z.object({
  query: z.string().min(1).max(1000),
  domain: z.enum(['financial', 'medical', 'legal', 'general']).optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, domain } = RequestSchema.parse(body);

    const result = await executeQuery(query, { domain });

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: error.errors
        },
        { status: 400 }
      );
    }

    logger.error('API execution failed', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
```

---

## 11. Enforcement Checklist

Before committing code, verify:

- [ ] **No `any` types** (use proper interfaces/types)
- [ ] **No `eval()`, `Function()`, or unsafe `innerHTML`**
- [ ] **All async operations have try-catch**
- [ ] **Use `logger` instead of `console`**
- [ ] **Parallel execution for independent operations**
- [ ] **Input validation with Zod for all API routes**
- [ ] **Environment variables validated on startup**
- [ ] **No TODO comments for core functionality**
- [ ] **All interactive elements have aria-labels and keyboard handlers**
- [ ] **Proper TypeScript types for all function parameters/returns**
- [ ] **No hardcoded secrets or API keys**
- [ ] **Caching implemented for expensive operations**
- [ ] **Error handling returns safe fallbacks (no throws to user)**
- [ ] **Tests written for new business logic**
- [ ] **DSPy signatures specify WHAT (semantic meaning), not HOW (variable names)**

---

## 12. Quick Reference

### Code Smells to Avoid

```typescript
// ❌ Type assertions
const result = data as SkillResult;

// ❌ Non-null assertions
const value = obj.prop!.value!;

// ❌ any type
function process(data: any): any { }

// ❌ Sequential awaits
await step1(); await step2(); await step3();

// ❌ console logging
console.log('Debug info');

// ❌ Unsafe eval
eval(userInput);

// ❌ Hardcoded secrets
const apiKey = "sk-abc123";

// ❌ Missing error handling
const result = await riskyOperation();

// ❌ TODO in production
// TODO: Implement this properly

// ❌ DSPy: Hand-tuned variable names (prompt engineering)
const signature = "detailed_reasoning_step_1: str, comprehensive_context_v2: str -> final_answer_optimized: str";
```

### Approved Patterns

```typescript
// ✅ Type guards
if (isSkillResult(data)) { }

// ✅ Optional chaining
const value = obj.prop?.value ?? 0;

// ✅ Proper types
function process(data: DataItem[]): Result { }

// ✅ Parallel execution
await Promise.all([step1(), step2(), step3()]);

// ✅ Logger usage
logger.info('Debug info', { context });

// ✅ Safe parsing
const result = JSON.parse(sanitized);

// ✅ Environment variables
const apiKey = env.OPENAI_API_KEY;

// ✅ Try-catch everywhere
try { await riskyOp(); } catch (e) { logger.error(...); }

// ✅ Complete implementation
function feature() { /* fully implemented */ }

// ✅ DSPy: Semantic specification (not prompt engineering)
const signature = "query: question to answer, context: relevant background -> answer: final response";
```

---

## Version History

- **v2.1** (2025-10-29): Added DSPy declarative AI programming principles
  - Section 6.5: DSPy integration philosophy
  - Emphasis on semantic specification over variable naming
  - Type-safe DSPy patterns with Zod schemas
  - DSPy + ACE/GEPA integration examples
  - Updated enforcement checklist and quick reference

- **v2.0** (2025-10-29): Updated based on comprehensive code analysis
  - Added security rules for dynamic code execution
  - Added `any` type reduction guidelines
  - Added PERMUTATION AI specific patterns (MoE, IRT, ACE, GEPA)
  - Added performance patterns (parallel execution, caching)
  - Added enforcement checklist

- **v1.0** (Initial): Base TypeScript guidelines

---

**Apply these rules to ALL code generation and editing in Cursor IDE.**
**If existing code violates these rules, refactor to comply.**
**For new features, define types first, then implement.**
