# Extended Intelligence Metrics Implementation

## Overview

Implemented a comprehensive metrics system for measuring extended intelligence (agent+context), based on the theory that intelligence is a property of agents-in-context, not agents alone.

## Components

### 1. Extended Intelligence Metrics (`extended-intelligence-metrics.ts`)

**Purpose**: Measure intelligence as agent+context, not just agent.

**Key Metrics**:
- **Agent Contribution**: Baseline quality, relevance, coherence, completeness without context
- **Context Contribution**: Quality improvements, relevance improvements, entropy reduction, context efficiency
- **Extended Intelligence**: Overall quality, interaction quality, context efficiency, intelligence extension

**Usage**:
```typescript
import { extendedIntelligenceMetrics } from '@/lib/extended-intelligence-metrics';

// Record metrics after generating answer
const metrics = await extendedIntelligenceMetrics.recordMetrics({
  query: '...',
  domain: 'general',
  agent: 'gemma3:4b',
  agentAnswer: '...',      // Answer without context
  contextAnswer: '...',   // Answer with context
  contextQuality: {...},
  agentQuality: {...},
  contextTokens: 1000,
  agentTokens: 500,
  sessionId: '...',
});

// Get aggregated metrics
const aggregated = extendedIntelligenceMetrics.getAggregatedMetrics(3600000); // 1 hour
```

### 2. Context Quality Dashboard (`context-quality-dashboard.ts`)

**Purpose**: Track and visualize context quality metrics independently of agent.

**Key Metrics**:
- **Relevance**: How relevant is context to query (0-1)
- **Coherence**: How coherent is context internally (0-1)
- **Completeness**: How complete is context (0-1)
- **Efficiency**: Token efficiency (lower tokens for same quality = higher) (0-1)
- **Freshness**: How fresh/recent is context (0-1)
- **Diversity**: How diverse are context sources (0-1)

**Features**:
- Quality trends (improving/stable/declining)
- Automated alerts (low relevance, low coherence, quality degradation)
- Recommendations for improvement

**Usage**:
```typescript
import { contextQualityDashboard } from '@/lib/context-quality-dashboard';

// Record quality metrics
contextQualityDashboard.recordQuality({
  relevance: 0.8,
  coherence: 0.7,
  completeness: 0.9,
  efficiency: 0.6,
  freshness: 0.8,
  diversity: 0.7,
});

// Get dashboard data
const dashboard = contextQualityDashboard.getDashboardData();
console.log(dashboard.summary.overallQuality);
console.log(dashboard.alerts);
console.log(dashboard.recommendations);
```

### 3. Context A/B Testing Framework (`context-ab-testing.ts`)

**Purpose**: Test context configurations independently of agent to measure context contribution.

**Features**:
- Compare two context configurations
- Measure quality improvements
- Calculate statistical significance
- Track winning configurations per domain

**Usage**:
```typescript
import { contextABTesting } from '@/lib/context-ab-testing';

// Run A/B test
const result = await contextABTesting.runABTest({
  query: '...',
  domain: 'general',
  configurationA: {
    id: 'config-a',
    name: 'Default',
    config: { ... },
  },
  configurationB: {
    id: 'config-b',
    name: 'Optimized',
    config: { ... },
  },
  generateAnswer: async (query, context, config) => {
    // Generate answer with context
    return {
      answer: '...',
      contextTokens: 1000,
      agentTokens: 500,
      latency: 2000,
    };
  },
});

// Get winning configuration
const winner = contextABTesting.getWinningConfiguration('general');
```

### 4. Context Metrics API (`/api/context-metrics/route.ts`)

**Purpose**: RESTful API for accessing metrics and dashboard data.

**Endpoints**:

**GET `/api/context-metrics?endpoint=extended-intelligence&timeWindow=3600000`**
- Returns aggregated extended intelligence metrics

**GET `/api/context-metrics?endpoint=quality-dashboard&timeWindow=3600000`**
- Returns context quality dashboard data

**GET `/api/context-metrics?endpoint=ab-test-results&domain=general&limit=10`**
- Returns A/B test results for a domain

**POST `/api/context-metrics`**
```json
{
  "action": "record-metrics",
  "query": "...",
  "domain": "general",
  "agent": "gemma3:4b",
  "agentAnswer": "...",
  "contextAnswer": "...",
  "contextQuality": {...},
  "agentQuality": {...},
  "contextTokens": 1000,
  "agentTokens": 500,
  "sessionId": "..."
}
```

## Integration with AdvancedContextSystem

The `AdvancedContextSystem` automatically records context quality metrics:

```typescript
// In processQuery method
const contextQuality: ContextQualityMetrics = {
  relevance: qualityReport.currentQuality.relevance || 0.5,
  coherence: qualityReport.currentQuality.coherence || 0.5,
  completeness: qualityReport.currentQuality.completeness || 0.5,
  efficiency: this.calculateContextEfficiency(finalContext, entropyReduced),
  freshness: this.calculateFreshness(finalContext),
  diversity: this.calculateDiversity(finalContext),
};

contextQualityDashboard.recordQuality(contextQuality);
```

## Integration with GAMP Pipeline

To fully measure extended intelligence, the pipeline should:

1. **Generate agent-only answer** (without context)
2. **Generate context-enhanced answer** (with context)
3. **Record metrics** comparing both

Example integration:
```typescript
// In permutation-lite-gamp-pipeline.ts

// 1. Generate agent-only answer (baseline)
const agentOnlyAnswer = await generateAgentOnlyAnswer(query);

// 2. Generate context-enhanced answer (with Context Engineering 2.0)
const contextEnhancedAnswer = await generateAnswer(query, contextEngineeringResult);

// 3. Record extended intelligence metrics
await extendedIntelligenceMetrics.recordMetrics({
  query,
  domain: routingResult.domain,
  agent: 'gemma3:4b',
  agentAnswer: agentOnlyAnswer,
  contextAnswer: contextEnhancedAnswer,
  contextQuality: contextEngineeringResult.analytics.contextQuality,
  agentQuality: await calculateAnswerQuality(agentOnlyAnswer, query),
  contextTokens: contextEngineeringResult.context.length,
  agentTokens: agentOnlyAnswer.length / 4,
  sessionId,
});
```

## Key Insights

### 1. Intelligence = Agent + Context

The system measures:
- **Agent contribution**: Baseline intelligence without context
- **Context contribution**: How much context extends intelligence
- **Extended intelligence**: Final intelligence (agent+context)

### 2. Context Quality is Independent

Context quality metrics (relevance, coherence, efficiency) are measured independently of agent quality, allowing optimization of contexts separately from agents.

### 3. A/B Testing for Context Optimization

Context configurations can be tested independently of agent, allowing optimization of context engineering separately from agent selection.

### 4. Quality Dashboard for Monitoring

Real-time monitoring of context quality with alerts and recommendations for continuous improvement.

## Next Steps

1. **Integrate with GAMP Pipeline**: Add agent-only answer generation and metrics recording
2. **Add Persistence**: Store metrics in Supabase for long-term analysis
3. **Create Dashboard UI**: Visual dashboard for viewing metrics and trends
4. **Automated Optimization**: Use A/B test results to automatically optimize context configurations

## Example Output

```json
{
  "extendedIntelligence": {
    "avgAgentContribution": 0.65,
    "avgContextContribution": 0.25,
    "avgExtendedIntelligence": 0.90,
    "avgIntelligenceExtension": 0.28,
    "contextEfficiency": 0.15,
    "totalQueries": 100
  },
  "contextQuality": {
    "avgRelevance": 0.82,
    "avgCoherence": 0.75,
    "avgEfficiency": 0.68,
    "trends": {
      "relevance": "improving",
      "coherence": "stable",
      "efficiency": "improving"
    }
  }
}
```

This shows that:
- Agent contributes 65% baseline quality
- Context extends intelligence by 25% (bringing total to 90%)
- Context quality is improving (relevance and efficiency trending up)
- Context is efficiently extending intelligence (0.15 efficiency score)

