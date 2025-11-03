/**
 * REFRAG Vector-Passing Benchmark
 * 
 * Compares performance of vector-passing vs text-passing modes
 * Measures:
 * - Time-To-First-Token (TTFT)
 * - Time-To-Iterative-Token (TTIT)
 * - Overall throughput
 * - Token efficiency
 */

import { REFRAGSystem, REFRAGConfig, type REFRAGResult } from './refrag-system';
import { VectorPassingLLM, type VectorChunk } from './vector-passing-llm';
import { createLogger } from '../../lib/walt/logger';

const logger = createLogger('REFRAGBenchmark');

export interface BenchmarkTest {
  query: string;
  expectedContext: string; // Description of expected context
  chunks: Array<{
    id: string;
    content: string;
    embedding: number[];
    metadata?: any;
  }>;
}

export interface BenchmarkResult {
  test: BenchmarkTest;
  vectorPassing: {
    ttft_ms: number;
    ttit_ms: number;
    totalTime_ms: number;
    tokensGenerated: number;
    throughput_improvement: number;
    vectorTokensSaved: number;
    response: string;
    method: 'vector' | 'text_fallback';
  };
  textPassing: {
    ttft_ms: number;
    ttit_ms: number;
    totalTime_ms: number;
    tokensGenerated: number;
    response: string;
  };
  comparison: {
    ttft_speedup: number; // How many times faster (vector vs text)
    ttit_speedup: number;
    throughput_speedup: number;
    tokenEfficiency: number; // Tokens saved percentage
  };
}

export class REFRAGBenchmark {
  private tests: BenchmarkTest[] = [];
  private perplexityKey: string | null = null;
  private ollamaAvailable: boolean = false;

  constructor() {
    this.perplexityKey = process.env.PERPLEXITY_API_KEY || null;
    this.initializeTests();
    this.checkOllamaAvailability();
  }

  /**
   * Initialize test cases
   * Note: Tests will use real embeddings generated at runtime from actual text content
   */
  private initializeTests() {
    this.tests = [
      {
        query: 'What is the main benefit of vector-passing in RAG systems?',
        expectedContext: 'Technical documentation about vector-passing and RAG optimization',
        chunks: [
          {
            id: 'chunk1',
            content: 'Vector-passing in RAG systems allows pre-computed embeddings to be passed directly to LLMs, avoiding the need to re-encode text tokens. This achieves significant speedups: 31x faster Time-To-First-Token (TTFT) and 3x faster Time-To-Iterative-Token (TTIT), resulting in 7x overall throughput improvement.',
            embedding: [], // Will be generated from real embedding service at runtime
            metadata: { source: 'rag-optimization-paper' }
          },
          {
            id: 'chunk2',
            content: 'Traditional RAG systems retrieve relevant documents using vector similarity search, but then discard the vectors and pass only the text content to the LLM. This wastes computational resources since embeddings are already computed.',
            embedding: [], // Will be generated from real embedding service at runtime
            metadata: { source: 'rag-comparison' }
          },
          {
            id: 'chunk3',
            content: 'REFRAG (Retrieval-Enhanced Fine-Grained RAG) combines advanced chunk selection with vector-passing to maximize both retrieval quality and inference speed. The system uses sensor-based strategies like MMR and uncertainty sampling.',
            embedding: [], // Will be generated from real embedding service at runtime
            metadata: { source: 'refrag-docs' }
          }
        ]
      },
      {
        query: 'How does REFRAG improve over standard RAG?',
        expectedContext: 'REFRAG system architecture and features',
        chunks: [
          {
            id: 'chunk4',
            content: 'REFRAG introduces sensor-based chunk selection beyond simple top-k retrieval. It uses Maximal Marginal Relevance (MMR) for diversity, uncertainty sampling for active learning, and optimization memory that learns from past retrievals.',
            embedding: [], // Will be generated from real embedding service at runtime
            metadata: { source: 'refrag-architecture' }
          },
          {
            id: 'chunk5',
            content: 'The system adapts retrieval parameters based on query characteristics. For short questions, it prefers MMR. For technical queries, it uses uncertainty sampling. The optimization memory tracks effectiveness and suggests better strategies over time.',
            embedding: [], // Will be generated from real embedding service at runtime
            metadata: { source: 'refrag-optimization' }
          }
        ]
      },
      {
        query: 'What are the performance metrics for vector-passing?',
        expectedContext: 'Performance benchmarks and metrics',
        chunks: [
          {
            id: 'chunk6',
            content: 'Vector-passing achieves 31x faster Time-To-First-Token compared to text-passing. This is because the LLM doesn\'t need to process long text sequences when vectors are already encoded.',
            embedding: [], // Will be generated from real embedding service at runtime
            metadata: { source: 'performance-metrics' }
          },
          {
            id: 'chunk7',
            content: 'Time-To-Iterative-Token improves by 3x, meaning each subsequent token is generated faster. Combined with TTFT improvements, overall throughput increases by 7x while maintaining or improving response quality.',
            embedding: [], // Will be generated from real embedding service at runtime
            metadata: { source: 'throughput-analysis' }
          },
          {
            id: 'chunk8',
            content: 'The speedup is more pronounced for longer contexts. For documents with 10+ chunks, vector-passing can save thousands of tokens per request, making it especially valuable for enterprise RAG applications.',
            embedding: [], // Will be generated from real embedding service at runtime
            metadata: { source: 'long-context-benefits' }
          }
        ]
      }
    ];

    logger.info('Benchmark tests initialized', { testCount: this.tests.length });
  }

  /**
   * Check if Ollama is available
   */
  private async checkOllamaAvailability() {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(1000) // 1 second timeout
      });
      this.ollamaAvailable = response.ok;
    } catch (error) {
      this.ollamaAvailable = false;
    }
    logger.info('Ollama availability check', { available: this.ollamaAvailable });
  }

  /**
   * Run benchmark for a single test
   */
  async runBenchmark(
    test: BenchmarkTest,
    provider: 'perplexity' | 'ollama'
  ): Promise<BenchmarkResult> {
    logger.info('Running benchmark', { query: test.query.substring(0, 50), provider });

    // Generate real embeddings for test chunks if not already present
    const testWithEmbeddings = await this.ensureEmbeddings(test);

    // Test vector-passing
    const vectorPassingResult = await this.testVectorPassing(testWithEmbeddings, provider);

    // Test text-passing (baseline)
    const textPassingResult = await this.testTextPassing(testWithEmbeddings, provider);

    // Calculate comparison metrics
    const comparison = {
      ttft_speedup: textPassingResult.ttft_ms / vectorPassingResult.ttft_ms,
      ttit_speedup: textPassingResult.ttit_ms / vectorPassingResult.ttit_ms,
      throughput_speedup: (textPassingResult.totalTime_ms / textPassingResult.tokensGenerated) /
                          (vectorPassingResult.totalTime_ms / vectorPassingResult.tokensGenerated),
      tokenEfficiency: vectorPassingResult.vectorTokensSaved / 
                      (testWithEmbeddings.chunks.reduce((sum, c) => sum + c.content.length, 0) / 4) * 100
    };

    return {
      test: testWithEmbeddings,
      vectorPassing: vectorPassingResult,
      textPassing: textPassingResult,
      comparison
    };
  }

  /**
   * Ensure test chunks have real embeddings generated from content
   */
  private async ensureEmbeddings(test: BenchmarkTest): Promise<BenchmarkTest> {
    const { embeddingService } = await import('./embedding-service');
    
    const chunksWithEmbeddings = await Promise.all(
      test.chunks.map(async (chunk) => {
        if (chunk.embedding && chunk.embedding.length > 0) {
          // Already has embedding
          return chunk;
        }
        
        // Generate real embedding from content
        const embeddingResult = await embeddingService.generate(chunk.content);
        return {
          ...chunk,
          embedding: embeddingResult.embedding
        };
      })
    );

    return {
      ...test,
      chunks: chunksWithEmbeddings
    };
  }

  /**
   * Test vector-passing mode
   */
  private async testVectorPassing(
    test: BenchmarkTest,
    provider: 'perplexity' | 'ollama'
  ): Promise<BenchmarkResult['vectorPassing']> {
    const startTime = Date.now();
    
    const vectorChunks: VectorChunk[] = test.chunks.map(chunk => ({
      id: chunk.id,
      embedding: chunk.embedding,
      content: chunk.content,
      metadata: chunk.metadata
    }));

      const vectorLLM = new VectorPassingLLM({
      provider,
      model: provider === 'ollama' ? 'gemma3:4b' : 'sonar-pro',
      compressionRatio: 8,
      quantizationBits: 8
    });

    const result = await vectorLLM.generate(test.query, vectorChunks);

    return {
      ...result.metrics,
      response: result.response,
      method: result.method
    };
  }

  /**
   * Test text-passing mode (baseline)
   */
  private async testTextPassing(
    test: BenchmarkTest,
    provider: 'perplexity' | 'ollama'
  ): Promise<BenchmarkResult['textPassing']> {
    const startTime = Date.now();
    
    // Construct text context
    const textContext = test.chunks
      .map((c, idx) => `[Document ${idx + 1}]\n${c.content}`)
      .join('\n\n');
    
    const prompt = `Query: ${test.query}\n\nContext:\n${textContext}\n\nAnswer:`;

    let responseText = '';
    let ttft_ms = 0;
    let ttit_ms = 0;

    if (provider === 'perplexity') {
      if (!this.perplexityKey) {
        throw new Error('PERPLEXITY_API_KEY not configured');
      }

      const ttftStart = Date.now();
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 4000
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let firstTokenReceived = false;
      let tokensGenerated = 0;
      let lastTokenTime = Date.now();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta?.content;
              
              if (delta) {
                if (!firstTokenReceived) {
                  ttft_ms = Date.now() - ttftStart;
                  firstTokenReceived = true;
                }
                responseText += delta;
                tokensGenerated++;
                if (tokensGenerated > 1) {
                  ttit_ms = (Date.now() - lastTokenTime) / tokensGenerated;
                }
                lastTokenTime = Date.now();
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } else {
      // Ollama text passing
      const ttftStart = Date.now();
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3:4b',
          prompt,
          stream: true,
          options: {
            temperature: 0.7,
            num_predict: 4000
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let firstTokenReceived = false;
      let tokensGenerated = 0;
      let lastTokenTime = Date.now();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            const delta = data.response;
            
            if (delta) {
              if (!firstTokenReceived) {
                ttft_ms = Date.now() - ttftStart;
                firstTokenReceived = true;
              }
              responseText += delta;
              tokensGenerated++;
              if (tokensGenerated > 1) {
                ttit_ms = (Date.now() - lastTokenTime) / tokensGenerated;
              }
              lastTokenTime = Date.now();
            }
            
            if (data.done) break;
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    const totalTime = Date.now() - startTime;
    const tokensGenerated = Math.ceil(responseText.length / 4);

    return {
      ttft_ms,
      ttit_ms,
      totalTime_ms: totalTime,
      tokensGenerated,
      response: responseText
    };
  }

  /**
   * Run all benchmarks
   */
  async runAllBenchmarks(provider: 'perplexity' | 'ollama'): Promise<BenchmarkResult[]> {
    logger.info('Running all benchmarks', { provider, testCount: this.tests.length });

    const results: BenchmarkResult[] = [];

    for (const test of this.tests) {
      try {
        const result = await this.runBenchmark(test, provider);
        results.push(result);
        
        logger.info('Benchmark completed', {
          query: test.query.substring(0, 50),
          ttft_speedup: result.comparison.ttft_speedup.toFixed(2) + 'x',
          throughput_speedup: result.comparison.throughput_speedup.toFixed(2) + 'x'
        });
      } catch (error: any) {
        logger.error('Benchmark failed', { error: error.message, query: test.query });
      }
    }

    return results;
  }

  /**
   * Get summary statistics
   */
  getSummary(results: BenchmarkResult[]) {
    const avgTTFTSpeedup = results.reduce((sum, r) => sum + r.comparison.ttft_speedup, 0) / results.length;
    const avgTTITSpeedup = results.reduce((sum, r) => sum + r.comparison.ttit_speedup, 0) / results.length;
    const avgThroughputSpeedup = results.reduce((sum, r) => sum + r.comparison.throughput_speedup, 0) / results.length;
    const avgTokenEfficiency = results.reduce((sum, r) => sum + r.comparison.tokenEfficiency, 0) / results.length;

    return {
      testCount: results.length,
      averageSpeedups: {
        ttft: avgTTFTSpeedup,
        ttit: avgTTITSpeedup,
        throughput: avgThroughputSpeedup,
        tokenEfficiency: avgTokenEfficiency
      },
      results
    };
  }

  getTests(): BenchmarkTest[] {
    return this.tests;
  }
}

