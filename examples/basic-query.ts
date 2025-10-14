/**
 * Basic Query Example
 * 
 * Shows the simplest way to use PERMUTATION for a single query.
 */

import { PermutationEngine } from '../frontend/lib/permutation-engine';

async function basicQueryExample() {
  // 1. Create engine with default configuration
  const engine = new PermutationEngine();

  // 2. Execute a query
  const result = await engine.execute(
    "What's the current Bitcoin price?",
    "crypto"
  );

  // 3. Display results
  console.log('Answer:', result.answer);
  console.log('Quality Score:', result.metadata.quality_score);
  console.log('Cost:', `$${result.metadata.cost}`);
  console.log('Duration:', `${result.metadata.duration_ms}ms`);

  // 4. View reasoning steps
  console.log('\nReasoning Steps:');
  result.reasoning.forEach((step, i) => {
    console.log(`${i + 1}. ${step}`);
  });

  // 5. Check metadata
  console.log('\nComponents Used:');
  console.log('- Teacher calls:', result.metadata.teacher_calls);
  console.log('- Student calls:', result.metadata.student_calls);
  console.log('- Queries generated:', result.metadata.queries_generated);
  console.log('- Memories retrieved:', result.metadata.memories_retrieved);
}

// Run the example
basicQueryExample().catch(console.error);

/**
 * Expected Output:
 * 
 * Answer: Bitcoin is currently trading at $67,340 USD...
 * Quality Score: 0.94
 * Cost: $0.005
 * Duration: 3200ms
 * 
 * Reasoning Steps:
 * 1. Domain Detection: crypto identified
 * 2. ACE Framework: Loaded 5 bullets from Supabase
 * 3. Multi-Query: Generated 60 variations with Ollama
 * 4. IRT: Difficulty 0.80 (Hard), Expected accuracy 85%
 * 5. ReasoningBank: Retrieved 3 crypto memories from database
 * 6. LoRA: Applied crypto fine-tuning (rank=8, alpha=16)
 * 7. Teacher Model: Fetched real-time data from Perplexity
 * 8. DSPy: Optimized prompt with Ax LLM
 * 9. TRM: Verified with 92% confidence (3 iterations)
 * 10. Student Model: Generated final answer with Ollama
 * 
 * Components Used:
 * - Teacher calls: 1
 * - Student calls: 3
 * - Queries generated: 60
 * - Memories retrieved: 3
 */

