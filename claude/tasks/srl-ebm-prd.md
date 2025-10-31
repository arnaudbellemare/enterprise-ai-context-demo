# PRD: SRL + nanoEBM Integration with ElizaOS Architecture

**Created**: 2025-10-31
**Status**: PRD Complete - Ready for Implementation Planning
**Priority**: High (Research Enhancement)

## Executive Summary

Enhance PERMUTATION's reasoning capabilities by integrating **SRL (Supervised Reinforcement Learning)** for multi-step decomposition and **nanoEBM (Energy-Based Model)** for answer refinement, using ElizaOS architectural patterns for clean, maintainable, testable implementation.

**Expected Impact**:
- **Quality**: +15-25% improvement on multi-step reasoning queries
- **Accuracy**: +10-15% improvement on verification tasks
- **Completeness**: +20-30% improvement on complex analyses
- **Cost**: Controlled via teacher/student routing (IRT)
- **Latency**: <10% increase despite additional processing

## Real-World Scenarios

### Scenario 1: Financial Multi-Step Analysis (SRL Primary)

**User**: "Calculate Bitcoin ROI 2020-2024 vs S&P 500, adjust for inflation, and explain which was better for a tax-advantaged account."

**Current System** (Baseline):
- Perplexity generates answer in one shot
- May skip inflation adjustment
- May not explain tax advantages
- Quality: ~75% (missing steps)

**With SRL Enhancement**:
1. **Expert Provider** matches financial trajectory with 6 steps
2. **Decomposition** breaks into: price retrieval, ROI calculation, inflation adjustment, tax analysis, synthesis
3. **Step Rewards** guide each step to match expert trajectory
4. **Internal Reasoning** generates "why this step matters"
5. **Result**: Complete 6-step analysis with all aspects covered
6. **Quality**: ~90% (all steps covered, expert-guided)

**User Value**:
- ✅ Complete analysis (no missed steps)
- ✅ Transparent reasoning (internal monologue)
- ✅ Higher confidence (expert-validated)
- ✅ Educational (shows step-by-step process)

### Scenario 2: Legal Verification (nanoEBM Primary)

**User**: "Based on this employment contract, is the non-compete clause enforceable for a remote California employee?"

**Current System**:
- Perplexity generates initial answer
- May lack nuance or miss exceptions
- Quality: ~70% (basic answer)

**With nanoEBM Enhancement**:
1. **Initial Answer**: "Non-competes generally not enforceable in California"
2. **Energy Calculation**: Low faithfulness (missing context details)
3. **Refinement Step 1**: Add jurisdiction analysis
4. **Refinement Step 2**: Add exception cases
5. **Refinement Step 3**: Add supporting citations
6. **Convergence**: Energy minimized, answer complete
7. **Quality**: ~85% (comprehensive with nuances)

**User Value**:
- ✅ Complete legal analysis (jurisdictions, exceptions)
- ✅ Higher accuracy (energy-optimized)
- ✅ Better structure (refinement adds organization)
- ✅ Confidence in answer (convergence validated)

### Scenario 3: Scientific Experiment Design (Combined SRL + EBM)

**User**: "Design an experiment to test the efficacy of a new drug compound, including hypothesis formation, control group design, and statistical analysis plan."

**Current System**:
- Basic experiment outline
- May lack rigor or completeness
- Quality: ~65% (incomplete methodology)

**With Combined SRL + EBM**:
1. **SRL Phase**: Expert trajectory guides 5-step decomposition
   - Hypothesis formulation
   - Control group design
   - Experimental protocol
   - Statistical analysis plan
   - Expected outcomes

2. **Step Execution**: Each step supervised by expert rewards

3. **EBM Phase**: Refine final answer
   - Energy calculation: Check completeness, rigor, clarity
   - Refinement: Add methodology details
   - Refinement: Improve statistical plan
   - Convergence: Rigorous experimental design

4. **Result**: Publication-grade experimental design
5. **Quality**: ~95% (expert-guided + energy-refined)

**User Value**:
- ✅ Publication-quality output
- ✅ Comprehensive methodology
- ✅ Statistical rigor validated
- ✅ Transparent design process

## UX Review: How to Make More Agentic, Automated, Passive

### 1. Make It More Agentic (Self-Directed)

**Current**: User must know when to use which approach (SRL vs EBM vs Current)

**Improved**:
- **Auto-Detection**: System automatically detects query type
  - Multi-step reasoning → SRL
  - Verification/Refinement → EBM
  - Simple queries → Current system

- **Adaptive Execution**: System chooses best approach based on:
  - Query complexity (IRT difficulty)
  - Domain availability (expert trajectories)
  - Quality requirements (user preferences)

**Implementation**: ElizaOS Action Validator pattern
```typescript
validate: async (runtime, message, state) => {
  const queryType = classifyQuery(message.content.text);
  const hasExpertTrajectories = await checkExpertTrajectories(state.values.domain);

  // Auto-activate SRL if multi-step + expert trajectories available
  return queryType === 'multi_step' && hasExpertTrajectories;
}
```

### 2. Make It More Automated

**Current**: Manual configuration of SRL/EBM parameters

**Improved**:
- **Auto-Configuration**: Detect optimal parameters
  - SRL reward weights based on query complexity
  - EBM refinement steps based on convergence history
  - Early stopping based on quality thresholds

- **Auto-Learning**: System learns from successful executions
  - Store successful trajectories as new expert examples
  - Update energy function weights based on outcomes
  - Build domain-specific energy functions

**Implementation**: ElizaOS Service pattern for adaptive configuration
```typescript
class AdaptiveConfigService extends Service {
  async getOptimalSRLConfig(query, domain): Promise<SRLConfig> {
    // Query historical performance
    const history = await this.getPerformanceHistory(domain);

    // Compute optimal weights
    const stepRewardWeight = this.computeOptimalWeight(history, 'step');
    const finalRewardWeight = 1 - stepRewardWeight;

    return { stepRewardWeight, finalRewardWeight, ... };
  }
}
```

### 3. Make It More Passive (Less User Intervention)

**Current**: User needs to understand SRL/EBM concepts

**Improved**:
- **Transparent Enhancement**: User doesn't know/care about SRL/EBM
  - Just gets higher quality answers
  - Optional: Show reasoning trace on request

- **Progressive Disclosure**:
  - Basic mode: Just show final answer
  - Advanced mode: Show step-by-step reasoning
  - Expert mode: Show reward scores, energy history

- **Quality Indicators**: User sees quality signals
  - "Expert-guided" badge for SRL-enhanced
  - "Refined" badge for EBM-enhanced
  - Confidence scores visible

**Implementation**: ElizaOS Metadata pattern
```typescript
await callback({
  text: refinedAnswer,
  thought: 'Enhanced with SRL + EBM',
  metadata: {
    srlEnhanced: true,
    averageStepReward: 0.87,
    ebmRefined: true,
    energyReduction: 0.23,
    qualityIndicator: 'expert-guided-refined'
  }
});
```

### 4. Reduce Friction Points

**Friction 1**: Expert trajectory creation is manual

**Solution**: Auto-generation from successful queries
```typescript
// After successful high-quality query execution
if (quality > 0.9 && !hasExpertTrajectory(domain, query)) {
  await generateExpertTrajectory({
    query,
    domain,
    steps: executedSteps,
    finalAnswer,
    quality
  });
}
```

**Friction 2**: Energy function is domain-agnostic

**Solution**: Domain-specific energy functions
```typescript
class EBMEnergyService extends Service {
  getEnergyFunction(domain: string): EnergyFunction {
    return this.domainFunctions[domain] || this.defaultFunction;
  }

  // Financial domain: emphasize numbers, calculations
  financialEnergy(query, context, answer): number {
    const hasNumbers = /\d+\.?\d*%|\$[\d,]+/.test(answer);
    const hasCalculations = /(ROI|return|yield|growth)/.test(answer);
    return baseEnergy * (hasNumbers ? 0.8 : 1.2) * (hasCalculations ? 0.8 : 1.2);
  }
}
```

**Friction 3**: User doesn't know when to expect longer processing

**Solution**: Progressive response with intermediate updates
```typescript
// Stream intermediate results
await callback({ text: 'Analyzing with expert guidance (Step 1/6)...', thought: 'SRL decomposition' });
await callback({ text: 'Retrieving Bitcoin data...', thought: 'Step 1 execution' });
...
await callback({ text: 'Refining answer (energy: 0.45 → 0.23)...', thought: 'EBM refinement' });
await callback({ text: finalAnswer, thought: 'Complete', metadata: { ... } });
```

## Technical Requirements

### Performance Requirements

| Metric | Current | Target (SRL) | Target (EBM) | Target (Combined) |
|--------|---------|--------------|--------------|-------------------|
| **Quality Score** | 0.72-0.94 | 0.85-0.96 (+13-2%) | 0.80-0.95 (+8-1%) | 0.90-0.98 (+18-4%) |
| **Latency p50** | 3.2s | 4.0s (+25%) | 3.8s (+19%) | 5.0s (+56%) |
| **Latency p95** | 8.5s | 11.0s (+29%) | 10.0s (+18%) | 13.5s (+59%) |
| **Cost/1K queries** | $5.20 | $6.50 (+25%) | $6.00 (+15%) | $7.80 (+50%) |
| **Accuracy** | 67-85% | 80-92% (+13-7%) | 75-88% (+8-3%) | 85-95% (+18-10%) |

**Acceptable Trade-offs**:
- ✅ 25-50% latency increase for 13-18% quality improvement
- ✅ 15-50% cost increase for 7-18% accuracy improvement
- ✅ Controlled via IRT routing (easy queries → current system)

### Scalability Requirements

- **Expert Trajectories**: Support 100+ domains, 1000+ trajectories
- **Concurrent Queries**: Handle 100+ simultaneous SRL/EBM executions
- **Memory**: ≤500MB per active refinement session
- **Database**: Supabase storage for expert trajectories (PostgreSQL)

### Security Requirements

- **Expert Trajectory Validation**: Prevent injection of malicious trajectories
- **Energy Function Integrity**: Validate energy calculations (no manipulation)
- **Cost Controls**: Max refinement steps, max trajectory search time
- **Input Sanitization**: Validate query text, domain names, parameters

### Integration Requirements

- **Backward Compatibility**: Existing PERMUTATION APIs unchanged
- **Feature Flags**: Enable/disable SRL, EBM, Combined independently
- **Monitoring**: Track SRL/EBM usage, performance, costs
- **Observability**: Log all enhancement decisions, steps, outcomes

## Success Criteria

### Must Have (MVP)

1. **SRL Integration**
   - ✅ Expert trajectory provider loads from Supabase
   - ✅ Step-wise reward calculation evaluator
   - ✅ Auto-activate for multi-step queries with expert trajectories
   - ✅ ≥10% quality improvement on financial/legal queries
   - ✅ Unit tests (mocked runtime)
   - ✅ E2E tests (real runtime)

2. **nanoEBM Integration**
   - ✅ Energy calculation evaluator
   - ✅ Refinement action chain
   - ✅ Convergence detection
   - ✅ Auto-activate for verification/refinement queries
   - ✅ ≥8% quality improvement on verification queries
   - ✅ Unit tests (mocked energy)
   - ✅ E2E tests (real refinement)

3. **ElizaOS Architecture**
   - ✅ Provider pattern for expert trajectories
   - ✅ Action pattern for SRL enhancement, EBM refinement
   - ✅ Evaluator pattern for rewards, energy
   - ✅ Service pattern for trajectory/energy management
   - ✅ Plugin pattern for packaging (srl-plugin, ebm-plugin)

4. **Testing**
   - ✅ All existing tests pass
   - ✅ ≥90% code coverage for new code
   - ✅ Benchmark results documented
   - ✅ Performance regression tests

### Should Have (V1.1)

- Auto-generation of expert trajectories from successful executions
- Domain-specific energy functions (financial, legal, scientific)
- Progressive response updates (intermediate steps visible)
- Quality indicator badges in UI
- Admin interface for trajectory curation

### Could Have (Future)

- Learned energy functions (neural network-based)
- Multi-language expert trajectories
- User-contributed trajectories (with validation)
- A/B testing framework for SRL vs EBM vs Combined
- Cost optimization via caching refined answers

### Won't Have (Out of Scope)

- Full TensorFlow.js EBM (keep simple energy function)
- Real-time learning during query execution (batch learning only)
- User-facing SRL/EBM configuration UI (auto-configuration only)
- Multi-agent debate for trajectory selection

## Measurable Outcomes

### Primary Metrics

1. **Quality Score**: ≥0.90 average (up from 0.72-0.94 baseline)
2. **Hard Query Accuracy**: ≥88% (up from 67-85% baseline)
3. **User Satisfaction**: ≥4.5/5 on complex queries (survey)
4. **Adoption Rate**: ≥60% of multi-step queries use SRL

### Secondary Metrics

1. **Expert Trajectory Coverage**: ≥10 domains, ≥50 trajectories
2. **Refinement Convergence**: ≥80% queries converge within 3 steps
3. **Cost Efficiency**: ≤$7.80 per 1K queries (vs $5.20 baseline, +50% acceptable)
4. **Latency p95**: ≤13.5s (vs 8.5s baseline, +59% acceptable)

### Quality Metrics by Category

| Category | Current Accuracy | Target (SRL/EBM) | Success Threshold |
|----------|------------------|------------------|-------------------|
| Multi-Step | 67-75% | 80-88% | ≥80% |
| Verification | 70-80% | 78-88% | ≥78% |
| Refinement | 65-75% | 75-85% | ≥75% |

## User Satisfaction Metrics

**Pre-Enhancement** (Current System):
- "Answer was complete": 72%
- "Steps were clear": 65%
- "Felt confident in result": 68%

**Post-Enhancement** (Target):
- "Answer was complete": ≥85% (+13%)
- "Steps were clear": ≥80% (+15%)
- "Felt confident in result": ≥85% (+17%)

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Expert trajectory coverage too low | Medium | High | Auto-generate from successful executions, start with 5 core domains |
| EBM energy function not effective | Low | Medium | Use proven text-overlap metrics, validate with manual review |
| Performance degradation >50% latency | Low | High | IRT routing to skip enhancement on easy queries, parallel execution |
| Cost increase >$10/1K queries | Low | Medium | Teacher/student routing, cache refined answers, batch processing |

### Product Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Users don't value transparency | Low | Low | Make reasoning optional (collapsed by default), focus on quality |
| Quality improvement not visible | Medium | High | Show quality indicators, A/B test with control group, measure satisfaction |
| Too complex to maintain | Medium | Medium | ElizaOS patterns enforce clean architecture, comprehensive tests |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ROI not justified (cost vs quality) | Low | Medium | Target high-value queries only (financial, legal, scientific), skip low-value |
| Adoption rate <40% | Medium | Low | Auto-activation (no user action needed), progressive rollout with metrics |

## Implementation Timeline

**MVP (V1.0)**: 7-11 hours
- Research: ✅ Complete (30 min)
- PRD: ✅ Complete (this document, 30 min)
- Design: ⏳ 1-2 hours (3 approaches, evaluation, selection)
- Implementation: ⏳ 3-5 hours (SRL + EBM with ElizaOS patterns)
- Testing: ⏳ 1-2 hours (unit + E2E + benchmarks)
- Review: ⏳ 1 hour (critical review, iteration)

**V1.1 Enhancements**: +4-6 hours
- Auto-trajectory generation: 2 hours
- Domain-specific energy: 1 hour
- Progressive updates: 1 hour
- Quality indicators: 1 hour
- Admin interface: 2 hours

**Total**: 11-17 hours for complete system

## Dependencies

**Technical**:
- ✅ Supabase database (expert trajectories)
- ✅ Perplexity API (teacher model)
- ✅ Ollama (student model, optional)
- ✅ PERMUTATION existing components (SWiRL, TRM, GEPA, ACE, IRT)

**Data**:
- ✅ 2 expert trajectories (financial, legal) - existing
- ⏳ 3-8 more expert trajectories (target: 10 domains)
- ⏳ Energy function validation dataset (100 query-answer pairs)

**People**:
- Developer (ElizaOS pattern implementation)
- Reviewer (architecture validation)
- QA (comprehensive testing)

## Acceptance Criteria

✅ **Code Quality**:
- ElizaOS patterns correctly implemented (Providers, Actions, Evaluators, Services, Plugins)
- ≥90% test coverage
- No ESLint errors
- TypeScript strict mode
- All tests pass (unit + E2E)

✅ **Performance**:
- Quality score ≥0.90 average
- Hard query accuracy ≥88%
- Latency p95 ≤13.5s
- Cost ≤$7.80 per 1K queries

✅ **Functionality**:
- SRL auto-activates for multi-step queries with expert trajectories
- EBM auto-activates for verification/refinement queries
- Combined approach available for complex queries
- Backward compatible (existing queries work unchanged)

✅ **Documentation**:
- Architecture diagrams (ElizaOS integration)
- API documentation (new providers, actions, evaluators)
- User guide (when to expect SRL/EBM enhancement)
- Runbook (monitoring, debugging, scaling)

## Next Steps

1. **Design 3+ Implementation Approaches** (1-2 hours)
   - Approach 1: Full ElizaOS package integration
   - Approach 2: ElizaOS patterns without package
   - Approach 3: Minimal refactor with better structure
   - Evaluate: complexity, performance, maintainability
   - Select: optimal approach

2. **Implementation** (3-5 hours)
   - Create ElizaOS wrappers (providers, actions, evaluators, services)
   - Integrate with PERMUTATION engine
   - Write unit tests (mocked runtime)
   - Write E2E tests (real runtime)

3. **Validation** (1-2 hours)
   - Run comparative benchmarks
   - Validate performance targets
   - Document results
   - Create PR for review

4. **Deployment** (1 hour)
   - Feature flag configuration
   - Monitoring setup
   - Gradual rollout plan
   - Success metrics dashboard

---

**Approved By**: Awaiting approval
**Next Action**: Design 3+ Implementation Approaches
**Document Version**: 1.0
**Last Updated**: 2025-10-31 01:35AM
