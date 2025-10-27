# DSPy Hints System - Usage Guide

**Problem**: "I have a DSPy optimized program but want minor tweaks to focus the output more on what I'm looking for"

**Solution**: Pass hints through 3 different approaches!

---

## 🎯 Three Approaches

### Approach 1: Edit JSON of Saved Prompt
**When to use**: You already have an optimized prompt saved and want to tweak it

```typescript
import { dspyHints } from '@/lib/dspy-hints-system';

// Load and edit saved prompt
const updated = await dspyHints.editSavedPrompt('my-prompt-123', {
  focus_areas: ['code examples', 'best practices'],
  avoid_patterns: ['generic advice', 'obvious points'],
  output_style: {
    tone: 'technical',
    length: 'detailed',
    structure: 'numbered-list'
  }
});

// The JSON file is updated with hints applied to the prompt
```

**Result**: Prompt JSON gets these additions:
```
**FOCUS ON**: code examples, best practices
**AVOID**: generic advice, obvious points
**OUTPUT STYLE**:
- Tone: technical
- Length: detailed
- Structure: numbered-list
```

### Approach 2: Edit Signature Before Optimizing
**When to use**: You're about to optimize and want to guide the optimization from the start

```typescript
import { createHintedSignature } from '@/lib/dspy-hints-system';
import { FinancialAnalysisSignature } from '@/lib/dspy-signatures';

// Create signature with hints
const hintedSignature = createHintedSignature(
  FinancialAnalysisSignature,
  {
    focus_areas: [
      'cash flow analysis',
      'risk assessment',
      'forward-looking projections'
    ],
    avoid_patterns: [
      'generic financial advice',
      'obvious ratios without context'
    ],
    constraints: {
      must_include: ['specific numbers', 'timeframes', 'confidence levels'],
      must_avoid: ['vague statements', 'unqualified claims'],
      preferred_terminology: ['EBITDA', 'working capital', 'burn rate']
    },
    output_style: {
      tone: 'formal',
      length: 'comprehensive',
      structure: 'paragraphs'
    },
    preferences: {
      prioritize_accuracy: true,
      prioritize_completeness: true,
      prioritize_speed: false
    },
    custom_instructions: 'Always include a risk score and explain the methodology used'
  }
);

// Now optimize with the hinted signature
const optimizer = new DSPyGEPAOptimizer();
const module = {
  signature: hintedSignature,  // <-- Uses hints during optimization!
  forward: async (input) => { /* ... */ }
};

const result = await optimizer.compile(module, trainset);
```

**Result**: The signature description gets enhanced with all hints, guiding GEPA/SIMBA during evolution

### Approach 3: Custom Metrics for GEPA/SIMBA with Hint Feedback
**When to use**: You want the optimizer to get real-time feedback based on your hints

```typescript
import { optimizeWithHints } from '@/lib/dspy-hints-system';

const hints = {
  focus_areas: ['actionable recommendations', 'specific examples'],
  avoid_patterns: ['theoretical discussion', 'academic language'],
  constraints: {
    must_include: ['next steps', 'timeline', 'resources needed']
  },
  output_style: {
    tone: 'casual',
    length: 'concise',
    structure: 'bullet-points'
  }
};

// Optimize with hint-aware metrics
const result = await optimizeWithHints(module, hints, trainset);

// During optimization, GEPA gets feedback like:
// ✅ "All focus areas covered"
// ❌ "Missing required elements: timeline, resources needed"
// ⚠️  "Found patterns to avoid: theoretical discussion"
```

**Result**: GEPA/SIMBA evolution receives custom metrics that score based on your hints:
- `focus_coverage`: How well it covers your focus areas
- `avoidance_compliance`: How well it avoids unwanted patterns
- `required_elements`: Whether must-include items are present
- `style_compliance`: Whether output style matches preferences

---

## 📋 Complete Hint Reference

```typescript
interface DSPyHints {
  // What to focus on in the output
  focus_areas?: string[];
  // Example: ['security best practices', 'performance optimization']
  
  // Patterns to avoid in the output
  avoid_patterns?: string[];
  // Example: ['generic advice', 'obvious statements', 'buzzwords']
  
  // Desired output characteristics
  output_style?: {
    tone?: 'formal' | 'casual' | 'technical' | 'creative';
    length?: 'concise' | 'detailed' | 'comprehensive';
    structure?: 'bullet-points' | 'paragraphs' | 'numbered-list' | 'mixed';
  };
  
  // Hard constraints
  constraints?: {
    must_include?: string[];    // Required elements
    must_avoid?: string[];      // Forbidden elements
    preferred_terminology?: string[];  // Preferred vocab
  };
  
  // Optimization priorities
  preferences?: {
    prioritize_accuracy?: boolean;      // Favor correctness
    prioritize_speed?: boolean;         // Favor brevity/efficiency
    prioritize_creativity?: boolean;    // Favor novel approaches
    prioritize_completeness?: boolean;  // Favor thoroughness
  };
  
  // Examples of good output
  example_outputs?: string[];
  // Example: ['Here's a specific solution: ...", "Step 1: Install X...']
  
  // Free-form instructions
  custom_instructions?: string;
  // Example: 'Always explain WHY, not just WHAT'
}
```

---

## 🚀 Real-World Examples

### Example 1: Legal Analysis - Focus on Practical Advice

```typescript
const legalHints = {
  focus_areas: [
    'actionable next steps',
    'specific legal requirements',
    'jurisdiction-specific rules'
  ],
  avoid_patterns: [
    'general legal principles',
    'academic discussion',
    'without consulting an attorney'
  ],
  constraints: {
    must_include: ['specific laws', 'deadlines', 'required documents'],
    must_avoid: ['definitive legal advice', 'guarantees']
  },
  output_style: {
    tone: 'formal',
    length: 'detailed',
    structure: 'numbered-list'
  },
  custom_instructions: 'Always cite specific laws and regulations. Include deadlines and filing requirements.'
};

const result = await dspyHints.editSavedPrompt('legal-analysis-v2', legalHints);
```

### Example 2: Code Generation - Emphasize Best Practices

```typescript
const codeHints = {
  focus_areas: [
    'error handling',
    'edge cases',
    'testing examples',
    'security considerations'
  ],
  avoid_patterns: [
    'TODO comments',
    'console.log statements',
    'magic numbers'
  ],
  constraints: {
    must_include: ['type annotations', 'docstrings', 'error handling'],
    preferred_terminology: ['async/await', 'try/catch', 'type guard']
  },
  output_style: {
    tone: 'technical',
    length: 'comprehensive',
    structure: 'mixed'
  },
  preferences: {
    prioritize_accuracy: true,
    prioritize_completeness: true
  },
  example_outputs: [
    '```typescript\n// Well-documented function with error handling\nasync function fetchData(): Promise<Data> {\n  try {\n    ...\n  } catch (error) {\n    ...\n  }\n}\n```'
  ],
  custom_instructions: 'Include unit test examples. Explain WHY each pattern is used, not just WHAT it does.'
};

const hintedSig = createHintedSignature(CodeGenerationSignature, codeHints);
```

### Example 3: Market Research - Emphasize Data-Driven Insights

```typescript
const researchHints = {
  focus_areas: [
    'quantitative data',
    'market trends with numbers',
    'competitor analysis',
    'growth projections'
  ],
  avoid_patterns: [
    'vague statements',
    'assumptions without data',
    'generic market descriptions'
  ],
  constraints: {
    must_include: ['percentages', 'timeframes', 'source citations'],
    must_avoid: ['unqualified claims', 'opinions without backing']
  },
  output_style: {
    tone: 'formal',
    length: 'comprehensive',
    structure: 'mixed'
  },
  preferences: {
    prioritize_accuracy: true,
    prioritize_completeness: true,
    prioritize_creativity: false
  },
  custom_instructions: 'Always include data sources. Use charts/tables where appropriate. Provide confidence intervals for projections.'
};

await optimizeWithHints(marketResearchModule, researchHints, trainset);
```

### Example 4: Creative Writing - Emphasize Storytelling

```typescript
const creativeHints = {
  focus_areas: [
    'vivid descriptions',
    'character development',
    'emotional resonance',
    'unexpected twists'
  ],
  avoid_patterns: [
    'clichés',
    'passive voice',
    'telling instead of showing',
    'info dumps'
  ],
  output_style: {
    tone: 'creative',
    length: 'detailed',
    structure: 'paragraphs'
  },
  preferences: {
    prioritize_creativity: true,
    prioritize_completeness: false,
    prioritize_accuracy: false
  },
  example_outputs: [
    'The rain didn\'t just fall—it attacked the pavement with the fury of a thousand tiny fists.',
    'She smiled, but her eyes told a different story.'
  ],
  custom_instructions: 'Show, don\'t tell. Use sensory details. Vary sentence structure. Create tension.'
};
```

---

## 🔧 API Endpoint

### POST `/api/dspy-hints/optimize`

**Request**:
```json
{
  "signature": {
    "input": { ... },
    "output": { ... },
    "description": "...",
    "domain": "finance"
  },
  "hints": {
    "focus_areas": ["cash flow", "risk assessment"],
    "avoid_patterns": ["generic advice"],
    "output_style": {
      "tone": "formal",
      "length": "detailed",
      "structure": "numbered-list"
    },
    "constraints": {
      "must_include": ["specific numbers", "timeframes"]
    }
  },
  "trainset": [
    { "input": {...}, "expected_output": {...} }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "result": {
    "optimized_module": { ... },
    "improvement": {
      "quality_delta": 0.15,
      "hint_compliance": 0.92
    },
    "hint_evaluation": {
      "overall_score": 0.92,
      "metric_scores": {
        "focus_coverage": 1.0,
        "avoidance_compliance": 0.95,
        "required_elements": 1.0,
        "style_compliance": 0.85
      },
      "feedback": {
        "focus_coverage": "All focus areas covered",
        "required_elements": "All required elements present"
      }
    }
  }
}
```

---

## 💡 Pro Tips

### Tip 1: Start with Focus Areas
The most powerful hints are `focus_areas` and `avoid_patterns`:
```typescript
{
  focus_areas: ['what you WANT to see more of'],
  avoid_patterns: ['what you DON\'T want']
}
```

### Tip 2: Use Must-Include for Critical Elements
If something is absolutely required, use constraints:
```typescript
{
  constraints: {
    must_include: ['required element 1', 'required element 2']
  }
}
```

### Tip 3: Provide Example Outputs
Examples are incredibly powerful for guiding optimization:
```typescript
{
  example_outputs: [
    'Good example 1: specific, actionable, clear',
    'Good example 2: with numbers and context'
  ]
}
```

### Tip 4: Iterate on Hints
Start with broad hints, see results, then add more specific constraints:

**Iteration 1**:
```typescript
{ focus_areas: ['actionable advice'] }
```

**Iteration 2** (after seeing results):
```typescript
{
  focus_areas: ['actionable advice', 'specific examples'],
  avoid_patterns: ['generic statements'],
  constraints: { must_include: ['next steps'] }
}
```

**Iteration 3** (fine-tuning):
```typescript
{
  focus_areas: ['actionable advice', 'specific examples', 'timeline'],
  avoid_patterns: ['generic statements', 'obvious points'],
  constraints: {
    must_include: ['next steps', 'resources needed', 'estimated time']
  },
  output_style: { structure: 'numbered-list', length: 'concise' }
}
```

### Tip 5: Use Custom Instructions for Nuance
When hints alone aren't enough, add custom instructions:
```typescript
{
  custom_instructions: 'Explain the WHY behind each recommendation, not just the WHAT. Include potential pitfalls and how to avoid them.'
}
```

---

## 🔄 Workflow Examples

### Workflow 1: Quick Tweak to Existing Prompt
```bash
# 1. Edit saved prompt with hints
curl -X POST /api/dspy-hints/edit-prompt \
  -d '{
    "prompt_id": "my-prompt-123",
    "hints": {
      "focus_areas": ["code examples"],
      "avoid_patterns": ["theoretical discussion"]
    }
  }'

# 2. Use updated prompt immediately
# (no re-optimization needed)
```

### Workflow 2: Optimize from Scratch with Hints
```typescript
// 1. Create signature with hints
const signature = createHintedSignature(baseSignature, hints);

// 2. Optimize
const optimizer = new DSPyGEPAOptimizer();
const result = await optimizer.compile({ signature, ... }, trainset);

// 3. Evaluate hint compliance
const evaluation = optimizer.evaluateWithHints(result);
console.log('Hint compliance:', evaluation.overall_score);
```

### Workflow 3: Iterative Optimization with Hint Feedback
```typescript
let hints = { focus_areas: ['accuracy'] };
let iteration = 0;

while (iteration < 3) {
  // Optimize
  const result = await optimizeWithHints(module, hints, trainset);
  
  // Check hint compliance
  const eval = result.hint_evaluation;
  console.log(`Iteration ${iteration}: ${eval.overall_score}`);
  
  // Adjust hints based on feedback
  if (eval.metric_scores.focus_coverage < 0.8) {
    hints.focus_areas.push('more specific details');
  }
  
  if (eval.feedback.required_elements.includes('Missing')) {
    // Add more constraints
  }
  
  iteration++;
}
```

---

## 📊 How Hints Affect Optimization

### Without Hints (Standard GEPA):
```
Generation 1: [50 random prompt variations]
Generation 2: [evolve based on fitness]
Generation 3: [further evolution]
...
Final: Best performing prompt (generic fitness)
```

### With Hints (Hint-Aware GEPA):
```
Generation 1: [50 prompt variations + hints applied]
  ├─ Metric 1: focus_coverage (0.6)
  ├─ Metric 2: avoidance_compliance (0.8)
  ├─ Metric 3: required_elements (0.7)
  └─ Metric 4: style_compliance (0.9)

Generation 2: [evolve toward high hint-metric scores]
  ├─ focus_coverage (0.8) ✓ improved
  ├─ avoidance_compliance (0.9) ✓ improved
  └─ ...

Final: Best prompt that satisfies YOUR specific needs
```

---

## 🎯 Summary

**Three Approaches**:
1. **Edit JSON**: Quick tweaks to saved prompts
2. **Hinted Signature**: Guide optimization from the start
3. **Custom Metrics**: Real-time feedback during optimization

**Most Powerful Hints**:
- `focus_areas`: What to emphasize
- `avoid_patterns`: What to avoid
- `constraints.must_include`: Critical required elements
- `example_outputs`: Show, don't just tell
- `custom_instructions`: Nuanced guidance

**Best Practice**: Start broad → iterate based on results → add specific constraints

---

**Files**:
- Implementation: `frontend/lib/dspy-hints-system.ts`
- API: `/api/dspy-hints/optimize`
- Examples: This guide

**Status**: ✅ Ready to use!
