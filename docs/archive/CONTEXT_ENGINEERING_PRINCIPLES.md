# 🎯 Context Engineering Principles for Enterprise AI

*Adapted from Grok Code Fast 1 best practices for our Agent Builder, Workflow Builder, and Smart Extract systems*

---

## 📋 Core Principles

Our system uses **intelligent context assembly** to give AI agents the right information at the right time. Follow these principles to maximize effectiveness.

---

## 1️⃣ **Provide Necessary Context (Don't Overload)**

### ❌ Bad: No Context
```
User: "Make error handling better"
```
**Problem**: Agent doesn't know which file, what errors, or current approach.

### ✅ Good: Specific Context
```
User: "My error codes are defined in @errors.ts. Add proper error 
handling using these codes to @sql.ts where I'm making database queries."
```
**Why Better**: 
- References specific files
- Clear what needs to be done
- Points to existing patterns

### 🎯 In Our System:
```typescript
// Use Smart Extract to gather context
POST /api/smart-extract
{
  "text": "User query + relevant file contents",
  "options": { "autoDetect": true }
}

// Agent Builder automatically:
// 1. Extracts entities (files, errors, patterns)
// 2. Routes to appropriate tools
// 3. Assembles focused context
```

---

## 2️⃣ **Set Explicit Goals and Requirements**

### ❌ Vague Request
```
User: "Create a food tracker"
```
**Problem**: Too many unknowns - what features? what UI? what data?

### ✅ Detailed Request
```
User: "Create a food tracker that:
- Shows calorie breakdown per day
- Divides calories by nutrients (protein, carbs, fats)
- Allows entering food items manually
- Displays daily overview + weekly trends
- Uses a simple card-based UI"
```
**Why Better**: Clear requirements, specific features, measurable goals.

### 🎯 In Our System:
```typescript
// Agent Builder processes detailed requests
POST /api/agent-builder/create
{
  "userQuery": "Create a food tracker that shows calorie breakdown 
                per day divided by nutrients. Include daily overview 
                and weekly trends when I enter food items.",
  "industry": "health_wellness"
}

// AI automatically:
// 1. Detects requirements (calorie tracking, nutrient breakdown, trends)
// 2. Selects appropriate tools (data storage, analytics, visualization)
// 3. Structures workflow with clear goals
```

---

## 3️⃣ **Continually Refine Based on Results**

### ❌ Give Up After First Try
```
First attempt fails → User gives up
```

### ✅ Iterate and Improve
```
First attempt: "Create async file processor"
Result: Blocks main thread

Refinement: "The previous approach didn't consider IO-heavy operations 
that block the main thread. Run file processing in a separate worker 
thread to avoid blocking the event loop, not just using async lib."
```
**Why Better**: Learns from failures, adds missing constraints.

### 🎯 In Our System:
```typescript
// Use conversation history for refinement
POST /api/context/enrich
{
  "query": "Improve file processing - previous attempt blocked main thread",
  "conversationHistory": [
    "Create async file processor",
    "Result: Still blocking main thread"
  ],
  "includeSources": ["memory_network", "conversation_history"]
}

// Context engine:
// 1. Remembers previous attempts
// 2. Identifies what failed
// 3. Suggests improvements based on history
```

---

## 4️⃣ **Structure Context with Markup**

### ❌ Unstructured Context Dump
```
The user wants to track food items the system should show calories 
breakdown there are nutrients like protein carbs fats also weekly trends...
```
**Problem**: Hard to parse, no clear sections.

### ✅ Structured with Markdown/XML
```markdown
# User Request
Create a food tracking application

## Requirements
- Daily calorie tracking
- Nutrient breakdown (protein, carbs, fats)
- Manual food entry

## UI Preferences
- Card-based interface
- Mobile-responsive

## Data Requirements
- Store per-day entries
- Calculate weekly aggregates
```
**Why Better**: Clear sections, easy to parse, organized information.

### 🎯 In Our System:
```typescript
// Context Assembly returns structured format
POST /api/context/assemble
{
  "query": "Create food tracker",
  "structured": true
}

// Returns:
{
  "structured_context": `
    # User Query
    Create food tracker
    
    ## Detected Requirements
    - Feature: Daily calorie tracking
    - Feature: Nutrient breakdown
    - Data: Weekly aggregation
    
    ## Suggested Architecture
    - Backend: Node.js + PostgreSQL
    - Frontend: React with charts
    - API: RESTful endpoints for CRUD
  `
}
```

---

## 5️⃣ **Assign Agentic vs One-Shot Tasks**

### When to Use Agentic (Multi-Step)
```
✅ "Navigate codebase and find all API endpoints that handle user auth"
✅ "Refactor error handling across multiple files"
✅ "Add logging to all database operations"
```
**Why Agentic**: Requires exploring, multiple files, iterative work.

### When to Use One-Shot (Direct Answer)
```
✅ "What does this function do?" (provide function)
✅ "Explain this error message"
✅ "What's the complexity of this algorithm?"
```
**Why One-Shot**: Single answer, all context provided upfront.

### 🎯 In Our System:
```typescript
// Agentic Task (uses Workflow Builder)
POST /api/agent-builder/create
{
  "userQuery": "Find all API endpoints handling user auth and add 
                rate limiting to them",
  "mode": "agentic"  // Multi-step exploration
}

// Workflow created:
// 1. Web Search → Find auth patterns
// 2. Knowledge Graph → Extract API endpoints
// 3. Smart Extract → Identify auth operations
// 4. Code Generation → Add rate limiting
// 5. Validation → Check coverage

// One-Shot Task (uses direct API)
POST /api/answer
{
  "query": "What does the authenticateUser function do?",
  "documents": [/* function code */],
  "mode": "one-shot"
}
```

---

## 6️⃣ **Optimize for Cache Hits (Performance)**

### ❌ Constantly Changing Prompts
```
Attempt 1: "Fix auth error in login.ts with context ABC..."
Attempt 2: "Fix auth error in login.ts with context XYZ..."
Attempt 3: "Fix auth error in login.ts with context 123..."
```
**Problem**: Different context each time = cache miss = slow.

### ✅ Stable Prompt Structure
```
System Prompt (stays same):
"You are a code assistant. Use provided context to solve problems."

User Prompt (varies):
"Fix auth error in login.ts"

Context (appended):
[Relevant files and patterns from cache]
```
**Why Better**: System prompt cached, only user query changes.

### 🎯 In Our System:
```typescript
// Context engine uses stable structure
{
  "system_prompt": "You are an enterprise AI assistant...",  // CACHED
  "context_sources": [
    "memory_network",      // CACHED if same user
    "conversation_history" // CACHED for session
  ],
  "user_query": "Fix auth error"  // Only this changes
}

// Our optimization:
// 1. System prompts are standardized (cache hits)
// 2. Context sources are persistent per user (cache hits)
// 3. Only user query varies (minimal cache misses)
```

---

## 7️⃣ **Give Detailed System Prompts**

### ❌ Vague System Prompt
```
"You are a helpful assistant."
```

### ✅ Detailed System Prompt
```
"You are an enterprise AI assistant specializing in code generation 
and refactoring.

## Your Capabilities
- Analyze codebases and identify patterns
- Generate production-ready code following best practices
- Refactor existing code for better performance
- Add comprehensive error handling

## Guidelines
- Always check for edge cases
- Follow the project's existing code style
- Add comments for complex logic
- Prioritize readability over cleverness

## When Uncertain
- Ask for clarification
- Provide multiple options
- Explain trade-offs"
```

### 🎯 In Our System:
```typescript
// Agent Builder creates detailed system prompts
const systemPrompt = `
You are a specialized ${industry} AI agent.

# Your Role
${agentRole}

# Available Tools
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

# Workflow Process
${workflow.steps.map((s, i) => `${i+1}. ${s.description}`).join('\n')}

# Success Criteria
${successCriteria.join('\n')}

# Error Handling
- If data is missing: ${errorStrategies.missingData}
- If API fails: ${errorStrategies.apiFailure}
- If ambiguous: ${errorStrategies.ambiguity}

# Best Practices
${bestPractices.join('\n')}
`;
```

---

## 8️⃣ **Use Native Tool Calling**

### ❌ XML-Based Tool Calls (Slow)
```xml
<tool_call>
  <name>search_api</name>
  <parameters>
    <query>user authentication</query>
  </parameters>
</tool_call>
```

### ✅ Native Function Calling (Fast)
```json
{
  "tool_calls": [
    {
      "function": "search_api",
      "arguments": {
        "query": "user authentication"
      }
    }
  ]
}
```

### 🎯 In Our System:
```typescript
// All our APIs use native JSON function calling
POST /api/agent/chat
{
  "messages": [...],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "extract_entities",
        "description": "Extract entities from text",
        "parameters": {
          "type": "object",
          "properties": {
            "text": { "type": "string" }
          }
        }
      }
    }
  ]
}

// Fast, native, optimized
```

---

## 📊 **Context Engineering Workflow**

### Our 5-Step Process:

```
1. USER INPUT
   ↓
   "Create a dashboard for sales analytics"

2. CONTEXT EXTRACTION (Smart Extract)
   ↓
   Entities: [dashboard, sales, analytics]
   Complexity: 0.45 (medium)
   → Routes to: Knowledge Graph

3. CONTEXT ASSEMBLY (Context Engine)
   ↓
   Sources:
   - Memory Network: Previous dashboards created
   - Conversation History: User preferences
   - Knowledge Graph: Sales + analytics patterns
   - User Preferences: Likes card layouts

4. STRUCTURED CONTEXT (Markdown)
   ↓
   # User Request
   Create sales analytics dashboard
   
   ## Known Preferences
   - Likes card-based layouts
   - Previously used Chart.js
   
   ## Available Data
   - Sales table in PostgreSQL
   - Real-time updates needed

5. AGENT EXECUTION (Workflow)
   ↓
   Workflow:
   1. Data Schema → Analyze sales table
   2. Dashboard Design → Card-based with Chart.js
   3. API Creation → RESTful endpoints
   4. Real-time Setup → WebSocket connections
```

---

## 🎯 **Best Practices Summary**

| Principle | What To Do | What To Avoid |
|-----------|-----------|---------------|
| **Context** | Provide specific files/data | Dump everything |
| **Goals** | Clear, measurable requirements | Vague requests |
| **Iteration** | Refine based on failures | Give up after one try |
| **Structure** | Use Markdown/sections | Unstructured text |
| **Task Type** | Agentic for multi-step, one-shot for Q&A | Wrong mode for task |
| **Performance** | Stable prompt structure | Constantly changing prompts |
| **System Prompt** | Detailed capabilities/guidelines | Generic "helpful assistant" |
| **Tool Calls** | Native JSON function calls | XML-based calls |

---

## 💡 **Real Examples from Our System**

### Example 1: Good Context Engineering
```typescript
// User request
"Using @errors.ts error definitions, add comprehensive error handling 
 to @api/users.ts where we make database calls. Follow the pattern 
 from @api/products.ts which has good error handling."

// What our system does:
1. Smart Extract:
   - Entities: errors.ts, api/users.ts, api/products.ts
   - Pattern: error handling, database calls
   
2. Context Assembly:
   - Read errors.ts → Get error code definitions
   - Read api/products.ts → Extract error handling pattern
   - Read api/users.ts → Identify database calls
   
3. Structured Context:
   ```markdown
   # Task
   Add error handling to user API
   
   ## Error Codes (from errors.ts)
   - DB_CONNECTION_ERROR: 500
   - INVALID_USER_ID: 400
   - USER_NOT_FOUND: 404
   
   ## Pattern (from api/products.ts)
   try {
     const result = await db.query(...)
   } catch (error) {
     if (error.code === 'CONNECTION_ERROR') 
       throw new DbError(DB_CONNECTION_ERROR)
   }
   
   ## Target (api/users.ts)
   [Current code without error handling]
   ```

4. Agent applies pattern with proper error codes
```

### Example 2: Iterative Refinement
```typescript
// First attempt
User: "Create API rate limiter"

Agent: *Creates simple in-memory rate limiter*

// Refinement
User: "The previous in-memory approach won't work in production 
       with multiple server instances. Use Redis for distributed 
       rate limiting instead."

// Our system:
1. Context Engine adds:
   - Previous attempt (in-memory)
   - Failure reason (multi-instance)
   - New requirement (Redis, distributed)
   
2. Memory Network remembers:
   - User has multi-instance setup
   - Prefers Redis for shared state
   
3. Agent creates Redis-based rate limiter with:
   - Distributed state
   - Atomic operations
   - Fallback strategy
```

---

## 🚀 **How to Apply This**

### In Agent Builder:
```typescript
// Instead of:
"Create a dashboard"

// Use:
"Create a sales dashboard that:
- Shows revenue trends (line chart)
- Displays top products (bar chart)
- Uses real-time WebSocket updates
- Follows our @components/Card.tsx layout pattern
- Fetches data from @api/sales.ts endpoint"
```

### In Workflow Builder:
```typescript
// Instead of:
Add nodes randomly

// Use:
1. Define clear goal: "Extract invoice data"
2. Specify context sources: "Invoice format from @schemas/invoice.ts"
3. Structure workflow: 
   - Smart Extract (complexity detection)
   - Knowledge Graph (entity extraction)
   - Validation (check required fields)
   - Output (structured JSON)
```

### In Smart Extract:
```typescript
// Provide structured input
POST /api/smart-extract
{
  "text": `
# Invoice Document

## Header
Invoice #: INV-2024-001
Date: 2024-01-15

## Line Items
1. Product A: $100
2. Product B: $200

## Total
$300
  `,
  "schema": {
    "invoice_number": "string",
    "date": "date",
    "line_items": "array",
    "total": "number"
  }
}

// Much better than:
"text": "Invoice INV-2024-001 from Jan 15 with items A $100 B $200 total $300"
```

---

## ✅ **Checklist for Good Context Engineering**

Before creating an agent or workflow:

- [ ] Is my request specific and detailed?
- [ ] Have I referenced relevant files/patterns?
- [ ] Have I structured my input (Markdown/sections)?
- [ ] Have I defined clear success criteria?
- [ ] Am I using the right mode (agentic vs one-shot)?
- [ ] Have I included enough context but not too much?
- [ ] Can I iterate if the first attempt isn't perfect?
- [ ] Am I using native tool calling (not XML)?

---

## 🎉 **Summary**

Our system applies **Grok-style context engineering** through:

1. **Smart Extract** → Analyzes complexity, routes intelligently
2. **Knowledge Graph** → Provides focused, relevant context
3. **Context Assembly** → Structures information clearly
4. **Agent Builder** → Creates detailed system prompts
5. **Workflow Builder** → Enables agentic multi-step tasks
6. **Memory Network** → Learns from iterations

**Follow these principles to get 10x better results!** 🚀

---

*These principles are adapted from Grok Code Fast 1's prompt engineering guide and optimized for our enterprise AI context engineering system.*

