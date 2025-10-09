# Classification Guide - Turning Messy Text into Structured Categories

## 🎯 Overview

Classification is one of the most powerful Invisible AI patterns - automatically categorizing unstructured text into predefined categories at scale.

**The Problem**: Flooded with user feedback, support tickets, GitHub issues - manually categorizing is slow and doesn't scale.

**The Solution**: Use `generateObject` with Zod schemas to classify automatically.

---

## 📊 Why Classification Matters

### **Real-World Examples**

1. **Support Tickets**: Billing? Bug? Feature request?
2. **User Feedback**: Positive? Negative? Suggestion?
3. **GitHub Issues**: Bug? Feature? Docs? Needs triage?
4. **Email Inbox**: Work? Personal? Spam? Newsletter?
5. **Content Moderation**: Safe? Warning? Critical?

### **The Traditional Approach (Manual)**
- Read every message
- Decide category
- Assign manually
- Repeat thousands of times
- Slow, tedious, doesn't scale

### **The AI Approach (Automated)**
- Send batch to LLM
- Get structured categories back
- Instant, consistent, scales infinitely

---

## 🛠️ Implementation with generateObject

### **Basic Classification**

Create `frontend/app/api/classify/support/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define classification categories with z.enum
const classificationSchema = z.object({
  request: z.string().describe('The original support request text'),
  category: z.enum([
    'billing',
    'product_issues',
    'enterprise_sales',
    'account_issues',
    'product_feedback'
  ]).describe('The most relevant category for the support request'),
  confidence: z.number().min(0).max(1).describe('Confidence score for classification')
});

export type SupportClassification = z.infer<typeof classificationSchema>;

export async function POST(req: NextRequest) {
  try {
    const { requests } = await req.json();
    
    if (!Array.isArray(requests)) {
      return NextResponse.json(
        { success: false, error: 'requests must be an array' },
        { status: 400 }
      );
    }
    
    const prompt = `
Classify the following support requests into categories.

Categories:
- billing: Payment, invoices, subscription issues
- product_issues: Bugs, errors, features not working
- enterprise_sales: Enterprise inquiries, contracts, bulk licensing
- account_issues: Login, password, account access
- product_feedback: Feature requests, suggestions, improvements

Support Requests:
${JSON.stringify(requests, null, 2)}

For each request:
1. Determine the most relevant category
2. Provide a confidence score (0-1)
3. Return the original request text

Return as JSON array matching the schema.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4', // Fast model ideal for classification
        messages: [
          {
            role: 'system',
            content: 'You are a support ticket classification expert. Classify requests accurately and provide confidence scores.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3 // Low temperature for consistent classification
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // Validate each classification against schema
    const classifiedRequests = result.classifications || result;
    const validatedRequests = classifiedRequests.map((item: any) => 
      classificationSchema.parse(item)
    );
    
    return NextResponse.json({
      success: true,
      classified: validatedRequests,
      stats: {
        total: validatedRequests.length,
        byCategory: getCategoryCounts(validatedRequests),
        avgConfidence: getAverageConfidence(validatedRequests)
      }
    });
    
  } catch (error: any) {
    console.error('Classification error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function getCategoryCounts(requests: SupportClassification[]): Record<string, number> {
  return requests.reduce((acc, req) => {
    acc[req.category] = (acc[req.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function getAverageConfidence(requests: SupportClassification[]): number {
  const sum = requests.reduce((acc, req) => acc + req.confidence, 0);
  return sum / requests.length;
}
```

---

### **Adding Urgency Detection**

Enhance the schema to include urgency:

```typescript
const classificationWithUrgencySchema = z.object({
  request: z.string().describe('The original support request text'),
  
  category: z.enum([
    'billing',
    'product_issues',
    'enterprise_sales',
    'account_issues',
    'product_feedback'
  ]).describe('The most relevant category for the support request'),
  
  urgency: z.enum(['low', 'medium', 'high', 'critical']).describe(
    `Urgency level based on:
    - critical: System down, data loss, security issue, blocking production
    - high: Important feature broken, multiple users affected, deadline pressure
    - medium: Single user issue, workaround available, non-urgent bug
    - low: Feature request, enhancement, question, documentation`
  ),
  
  confidence: z.number().min(0).max(1),
  
  estimatedResponseTime: z.string().nullable().describe(
    'Estimated response time: "immediately", "within 1 hour", "within 24 hours", "within 1 week"'
  )
});
```

**Key Improvement**: Use `.describe()` to provide detailed classification criteria.

---

### **Multi-Language Classification**

Handle multiple languages automatically:

```typescript
const multiLanguageSchema = z.object({
  request: z.string().describe('The original support request text'),
  
  category: z.enum([
    'billing',
    'product_issues',
    'enterprise_sales',
    'account_issues',
    'product_feedback'
  ]).describe('The most relevant category'),
  
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  
  language: z.string().describe(
    'The full name of the language the request is in (e.g., English, Spanish, German, Chinese, Japanese, French, Portuguese)'
  ),
  
  translatedRequest: z.string().nullable().describe(
    'English translation of the request if not already in English, otherwise null'
  ),
  
  confidence: z.number().min(0).max(1)
});

// Example classifications:
// Spanish: "No puedo iniciar sesión" → 
// { category: "account_issues", language: "Spanish", translatedRequest: "I cannot log in" }

// German: "Rechnung ist falsch" → 
// { category: "billing", language: "German", translatedRequest: "Invoice is incorrect" }

// Chinese: "产品有问题" → 
// { category: "product_issues", language: "Chinese", translatedRequest: "There is a problem with the product" }
```

---

### **Multi-Label Classification**

Allow multiple categories per request:

```typescript
const multiLabelSchema = z.object({
  request: z.string().describe('The original support request text'),
  
  categories: z.array(z.enum([
    'billing',
    'product_issues',
    'enterprise_sales',
    'account_issues',
    'product_feedback'
  ])).describe(
    `All relevant categories for this request. Assign multiple categories when:
    - Request spans multiple areas (e.g., billing affecting product access)
    - Multiple issues mentioned in one message
    - Request has both a problem AND a feature suggestion
    
    Guidelines:
    - Assign 1-3 categories (avoid over-assignment)
    - Order by relevance (most relevant first)
    - Only assign if clearly relevant (>70% confidence)`
  ),
  
  primaryCategory: z.enum([
    'billing',
    'product_issues',
    'enterprise_sales',
    'account_issues',
    'product_feedback'
  ]).describe('The single most relevant category for routing'),
  
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  
  reasoning: z.string().describe('Brief explanation for category assignment')
});

// Example:
// "I can't access my premium features after my payment went through"
// →
// {
//   categories: ["billing", "product_issues", "account_issues"],
//   primaryCategory: "billing",
//   reasoning: "Payment processed but premium features not activated - billing issue affecting product access"
// }
```

---

### **Content Moderation System**

Real-time classification for moderation:

Create `frontend/app/api/moderate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const moderationSchema = z.object({
  message: z.string().describe('The original message'),
  
  severity: z.enum(['safe', 'warning', 'critical']).describe(
    `Severity level:
    - safe: No policy violations, appropriate content
    - warning: Minor issues, borderline content, needs review
    - critical: Clear policy violation, immediate action required`
  ),
  
  categories: z.array(z.enum([
    'spam',
    'violence',
    'hate_speech',
    'harassment',
    'sexual_content',
    'pii', // Personally Identifiable Information
    'misinformation',
    'self_harm',
    'illegal',
    'other'
  ])).describe('All applicable violation categories'),
  
  confidence: z.number().min(0).max(1),
  
  actionRecommendation: z.enum([
    'allow',
    'flag_for_review',
    'hide',
    'remove',
    'ban_user'
  ]).describe('Recommended moderation action'),
  
  reasoning: z.string().describe('Explanation for the classification'),
  
  language: z.string().nullable()
});

export type ModerationResult = z.infer<typeof moderationSchema>;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    const startTime = Date.now();
    
    const prompt = `
Moderate the following message for policy violations.

Policy Guidelines:
- spam: Unsolicited commercial content, repetitive posting
- violence: Threats, graphic violence, calls to violence
- hate_speech: Attacks on protected characteristics
- harassment: Targeted abuse, bullying, intimidation
- sexual_content: Explicit sexual content, solicitation
- pii: Leaked personal information (SSN, credit cards, addresses)
- misinformation: Demonstrably false health/safety claims
- self_harm: Promotion of suicide, self-injury
- illegal: Illegal activities, fraud, drugs

Message: "${message}"

Classify severity, categories, and recommend action.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a content moderation expert. Classify accurately and provide clear reasoning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1 // Very low for consistent moderation
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // Validate against schema
    const moderation = moderationSchema.parse(result);
    
    const latency = Date.now() - startTime;
    
    // Take action based on severity
    if (moderation.severity === 'critical') {
      await sendAlert(message, moderation);
      console.error('🚨 Critical content detected:', {
        message: message.substring(0, 50) + '...',
        categories: moderation.categories,
        action: moderation.actionRecommendation
      });
    }
    
    return NextResponse.json({
      success: true,
      moderation,
      metadata: {
        latency,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('Moderation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function sendAlert(message: string, moderation: ModerationResult) {
  // In production: send to Slack, PagerDuty, etc.
  console.error('⚠️ MODERATION ALERT', {
    severity: moderation.severity,
    categories: moderation.categories,
    action: moderation.actionRecommendation,
    message: message.substring(0, 100)
  });
}
```

---

## 📈 Advanced Techniques

### **1. Confidence Scoring for Ambiguous Cases**

```typescript
const confidenceAwareSchema = z.object({
  request: z.string(),
  
  category: z.enum([...]),
  
  confidence: z.number().min(0).max(1).describe(
    `Confidence score (0-1). Consider:
    - 0.9-1.0: Clear, unambiguous category
    - 0.7-0.9: Confident but some ambiguity
    - 0.5-0.7: Uncertain, multiple possible categories
    - <0.5: Very ambiguous, needs human review`
  ),
  
  alternativeCategories: z.array(z.object({
    category: z.enum([...]),
    confidence: z.number()
  })).nullable().describe('Alternative categories if confidence < 0.8'),
  
  needsHumanReview: z.boolean().describe('True if confidence < 0.6 or edge case detected')
});

// Usage:
if (result.confidence < 0.6 || result.needsHumanReview) {
  // Send to human review queue
  await queueForReview(result);
} else {
  // Automatic routing
  await routeToTeam(result.category);
}
```

### **2. Temperature Tuning for Classification**

```typescript
// For consistent classification
const response = await generateObject({
  model: 'gpt-4',
  temperature: 0.1, // Very low for deterministic results
  // ...
});

// For creative categorization (e.g., content tagging)
const response = await generateObject({
  model: 'gpt-4',
  temperature: 0.5, // Higher for more varied tags
  // ...
});
```

### **3. Handling Edge Cases**

```typescript
const robustSchema = z.object({
  request: z.string(),
  
  category: z.enum([...]),
  
  isEdgeCase: z.boolean().describe(
    `True if request spans multiple categories or is ambiguous`
  ),
  
  edgeCaseReason: z.string().nullable().describe(
    'Explanation of why this is an edge case'
  ),
  
  suggestedCategories: z.array(z.enum([...])).nullable().describe(
    'All relevant categories for edge cases'
  )
});
```

---

## 🎨 UI Integration

### **Classification Dashboard Component**

```typescript
// frontend/components/ClassificationDashboard.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Classification {
  request: string;
  category: string;
  urgency: string;
  confidence: number;
}

export function ClassificationDashboard() {
  const [requests, setRequests] = useState<string[]>([]);
  const [classified, setClassified] = useState<Classification[]>([]);
  const [isClassifying, setIsClassifying] = useState(false);

  const handleClassify = async () => {
    setIsClassifying(true);
    
    const response = await fetch('/api/classify/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests })
    });
    
    const result = await response.json();
    
    if (result.success) {
      setClassified(result.classified);
    }
    
    setIsClassifying(false);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      billing: 'bg-blue-100 text-blue-800',
      product_issues: 'bg-red-100 text-red-800',
      enterprise_sales: 'bg-green-100 text-green-800',
      account_issues: 'bg-yellow-100 text-yellow-800',
      product_feedback: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-green-500 text-white'
    };
    return colors[urgency] || 'bg-gray-500 text-white';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'monospace' }}>
            Support Ticket Classifier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Area */}
          <textarea
            className="w-full p-3 border border-gray-300 rounded font-mono text-sm"
            rows={6}
            placeholder="Paste support requests (one per line)..."
            onChange={(e) => setRequests(e.target.value.split('\n').filter(r => r.trim()))}
          />
          
          <Button
            onClick={handleClassify}
            disabled={requests.length === 0 || isClassifying}
            className="w-full bg-black text-white hover:bg-gray-800"
            style={{ fontFamily: 'monospace' }}
          >
            {isClassifying ? 'Classifying...' : `Classify ${requests.length} Requests`}
          </Button>
          
          {/* Results */}
          {classified.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-bold text-black mb-3" style={{ fontFamily: 'monospace' }}>
                ✅ Classified Requests:
              </h3>
              
              {classified.map((item, i) => (
                <div key={i} className="p-4 bg-white border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700 mb-3" style={{ fontFamily: 'monospace' }}>
                    {item.request}
                  </p>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`} style={{ fontFamily: 'monospace' }}>
                      {item.category.replace('_', ' ').toUpperCase()}
                    </span>
                    
                    <span className={`px-3 py-1 rounded text-xs font-medium ${getUrgencyColor(item.urgency)}`} style={{ fontFamily: 'monospace' }}>
                      {item.urgency.toUpperCase()}
                    </span>
                    
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium" style={{ fontFamily: 'monospace' }}>
                      {(item.confidence * 100).toFixed(0)}% confident
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ✅ Best Practices

### **1. Use z.enum for Fixed Categories**
```typescript
// ✅ Good: Fixed set of categories
category: z.enum(['bug', 'feature', 'docs'])

// ❌ Bad: Open-ended string
category: z.string()
```

### **2. Provide Detailed .describe() Guidance**
```typescript
// ✅ Good: Detailed criteria
urgency: z.enum(['low', 'medium', 'high']).describe(
  `high: Blocking production, data loss, security
  medium: Important but has workaround
  low: Enhancement, question, documentation`
)

// ❌ Bad: No guidance
urgency: z.enum(['low', 'medium', 'high'])
```

### **3. Include Confidence Scores**
```typescript
// Always include for quality monitoring
confidence: z.number().min(0).max(1)

// Route based on confidence
if (confidence < 0.7) {
  await queueForHumanReview();
}
```

### **4. Log and Monitor Classifications**
```typescript
// Track performance over time
await logClassification({
  category: result.category,
  confidence: result.confidence,
  latency,
  timestamp: new Date()
});
```

---

## 🚀 Integration into Our System

### **Already Using Classification**:
1. ✅ Workflow routing (agent builder)
2. ✅ Entity type detection (knowledge graph)
3. ✅ Model selection (router)

### **Ready to Add**:
1. 🎯 Support ticket classification
2. 🎯 Email inbox triage
3. 🎯 Content moderation
4. 🎯 Multi-language support

---

## 📚 Key Takeaways

1. **z.enum()** defines fixed classification categories
2. **generateObject** ensures structured, validated output
3. **.describe()** guides the LLM for better accuracy
4. **output: 'array'** classifies multiple items at once
5. **Confidence scores** help identify ambiguous cases
6. **Multi-label** allows multiple categories per item
7. **Temperature 0.1-0.3** for consistent classification

---

**Classification is the foundation of automated workflows!** 🎯

