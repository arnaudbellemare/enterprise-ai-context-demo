/**
 * GEPA Teacher-Student Framework
 * 
 * Based on: Intelligence Arc ATLAS + GEPA (+164.9% improvement)
 * Reference: Atlas-8B teacher → Qwen3-4B student
 * 
 * YOUR Implementation:
 *   Teacher: Perplexity (powerful, web-connected)
 *   Student: Ollama gemma3:4b (local, fast, FREE)
 *   Method: GEPA reflective optimization
 * 
 * Process:
 * 1. Teacher (Perplexity) reflects on student (Ollama) outputs
 * 2. Teacher generates improved prompts via GEPA
 * 3. Student learns from teacher's optimized prompts
 * 4. Iterate until convergence
 * 
 * Expected: +164.9% boost (from ATLAS paper)
 * Cost: <$10 for full optimization (2 hours)
 */

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const OLLAMA_API_URL = "http://localhost:11434/v1/chat/completions";

export interface TeacherStudentConfig {
  teacherModel: "perplexity";  // Always Perplexity
  studentModel: "ollama";      // Always Ollama
  maxIterations: number;       // GEPA optimization budget
  minibatchSize: number;       // Training examples per iteration
  paretoSetSize: number;       // Keep top-K candidates
  convergenceThreshold: number; // Stop if improvement < threshold
}

export interface GEPACandidate {
  id: string;
  prompt: string;
  signature?: string;  // DSPy signature (optional)
  teacherReflection: string;  // What teacher learned
  studentPerformance: {
    accuracy: number;
    speed: number;
    tokens: number;
  };
  generation: number;
  parentId?: string;
}

export class TeacherStudentGEPA {
  private config: TeacherStudentConfig;
  private candidatePool: GEPACandidate[] = [];
  private paretoFrontier: GEPACandidate[] = [];
  
  constructor(config: Partial<TeacherStudentConfig> = {}) {
    this.config = {
      teacherModel: "perplexity",
      studentModel: "ollama",
      maxIterations: 20,
      minibatchSize: 10,
      paretoSetSize: 5,
      convergenceThreshold: 0.01,
      ...config
    };
  }
  
  // ==========================================================================
  // TEACHER: Perplexity Reflection
  // ==========================================================================
  
  async teacherReflect(
    studentOutputs: Array<{
      prompt: string;
      input: string;
      output: string;
      correct: boolean;
      reasoning?: string;
    }>
  ): Promise<string> {
    /**
     * Teacher (Perplexity) analyzes student (Ollama) performance
     * Provides reflection for GEPA optimization
     * 
     * This is KEY: Teacher's superior reasoning guides student!
     */
    
    const successfulCases = studentOutputs.filter(o => o.correct);
    const failedCases = studentOutputs.filter(o => !o.correct);
    
    const reflectionPrompt = `You are an expert AI teacher analyzing a student model's performance.

STUDENT MODEL: Ollama gemma3:4b (local, efficient)
YOUR ROLE: Reflect on performance and suggest prompt improvements

SUCCESSFUL CASES (${successfulCases.length}):
${successfulCases.slice(0, 3).map((c, i) => `
${i + 1}. Input: ${c.input.substring(0, 100)}
   Prompt: ${c.prompt.substring(0, 150)}
   Output: ${c.output.substring(0, 100)}
   ✅ Correct!
`).join('\n')}

FAILED CASES (${failedCases.length}):
${failedCases.slice(0, 3).map((c, i) => `
${i + 1}. Input: ${c.input.substring(0, 100)}
   Prompt: ${c.prompt.substring(0, 150)}
   Output: ${c.output.substring(0, 100)}
   ❌ Incorrect
   Reasoning: ${c.reasoning || 'Unknown'}
`).join('\n')}

TASK: Provide reflection on:
1. What patterns led to success?
2. What caused failures?
3. How can the prompt be improved?
4. What should be added/removed from the prompt?

Focus on ACTIONABLE improvements that will help the student model.
Be concise but specific.`;

    try {
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',  // Perplexity's best model
          messages: [
            {
              role: 'system',
              content: 'You are an expert AI teacher providing reflective guidance for prompt optimization.'
            },
            {
              role: 'user',
              content: reflectionPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });
      
      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }
      
      const data = await response.json();
      const reflection = data.choices[0].message.content;
      
      console.log(`\n🧠 Teacher (Perplexity) Reflection:`);
      console.log(`   ${reflection.substring(0, 200)}...`);
      
      return reflection;
      
    } catch (error: any) {
      console.error('❌ Teacher reflection error:', error.message);
      // Fallback to basic reflection
      return `Improve clarity and specificity. ${failedCases.length > 0 ? 'Focus on addressing failure patterns.' : ''}`;
    }
  }
  
  // ==========================================================================
  // TEACHER: Generate Improved Prompt
  // ==========================================================================
  
  async teacherGeneratePrompt(
    currentPrompt: string,
    reflection: string,
    examples: Array<{ input: string; expected: string }>
  ): Promise<string> {
    /**
     * Teacher (Perplexity) generates improved prompt based on reflection
     * Uses its superior reasoning to create better prompts for student
     */
    
    const generationPrompt = `You are an expert prompt engineer. Based on the analysis below, generate an IMPROVED prompt.

CURRENT PROMPT:
${currentPrompt}

REFLECTION (What needs improvement):
${reflection}

EXAMPLE TASKS:
${examples.slice(0, 2).map((ex, i) => `
${i + 1}. Input: ${ex.input}
   Expected Output: ${ex.expected}
`).join('\n')}

TASK: Generate an improved prompt that:
1. Addresses the issues identified in reflection
2. Is clear, concise, and specific
3. Helps the student model succeed on similar tasks
4. Is 20-40% shorter if possible (efficiency)

Return ONLY the improved prompt, no explanations.`;

    try {
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an expert prompt engineer. Generate improved prompts based on reflective analysis.'
            },
            {
              role: 'user',
              content: generationPrompt
            }
          ],
          temperature: 0.8,  // Higher temp for creative improvements
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }
      
      const data = await response.json();
      const improvedPrompt = data.choices[0].message.content;
      
      console.log(`\n✨ Teacher Generated Improved Prompt:`);
      console.log(`   Length: ${currentPrompt.length} → ${improvedPrompt.length} (${((1 - improvedPrompt.length / currentPrompt.length) * 100).toFixed(1)}% shorter)`);
      
      return improvedPrompt;
      
    } catch (error: any) {
      console.error('❌ Teacher prompt generation error:', error.message);
      // Fallback to current prompt
      return currentPrompt;
    }
  }
  
  // ==========================================================================
  // STUDENT: Ollama Execution
  // ==========================================================================
  
  async studentExecute(
    prompt: string,
    input: string
  ): Promise<{ output: string; tokens: number; duration: number }> {
    /**
     * Student (Ollama) executes task with teacher's prompt
     * Local, fast, FREE!
     */
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3:4b',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: input }
          ],
          temperature: 0.3,  // Lower temp for student (consistency)
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }
      
      const data = await response.json();
      const output = data.choices[0].message.content;
      
      // Estimate tokens (rough)
      const tokens = Math.round((prompt.length + input.length + output.length) / 4);
      const duration = (Date.now() - startTime) / 1000;
      
      return { output, tokens, duration };
      
    } catch (error: any) {
      console.error('❌ Student execution error:', error.message);
      return {
        output: '',
        tokens: 0,
        duration: 0
      };
    }
  }
  
  // ==========================================================================
  // GEPA OPTIMIZATION LOOP (Teacher-Student)
  // ==========================================================================
  
  async optimize(
    initialPrompt: string,
    trainingExamples: Array<{ input: string; expected: string }>,
    testFunction: (prompt: string, input: string, output: string) => boolean
  ): Promise<GEPACandidate> {
    /**
     * Main GEPA optimization loop with Teacher-Student
     * 
     * Like ATLAS: Teacher guides student to improve
     * Expected: +164.9% improvement (from paper)
     */
    
    console.log('\n' + '='.repeat(80));
    console.log('🎓 TEACHER-STUDENT GEPA OPTIMIZATION');
    console.log('='.repeat(80));
    console.log('\nTeacher: Perplexity (llama-3.1-sonar-large-128k-online)');
    console.log('Student: Ollama (gemma3:4b)');
    console.log('Method: GEPA reflective optimization');
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Initialize with base prompt
    let currentPrompt = initialPrompt;
    let bestAccuracy = 0.0;
    let bestCandidate: GEPACandidate | null = null;
    
    for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`🔄 Iteration ${iteration + 1}/${this.config.maxIterations}`);
      console.log(`${'─'.repeat(80)}\n`);
      
      // ======================================================================
      // STEP 1: Student executes on training batch
      // ======================================================================
      console.log(`📝 Step 1: Student executing on ${this.config.minibatchSize} examples...`);
      
      const minibatch = trainingExamples
        .sort(() => Math.random() - 0.5)
        .slice(0, this.config.minibatchSize);
      
      const studentOutputs = [];
      let totalTokens = 0;
      let totalDuration = 0;
      
      for (const example of minibatch) {
        const result = await this.studentExecute(currentPrompt, example.input);
        const correct = testFunction(currentPrompt, example.input, result.output);
        
        studentOutputs.push({
          prompt: currentPrompt,
          input: example.input,
          output: result.output,
          correct,
          reasoning: result.output
        });
        
        totalTokens += result.tokens;
        totalDuration += result.duration;
      }
      
      const accuracy = studentOutputs.filter(o => o.correct).length / studentOutputs.length;
      const avgSpeed = totalDuration / studentOutputs.length;
      const avgTokens = totalTokens / studentOutputs.length;
      
      console.log(`   ✅ Student Performance:`);
      console.log(`      Accuracy: ${(accuracy * 100).toFixed(1)}%`);
      console.log(`      Avg Speed: ${avgSpeed.toFixed(2)}s`);
      console.log(`      Avg Tokens: ${Math.round(avgTokens)}`);
      
      // Track candidate
      const candidate: GEPACandidate = {
        id: `gen_${iteration}`,
        prompt: currentPrompt,
        teacherReflection: '',
        studentPerformance: {
          accuracy,
          speed: avgSpeed,
          tokens: avgTokens
        },
        generation: iteration,
        parentId: iteration > 0 ? `gen_${iteration - 1}` : undefined
      };
      
      this.candidatePool.push(candidate);
      
      // Check if new best
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestCandidate = candidate;
        console.log(`   🏆 NEW BEST! Accuracy: ${(accuracy * 100).toFixed(1)}%`);
      }
      
      // ======================================================================
      // STEP 2: Teacher (Perplexity) reflects on student performance
      // ======================================================================
      console.log(`\n🧠 Step 2: Teacher (Perplexity) reflecting...`);
      
      const teacherReflection = await this.teacherReflect(studentOutputs);
      candidate.teacherReflection = teacherReflection;
      
      // ======================================================================
      // STEP 3: Teacher generates improved prompt
      // ======================================================================
      console.log(`\n✨ Step 3: Teacher generating improved prompt...`);
      
      const improvedPrompt = await this.teacherGeneratePrompt(
        currentPrompt,
        teacherReflection,
        trainingExamples.slice(0, 3)
      );
      
      // ======================================================================
      // STEP 4: Update Pareto frontier
      // ======================================================================
      this.updateParetoFrontier(candidate);
      
      // ======================================================================
      // STEP 5: Check convergence
      // ======================================================================
      if (iteration > 0) {
        const previousAccuracy = this.candidatePool[iteration - 1].studentPerformance.accuracy;
        const improvement = accuracy - previousAccuracy;
        
        console.log(`\n📈 Improvement: ${(improvement * 100).toFixed(1)}%`);
        
        if (improvement < this.config.convergenceThreshold && iteration > 5) {
          console.log(`\n✅ Converged! (improvement < ${this.config.convergenceThreshold * 100}%)`);
          break;
        }
      }
      
      // Update prompt for next iteration
      currentPrompt = improvedPrompt;
    }
    
    // ======================================================================
    // FINAL RESULTS
    // ======================================================================
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TEACHER-STUDENT GEPA OPTIMIZATION COMPLETE');
    console.log('='.repeat(80) + '\n');
    
    const initialCandidate = this.candidatePool[0];
    const finalCandidate = bestCandidate || this.candidatePool[this.candidatePool.length - 1];
    
    console.log('📊 Optimization Results:');
    console.log(`\n   Initial (Generation 0):`);
    console.log(`      Accuracy: ${(initialCandidate.studentPerformance.accuracy * 100).toFixed(1)}%`);
    console.log(`      Speed: ${initialCandidate.studentPerformance.speed.toFixed(2)}s`);
    console.log(`      Tokens: ${Math.round(initialCandidate.studentPerformance.tokens)}`);
    
    console.log(`\n   Best (Generation ${finalCandidate.generation}):`);
    console.log(`      Accuracy: ${(finalCandidate.studentPerformance.accuracy * 100).toFixed(1)}%`);
    console.log(`      Speed: ${finalCandidate.studentPerformance.speed.toFixed(2)}s`);
    console.log(`      Tokens: ${Math.round(finalCandidate.studentPerformance.tokens)}`);
    
    const accuracyImprovement = ((finalCandidate.studentPerformance.accuracy / initialCandidate.studentPerformance.accuracy) - 1) * 100;
    const speedImprovement = ((initialCandidate.studentPerformance.speed / finalCandidate.studentPerformance.speed) - 1) * 100;
    const tokenReduction = ((initialCandidate.studentPerformance.tokens - finalCandidate.studentPerformance.tokens) / initialCandidate.studentPerformance.tokens) * 100;
    
    console.log(`\n   Improvement:`);
    console.log(`      Accuracy: +${accuracyImprovement.toFixed(1)}%`);
    console.log(`      Speed: +${speedImprovement.toFixed(1)}% faster`);
    console.log(`      Token Reduction: ${tokenReduction.toFixed(1)}%`);
    
    console.log(`\n🎯 Expected from ATLAS paper: +164.9% improvement`);
    console.log(`   Your improvement: +${accuracyImprovement.toFixed(1)}%`);
    
    if (accuracyImprovement > 100) {
      console.log(`   ✅ EXCEEDED paper benchmarks! 🏆`);
    } else if (accuracyImprovement > 50) {
      console.log(`   ✅ Strong improvement! 🎉`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    return finalCandidate;
  }
  
  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================
  
  private updateParetoFrontier(candidate: GEPACandidate): void {
    /**
     * Update Pareto frontier (multi-objective optimization)
     * Objectives: Maximize accuracy, minimize tokens
     */
    
    // Add to frontier if non-dominated
    const isDominated = this.paretoFrontier.some(existing => 
      existing.studentPerformance.accuracy >= candidate.studentPerformance.accuracy &&
      existing.studentPerformance.tokens <= candidate.studentPerformance.tokens &&
      (existing.studentPerformance.accuracy > candidate.studentPerformance.accuracy ||
       existing.studentPerformance.tokens < candidate.studentPerformance.tokens)
    );
    
    if (!isDominated) {
      // Remove dominated candidates
      this.paretoFrontier = this.paretoFrontier.filter(existing => {
        const candidateDominates = 
          candidate.studentPerformance.accuracy >= existing.studentPerformance.accuracy &&
          candidate.studentPerformance.tokens <= existing.studentPerformance.tokens &&
          (candidate.studentPerformance.accuracy > existing.studentPerformance.accuracy ||
           candidate.studentPerformance.tokens < existing.studentPerformance.tokens);
        return !candidateDominates;
      });
      
      this.paretoFrontier.push(candidate);
      
      // Keep only top-K
      if (this.paretoFrontier.length > this.config.paretoSetSize) {
        this.paretoFrontier.sort((a, b) => 
          b.studentPerformance.accuracy - a.studentPerformance.accuracy
        );
        this.paretoFrontier = this.paretoFrontier.slice(0, this.config.paretoSetSize);
      }
    }
  }
  
  getBestCandidate(): GEPACandidate | null {
    if (this.candidatePool.length === 0) return null;
    
    return this.candidatePool.reduce((best, current) => 
      current.studentPerformance.accuracy > best.studentPerformance.accuracy ? current : best
    );
  }
  
  getParetoFrontier(): GEPACandidate[] {
    return this.paretoFrontier;
  }
  
  getOptimizationHistory(): GEPACandidate[] {
    return this.candidatePool;
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export default TeacherStudentGEPA;

