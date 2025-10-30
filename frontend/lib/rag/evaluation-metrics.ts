/**
 * RAG Evaluation Metrics
 *
 * Implements comprehensive evaluation metrics for RAG systems:
 * - Retrieval: Precision, Recall, MRR, NDCG, MAP
 * - Generation: BLEU, ROUGE, F1, Faithfulness
 * - End-to-End: Answer correctness, latency, cost
 *
 * References:
 * - GEPA RAG: https://github.com/gepa-ai/gepa
 * - RAGAS: https://github.com/explodinggradients/ragas
 * - BEIR: https://github.com/beir-cellar/beir
 */

import { Document } from './vector-store-adapter';

export interface RetrievalMetrics {
  precision: number;
  recall: number;
  f1: number;
  mrr: number;         // Mean Reciprocal Rank
  ndcg: number;        // Normalized Discounted Cumulative Gain
  map: number;         // Mean Average Precision
}

export interface GenerationMetrics {
  bleu: number;
  rouge1: number;
  rouge2: number;
  rougeL: number;
  faithfulness: number;
  relevance: number;
}

export interface EndToEndMetrics {
  answerCorrectness: number;
  contextRelevance: number;
  contextPrecision: number;
  contextRecall: number;
  latency: number;
  cost: number;
}

/**
 * Evaluate retrieval quality
 */
export function evaluateRetrieval(
  retrieved: Document[],
  relevant: Set<string>,
  k: number = 10
): RetrievalMetrics {
  const retrievedIds = retrieved.slice(0, k).map(d => d.id);

  // Precision: Retrieved relevant / Retrieved
  const retrievedRelevant = retrievedIds.filter(id => relevant.has(id)).length;
  const precision = retrievedRelevant / Math.min(k, retrieved.length);

  // Recall: Retrieved relevant / Total relevant
  const recall = retrievedRelevant / relevant.size;

  // F1: Harmonic mean
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // MRR: 1 / rank of first relevant
  let mrr = 0;
  for (let i = 0; i < retrievedIds.length; i++) {
    if (relevant.has(retrievedIds[i])) {
      mrr = 1 / (i + 1);
      break;
    }
  }

  // NDCG: Normalized DCG
  const dcg = calculateDCG(retrievedIds, relevant);
  const idcg = calculateIDCG(relevant.size, k);
  const ndcg = idcg > 0 ? dcg / idcg : 0;

  // MAP: Mean Average Precision
  let sumPrecision = 0;
  let relevantCount = 0;

  for (let i = 0; i < retrievedIds.length; i++) {
    if (relevant.has(retrievedIds[i])) {
      relevantCount++;
      const precisionAtI = relevantCount / (i + 1);
      sumPrecision += precisionAtI;
    }
  }

  const map = relevant.size > 0 ? sumPrecision / Math.min(relevant.size, k) : 0;

  return { precision, recall, f1, mrr, ndcg, map };
}

/**
 * Calculate DCG (Discounted Cumulative Gain)
 */
function calculateDCG(retrieved: string[], relevant: Set<string>): number {
  let dcg = 0;

  for (let i = 0; i < retrieved.length; i++) {
    const relevance = relevant.has(retrieved[i]) ? 1 : 0;
    dcg += relevance / Math.log2(i + 2);  // log2(i + 2) because i is 0-indexed
  }

  return dcg;
}

/**
 * Calculate IDCG (Ideal DCG)
 */
function calculateIDCG(numRelevant: number, k: number): number {
  let idcg = 0;

  for (let i = 0; i < Math.min(numRelevant, k); i++) {
    idcg += 1 / Math.log2(i + 2);
  }

  return idcg;
}

/**
 * Evaluate generation quality
 */
export function evaluateGeneration(
  generated: string,
  reference: string,
  context: string
): GenerationMetrics {
  // BLEU score (simple approximation)
  const bleu = calculateBLEU(generated, reference);

  // ROUGE scores
  const rouge1 = calculateROUGE1(generated, reference);
  const rouge2 = calculateROUGE2(generated, reference);
  const rougeL = calculateROUGEL(generated, reference);

  // Faithfulness: Does generated answer use only context info?
  const faithfulness = calculateFaithfulness(generated, context);

  // Relevance: Does generated answer address the reference?
  const relevance = calculateRelevance(generated, reference);

  return { bleu, rouge1, rouge2, rougeL, faithfulness, relevance };
}

/**
 * Calculate BLEU score (simple unigram approximation)
 */
function calculateBLEU(generated: string, reference: string): number {
  const genTokens = tokenize(generated);
  const refTokens = tokenize(reference);

  if (genTokens.length === 0) return 0;

  const refSet = new Set(refTokens);
  let matches = 0;

  for (const token of genTokens) {
    if (refSet.has(token)) {
      matches++;
    }
  }

  return matches / genTokens.length;
}

/**
 * Calculate ROUGE-1 (unigram overlap)
 */
function calculateROUGE1(generated: string, reference: string): number {
  const genTokens = new Set(tokenize(generated));
  const refTokens = new Set(tokenize(reference));

  const intersection = new Set([...genTokens].filter(t => refTokens.has(t)));

  if (refTokens.size === 0) return 0;

  return intersection.size / refTokens.size;
}

/**
 * Calculate ROUGE-2 (bigram overlap)
 */
function calculateROUGE2(generated: string, reference: string): number {
  const genBigrams = getBigrams(tokenize(generated));
  const refBigrams = getBigrams(tokenize(reference));

  const genSet = new Set(genBigrams);
  const refSet = new Set(refBigrams);

  const intersection = new Set([...genSet].filter(b => refSet.has(b)));

  if (refSet.size === 0) return 0;

  return intersection.size / refSet.size;
}

/**
 * Calculate ROUGE-L (longest common subsequence)
 */
function calculateROUGEL(generated: string, reference: string): number {
  const genTokens = tokenize(generated);
  const refTokens = tokenize(reference);

  const lcs = longestCommonSubsequence(genTokens, refTokens);

  if (refTokens.length === 0) return 0;

  return lcs.length / refTokens.length;
}

/**
 * Calculate faithfulness (token overlap with context)
 */
function calculateFaithfulness(generated: string, context: string): number {
  const genTokens = new Set(tokenize(generated));
  const contextTokens = new Set(tokenize(context));

  // Count how many generated tokens are in context
  const faithful = [...genTokens].filter(t => contextTokens.has(t)).length;

  if (genTokens.size === 0) return 1;

  return faithful / genTokens.size;
}

/**
 * Calculate relevance (similarity to reference)
 */
function calculateRelevance(generated: string, reference: string): number {
  return calculateROUGE1(generated, reference);
}

/**
 * Get bigrams from tokens
 */
function getBigrams(tokens: string[]): string[] {
  const bigrams: string[] = [];

  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }

  return bigrams;
}

/**
 * Longest common subsequence
 */
function longestCommonSubsequence(seq1: string[], seq2: string[]): string[] {
  const m = seq1.length;
  const n = seq2.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (seq1[i - 1] === seq2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (seq1[i - 1] === seq2[j - 1]) {
      lcs.unshift(seq1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

/**
 * Tokenize text
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

/**
 * Evaluate end-to-end RAG performance
 */
export function evaluateEndToEnd(
  query: string,
  retrievedDocs: Document[],
  generatedAnswer: string,
  referenceAnswer: string,
  relevantDocIds: Set<string>,
  latency: number,
  cost: number
): EndToEndMetrics {
  // Answer correctness (ROUGE-L with reference)
  const answerCorrectness = calculateROUGEL(generatedAnswer, referenceAnswer);

  // Context relevance (how relevant are retrieved docs to query?)
  const contextRelevance = calculateContextRelevance(query, retrievedDocs);

  // Context precision (% of retrieved docs that are relevant)
  const retrievedRelevant = retrievedDocs.filter(d => relevantDocIds.has(d.id)).length;
  const contextPrecision = retrievedDocs.length > 0 ? retrievedRelevant / retrievedDocs.length : 0;

  // Context recall (% of relevant docs that were retrieved)
  const contextRecall = relevantDocIds.size > 0 ? retrievedRelevant / relevantDocIds.size : 0;

  return {
    answerCorrectness,
    contextRelevance,
    contextPrecision,
    contextRecall,
    latency,
    cost,
  };
}

/**
 * Calculate context relevance
 */
function calculateContextRelevance(query: string, documents: Document[]): number {
  const queryTokens = new Set(tokenize(query));

  let totalRelevance = 0;

  for (const doc of documents) {
    const docTokens = new Set(tokenize(doc.content));
    const intersection = new Set([...queryTokens].filter(t => docTokens.has(t)));

    const relevance = queryTokens.size > 0 ? intersection.size / queryTokens.size : 0;
    totalRelevance += relevance;
  }

  return documents.length > 0 ? totalRelevance / documents.length : 0;
}

/**
 * Benchmark results container
 */
export interface BenchmarkResults {
  dataset: string;
  numQueries: number;
  retrieval: {
    avgPrecision: number;
    avgRecall: number;
    avgF1: number;
    avgMRR: number;
    avgNDCG: number;
    avgMAP: number;
  };
  generation: {
    avgBLEU: number;
    avgROUGE1: number;
    avgROUGE2: number;
    avgROUGEL: number;
    avgFaithfulness: number;
    avgRelevance: number;
  };
  endToEnd: {
    avgAnswerCorrectness: number;
    avgContextRelevance: number;
    avgContextPrecision: number;
    avgContextRecall: number;
    avgLatency: number;
    totalCost: number;
  };
}

/**
 * Aggregate benchmark results
 */
export function aggregateBenchmarkResults(
  results: Array<{
    retrieval?: RetrievalMetrics;
    generation?: GenerationMetrics;
    endToEnd?: EndToEndMetrics;
  }>,
  dataset: string
): BenchmarkResults {
  const n = results.length;

  const retrieval = {
    avgPrecision: avg(results.map(r => r.retrieval?.precision || 0)),
    avgRecall: avg(results.map(r => r.retrieval?.recall || 0)),
    avgF1: avg(results.map(r => r.retrieval?.f1 || 0)),
    avgMRR: avg(results.map(r => r.retrieval?.mrr || 0)),
    avgNDCG: avg(results.map(r => r.retrieval?.ndcg || 0)),
    avgMAP: avg(results.map(r => r.retrieval?.map || 0)),
  };

  const generation = {
    avgBLEU: avg(results.map(r => r.generation?.bleu || 0)),
    avgROUGE1: avg(results.map(r => r.generation?.rouge1 || 0)),
    avgROUGE2: avg(results.map(r => r.generation?.rouge2 || 0)),
    avgROUGEL: avg(results.map(r => r.generation?.rougeL || 0)),
    avgFaithfulness: avg(results.map(r => r.generation?.faithfulness || 0)),
    avgRelevance: avg(results.map(r => r.generation?.relevance || 0)),
  };

  const endToEnd = {
    avgAnswerCorrectness: avg(results.map(r => r.endToEnd?.answerCorrectness || 0)),
    avgContextRelevance: avg(results.map(r => r.endToEnd?.contextRelevance || 0)),
    avgContextPrecision: avg(results.map(r => r.endToEnd?.contextPrecision || 0)),
    avgContextRecall: avg(results.map(r => r.endToEnd?.contextRecall || 0)),
    avgLatency: avg(results.map(r => r.endToEnd?.latency || 0)),
    totalCost: sum(results.map(r => r.endToEnd?.cost || 0)),
  };

  return {
    dataset,
    numQueries: n,
    retrieval,
    generation,
    endToEnd,
  };
}

/**
 * Average
 */
function avg(values: number[]): number {
  return values.length > 0 ? sum(values) / values.length : 0;
}

/**
 * Sum
 */
function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
