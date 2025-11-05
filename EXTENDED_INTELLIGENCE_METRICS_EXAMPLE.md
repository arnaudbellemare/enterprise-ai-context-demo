# Extended Intelligence Metrics: Usage Examples

## Example 1: Integration in GAMP Pipeline

### Full Integration Example

```typescript
// In permutation-lite-gamp-pipeline.ts

import { extendedIntelligenceMetrics } from '../extended-intelligence-metrics';
import { contextQualityDashboard } from '../context-quality-dashboard';

async execute(query: string, sessionId: string) {
  // ... existing pipeline code ...
  
  // 1. Generate agent-only answer (baseline - without context)
  const agentOnlyAnswer = await this.generateAgentOnlyAnswer(query);
  const agentOnlyStart = Date.now();
  
  // 2. Generate context-enhanced answer (with Context Engineering 2.0)
  const contextEngineeringResult = await this.contextSystem.processQuery(sessionId, query);
  const contextEnhancedAnswer = await this.generateAnswer(
    query, 
    contextEngineeringResult.context,
    contextEngineeringResult.analytics
  );
  
  // 3. Calculate quality metrics for both answers
  const agentQuality = this.calculateAnswerQuality(agentOnlyAnswer, query);
  const contextQuality = contextEngineeringResult.analytics.contextQuality;
  
  // 4. Record extended intelligence metrics
  const metrics = await extendedIntelligenceMetrics.recordMetrics({
    query,
    domain: routingResult.domain,
    agent: 'gemma3:4b',
    agentAnswer: agentOnlyAnswer,
    contextAnswer: contextEnhancedAnswer,
    contextQuality: contextQuality,
    agentQuality: agentQuality,
    contextTokens: contextEngineeringResult.context.reduce(
      (sum, c) => sum + (c.content.length / 4), 0
    ),
    agentTokens: agentOnlyAnswer.length / 4,
    sessionId,
  });
  
  console.log(`📊 Extended Intelligence Metrics:`);
  console.log(`   Agent Contribution: ${metrics.agentContribution.quality.toFixed(3)}`);
  console.log(`   Context Contribution: +${(metrics.contextContribution.qualityImprovement * 100).toFixed(1)}%`);
  console.log(`   Extended Intelligence: ${metrics.extendedIntelligence.overallQuality.toFixed(3)}`);
  console.log(`   Intelligence Extension: ${(metrics.extendedIntelligence.intelligenceExtension * 100).toFixed(1)}%`);
  
  return {
    answer: contextEnhancedAnswer,
    metrics,
    contextEngineering: contextEngineeringResult,
  };
}

// Helper: Generate agent-only answer (without context)
private async generateAgentOnlyAnswer(query: string): Promise<string> {
  const ollama = new Ollama();
  const response = await ollama.generate({
    model: 'gemma3:4b',
    prompt: query,
    system: 'You are a helpful assistant. Answer the question directly without additional context.',
  });
  return response.text;
}

// Helper: Calculate answer quality
private calculateAnswerQuality(answer: string, query: string): {
  quality: number;
  relevance: number;
  coherence: number;
  completeness: number;
} {
  // Simple quality calculation
  const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const answerWords = new Set(answer.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const intersection = [...queryWords].filter(w => answerWords.has(w)).length;
  const relevance = queryWords.size > 0 ? intersection / queryWords.size : 0;
  
  const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgLength = sentences.length > 0 
    ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length 
    : 0;
  const coherence = Math.max(0, 1 - Math.abs(avgLength - 50) / 50);
  
  const completeness = Math.min(1, answer.length / 100);
  const quality = (relevance * 0.4) + (coherence * 0.3) + (completeness * 0.3);
  
  return { quality, relevance, coherence, completeness };
}
```

## Example 2: Accessing Metrics via API

### Get Extended Intelligence Metrics

```bash
# Get aggregated metrics for last hour
curl "http://localhost:3000/api/context-metrics?endpoint=extended-intelligence&timeWindow=3600000"
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "avgAgentContribution": 0.652,
    "avgContextContribution": 0.234,
    "avgExtendedIntelligence": 0.886,
    "avgIntelligenceExtension": 0.281,
    "contextEfficiency": 0.156,
    "totalQueries": 47
  },
  "trends": {
    "avgRelevance": 0.823,
    "avgCoherence": 0.756,
    "avgEfficiency": 0.689,
    "trends": {
      "relevance": "improving",
      "coherence": "stable",
      "efficiency": "improving"
    }
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

### Get Context Quality Dashboard

```bash
# Get quality dashboard data
curl "http://localhost:3000/api/context-metrics?endpoint=quality-dashboard&timeWindow=3600000"
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "current": {
      "relevance": 0.82,
      "coherence": 0.75,
      "completeness": 0.88,
      "efficiency": 0.68,
      "freshness": 0.91,
      "diversity": 0.73
    },
    "summary": {
      "avgRelevance": 0.823,
      "avgCoherence": 0.756,
      "avgEfficiency": 0.689,
      "avgCompleteness": 0.871,
      "avgFreshness": 0.892,
      "avgDiversity": 0.724,
      "overallQuality": 0.782
    },
    "alerts": [
      {
        "type": "low_efficiency",
        "message": "Context efficiency is low (68.0%). Consider reducing context tokens.",
        "severity": "medium",
        "timestamp": 1705756200000
      }
    ],
    "recommendations": [
      "Improve context efficiency: Reduce context tokens through better compression and selection.",
      "Context quality is good. Continue monitoring and optimizing."
    ]
  },
  "trends": {
    "relevance": "improving",
    "coherence": "stable",
    "efficiency": "improving"
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

### Get A/B Test Results

```bash
# Get A/B test results for 'general' domain
curl "http://localhost:3000/api/context-metrics?endpoint=ab-test-results&domain=general&limit=5"
```

**Response:**
```json
{
  "success": true,
  "testResults": [
    {
      "testId": "ab_test_1705756200000_abc123",
      "configurationA": {
        "id": "default",
        "name": "Default Configuration",
        "config": {
          "enableEntropyReduction": true,
          "enableLayeredMemory": true,
          "maxContextItems": 10,
          "compressionRatio": 0.3
        }
      },
      "configurationB": {
        "id": "optimized",
        "name": "Optimized Configuration",
        "config": {
          "enableEntropyReduction": true,
          "enableLayeredMemory": true,
          "maxContextItems": 15,
          "compressionRatio": 0.2
        }
      },
      "query": "What is the impact of climate change on agriculture?",
      "domain": "general",
      "resultA": {
        "answer": "...",
        "quality": 0.75,
        "relevance": 0.82,
        "coherence": 0.71,
        "completeness": 0.68,
        "contextTokens": 1200,
        "agentTokens": 600,
        "latency": 3200
      },
      "resultB": {
        "answer": "...",
        "quality": 0.88,
        "relevance": 0.91,
        "coherence": 0.85,
        "completeness": 0.89,
        "contextTokens": 1500,
        "agentTokens": 600,
        "latency": 3500
      },
      "winner": "B",
      "improvement": 17.3,
      "significance": 0.87,
      "timestamp": 1705756200000
    }
  ],
  "winningConfiguration": {
    "configuration": {
      "id": "optimized",
      "name": "Optimized Configuration",
      "config": { ... }
    },
    "winRate": 0.73,
    "avgImprovement": 15.2,
    "totalTests": 23
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## Example 3: Recording Metrics Manually

### Record Extended Intelligence Metrics

```typescript
import { extendedIntelligenceMetrics } from '@/lib/extended-intelligence-metrics';

// After generating answers
const metrics = await extendedIntelligenceMetrics.recordMetrics({
  query: "What is the impact of climate change on agriculture?",
  domain: "general",
  agent: "gemma3:4b",
  agentAnswer: "Climate change affects agriculture through temperature changes, precipitation patterns, and extreme weather events.",
  contextAnswer: "Climate change significantly impacts agriculture through multiple mechanisms: 1) Temperature changes affect crop growth cycles and yields, 2) Altered precipitation patterns lead to droughts and floods, 3) Extreme weather events damage crops and infrastructure, 4) Pests and diseases expand their ranges. Research shows that global crop yields could decline by 10-25% by 2050 without adaptation measures.",
  contextQuality: {
    relevance: 0.92,
    coherence: 0.85,
    completeness: 0.88,
    efficiency: 0.72,
    freshness: 0.95,
    diversity: 0.78,
  },
  agentQuality: {
    quality: 0.65,
    relevance: 0.70,
    coherence: 0.60,
    completeness: 0.55,
  },
  contextTokens: 1500,
  agentTokens: 600,
  sessionId: "session_123",
});

console.log('Metrics recorded:', metrics);
```

**Output:**
```javascript
{
  agentContribution: {
    quality: 0.65,
    relevance: 0.70,
    coherence: 0.60,
    completeness: 0.55
  },
  contextContribution: {
    qualityImprovement: 0.23,      // +23% improvement
    relevanceImprovement: 0.22,     // +22% improvement
    coherenceImprovement: 0.25,     // +25% improvement
    completenessImprovement: 0.33,  // +33% improvement
    entropyReduction: 0.72,
    contextRelevance: 0.92,
    contextEfficiency: 0.00015     // Improvement per token
  },
  extendedIntelligence: {
    overallQuality: 0.88,           // Final quality (agent+context)
    interactionQuality: 0.85,       // How well they work together
    contextEfficiency: 0.60,        // Token efficiency
    intelligenceExtension: 0.26     // 26% intelligence extension
  },
  metadata: {
    query: "What is the impact of climate change on agriculture?",
    domain: "general",
    agent: "gemma3:4b",
    contextTokens: 1500,
    agentTokens: 600,
    totalTokens: 2100,
    timestamp: 1705756200000,
    sessionId: "session_123"
  }
}
```

## Example 4: Using Context Quality Dashboard

```typescript
import { contextQualityDashboard } from '@/lib/context-quality-dashboard';

// Record quality metrics
contextQualityDashboard.recordQuality({
  relevance: 0.82,
  coherence: 0.75,
  completeness: 0.88,
  efficiency: 0.68,
  freshness: 0.91,
  diversity: 0.73,
});

// Get dashboard data
const dashboard = contextQualityDashboard.getDashboardData();

console.log('Overall Quality:', dashboard.summary.overallQuality);
console.log('Alerts:', dashboard.alerts);
console.log('Recommendations:', dashboard.recommendations);

// Get quality trends
const trends = contextQualityDashboard.getQualityTrends();
console.log('Relevance trend:', trends.relevance); // 'improving' | 'stable' | 'declining'
```

**Output:**
```javascript
{
  current: {
    relevance: 0.82,
    coherence: 0.75,
    completeness: 0.88,
    efficiency: 0.68,
    freshness: 0.91,
    diversity: 0.73
  },
  summary: {
    avgRelevance: 0.823,
    avgCoherence: 0.756,
    avgEfficiency: 0.689,
    avgCompleteness: 0.871,
    avgFreshness: 0.892,
    avgDiversity: 0.724,
    overallQuality: 0.782
  },
  alerts: [
    {
      type: "low_efficiency",
      message: "Context efficiency is low (68.0%). Consider reducing context tokens.",
      severity: "medium",
      timestamp: 1705756200000
    }
  ],
  recommendations: [
    "Improve context efficiency: Reduce context tokens through better compression and selection.",
    "Context quality is good. Continue monitoring and optimizing."
  ]
}
```

## Example 5: Running A/B Tests

```typescript
import { contextABTesting } from '@/lib/context-ab-testing';

// Define configurations
const defaultConfig = {
  id: 'default',
  name: 'Default Configuration',
  config: {
    enableEntropyReduction: true,
    enableLayeredMemory: true,
    enableContextIsolation: true,
    enableContextAbstraction: true,
    enableProactiveInference: true,
    contextSelectionStrategy: 'hybrid' as const,
    maxContextItems: 10,
    compressionRatio: 0.3,
  },
};

const optimizedConfig = {
  id: 'optimized',
  name: 'Optimized Configuration',
  config: {
    enableEntropyReduction: true,
    enableLayeredMemory: true,
    enableContextIsolation: true,
    enableContextAbstraction: true,
    enableProactiveInference: true,
    contextSelectionStrategy: 'semantic' as const,
    maxContextItems: 15,
    compressionRatio: 0.2,
  },
};

// Run A/B test
const testResult = await contextABTesting.runABTest({
  query: "What is the impact of climate change on agriculture?",
  domain: "general",
  configurationA: defaultConfig,
  configurationB: optimizedConfig,
  agent: async () => '', // Not used in this example
  generateAnswer: async (query, context, config) => {
    // Generate answer with context
    const answer = await generateAnswerWithContext(query, config);
    return {
      answer: answer.text,
      contextTokens: answer.contextTokens,
      agentTokens: answer.agentTokens,
      latency: answer.latency,
    };
  },
});

console.log('A/B Test Result:', testResult);
console.log('Winner:', testResult.winner); // 'A' | 'B' | 'tie'
console.log('Improvement:', testResult.improvement, '%');
console.log('Significance:', testResult.significance);

// Get winning configuration for domain
const winner = contextABTesting.getWinningConfiguration('general');
console.log('Winning Configuration:', winner.configuration?.name);
console.log('Win Rate:', (winner.winRate * 100).toFixed(1), '%');
```

**Output:**
```javascript
{
  testId: "ab_test_1705756200000_abc123",
  configurationA: { ... },
  configurationB: { ... },
  query: "What is the impact of climate change on agriculture?",
  domain: "general",
  resultA: {
    answer: "...",
    quality: 0.75,
    relevance: 0.82,
    coherence: 0.71,
    completeness: 0.68,
    contextTokens: 1200,
    agentTokens: 600,
    latency: 3200
  },
  resultB: {
    answer: "...",
    quality: 0.88,
    relevance: 0.91,
    coherence: 0.85,
    completeness: 0.89,
    contextTokens: 1500,
    agentTokens: 600,
    latency: 3500
  },
  winner: "B",
  improvement: 17.3,
  significance: 0.87,
  timestamp: 1705756200000
}
```

## Example 6: Real-World Usage in Chat API

```typescript
// In /api/chat-reasoning/route.ts

import { extendedIntelligenceMetrics } from '@/lib/extended-intelligence-metrics';

export async function POST(request: NextRequest) {
  const { query, mode } = await request.json();
  
  if (mode === 'lite-gamp') {
    // Generate agent-only answer
    const agentOnlyAnswer = await generateAgentOnlyAnswer(query);
    
    // Generate context-enhanced answer
    const pipeline = new PermutationLiteGAMPPipeline({...});
    const result = await pipeline.execute(query);
    
    // Record metrics
    const metrics = await extendedIntelligenceMetrics.recordMetrics({
      query,
      domain: result.metadata?.domain || 'general',
      agent: 'gemma3:4b',
      agentAnswer: agentOnlyAnswer,
      contextAnswer: result.answer,
      contextQuality: result.metadata?.contextQuality || {},
      agentQuality: calculateAnswerQuality(agentOnlyAnswer, query),
      contextTokens: result.metadata?.contextTokens || 0,
      agentTokens: agentOnlyAnswer.length / 4,
      sessionId: result.metadata?.sessionId || 'default',
    });
    
    // Include metrics in response
    return NextResponse.json({
      answer: result.answer,
      metrics: {
        agentContribution: metrics.agentContribution.quality,
        contextContribution: metrics.contextContribution.qualityImprovement,
        extendedIntelligence: metrics.extendedIntelligence.overallQuality,
        intelligenceExtension: metrics.extendedIntelligence.intelligenceExtension,
      },
      contextEngineering: result.metadata?.contextEngineering,
    });
  }
}
```

## Example 7: Monitoring Dashboard (TypeScript/React)

```typescript
// In a React component

import { useEffect, useState } from 'react';

function ContextMetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  
  useEffect(() => {
    // Fetch metrics
    fetch('/api/context-metrics?endpoint=extended-intelligence&timeWindow=3600000')
      .then(res => res.json())
      .then(data => setMetrics(data.metrics));
    
    // Fetch dashboard
    fetch('/api/context-metrics?endpoint=quality-dashboard&timeWindow=3600000')
      .then(res => res.json())
      .then(data => setDashboard(data.dashboard));
  }, []);
  
  return (
    <div>
      <h2>Extended Intelligence Metrics</h2>
      {metrics && (
        <div>
          <p>Agent Contribution: {(metrics.avgAgentContribution * 100).toFixed(1)}%</p>
          <p>Context Contribution: +{(metrics.avgContextContribution * 100).toFixed(1)}%</p>
          <p>Extended Intelligence: {(metrics.avgExtendedIntelligence * 100).toFixed(1)}%</p>
          <p>Intelligence Extension: {(metrics.avgIntelligenceExtension * 100).toFixed(1)}%</p>
        </div>
      )}
      
      <h2>Context Quality Dashboard</h2>
      {dashboard && (
        <div>
          <p>Overall Quality: {(dashboard.summary.overallQuality * 100).toFixed(1)}%</p>
          <p>Relevance: {(dashboard.summary.avgRelevance * 100).toFixed(1)}%</p>
          <p>Coherence: {(dashboard.summary.avgCoherence * 100).toFixed(1)}%</p>
          <p>Efficiency: {(dashboard.summary.avgEfficiency * 100).toFixed(1)}%</p>
          
          {dashboard.alerts.length > 0 && (
            <div>
              <h3>Alerts</h3>
              {dashboard.alerts.map(alert => (
                <div key={alert.timestamp} className={`alert ${alert.severity}`}>
                  {alert.message}
                </div>
              ))}
            </div>
          )}
          
          <h3>Recommendations</h3>
          <ul>
            {dashboard.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Key Takeaways

1. **Measure agent and context separately**: Generate both agent-only and context-enhanced answers to measure contribution
2. **Track quality over time**: Use dashboard to monitor trends and get alerts
3. **Test configurations**: Use A/B testing to optimize context independently of agent
4. **API access**: All metrics accessible via REST API for dashboards and monitoring
5. **Automatic recording**: AdvancedContextSystem automatically records context quality metrics

