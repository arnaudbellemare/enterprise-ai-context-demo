/**
 * DSPy Evaluators for RAG Modules
 * 
 * "The evaluator doesn't HAVE to use an LLM"
 * "You could as easily use BM25 precision/recall numbers"
 * 
 * Evaluators:
 * - Retrieve: Precision, Recall, F1
 * - Extract: Keyword accuracy, Entity F1
 * - Decide: Validation accuracy
 * 
 * NO LLM REQUIRED - Pure metrics!
 */

// ============================================
// RETRIEVE EVALUATOR
// Measures: Precision, Recall, F1
// ============================================

export interface RetrieveEvaluation {
  precision: number;
  recall: number;
  f1: number;
  retrieved_count: number;
  relevant_count: number;
  total_relevant: number;
}

export function evaluateRetrieve(
  retrieved_spans: string[],
  ground_truth_spans: string[]
): RetrieveEvaluation {
  // True positives: Retrieved AND relevant
  const truePositives = retrieved_spans.filter(span => 
    ground_truth_spans.some(gt => 
      span.toLowerCase().includes(gt.toLowerCase()) ||
      gt.toLowerCase().includes(span.toLowerCase())
    )
  ).length;

  // Precision: What fraction of retrieved spans are relevant?
  const precision = retrieved_spans.length > 0 
    ? truePositives / retrieved_spans.length 
    : 0;

  // Recall: What fraction of relevant spans were retrieved?
  const recall = ground_truth_spans.length > 0
    ? truePositives / ground_truth_spans.length
    : 0;

  // F1: Harmonic mean of precision and recall
  const f1 = precision + recall > 0
    ? 2 * (precision * recall) / (precision + recall)
    : 0;

  return {
    precision,
    recall,
    f1,
    retrieved_count: retrieved_spans.length,
    relevant_count: truePositives,
    total_relevant: ground_truth_spans.length
  };
}

// ============================================
// EXTRACT EVALUATOR
// Measures: Keyword accuracy, Entity F1
// ============================================

export interface ExtractEvaluation {
  keyword_precision: number;
  keyword_recall: number;
  keyword_f1: number;
  entity_precision: number;
  entity_recall: number;
  entity_f1: number;
  overall_score: number;
}

export function evaluateExtract(
  extracted_keywords: string[],
  extracted_entities: Array<{ text: string; type: string }>,
  ground_truth_keywords: string[],
  ground_truth_entities: string[]
): ExtractEvaluation {
  // Keyword evaluation
  const keywordTruePositives = extracted_keywords.filter(kw =>
    ground_truth_keywords.some(gt => 
      kw.toLowerCase() === gt.toLowerCase() ||
      gt.toLowerCase().includes(kw.toLowerCase())
    )
  ).length;

  const keywordPrecision = extracted_keywords.length > 0
    ? keywordTruePositives / extracted_keywords.length
    : 0;

  const keywordRecall = ground_truth_keywords.length > 0
    ? keywordTruePositives / ground_truth_keywords.length
    : 0;

  const keywordF1 = keywordPrecision + keywordRecall > 0
    ? 2 * (keywordPrecision * keywordRecall) / (keywordPrecision + keywordRecall)
    : 0;

  // Entity evaluation
  const entityTexts = extracted_entities.map(e => e.text);
  const entityTruePositives = entityTexts.filter(ent =>
    ground_truth_entities.some(gt =>
      ent.toLowerCase().includes(gt.toLowerCase()) ||
      gt.toLowerCase().includes(ent.toLowerCase())
    )
  ).length;

  const entityPrecision = entityTexts.length > 0
    ? entityTruePositives / entityTexts.length
    : 0;

  const entityRecall = ground_truth_entities.length > 0
    ? entityTruePositives / ground_truth_entities.length
    : 0;

  const entityF1 = entityPrecision + entityRecall > 0
    ? 2 * (entityPrecision * entityRecall) / (entityPrecision + entityRecall)
    : 0;

  // Overall score: Average of keyword and entity F1
  const overallScore = (keywordF1 + entityF1) / 2;

  return {
    keyword_precision: keywordPrecision,
    keyword_recall: keywordRecall,
    keyword_f1: keywordF1,
    entity_precision: entityPrecision,
    entity_recall: entityRecall,
    entity_f1: entityF1,
    overall_score: overallScore
  };
}

// ============================================
// DECIDE EVALUATOR
// Measures: Validation accuracy
// ============================================

export interface DecideEvaluation {
  accuracy: number;
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
  precision: number;
  recall: number;
  f1: number;
}

export function evaluateDecide(
  validated_insights: Array<{ insight: string; holds_up: boolean; confidence: number }>,
  ground_truth: Array<{ insight: string; should_hold_up: boolean }>
): DecideEvaluation {
  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;

  validated_insights.forEach(validated => {
    const gt = ground_truth.find(g => 
      g.insight.toLowerCase().includes(validated.insight.toLowerCase()) ||
      validated.insight.toLowerCase().includes(g.insight.toLowerCase())
    );

    if (!gt) return; // Skip if no ground truth

    if (validated.holds_up && gt.should_hold_up) {
      truePositives++;
    } else if (validated.holds_up && !gt.should_hold_up) {
      falsePositives++;
    } else if (!validated.holds_up && !gt.should_hold_up) {
      trueNegatives++;
    } else if (!validated.holds_up && gt.should_hold_up) {
      falseNegatives++;
    }
  });

  const total = truePositives + falsePositives + trueNegatives + falseNegatives;
  const accuracy = total > 0 ? (truePositives + trueNegatives) / total : 0;

  const precision = (truePositives + falsePositives) > 0
    ? truePositives / (truePositives + falsePositives)
    : 0;

  const recall = (truePositives + falseNegatives) > 0
    ? truePositives / (truePositives + falseNegatives)
    : 0;

  const f1 = precision + recall > 0
    ? 2 * (precision * recall) / (precision + recall)
    : 0;

  return {
    accuracy,
    true_positives: truePositives,
    false_positives: falsePositives,
    true_negatives: trueNegatives,
    false_negatives: falseNegatives,
    precision,
    recall,
    f1
  };
}

// ============================================
// END-TO-END PIPELINE EVALUATOR
// ============================================

export interface PipelineEvaluation {
  retrieve: RetrieveEvaluation;
  extract: ExtractEvaluation;
  decide: DecideEvaluation;
  overall_score: number;
  bottleneck: 'retrieve' | 'extract' | 'decide';
  recommendation: string;
}

export function evaluatePipeline(
  pipelineResults: any,
  groundTruth: any
): PipelineEvaluation {
  const retrieveEval = evaluateRetrieve(
    pipelineResults.spans.map((s: any) => s.text),
    groundTruth.relevant_spans
  );

  const extractEval = evaluateExtract(
    pipelineResults.keywords,
    pipelineResults.entities,
    groundTruth.keywords,
    groundTruth.entities
  );

  const decideEval = evaluateDecide(
    pipelineResults.validated_insights,
    groundTruth.insights
  );

  // Find bottleneck (lowest F1 score)
  const scores = {
    retrieve: retrieveEval.f1,
    extract: extractEval.overall_score,
    decide: decideEval.f1
  };

  const bottleneck = (() => {
    let minScore = scores.retrieve;
    let minName: 'retrieve' | 'extract' | 'decide' = 'retrieve';
    
    if (scores.extract < minScore) {
      minScore = scores.extract;
      minName = 'extract';
    }
    if (scores.decide < minScore) {
      minScore = scores.decide;
      minName = 'decide';
    }
    
    return minName;
  })();

  // Overall score: Weighted average
  const overallScore = 
    retrieveEval.f1 * 0.4 +
    extractEval.overall_score * 0.3 +
    decideEval.f1 * 0.3;

  // Generate recommendation
  let recommendation = '';
  if (retrieveEval.f1 < 0.7) {
    recommendation = 'Improve retrieval: Consider switching from BM25 to embedding or LLM-based retrieval';
  } else if (extractEval.overall_score < 0.7) {
    recommendation = 'Improve extraction: Consider switching from rule-based to LLM-based extraction';
  } else if (decideEval.f1 < 0.7) {
    recommendation = 'Improve validation: Consider switching from rule-based to LLM-based validation';
  } else {
    recommendation = 'Pipeline performing well! Consider optimizing for cost or latency';
  }

  return {
    retrieve: retrieveEval,
    extract: extractEval,
    decide: decideEval,
    overall_score: overallScore,
    bottleneck,
    recommendation
  };
}

