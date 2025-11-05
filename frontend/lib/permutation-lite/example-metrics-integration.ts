/**
 * Example: How to Integrate Extended Intelligence Metrics in GAMP Pipeline
 * 
 * This shows a practical example of adding metrics tracking to the pipeline.
 */

import { extendedIntelligenceMetrics, type ContextQualityMetrics } from '../extended-intelligence-metrics';
import { contextQualityDashboard } from '../context-quality-dashboard';

/**
 * Example integration in generateAnswer method
 */
async function generateAnswerWithMetrics(
  query: string,
  contextEngineeringResult: any | null,
  graphReasoningResult: any | null,
  agent: string = 'gemma3:4b'
): Promise<{
  answer: string;
  metrics?: any;
}> {
  // Handle null context
  if (!contextEngineeringResult) {
    console.warn('No context engineering result available, skipping metrics');
    return { answer: query, metrics: null };
  }
  // STEP 1: Generate agent-only answer (baseline - without context)
  console.log('📊 Generating agent-only answer for baseline comparison...');
  const agentOnlyAnswer = await generateAgentOnlyAnswer(query);
  
  // STEP 2: Generate context-enhanced answer (with Context Engineering 2.0)
  console.log('📊 Generating context-enhanced answer with Context Engineering 2.0...');
  const contextEnhancedAnswer = await generateAnswerWithContext(
    query,
    contextEngineeringResult,
    graphReasoningResult
  );
  
  // STEP 3: Calculate quality metrics
  const agentQuality = calculateAnswerQuality(agentOnlyAnswer, query);
  const contextQuality: ContextQualityMetrics = {
    relevance: contextEngineeringResult.quality?.relevance || 0.5,
    coherence: contextEngineeringResult.quality?.coherence || 0.5,
    completeness: contextEngineeringResult.quality?.completeness || 0.5,
    efficiency: calculateContextEfficiency(contextEngineeringResult),
    freshness: calculateContextFreshness(contextEngineeringResult),
    diversity: calculateContextDiversity(contextEngineeringResult),
  };
  
  // STEP 4: Record extended intelligence metrics
  const metrics = await extendedIntelligenceMetrics.recordMetrics({
    query,
    domain: contextEngineeringResult.metadata?.domain || 'general',
    agent,
    agentAnswer: agentOnlyAnswer,
    contextAnswer: contextEnhancedAnswer,
    contextQuality,
    agentQuality,
    contextTokens: estimateTokens(contextEngineeringResult.context || []),
    agentTokens: estimateTokens(agentOnlyAnswer),
    sessionId: contextEngineeringResult.metadata?.sessionId || 'default',
  });
  
  // STEP 5: Record context quality in dashboard
  contextQualityDashboard.recordQuality(contextQuality);
  
  // STEP 6: Log metrics
  console.log('📊 Extended Intelligence Metrics:');
  console.log(`   Agent Contribution: ${(metrics.agentContribution.quality * 100).toFixed(1)}%`);
  console.log(`   Context Contribution: +${(metrics.contextContribution.qualityImprovement * 100).toFixed(1)}%`);
  console.log(`   Extended Intelligence: ${(metrics.extendedIntelligence.overallQuality * 100).toFixed(1)}%`);
  console.log(`   Intelligence Extension: ${(metrics.extendedIntelligence.intelligenceExtension * 100).toFixed(1)}%`);
  
  return {
    answer: contextEnhancedAnswer,
    metrics,
  };
}

/**
 * Helper: Generate answer without context (baseline)
 */
async function generateAgentOnlyAnswer(query: string): Promise<string> {
  // Use Ollama HTTP API directly without context
  try {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma3:4b',
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Answer the question directly without additional context.' },
          { role: 'user', content: query }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || query;
  } catch (error) {
    console.warn('Failed to generate agent-only answer:', error);
    return 'Agent-only answer generation failed';
  }
}

/**
 * Helper: Generate answer with context (enhanced)
 */
async function generateAnswerWithContext(
  query: string,
  contextEngineeringResult: any,
  graphReasoningResult: any
): Promise<string> {
  // Use your existing answer generation with context
  // This is where you'd use Context Engineering 2.0 enriched context
  const enrichedContext = contextEngineeringResult.context || [];
  const graphInsights = graphReasoningResult?.paths?.[0] || null;
  
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const response = await fetch(`${ollamaUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma3:4b',
      messages: [
        { role: 'system', content: 'You are a helpful assistant with access to enriched context. Use the provided context to give a comprehensive answer.' },
        { role: 'user', content: buildPromptWithContext(query, enrichedContext, graphInsights) }
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Helper: Build prompt with context
 */
function buildPromptWithContext(
  query: string,
  context: any[],
  graphInsights: any
): string {
  const contextText = context
    .map(c => `- ${c.content}`)
    .join('\n');
  
  const graphText = graphInsights
    ? `\n\nGraph Reasoning Insights:\n- Problem: ${graphInsights.problem}\n- Solution: ${graphInsights.solution}\n- Effect: ${graphInsights.effect}`
    : '';
  
  return `Query: ${query}\n\nContext:\n${contextText}${graphText}\n\nAnswer:`;
}

/**
 * Helper: Calculate answer quality
 */
function calculateAnswerQuality(answer: string, query: string): {
  quality: number;
  relevance: number;
  coherence: number;
  completeness: number;
} {
  // Relevance: keyword overlap
  const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const answerWords = new Set(answer.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const intersection = [...queryWords].filter(w => answerWords.has(w)).length;
  const relevance = queryWords.size > 0 ? intersection / queryWords.size : 0;
  
  // Coherence: sentence structure
  const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgLength = sentences.length > 0 
    ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length 
    : 0;
  const coherence = Math.max(0, 1 - Math.abs(avgLength - 50) / 50);
  
  // Completeness: answer length
  const completeness = Math.min(1, answer.length / 100);
  
  // Overall quality
  const quality = (relevance * 0.4) + (coherence * 0.3) + (completeness * 0.3);
  
  return { quality, relevance, coherence, completeness };
}

/**
 * Helper: Calculate context efficiency
 */
function calculateContextEfficiency(contextResult: any): number {
  if (!contextResult.context || contextResult.context.length === 0) return 0;
  
  const totalTokens = estimateTokens(contextResult.context);
  const entropyReduction = contextResult.analytics?.entropyReduction || 0;
  
  // Efficiency = entropy reduction / tokens (higher is better)
  return totalTokens > 0 ? Math.min(1, entropyReduction / (totalTokens / 100)) : 0;
}

/**
 * Helper: Calculate context freshness
 */
function calculateContextFreshness(contextResult: any): number {
  if (!contextResult.context || contextResult.context.length === 0) return 0;
  
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  const freshnessScores = contextResult.context.map((c: any) => {
    const timestamp = c.metadata?.timestamp || now;
    const age = now - (typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime());
    return Math.max(0, 1 - (age / maxAge));
  });
  
  return freshnessScores.reduce((sum: number, score: number) => sum + score, 0) / freshnessScores.length;
}

/**
 * Helper: Calculate context diversity
 */
function calculateContextDiversity(contextResult: any): number {
  if (!contextResult.context || contextResult.context.length === 0) return 0;
  
  const sources = new Set(contextResult.context.map((c: any) => c.metadata?.domain || 'general'));
  const types = new Set(contextResult.context.map((c: any) => c.type || 'unknown'));
  
  const sourceDiversity = Math.min(1, sources.size / contextResult.context.length);
  const typeDiversity = Math.min(1, types.size / contextResult.context.length);
  
  return (sourceDiversity * 0.6) + (typeDiversity * 0.4);
}

/**
 * Helper: Estimate tokens (rough approximation)
 */
function estimateTokens(text: string | any[]): number {
  if (typeof text === 'string') {
    return Math.ceil(text.length / 4); // Rough approximation: 4 chars per token
  }
  if (Array.isArray(text)) {
    return text.reduce((sum, item) => {
      const content = item.content || JSON.stringify(item);
      return sum + Math.ceil(content.length / 4);
    }, 0);
  }
  return 0;
}

/**
 * Example: Using metrics in API route
 * 
 * NOTE: This is an example file for reference only.
 * The actual implementation should be in your API routes.
 * 
 * To use this:
 * 1. Copy the generateAnswerWithMetrics function to your API route
 * 2. Import extendedIntelligenceMetrics and contextQualityDashboard
 * 3. Call generateAnswerWithMetrics after pipeline execution
 */

/**
 * Example: Accessing metrics via API
 */
export async function exampleGetMetrics() {
  // Get extended intelligence metrics
  const metricsResponse = await fetch('/api/context-metrics?endpoint=extended-intelligence&timeWindow=3600000');
  const metrics = await metricsResponse.json();
  
  console.log('Extended Intelligence:', metrics.metrics);
  
  // Get quality dashboard
  const dashboardResponse = await fetch('/api/context-metrics?endpoint=quality-dashboard&timeWindow=3600000');
  const dashboard = await dashboardResponse.json();
  
  console.log('Quality Dashboard:', dashboard.dashboard);
  console.log('Alerts:', dashboard.dashboard.alerts);
  console.log('Recommendations:', dashboard.dashboard.recommendations);
  
  return { metrics, dashboard };
}

