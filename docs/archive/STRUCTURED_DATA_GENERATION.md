# Structured Data Generation with generateObject

## 🎯 Overview

The most powerful invisible AI pattern is using `generateObject` to turn natural language into structured, typed data that your application can use directly.

**Key Insight**: `generateText` returns strings you need to parse. `generateObject` returns typed JSON ready to use.

---

## 📊 Text vs Structured Output

### **generateText (Unstructured)**

```typescript
const { text } = await generateText({
  model: 'openai/gpt-4.1',
  prompt: `Extract all names from: "In the meeting, Guillermo and Lee discussed the new Vercel AI SDK with Sarah from marketing."`
});

console.log(text);
// Output: "Guillermo, Lee, Sarah"
// Type: string
// Problem: Need to parse, split, clean, validate
```

**Issues**:
- Just a string (no structure)
- Need to parse manually
- No type safety
- Inconsistent format
- Hard to validate

---

### **generateObject (Structured)**

```typescript
const namesSchema = z.object({
  names: z.array(z.string()),
  count: z.number()
});

const { object } = await generateObject({
  model: 'openai/gpt-4.1',
  prompt: `Extract all names from: "In the meeting, Guillermo and Lee discussed the new Vercel AI SDK with Sarah from marketing."`,
  schema: namesSchema
});

console.log(object);
// Output: { names: ["Guillermo", "Lee", "Sarah"], count: 3 }
// Type: { names: string[], count: number }
// Direct property access: object.names[0]
```

**Benefits**:
- ✅ Structured JSON
- ✅ Type-safe
- ✅ Direct property access
- ✅ Validated against schema
- ✅ Consistent format

---

## 🛠️ Implementation in Our System

### **Example 1: Name Extraction Comparison**

Create `frontend/app/api/compare-outputs/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    
    // Method 1: generateText (unstructured)
    const textResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: `Extract all names from this text: "${text}"`
          }
        ]
      }),
    });
    
    const textData = await textResponse.json();
    const textOutput = textData.choices[0].message.content;
    
    // Method 2: generateObject (structured)
    const namesSchema = z.object({
      names: z.array(z.string()).describe('List of all person names found in the text'),
      count: z.number().describe('Total number of names extracted'),
      confidence: z.number().min(0).max(1).describe('Confidence score for the extraction')
    });
    
    const objectResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a precise data extraction assistant. Extract information in the exact structure provided.'
          },
          {
            role: 'user',
            content: `Extract all person names from this text: "${text}"\n\nReturn a JSON object with: names (array of strings), count (number), and confidence (0-1).`
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });
    
    const objectData = await objectResponse.json();
    const objectOutput = JSON.parse(objectData.choices[0].message.content);
    
    // Validate against schema
    const validatedOutput = namesSchema.parse(objectOutput);
    
    return NextResponse.json({
      success: true,
      comparison: {
        textOutput: {
          raw: textOutput,
          type: 'string',
          needsParsing: true,
          directAccess: false
        },
        objectOutput: {
          raw: validatedOutput,
          type: 'object',
          needsParsing: false,
          directAccess: true,
          typeSafe: true,
          validated: true
        }
      },
      usage: {
        textApproach: 'Need to parse string, split by commas, handle edge cases',
        objectApproach: 'Direct property access: result.names[0]'
      }
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

### **Example 2: Smart Form Filling**

Create `frontend/app/api/smart-form-fill/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define the calendar event structure
const eventSchema = z.object({
  eventTitle: z.string().describe('The title or purpose of the event'),
  date: z.string().describe('The date in YYYY-MM-DD format'),
  time: z.string().nullable().describe('The time in HH:MM format'),
  duration: z.string().nullable().describe('Duration like "1 hour", "30 minutes"'),
  location: z.string().nullable().describe('Physical location or "Virtual"'),
  attendees: z.array(z.string()).nullable().describe('List of attendee names'),
  notes: z.string().nullable().describe('Additional notes or agenda items'),
  reminderMinutes: z.number().nullable().describe('Minutes before event to remind, default 15')
});

export type EventDetails = z.infer<typeof eventSchema>;

export async function POST(req: NextRequest) {
  try {
    const { userInput } = await req.json();
    
    console.log(`📝 Processing: "${userInput}"`);
    
    // Current context for date handling
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    const prompt = `
Extract calendar event details from the following natural language input.

Current Context:
- Today is: ${today} (${dayOfWeek})
- Current time: ${new Date().toLocaleTimeString('en-US', { hour12: false })}

User Input: "${userInput}"

Instructions:
1. Extract all relevant event information
2. Convert relative dates ("tomorrow", "next Monday") to YYYY-MM-DD format
3. Convert times to 24-hour HH:MM format
4. If duration not specified, estimate based on event type (default: 1 hour)
5. Identify location as physical address or "Virtual" for online meetings
6. Extract all mentioned names as attendees
7. Capture any agenda items or notes mentioned
8. Set reminder to 15 minutes if not specified

Return valid JSON matching the schema.
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
            content: 'You are an expert at extracting structured event data from natural language. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1 // Low temperature for consistent extraction
      }),
    });

    const data = await response.json();
    const extracted = JSON.parse(data.choices[0].message.content);
    
    // Validate against schema
    const eventDetails = eventSchema.parse(extracted);
    
    console.log('✅ Extracted event details:', eventDetails);
    
    // Return formatted for UI display
    return NextResponse.json({
      success: true,
      eventDetails,
      formFields: {
        'Event Title': eventDetails.eventTitle,
        'Date': eventDetails.date,
        'Time': eventDetails.time || 'Not specified',
        'Duration': eventDetails.duration || '1 hour (estimated)',
        'Location': eventDetails.location || 'Not specified',
        'Attendees': eventDetails.attendees?.join(', ') || 'None',
        'Notes': eventDetails.notes || 'None',
        'Reminder': eventDetails.reminderMinutes ? `${eventDetails.reminderMinutes} minutes before` : '15 minutes before'
      },
      message: '✨ Form automatically filled! Review and save.'
    });
    
  } catch (error: any) {
    console.error('Smart form fill error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

### **Example 3: Email Triage**

Create `frontend/app/api/email-triage/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Email classification schema
const emailTriageSchema = z.object({
  category: z.enum(['urgent', 'important', 'normal', 'spam', 'promotional', 'notification']).describe('Email category'),
  priority: z.enum(['high', 'medium', 'low']).describe('Priority level'),
  sentiment: z.enum(['positive', 'negative', 'neutral', 'angry', 'grateful']).describe('Sender sentiment'),
  actionRequired: z.boolean().describe('Does this email require action?'),
  estimatedResponseTime: z.string().nullable().describe('How long to respond? e.g., "immediately", "today", "this week"'),
  suggestedResponse: z.string().nullable().describe('AI-generated suggested reply. Null if too complex for auto-response'),
  tags: z.array(z.string()).describe('Relevant tags for organization'),
  summary: z.string().describe('One-sentence summary of the email'),
  keyPoints: z.array(z.string()).describe('Key points or action items from the email')
});

export type EmailTriage = z.infer<typeof emailTriageSchema>;

export async function POST(req: NextRequest) {
  try {
    const { from, subject, body } = await req.json();
    
    const prompt = `
Analyze this email and provide structured triage information.

From: ${from}
Subject: ${subject}
Body: ${body}

Instructions:
1. Categorize the email (urgent/important/normal/spam/promotional/notification)
2. Assign priority (high/medium/low)
3. Detect sender sentiment
4. Determine if action is required
5. Estimate response time needed
6. Generate a suggested response IF the email is simple enough
   - For complex emails or sensitive topics, return null for suggestedResponse
7. Add relevant tags for organization
8. Provide a one-sentence summary
9. Extract key points or action items

Return valid JSON matching the schema.
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
            content: 'You are an expert email assistant that helps users prioritize and respond to emails efficiently.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2 // Low temperature for consistent categorization
      }),
    });

    const data = await response.json();
    const extracted = JSON.parse(data.choices[0].message.content);
    
    // Validate against schema
    const triage = emailTriageSchema.parse(extracted);
    
    return NextResponse.json({
      success: true,
      triage,
      uiDisplay: {
        priorityBadge: {
          text: triage.priority.toUpperCase(),
          color: triage.priority === 'high' ? 'red' : triage.priority === 'medium' ? 'orange' : 'green'
        },
        categoryBadge: {
          text: triage.category,
          icon: getCategoryIcon(triage.category)
        },
        summary: triage.summary,
        actionRequired: triage.actionRequired ? '⚠️ Action Required' : '✅ No Action Needed',
        estimatedResponse: triage.estimatedResponseTime || 'No rush',
        tags: triage.tags,
        keyPoints: triage.keyPoints,
        suggestedResponse: triage.suggestedResponse || 'This email requires a personalized response.'
      }
    });
    
  } catch (error: any) {
    console.error('Email triage error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function getCategoryIcon(category: string): string {
  const icons = {
    urgent: '🚨',
    important: '⭐',
    normal: '📧',
    spam: '🗑️',
    promotional: '🏷️',
    notification: '🔔'
  };
  return icons[category as keyof typeof icons] || '📧';
}
```

---

## 🔍 Optional vs Nullable in Zod

### **Understanding the Difference**

```typescript
// .optional() - Field may not exist in the object
const schemaOptional = z.object({
  title: z.string(),
  notes: z.string().optional() // Field might not be present
});

// Valid: { title: "Meeting" }
// Valid: { title: "Meeting", notes: "Agenda items" }
// Type: { title: string, notes?: string }

// .nullable() - Field must exist but can be null
const schemaNullable = z.object({
  title: z.string(),
  notes: z.string().nullable() // Field is present but might be null
});

// Valid: { title: "Meeting", notes: null }
// Valid: { title: "Meeting", notes: "Agenda items" }
// Invalid: { title: "Meeting" } // notes field must be present
// Type: { title: string, notes: string | null }
```

### **When to Use Each**

#### **Use `.optional()` when**:
- Field genuinely might not be relevant
- You want to save tokens (field omitted entirely)
- TypeScript should treat it as `field?: type`

```typescript
const userProfileSchema = z.object({
  name: z.string(),
  email: z.string(),
  bio: z.string().optional(), // Not everyone has a bio
  website: z.string().optional() // Not everyone has a website
});
```

#### **Use `.nullable()` when**:
- Field should always be considered but might be empty
- You want explicit "no value" vs missing
- LLM should always make a decision about this field
- TypeScript should treat it as `field: type | null`

```typescript
const appointmentSchema = z.object({
  title: z.string(),
  time: z.string().nullable(), // Always consider time, but might not be specified
  location: z.string().nullable(), // Always ask "where?", answer might be null
  attendees: z.array(z.string()).nullable() // Always check for attendees
});
```

### **Our Recommendation for generateObject**

**Use `.nullable()` by default** because:

1. **Forces LLM to consider every field**
   ```typescript
   // With .nullable() - LLM must decide
   time: z.string().nullable()
   // LLM thinks: "Is there a time mentioned? No → return null"
   
   // With .optional() - LLM might skip
   time: z.string().optional()
   // LLM thinks: "Time not obvious, skip this field"
   ```

2. **More explicit in your app logic**
   ```typescript
   // Clearer intent
   if (event.location === null) {
     console.log('Location not specified');
   }
   
   // vs ambiguous
   if (!event.location) {
     console.log('Location not specified OR undefined?');
   }
   ```

3. **Better error messages**
   ```typescript
   // With .nullable() - clear validation
   { location: undefined } // ❌ Fails: location is required
   { location: null }      // ✅ Passes: location explicitly null
   
   // With .optional() - might mask issues
   { location: undefined } // ✅ Passes: location is optional
   ```

---

## 🎨 UI Integration Examples

### **Smart Form Fill Component**

```typescript
// frontend/components/SmartFormFill.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SmartFormFill() {
  const [input, setInput] = useState('');
  const [formData, setFormData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExtract = async () => {
    setIsLoading(true);
    
    const response = await fetch('/api/smart-form-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: input })
    });
    
    const result = await response.json();
    
    if (result.success) {
      setFormData(result.formFields);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'monospace' }}>
            ✨ Smart Form Filling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Natural Language Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'monospace' }}>
              Describe your event in plain English:
            </label>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Team meeting tomorrow at 3pm with Sarah and James to discuss Q4 plans"
              className="font-mono"
            />
          </div>
          
          <Button
            onClick={handleExtract}
            disabled={!input || isLoading}
            className="w-full bg-black text-white hover:bg-gray-800"
            style={{ fontFamily: 'monospace' }}
          >
            {isLoading ? 'Extracting...' : 'Fill Form with AI'}
          </Button>
          
          {/* Auto-Filled Form */}
          {formData && (
            <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
              <h3 className="text-sm font-bold text-black mb-3" style={{ fontFamily: 'monospace' }}>
                ✨ Form Automatically Filled:
              </h3>
              
              <div className="space-y-2">
                {Object.entries(formData).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3">
                    <span className="text-xs font-medium text-gray-600 w-32" style={{ fontFamily: 'monospace' }}>
                      {key}:
                    </span>
                    <span className="text-sm text-black font-medium flex-1" style={{ fontFamily: 'monospace' }}>
                      {value as string}
                    </span>
                  </div>
                ))}
              </div>
              
              <Button
                className="mt-4 w-full bg-green-600 text-white hover:bg-green-700"
                style={{ fontFamily: 'monospace' }}
              >
                ✅ Save Event
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ✅ Real-World Applications

### **1. Linear** - Issue Title Suggestions
```typescript
const issueSchema = z.object({
  suggestedTitle: z.string(),
  labels: z.array(z.string()),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  estimatedComplexity: z.enum(['simple', 'medium', 'complex'])
});

// "button not working on mobile" → 
// { suggestedTitle: "Fix: Mobile button non-responsive", labels: ["bug", "mobile", "ui"], ... }
```

### **2. Figma** - Smart Search
```typescript
const searchSchema = z.object({
  matchingComponents: z.array(z.object({
    name: z.string(),
    type: z.string(),
    relevanceScore: z.number()
  })),
  intent: z.string(),
  suggestedFilters: z.array(z.string())
});

// "blue button" → understands color + component type
```

### **3. Gmail** - Smart Replies
```typescript
const replySchema = z.object({
  toneAnalysis: z.enum(['formal', 'casual', 'urgent', 'friendly']),
  suggestedReplies: z.array(z.object({
    text: z.string(),
    sentiment: z.string(),
    appropriateFor: z.string()
  }))
});
```

---

## 🚀 Integration into Our System

### **Already Using Structured Output**:

1. **Agent Builder** - Workflow generation
   ```typescript
   const workflowSchema = z.object({
     goal: z.string(),
     nodes: z.array(nodeSchema),
     edges: z.array(edgeSchema)
   });
   ```

2. **Entity Extraction** - Knowledge graph
   ```typescript
   const entitySchema = z.object({
     type: z.enum([...]),
     value: z.string(),
     confidence: z.number()
   });
   ```

3. **Fluid Benchmarking** - IRT analysis
   ```typescript
   const irtSchema = z.object({
     ability: z.number(),
     difficulty: z.number(),
     discrimination: z.number()
   });
   ```

### **New Additions**:
- Smart form filling API
- Email triage system
- Output comparison endpoint

---

## 📚 Key Takeaways

1. **generateObject > generateText** for structured data
2. **Zod schemas** enforce structure and validation
3. **`.nullable()` > `.optional()`** for LLM reliability
4. **.describe()** guides AI extraction
5. **Type safety** from schema to UI
6. **Invisible AI** = great UX without "AI feel"

---

**Structured data generation is the foundation of invisible AI!** 🎯

