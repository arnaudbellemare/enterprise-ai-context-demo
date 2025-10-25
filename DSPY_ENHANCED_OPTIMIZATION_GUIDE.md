# Enhanced DSPy Optimization with Hints and Custom Metrics

## 🎯 Overview

The Enhanced DSPy Optimization system allows you to:
- **Pass hints** to focus DSPy output on specific requirements
- **Use custom metrics** for GEPA/SIMBA feedback during optimization
- **Get real-time feedback** during the optimization process
- **Optimize signatures** for specific domains (legal, insurance, art, etc.)

## 🚀 Key Features

### 1. **Hints System**
Pass hints to guide the optimization process:

```typescript
const hints = [
  {
    id: 'focus_accuracy',
    type: 'focus',
    content: 'Focus on providing highly accurate valuations with detailed market analysis',
    weight: 0.9,
    domain: 'art'
  },
  {
    id: 'constraint_insurance',
    type: 'constraint',
    content: 'Output must include insurance-specific requirements and USPAP compliance',
    weight: 0.8,
    domain: 'insurance'
  }
];
```

### 2. **Custom Metrics**
Define your own evaluation metrics:

```typescript
const customMetrics = [
  {
    name: 'accuracy',
    description: 'How accurate are the outputs compared to expected results',
    weight: 0.4,
    evaluator: (output, expected) => {
      // Your custom evaluation logic
      const valueDiff = Math.abs(output.valuation - expected.valuation) / expected.valuation;
      return Math.max(0, 1 - valueDiff);
    }
  }
];
```

### 3. **Real-time Feedback**
Get feedback during optimization:

```typescript
const feedback = [
  {
    generation: 2,
    promptId: 'ArtValuationExpert',
    metrics: { accuracy: 0.85, completeness: 0.92 },
    feedback: 'Generation 2 - Best Score: 0.876\naccuracy needs improvement (85.0%)',
    suggestions: ['Focus on improving: accuracy', 'Leverage strengths in: completeness']
  }
];
```

## 📋 API Usage

### **POST /api/dspy-enhanced-optimization**

Run optimization with hints and custom metrics:

```bash
curl -X POST "http://localhost:3000/api/dspy-enhanced-optimization" \
  -H "Content-Type: application/json" \
  -d '{
    "signature": {
      "name": "ArtValuationExpert",
      "input": "artwork_data, market_context",
      "output": "valuation, confidence, reasoning",
      "instructions": "Analyze artwork and provide comprehensive valuation",
      "examples": [...]
    },
    "hints": [
      {
        "type": "focus",
        "content": "Focus on accuracy and detailed reasoning",
        "weight": 0.8
      }
    ],
    "customMetrics": [
      {
        "name": "accuracy",
        "weight": 0.4,
        "evaluator": "function(output, expected) { return 0.8; }"
      }
    ],
    "optimizationConfig": {
      "maxGenerations": 10,
      "populationSize": 20,
      "mutationRate": 0.1,
      "feedbackFrequency": 2
    }
  }'
```

### **GET /api/dspy-enhanced-optimization?action=stats**

Get optimization statistics:

```bash
curl "http://localhost:3000/api/dspy-enhanced-optimization?action=stats"
```

### **GET /api/dspy-enhanced-optimization?action=examples**

Get example hints, metrics, and signatures:

```bash
curl "http://localhost:3000/api/dspy-enhanced-optimization?action=examples"
```

## 🎯 Hint Types

### **1. Focus Hints**
Guide the optimization toward specific aspects:

```typescript
{
  type: 'focus',
  content: 'Focus on providing accurate valuations with detailed reasoning',
  weight: 0.8,
  domain: 'art'
}
```

### **2. Constraint Hints**
Set requirements that must be met:

```typescript
{
  type: 'constraint',
  content: 'Output must be in JSON format with specific fields',
  weight: 0.9,
  domain: 'general'
}
```

### **3. Preference Hints**
Set stylistic or approach preferences:

```typescript
{
  type: 'preference',
  content: 'Use professional, technical language appropriate for insurance appraisals',
  weight: 0.7,
  domain: 'insurance'
}
```

### **4. Example Hints**
Provide specific examples to guide optimization:

```typescript
{
  type: 'example',
  content: 'For high-value items (>$1M), include additional risk assessment',
  weight: 0.6,
  domain: 'insurance'
}
```

## 📊 Custom Metrics

### **Accuracy Metric**
```typescript
{
  name: 'accuracy',
  description: 'How accurate are the outputs compared to expected results',
  weight: 0.4,
  evaluator: (output, expected) => {
    const valueDiff = Math.abs(output.valuation - expected.valuation) / expected.valuation;
    return Math.max(0, 1 - valueDiff);
  }
}
```

### **Completeness Metric**
```typescript
{
  name: 'completeness',
  description: 'How complete are the responses (all required fields present)',
  weight: 0.3,
  evaluator: (output, expected) => {
    const requiredFields = ['valuation', 'confidence', 'reasoning'];
    const presentFields = requiredFields.filter(field => output[field] !== undefined);
    return presentFields.length / requiredFields.length;
  }
}
```

### **Domain Relevance Metric**
```typescript
{
  name: 'domain_relevance',
  description: 'How relevant are the outputs to the specific domain',
  weight: 0.3,
  evaluator: (output, expected) => {
    // Check for domain-specific terminology and concepts
    const domainTerms = ['USPAP', 'insurance', 'appraisal', 'market analysis'];
    const foundTerms = domainTerms.filter(term => 
      output.reasoning?.toLowerCase().includes(term.toLowerCase())
    );
    return foundTerms.length / domainTerms.length;
  }
}
```

## 🔧 Optimization Configuration

### **Basic Configuration**
```typescript
const optimizationConfig = {
  maxGenerations: 10,        // Number of optimization generations
  populationSize: 20,        // Size of the population
  mutationRate: 0.1,         // Rate of mutation (0-1)
  feedbackFrequency: 2       // How often to provide feedback
};
```

### **Advanced Configuration**
```typescript
const optimizationConfig = {
  maxGenerations: 20,        // More generations for complex problems
  populationSize: 50,        // Larger population for better diversity
  mutationRate: 0.15,       // Higher mutation for exploration
  feedbackFrequency: 1,     // Feedback every generation
  eliteSize: 10,            // Keep top 10 individuals
  crossoverRate: 0.8         // Rate of crossover operations
};
```

## 🎯 Domain-Specific Examples

### **Legal Domain**
```typescript
const legalHints = [
  {
    type: 'focus',
    content: 'Focus on providing accurate legal analysis with proper citations',
    weight: 0.9,
    domain: 'legal'
  },
  {
    type: 'constraint',
    content: 'Include relevant case law and statutory references',
    weight: 0.8,
    domain: 'legal'
  }
];

const legalMetrics = [
  {
    name: 'legal_accuracy',
    description: 'Accuracy of legal analysis and citations',
    weight: 0.5,
    evaluator: (output, expected) => {
      // Check for proper legal citations and analysis
      const hasCitations = output.reasoning?.includes('§') || output.reasoning?.includes('v.');
      const hasAnalysis = output.reasoning?.length > 200;
      return (hasCitations ? 0.5 : 0) + (hasAnalysis ? 0.5 : 0);
    }
  }
];
```

### **Insurance Domain**
```typescript
const insuranceHints = [
  {
    type: 'focus',
    content: 'Focus on USPAP compliance and insurance-specific requirements',
    weight: 0.9,
    domain: 'insurance'
  },
  {
    type: 'constraint',
    content: 'Include risk assessment and documentation requirements',
    weight: 0.8,
    domain: 'insurance'
  }
];

const insuranceMetrics = [
  {
    name: 'uspap_compliance',
    description: 'Compliance with USPAP standards',
    weight: 0.4,
    evaluator: (output, expected) => {
      const uspapTerms = ['USPAP', 'appraisal', 'market value', 'effective date'];
      const foundTerms = uspapTerms.filter(term => 
        output.reasoning?.toLowerCase().includes(term.toLowerCase())
      );
      return foundTerms.length / uspapTerms.length;
    }
  }
];
```

### **Art Domain**
```typescript
const artHints = [
  {
    type: 'focus',
    content: 'Focus on market analysis and comparable sales data',
    weight: 0.8,
    domain: 'art'
  },
  {
    type: 'preference',
    content: 'Include artist biography and historical context',
    weight: 0.6,
    domain: 'art'
  }
];

const artMetrics = [
  {
    name: 'market_analysis',
    description: 'Quality of market analysis and comparable sales',
    weight: 0.5,
    evaluator: (output, expected) => {
      const marketTerms = ['comparable', 'auction', 'gallery', 'market trend'];
      const foundTerms = marketTerms.filter(term => 
        output.reasoning?.toLowerCase().includes(term.toLowerCase())
      );
      return foundTerms.length / marketTerms.length;
    }
  }
];
```

## 📈 Response Format

### **Optimization Response**
```json
{
  "success": true,
  "data": {
    "optimizedSignature": {
      "name": "ArtValuationExpert",
      "input": "artwork_data, market_context",
      "output": "valuation, confidence, reasoning",
      "instructions": "Enhanced instructions with hints applied...",
      "examples": [...]
    },
    "feedback": [
      {
        "generation": 2,
        "promptId": "ArtValuationExpert",
        "metrics": { "accuracy": 0.85, "completeness": 0.92 },
        "feedback": "Generation 2 - Best Score: 0.876\naccuracy needs improvement (85.0%)",
        "suggestions": ["Focus on improving: accuracy", "Leverage strengths in: completeness"]
      }
    ],
    "metrics": {
      "accuracy": 0.876,
      "completeness": 0.92,
      "domain_relevance": 0.88
    },
    "suggestions": [
      "Focus on improving: accuracy",
      "Leverage strengths in: completeness",
      "Consider adjusting hint weights for better focus"
    ],
    "optimizationStats": {
      "size": 20,
      "generation": 8,
      "bestFitness": 0.876,
      "averageFitness": 0.823
    }
  }
}
```

## 🚀 Best Practices

### **1. Hint Design**
- **Be Specific**: Use clear, actionable hints
- **Weight Appropriately**: Higher weights for critical requirements
- **Domain-Specific**: Tailor hints to your domain
- **Balanced**: Don't over-constrain the system

### **Example:**
```typescript
// Good hint
{
  type: 'focus',
  content: 'Focus on providing accurate valuations with detailed market analysis and comparable sales data',
  weight: 0.8,
  domain: 'art'
}

// Bad hint (too vague)
{
  type: 'focus',
  content: 'Be better',
  weight: 0.5,
  domain: 'general'
}
```

### **2. Metric Design**
- **Meaningful**: Metrics should measure what matters
- **Balanced**: Don't over-weight any single metric
- **Efficient**: Fast evaluation functions
- **Robust**: Handle edge cases gracefully

**Example:**
```typescript
// Good metric
{
  name: 'accuracy',
  weight: 0.4,
  evaluator: (output, expected) => {
    const valueDiff = Math.abs(output.valuation - expected.valuation) / expected.valuation;
    return Math.max(0, 1 - valueDiff);
  }
}

// Bad metric (too complex)
{
  name: 'everything',
  weight: 0.9,
  evaluator: (output, expected) => {
    // 100 lines of complex evaluation logic
  }
}
```

### **3. Configuration Tuning**
- **Start Small**: Begin with fewer generations and smaller population
- **Monitor Feedback**: Use feedback to adjust configuration
- **Iterate**: Run multiple optimization cycles
- **Domain-Specific**: Adjust parameters for your domain

**Example Progression:**
```typescript
// Initial run
const config1 = {
  maxGenerations: 5,
  populationSize: 10,
  mutationRate: 0.1,
  feedbackFrequency: 2
};

// After seeing results
const config2 = {
  maxGenerations: 10,
  populationSize: 20,
  mutationRate: 0.15,
  feedbackFrequency: 1
};

// Fine-tuning
const config3 = {
  maxGenerations: 15,
  populationSize: 30,
  mutationRate: 0.12,
  feedbackFrequency: 1
};
```

## 🔍 Troubleshooting

### **Common Issues**

#### **1. Low Optimization Scores**
- **Check Hints**: Ensure hints are clear and actionable
- **Review Metrics**: Verify metrics are measuring what you want
- **Adjust Weights**: Balance hint and metric weights
- **Check Examples**: Ensure training data examples are good

#### **2. Slow Optimization**
- **Reduce Population**: Use smaller population size
- **Fewer Generations**: Start with fewer generations
- **Simplify Metrics**: Use simpler evaluation functions
- **Check Feedback Frequency**: Don't provide feedback too often

#### **3. Poor Domain Performance**
- **Domain-Specific Hints**: Add more domain-specific hints
- **Custom Metrics**: Create domain-specific metrics
- **Better Examples**: Improve training data examples
- **Weight Adjustment**: Increase domain-specific weights

### **Debugging Tips**

#### **1. Monitor Feedback**
```typescript
// Check feedback for patterns
feedback.forEach(f => {
  console.log(`Generation ${f.generation}: ${f.feedback}`);
  console.log(`Metrics:`, f.metrics);
  console.log(`Suggestions:`, f.suggestions);
});
```

#### **2. Analyze Metrics**
```typescript
// Check which metrics are performing poorly
Object.entries(metrics).forEach(([metric, score]) => {
  if (score < 0.7) {
    console.log(`⚠️ ${metric} needs improvement: ${(score * 100).toFixed(1)}%`);
  }
});
```

#### **3. Validate Hints**
```typescript
// Ensure hints are being applied
console.log('Applied hints:', optimizedSignature.instructions);
console.log('Hint weights:', hints.map(h => `${h.id}: ${h.weight}`));
```

## 🎉 Success Metrics

### **Good Optimization Results**
- **Overall Score**: > 0.8
- **Metric Balance**: No single metric dominating
- **Feedback Quality**: Clear, actionable feedback
- **Domain Relevance**: High domain-specific performance

### **Signs of Success**
- ✅ Consistent improvement across generations
- ✅ Balanced metric performance
- ✅ Clear, actionable feedback
- ✅ Domain-specific optimization
- ✅ Practical suggestions for improvement

## 🚀 Next Steps

1. **Start Simple**: Begin with basic hints and metrics
2. **Iterate**: Run multiple optimization cycles
3. **Monitor**: Watch feedback and adjust accordingly
4. **Scale**: Increase complexity as you get better results
5. **Domain-Specific**: Tailor to your specific use case

The Enhanced DSPy Optimization system gives you powerful control over the optimization process, allowing you to guide DSPy toward exactly what you're looking for! 🎯
