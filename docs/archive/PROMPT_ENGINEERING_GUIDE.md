# Prompt Engineering Guide - Implementation in Our System

## 🎯 Overview

Good prompts turn an LLM from a novelty into a reliable coworker. This guide shows how we've implemented zero-shot, few-shot, and chain-of-thought (CoT) prompting throughout our system.

**The Golden Rule**: Iterate aggressively. Monitor outputs. Keep tweaking.

---

## 📐 Basic Prompt Structure (ICOD)

Every good prompt contains:

1. **Instruction** - What task to do
2. **Context** - Background info
3. **Output Indicator** - Format requirements
4. **Data** - The actual input

---

## 🎓 Three Core Techniques

### **1. Zero-Shot Prompting: Just Ask!**

Simply ask the model to do something directly, without examples.

#### **When to Use**
- Simple, common tasks
- Basic classification or Q&A
- When the task is well-understood by the model

#### **Implementation in Our System**

**Example 1: Simple Classification** (`frontend/app/api/model-router/route.ts`)

```typescript
// Zero-shot task classification
const { text } = await generateText({
  model: 'gpt-4',
  prompt: `
Classify this query into ONE category: simple, complex, coding, research, creative

Query: "${userQuery}"

Category:`,
});

// Output: "complex" (no examples needed)
```

**Example 2: Entity Type Detection** (`frontend/app/api/entities/extract/route.ts`)

```typescript
// Zero-shot entity classification
const entityPrompt = `
Classify this text as one entity type: PERSON, ORGANIZATION, LOCATION, DATE, PROJECT, TECHNOLOGY, or CONCEPT

Text: "${text}"

Type:`;

// Model knows these common categories without examples
```

**Example 3: Sentiment Analysis**

```typescript
// Zero-shot sentiment classification
const { text } = await generateText({
  model: 'gpt-3.5-turbo',
  prompt: `Classify sentiment (positive/negative/neutral): '${userFeedback}'`,
});
```

---

### **2. Few-Shot Prompting: Show, Don't Just Tell**

Provide 2-5 examples to guide the model's output format and style.

#### **When to Use**
- Specific output formats required
- Custom classification categories
- Consistent structure needed
- Novel or unusual tasks

#### **Implementation in Our System**

**Example 1: Workflow Classification** (`frontend/app/api/agent-builder/create/route.ts`)

```typescript
const fewShotPrompt = `
You are an expert AI workflow architect. Classify user requests and design workflows.

Example 1:
User Request: "I need to research competitor pricing and create a report"
Classification: {
  "category": "research",
  "complexity": "medium",
  "requiredTools": ["web_search", "dspy_market_analyst", "answer_generator"]
}

Example 2:
User Request: "Automatically summarize my slack messages every morning"
Classification: {
  "category": "automation",
  "complexity": "simple",
  "requiredTools": ["memory_search", "dspy_data_synthesizer", "answer_generator"]
}

Example 3:
User Request: "Build a system to analyze customer feedback and suggest improvements"
Classification: {
  "category": "analysis",
  "complexity": "complex",
  "requiredTools": ["web_search", "sentiment_analyzer", "dspy_investment_report", "answer_generator"]
}

Now classify this request:
User Request: "${userRequest}"

Classification:`;

// Model follows the exact JSON structure from examples
```

**Example 2: Feedback Categorization**

```typescript
const feedbackPrompt = `
Categorize user feedback based on these examples:

Example 1:
Feedback: "Love the new design! So much easier to navigate."
Category: praise, Sentiment: positive, Urgency: low

Example 2:
Feedback: "Need a dark mode option for night work."
Category: feature, Sentiment: neutral, Urgency: medium

Example 3:
Feedback: "Login page won't load, can't access my account!"
Category: bug, Sentiment: negative, Urgency: high

Now categorize this feedback:
"${userFeedback}"

Category:`;
```

**Example 3: Structured Entity Extraction** (`frontend/app/api/extract/appointment/route.ts`)

```typescript
const appointmentExtractionPrompt = `
Extract appointment details from natural language input following these examples:

Example 1:
Input: "Team meeting with Sarah next Monday at 2pm in Conference Room B"
Output: {
  "title": "Team Meeting",
  "date": "2025-10-13",
  "startTime": "14:00",
  "endTime": "15:00",
  "attendees": ["Sarah"],
  "location": "Conference Room B",
  "duration": 60
}

Example 2:
Input: "Lunch with the marketing team tomorrow at noon"
Output: {
  "title": "Lunch",
  "date": "2025-10-10",
  "startTime": "12:00",
  "endTime": "13:00",
  "attendees": ["marketing team"],
  "location": null,
  "duration": 60
}

Example 3:
Input: "Call with James and Mike on Thursday morning to discuss Q4 roadmap"
Output: {
  "title": "Q4 Roadmap Discussion",
  "date": "2025-10-16",
  "startTime": "09:00",
  "endTime": "10:00",
  "attendees": ["James", "Mike"],
  "location": "Virtual Meeting",
  "duration": 60
}

Current Context:
- Today is: ${new Date().toISOString().split('T')[0]}
- Day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

Now extract appointment details from:
"${userInput}"

Output:`;

// Model follows the exact structure and handles relative dates correctly
```

---

### **3. Chain-of-Thought (CoT) Prompting: Think Step-by-Step**

Break complex tasks into intermediate reasoning steps before the final answer.

#### **When to Use**
- Complex reasoning or calculations
- Multi-step problems
- Logic puzzles
- When you need to verify the model's reasoning
- Debugging incorrect outputs

#### **Implementation in Our System**

**Example 1: Workflow Planning** (`frontend/app/api/agent-builder/create/route.ts`)

```typescript
const cotWorkflowPrompt = `
Design an optimal AI workflow using step-by-step reasoning.

User Request: "${userRequest}"

Let me think through this step by step:

Step 1: Identify the core goal
The user wants to ${identifyGoal(userRequest)}

Step 2: Break down required capabilities
To achieve this, we need:
- ${capability1}
- ${capability2}
- ${capability3}

Step 3: Select appropriate tools
For ${capability1}, we should use ${tool1} because ${reason1}
For ${capability2}, we should use ${tool2} because ${reason2}
For ${capability3}, we should use ${tool3} because ${reason3}

Step 4: Determine workflow structure
The logical flow is: ${tool1} → ${tool2} → ${tool3}
This is ${linear/branching/parallel} because ${reasoning}

Step 5: Final workflow design
Based on this analysis, here's the optimal workflow:
{
  "goal": "...",
  "reasoning": "...",
  "selectedTools": [...],
  "workflowStructure": "..."
}

Now design the workflow using this same reasoning process:
User Request: "${actualUserRequest}"

Let me think through this step by step:`;

// Model follows the reasoning pattern
```

**Example 2: Complex Query Analysis**

```typescript
const cotAnalysisPrompt = `
Analyze this query step-by-step to determine the best approach.

Query: "Compare our Q3 sales with last year's Q3, identify trends, and predict Q4 performance"

Step 1: Break down the query components
- Component 1: Retrieve Q3 sales data (current year)
- Component 2: Retrieve Q3 sales data (last year)
- Component 3: Calculate comparison metrics
- Component 4: Identify patterns and trends
- Component 5: Build predictive model for Q4

Step 2: Identify data requirements
- Need access to: sales database, historical data (2 years)
- Time period: Q3 (July-September)
- Metrics needed: revenue, units sold, customer count

Step 3: Determine analysis approach
- Use time-series comparison for growth rates
- Apply trend analysis algorithms
- Use predictive modeling (linear regression or ML)

Step 4: Select tools and workflow
- Data retrieval: database_query tool
- Analysis: dspy_financial_analyst
- Visualization: report_generator
- Flow: sequential (each step depends on previous)

Step 5: Final plan
Execute in this order:
1. database_query → get current Q3 data
2. database_query → get last year Q3 data
3. dspy_financial_analyst → compare and analyze
4. dspy_financial_analyst → predict Q4
5. report_generator → create final report

Now analyze this query using the same step-by-step approach:
Query: "${userQuery}"

Step 1:`;
```

**Example 3: Debugging Workflow Issues**

```typescript
const cotDebugPrompt = `
Debug this workflow execution using systematic reasoning.

Workflow: ${JSON.stringify(workflow)}
Error: ${errorMessage}
Input: ${input}
Partial Output: ${partialOutput}

Step 1: Identify where the workflow failed
The error occurred at node: ${failedNode}
Error type: ${errorType}

Step 2: Analyze the input to that node
Expected input format: ${expectedFormat}
Actual input received: ${actualInput}
Mismatch: ${identifyMismatch}

Step 3: Trace back to find the source
The input came from node: ${previousNode}
That node's output was: ${previousOutput}
The transformation between nodes: ${transformation}

Step 4: Identify root cause
The issue is: ${rootCause}
This happened because: ${explanation}

Step 5: Recommend fix
Solution: ${solution}
Implementation: ${implementation}

Now debug this workflow issue using the same reasoning:
Workflow: ${actualWorkflow}
Error: ${actualError}

Step 1:`;
```

---

## 🛠️ Combining Techniques

Often, the best prompts combine multiple techniques:

### **Few-Shot + CoT for Complex Extraction**

```typescript
const hybridPrompt = `
Extract structured data using examples and step-by-step reasoning.

Example with reasoning:
Input: "Board meeting next Tuesday at 10am with all department heads to finalize budget"

Reasoning:
1. "Board meeting" is the main purpose → title
2. "next Tuesday" is a relative date → calculate from today (${today})
3. "10am" → convert to 24-hour format: "10:00"
4. "all department heads" → attendees (general group)
5. No location mentioned → assume "Conference Room"
6. Budget discussion → likely 2 hours → endTime: "12:00"

Output: {
  "title": "Board Meeting - Budget Finalization",
  "date": "2025-10-14",
  "startTime": "10:00",
  "endTime": "12:00",
  "attendees": ["Department Heads"],
  "location": "Conference Room",
  "duration": 120
}

Now extract with reasoning:
Input: "${userInput}"

Reasoning:
1.`;
```

### **Zero-Shot + Schema Enforcement**

```typescript
// Use zero-shot with strict schema validation
const { object } = await generateObject({
  model: 'gpt-4',
  prompt: `Categorize this workflow request: "${userRequest}"`,
  schema: z.object({
    category: z.enum(['research', 'analysis', 'automation', 'report', 'general']),
    complexity: z.enum(['simple', 'medium', 'complex']),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().describe('Explain why you chose this category')
  })
});
```

---

## 📊 Real Implementation Examples from Our System

### **1. Agent Builder with Few-Shot + CoT**

Current implementation in `frontend/app/api/agent-builder/create/route.ts`:

```typescript
const llmPrompt = `
You are an expert AI workflow architect. Your job is to analyze user requests and design optimal multi-agent workflows.

AVAILABLE TOOLS:
${toolsDescription}

Your task:
1. Understand the user's goal
2. Identify required capabilities
3. Select the BEST tools from the library above
4. Design an optimal workflow structure
5. Explain your reasoning

GUIDELINES:
- Use specialized tools (DSPy agents) when available for better quality
- Start with data gathering (web_search or memory_search) if needed
- Use custom_agent for tasks without specialized tools
- Always end with answer_generator
- Aim for 3-5 nodes (not too simple, not too complex)
- Provide clear reasoning for each tool selection

Respond in JSON format:
{
  "goal": "Clear statement of what user wants to achieve",
  "reasoning": "Overall strategy and approach",
  "requiredCapabilities": ["capability1", "capability2"],
  "selectedTools": [
    {
      "toolKey": "web_search",
      "role": "Market Researcher",
      "purpose": "Gather current market data",
      "reasoning": "Need real-time information"
    }
  ],
  "workflowStructure": "linear"
}

User Request: "${userRequest}"
`;
```

This combines:
- **Few-shot**: Implicit examples in the JSON structure
- **CoT**: Step-by-step instructions (1-5)
- **Schema**: JSON structure for consistency

### **2. Summarization with Few-Shot**

Implementation in `INVISIBLE_AI_PATTERNS.md`:

```typescript
const summaryPrompt = `
Please summarize the following conversation concisely, focusing on key decisions and action items.

Example summary structure:
Headline: Weekly Sprint Planning
Context: Team discussed upcoming features and resource allocation for the next sprint cycle.
Discussion Points:
• Prioritized user authentication feature for implementation
• Debated between REST vs GraphQL API approach
• Reviewed Q4 timeline and milestone dependencies
Takeaways:
• John to prototype auth flow by Friday (high priority)
• Sarah to research GraphQL migration costs (medium priority)
• Team sync on Thursday to finalize API decision (blocker)

Context:
- Number of messages: ${messages.length}
- Participants: ${participants.join(', ')}

Conversation:
${messages.map(m => \`\${m.role}: \${m.content}\`).join('\\n')}

Now create a summary following the same structure:`;
```

### **3. Entity Extraction with Zero-Shot**

Current implementation in `frontend/app/api/entities/extract/route.ts`:

```typescript
// Zero-shot works well for standard entity types
function classifyEntity(text: string): EntityType {
  // Pattern matching for common types
  if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(text)) return 'PERSON';
  if (/Inc\.|Corp\.|LLC|Ltd/.test(text)) return 'ORGANIZATION';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return 'DATE';
  
  // For ambiguous cases, ask LLM (zero-shot)
  const prompt = `Classify this as ONE type: PERSON, ORGANIZATION, LOCATION, DATE, PROJECT, TECHNOLOGY, or CONCEPT\n\nText: "${text}"\n\nType:`;
  
  // Model knows these standard categories
}
```

---

## ✅ Best Practices from Our Implementation

### **1. Be Specific and Over-Explain**

**Bad**:
```typescript
const prompt = `Create a workflow for the user`;
```

**Good**:
```typescript
const prompt = `
You are an expert AI workflow architect.

Task: Design a multi-step AI workflow that accomplishes the user's goal.

Requirements:
- Use 3-5 nodes (not too simple, not too complex)
- Start with data gathering if external info is needed
- Use specialized tools when available
- Always end with answer_generator
- Provide reasoning for each tool selection

Available tools: ${tools}

User's goal: "${userRequest}"

Design the workflow:`;
```

### **2. Provide Context**

**Bad**:
```typescript
const prompt = `Extract the date from: "${text}"`;
```

**Good**:
```typescript
const prompt = `
Extract the date from the following text and convert it to YYYY-MM-DD format.

Current context:
- Today's date: ${new Date().toISOString().split('T')[0]}
- Day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

Conversion examples:
- "tomorrow" → ${addDays(today, 1)}
- "next Monday" → ${nextMonday}
- "in 3 days" → ${addDays(today, 3)}

Text: "${text}"

Date (YYYY-MM-DD):`;
```

### **3. Use Schema Validation**

```typescript
// Always validate LLM output with Zod
const workflowSchema = z.object({
  goal: z.string(),
  reasoning: z.string(),
  selectedTools: z.array(z.object({
    toolKey: z.string(),
    role: z.string(),
    purpose: z.string()
  }))
});

try {
  const workflow = workflowSchema.parse(llmResponse);
} catch (error) {
  // Fallback to keyword-based approach
  console.warn('LLM response invalid, using fallback');
}
```

### **4. Iterate Aggressively**

We implement version tracking for prompts:

```typescript
// Track prompt versions and performance
const promptVersions = {
  v1: {
    prompt: 'Simple zero-shot prompt',
    successRate: 0.65,
    avgLatency: 1200
  },
  v2: {
    prompt: 'Few-shot with 3 examples',
    successRate: 0.85,
    avgLatency: 1500
  },
  v3: {
    prompt: 'Few-shot + CoT reasoning',
    successRate: 0.92,
    avgLatency: 1800
  }
};

// Use best performing version
const currentPrompt = promptVersions.v3.prompt;
```

---

## 🎯 Technique Selection Guide

Use this decision tree:

```
Is the task simple and common?
├─ YES → Zero-Shot
│   └─ Example: "Classify sentiment"
└─ NO → Is consistent format important?
    ├─ YES → Few-Shot
    │   └─ Example: "Extract appointment in specific JSON structure"
    └─ NO → Does it require reasoning?
        ├─ YES → Chain-of-Thought
        │   └─ Example: "Plan multi-step workflow with dependencies"
        └─ NO → Combine Few-Shot + CoT
            └─ Example: "Extract complex data with validation reasoning"
```

---

## 📈 Monitoring and Iteration

### **Log Everything**

```typescript
// Track prompt performance
async function callLLMWithLogging(prompt: string, schema: z.ZodSchema) {
  const startTime = Date.now();
  
  try {
    const response = await generateObject({
      model: 'gpt-4',
      prompt,
      schema
    });
    
    const latency = Date.now() - startTime;
    
    // Log success
    await logPromptPerformance({
      prompt: prompt.substring(0, 100), // First 100 chars
      success: true,
      latency,
      model: 'gpt-4',
      timestamp: new Date()
    });
    
    return response;
  } catch (error) {
    // Log failure
    await logPromptPerformance({
      prompt: prompt.substring(0, 100),
      success: false,
      error: error.message,
      model: 'gpt-4',
      timestamp: new Date()
    });
    
    throw error;
  }
}
```

### **A/B Test Prompts**

```typescript
// Compare prompt versions
const promptA = 'Simple zero-shot prompt';
const promptB = 'Few-shot with examples';

// Randomly assign
const selectedPrompt = Math.random() < 0.5 ? promptA : promptB;

const response = await generateObject({
  model: 'gpt-4',
  prompt: selectedPrompt,
  schema
});

// Track which version performed better
await trackABTest({
  variant: selectedPrompt === promptA ? 'A' : 'B',
  success: response.success,
  quality: evaluateQuality(response)
});
```

---

## 🚀 Next Steps

1. **Practice in Playground**: Use AI SDK Playground to test prompts
2. **Implement in Code**: Add prompts to your endpoints
3. **Monitor Performance**: Track success rates and latency
4. **Iterate**: Refine based on real usage data
5. **Document**: Keep a prompt library with versions

---

## 📚 Further Reading

- `LLM_FUNDAMENTALS_AND_SYSTEM_INTEGRATION.md` - How LLMs work
- `INVISIBLE_AI_PATTERNS.md` - Practical patterns
- `ARTIFACT_PROMPTS_INTEGRATION.md` - Artifact-specific prompts

---

**Prompting is an art and a science. Master it through iteration and measurement!** 🎯

