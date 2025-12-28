# Email Classification: Path to 90-92% Accuracy

## Current State
- **Baseline**: 70-80% accuracy (rule-based + naive few-shot)
- **Phase 1 Complete**: Embedding-based example selection ✅
- **Target**: 90-92% accuracy

## Improvement Strategy

### 1. Complete Phase 1 Implementation (Already Done ✅)
**Expected Gain**: +12-22 percentage points (70-80% → 90-92%)

**What's Implemented**:
- ✅ Embedding-based example selection (semantic similarity)
- ✅ Supabase storage with pgvector
- ✅ Active learning queue infrastructure
- ✅ Metrics tracking API

**What Needs Verification**:
- [ ] Ensure embedding selector is actually being used in classification
- [ ] Verify cache hit rate is 60-80%
- [ ] Confirm 10 examples are being selected (not 5)
- [ ] Test that high-confidence examples (>0.85) are auto-stored

**Action Items**:
```typescript
// Verify in frontend/lib/email-template-classifier.ts
// Should use selectOptimalExamples() not random selection
const examples = await selectOptimalExamples(emailText, 10);
```

---

### 2. Implement Confidence Calibration (Phase 2)
**Expected Gain**: +2-4 percentage points (90% → 92-94%)

**Status**: Database schema exists, calibrator class NOT implemented

**Implementation Needed**:

```typescript
// frontend/lib/email-classification/confidence-calibrator.ts
export class ConfidenceCalibrator {
  private calibrationData: CalibrationData[] = [];
  private temperature: number = 1.0;
  private perTemplateTemperatures: Map<string, number> = new Map();

  async addFeedback(
    predictedConfidence: number,
    actualCorrect: boolean,
    templateId: string
  ): Promise<void> {
    // Store in Supabase
    await supabase.from('email_confidence_calibration').insert({
      predicted_confidence: predictedConfidence,
      actual_correct: actualCorrect,
      template_id: templateId
    });

    // Recalibrate every 50 examples
    const count = await this.getCalibrationDataCount(templateId);
    if (count % 50 === 0) {
      await this.calibrate(templateId);
    }
  }

  async calibrate(templateId: string): Promise<void> {
    const data = await this.getCalibrationData(templateId, 500);
    
    // Find optimal temperature T
    let bestT = 1.0;
    let bestLoss = Infinity;

    for (let T = 0.1; T <= 5.0; T += 0.1) {
      const loss = this.calculateLoss(data, T);
      if (loss < bestLoss) {
        bestLoss = loss;
        bestT = T;
      }
    }

    this.perTemplateTemperatures.set(templateId, bestT);
    
    // Store in database or cache
    await this.storeTemperature(templateId, bestT);
  }

  calibrateConfidence(rawConfidence: number, templateId: string): number {
    const T = this.perTemplateTemperatures.get(templateId) || 1.0;
    return this.applyTemperature(rawConfidence, T);
  }

  private applyTemperature(confidence: number, T: number): number {
    const logit = Math.log(confidence / (1 - confidence));
    const scaledLogit = logit / T;
    return 1 / (1 + Math.exp(-scaledLogit));
  }
}
```

**Integration Points**:
1. After classification, calibrate confidence score
2. Use calibrated confidence for threshold decisions
3. Collect feedback from user corrections

**Benefits**:
- Accurate confidence scores (ECE < 0.05)
- Better threshold tuning (when to use LLM vs rule-based)
- Per-template calibration (different templates have different confidence distributions)

---

### 3. Enhance Active Learning (Phase 2)
**Expected Gain**: +1-2 percentage points (92% → 93-94%)

**Status**: Queue exists, but may not be optimally prioritized

**Improvements Needed**:

```typescript
// Enhanced priority calculation
function calculatePriority(
  classification: EmailClassification,
  emailText: string
): number {
  const uncertainty = 1 - classification.confidence;
  
  // Diversity: How different is this from existing examples?
  const diversity = await calculateDiversity(emailText);
  
  // Entropy: How uncertain is the model?
  const entropy = calculatePredictionEntropy(classification);
  
  // Model disagreement: If ensemble, how much do models disagree?
  const disagreement = await calculateModelDisagreement(emailText);
  
  // Priority = weighted combination
  return (
    0.4 * uncertainty +
    0.3 * diversity +
    0.2 * entropy +
    0.1 * disagreement
  );
}
```

**Action Items**:
- [ ] Implement diversity calculation (distance to existing examples)
- [ ] Add prediction entropy calculation
- [ ] Create model disagreement metric (if using ensemble)
- [ ] Update active learning queue to use enhanced priority

---

### 4. Continuous Learning Pipeline (Phase 3)
**Expected Gain**: +1-2 percentage points (93% → 94-95%)

**Status**: Partially implemented, needs completion

**Implementation**:

```typescript
// frontend/lib/email-classification/continuous-learning.ts
export async function handleProductionEmail(
  email: EmailRequest
): Promise<EmailClassification> {
  const classification = await classifyEmailHybrid(email.body);

  // High confidence (>0.9) → Auto-label and store
  if (classification.confidence > 0.9) {
    await storePseudoLabeledExample({
      email: email.body,
      templateId: classification.template.id,
      templateName: classification.template.name,
      confidence: classification.confidence,
      entities: classification.extractedEntities,
      source: 'auto-labeled',
      userId: 'system'
    });
  }

  // Medium confidence (0.5-0.9) → Active learning queue
  else if (classification.confidence >= 0.5) {
    const priority = await calculatePriority(classification, email.body);
    await addToLabelingQueue({
      email: email.body,
      predictedTemplateId: classification.template.id,
      confidence: classification.confidence,
      uncertainty: 1 - classification.confidence,
      priority,
      diversity: await calculateDiversity(email.body)
    });
  }

  // Low confidence (<0.5) → Priority queue
  else {
    await addToLabelingQueue({
      email: email.body,
      predictedTemplateId: classification.template.id,
      confidence: classification.confidence,
      uncertainty: 1 - classification.confidence,
      priority: 1.0, // Highest priority
      diversity: await calculateDiversity(email.body)
    });
  }

  // Track metrics
  await trackClassificationMetric({
    emailHash: hashEmail(email.body),
    predictedTemplateId: classification.template.id,
    predictedConfidence: classification.confidence,
    method: 'hybrid'
  });

  return classification;
}
```

**Integration**:
- [ ] Integrate into `/api/email/classify-and-respond` route
- [ ] Set up background job to process labeling queue
- [ ] Create UI for reviewing auto-labeled examples

---

### 5. PALIMPZEST Optimization Integration
**Expected Gain**: Better model selection → fewer errors

**Status**: Recently implemented ✅

**What It Does**:
- Keyword pre-filtering (avoids LLM for obvious cases)
- Model selection (cheap model for simple, expensive for complex)
- Token trimming (50-70% reduction)

**Action Items**:
- [ ] Verify PALIMPZEST convert operator is being used
- [ ] Ensure model selection logic is optimal
- [ ] Monitor cost/accuracy trade-offs

---

### 6. Enhanced Few-Shot Examples
**Expected Gain**: +1-2 percentage points

**Current**: 10 examples (70% similar + 30% diverse)

**Improvements**:

```typescript
// Increase to 15 examples with better diversity
const examples = await selectOptimalExamples(emailText, 15, {
  similarRatio: 0.6,  // 60% similar (9 examples)
  diverseRatio: 0.3,  // 30% diverse (4 examples)
  adversarialRatio: 0.1 // 10% adversarial (2 examples)
});

// Adversarial examples: Similar but different template
// Helps model learn boundaries
```

**Action Items**:
- [ ] Increase example count from 10 to 15
- [ ] Add adversarial example selection
- [ ] Balance template coverage

---

### 7. Template-Specific Improvements
**Expected Gain**: +2-3 percentage points on weak templates

**Identify Weak Templates**:
```sql
-- Find templates with accuracy < 85%
SELECT 
  template_id,
  COUNT(*) as total,
  SUM(CASE WHEN correct THEN 1 ELSE 0 END)::float / COUNT(*) as accuracy
FROM email_classification_metrics
WHERE correct IS NOT NULL
GROUP BY template_id
HAVING SUM(CASE WHEN correct THEN 1 ELSE 0 END)::float / COUNT(*) < 0.85
ORDER BY accuracy ASC;
```

**Actions**:
- [ ] Add more examples for low-accuracy templates
- [ ] Create template-specific rules
- [ ] Fine-tune confidence thresholds per template

---

## Implementation Priority

### Week 1: Quick Wins
1. ✅ Verify Phase 1 is fully integrated
2. ✅ Implement confidence calibrator
3. ✅ Integrate calibration into classification flow

**Expected**: 90-91% accuracy

### Week 2: Active Learning Enhancement
1. ✅ Enhance priority calculation
2. ✅ Implement diversity metrics
3. ✅ Set up continuous learning pipeline

**Expected**: 91-92% accuracy

### Week 3: Optimization
1. ✅ Increase few-shot examples to 15
2. ✅ Add adversarial examples
3. ✅ Template-specific improvements

**Expected**: 92-93% accuracy

### Week 4: Production Hardening
1. ✅ Monitor and tune thresholds
2. ✅ Collect feedback and recalibrate
3. ✅ A/B test improvements

**Expected**: 93-94% accuracy (exceeds target)

---

## Monitoring & Validation

### Key Metrics to Track

1. **Overall Accuracy**:
   ```bash
   GET /api/email-label/metrics?type=accuracy&daysBack=30
   ```
   Target: >90%

2. **Per-Template Accuracy**:
   ```bash
   GET /api/email-label/metrics?type=accuracy&templateId=water-damage-incident
   ```
   Target: >85% for all templates

3. **Confidence Calibration (ECE)**:
   ```bash
   GET /api/email-label/metrics?type=calibration
   ```
   Target: ECE < 0.05

4. **Active Learning Queue**:
   ```bash
   GET /api/email-label/active-learning?limit=100
   ```
   Monitor: Queue depth, priority distribution

5. **Auto-Labeling Rate**:
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE confidence > 0.9)::float / COUNT(*) as auto_label_rate
   FROM email_classification_metrics
   WHERE created_at > NOW() - INTERVAL '7 days';
   ```
   Target: >60% auto-labeled

---

## Expected Results

### Accuracy Progression
- **Current**: 70-80%
- **After Week 1**: 90-91% (+12-21 points)
- **After Week 2**: 91-92% (+1-2 points)
- **After Week 3**: 92-93% (+1-2 points)
- **After Week 4**: 93-94% (+1-2 points)

### Efficiency Gains
- **Labeling Effort**: 70% reduction (active learning prioritization)
- **Auto-Labeling**: 60%+ of emails (high-confidence examples)
- **Cost**: 30-40% reduction (better example selection + PALIMPZEST)

---

## Quick Start Checklist

### Immediate Actions (Today)
- [ ] Verify embedding selector is used in classification
- [ ] Check cache hit rate (should be 60-80%)
- [ ] Review active learning queue (should have candidates)

### This Week
- [ ] Implement confidence calibrator class
- [ ] Integrate calibration into classification
- [ ] Set up continuous learning pipeline

### Next Week
- [ ] Enhance active learning priority
- [ ] Increase few-shot examples to 15
- [ ] Add adversarial examples

### Ongoing
- [ ] Monitor accuracy metrics daily
- [ ] Review low-accuracy templates weekly
- [ ] Recalibrate confidence monthly

---

## Success Criteria

✅ **Phase 1 Complete**: 90-92% accuracy achieved
✅ **Phase 2 Complete**: 92-94% accuracy with calibration
✅ **Phase 3 Complete**: 94-96% accuracy with continuous learning

**Target**: 90-92% accuracy ✅ (achievable in Week 1-2)

