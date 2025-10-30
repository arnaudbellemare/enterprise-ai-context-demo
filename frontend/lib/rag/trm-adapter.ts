import { Document } from './vector-store-adapter';

export interface TRMConfig {
  maxSteps?: number;           // recursive improvement steps
  minScore?: number;           // acceptance threshold
  useEmbeddings?: boolean;     // future: plug embeddings; currently token-based
}

export interface TRMVerifyResult {
  score: number;               // 0..1 consistency/faithfulness
  reasons: string[];
}

export interface TRMImproveResult {
  answer: string;
  delta: string;
  score: number;
}

/**
 * TRM-lite Adapter
 * A tiny recursive verifier/improver using token heuristics and gated latent state.
 */
export class TRMAdapter {
  private config: Required<TRMConfig>;

  constructor(config?: TRMConfig) {
    this.config = {
      maxSteps: config?.maxSteps ?? 3,
      minScore: config?.minScore ?? 0.6,
      useEmbeddings: config?.useEmbeddings ?? false,
    };
  }

  /**
   * Verify consistency and faithfulness of answer vs context + query.
   */
  async verify(query: string, context: string, answer: string): Promise<TRMVerifyResult> {
    const q = this.tokenize(query);
    const c = this.tokenize(context);
    const a = this.tokenize(answer);

    // Faithfulness: % of answer tokens present in context
    const faithful = this.overlap(a, c);

    // Relevance: % of query tokens represented in answer
    const relevance = this.overlap(q, a);

    // Coverage proxy: % of answer tokens also present in query OR context
    const coverage = this.overlap(a, new Set([...q, ...c]));

    // Combined score
    const score = 0.5 * faithful + 0.3 * relevance + 0.2 * coverage;

    const reasons: string[] = [];
    if (faithful < 0.6) reasons.push('Low faithfulness to provided context');
    if (relevance < 0.6) reasons.push('Low relevance to query');
    if (coverage < 0.6) reasons.push('Answer may include unsupported details');

    return { score, reasons };
  }

  /**
   * Improve answer recursively by removing unsupported spans and adding missing key points.
   */
  async improve(query: string, context: string, answer: string): Promise<TRMImproveResult> {
    let current = answer;
    let bestScore = 0;
    let bestAnswer = current;

    for (let step = 0; step < this.config.maxSteps; step++) {
      const { score } = await this.verify(query, context, current);
      if (score > bestScore) {
        bestScore = score;
        bestAnswer = current;
      }
      if (score >= this.config.minScore) break;

      // Compute suggestions
      const improved = this.minimalEdit(query, context, current);
      if (improved === current) break;
      current = improved;
    }

    return {
      answer: bestAnswer,
      delta: this.diff(answer, bestAnswer),
      score: bestScore,
    };
  }

  // --- helpers ---

  private tokenize(text: string): Set<string> {
    return new Set(
      (text || '')
        .toLowerCase()
        .replace(/[\W_]+/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2)
    );
  }

  private overlap(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) return 0;
    let inter = 0;
    for (const t of a) if (b.has(t)) inter++;
    return inter / a.size;
    }

  private minimalEdit(query: string, context: string, answer: string): string {
    // Remove unsupported sentences and add missing key terms
    const ctx = this.tokenize(context);
    const q = this.tokenize(query);

    const sentences = answer.split(/(?<=[.!?])\s+/);

    // Remove sentences with very low context overlap
    const kept: string[] = [];
    for (const s of sentences) {
      const st = this.tokenize(s);
      const faithful = this.overlap(st, ctx);
      if (faithful >= 0.3) kept.push(s);
    }

    let improved = kept.join(' ');

    // Ensure key query terms are present; if missing, add a short clause
    const keyMissing: string[] = [];
    for (const term of q) {
      if (!improved.toLowerCase().includes(term)) keyMissing.push(term);
    }

    if (keyMissing.length > 0) {
      improved += (improved.endsWith('.') ? ' ' : '. ') +
        `Addressed terms: ${keyMissing.slice(0, 6).join(', ')}.`;
    }

    // Trim overly long answer
    if (improved.length > 1500) {
      improved = improved.slice(0, 1500);
    }

    return improved;
  }

  private diff(a: string, b: string): string {
    if (a === b) return '';
    return `from ${JSON.stringify(a.slice(0, 200))} ... to ${JSON.stringify(b.slice(0, 200))}`;
  }
}
