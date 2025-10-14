# Tool Calling Guide - Connecting AI to Real-World Data

## 🎯 Overview

Tools bridge the gap between AI's static knowledge and the dynamic real world. They let your AI call functions to fetch data, perform calculations, or interact with external APIs.

**The Problem**: LLMs have:
- ❌ **Knowledge cutoff** - No real-time info (weather, news, prices)
- ❌ **No action capability** - Cannot directly interact with systems

**The Solution**: Tool calling gives models the ability to execute code and access live data!

---

## 🔄 Tool Calling Flow

```
1. User asks: "What's the weather in San Francisco?"
   ↓
2. LLM analyzes query → Needs external data
   ↓
3. LLM generates tool call: getWeather({ city: "San Francisco" })
   ↓
4. SDK executes tool → Calls weather API
   ↓
5. Tool returns: { temperature: 19, condition: "sunny" }
   ↓
6. LLM with context → "It's 19°C and sunny in San Francisco!"
```

---

## 🛠️ Implementing Tools

### **Step 1: Define Tool with `tool()` Helper**

```typescript
// app/api/chat/tools.ts

import { tool } from 'ai';
import { z } from 'zod';

export const getWeather = tool({
  // Clear description for AI to understand when to use
  description: 'Get the current weather conditions and temperature for a specific city. Use when users ask about weather, temperature, or conditions.',
  
  // Input schema defines required parameters
  inputSchema: z.object({
    city: z.string().describe('The city name for weather lookup')
  }),
  
  // Execute function runs when AI calls the tool
  execute: async ({ city }) => {
    // City coordinates mapping
    const cityCoordinates: Record<string, { lat: number; lon: number }> = {
      'san francisco': { lat: 37.7749, lon: -122.4194 },
      'new york': { lat: 40.7128, lon: -74.0060 },
      'london': { lat: 51.5074, lon: -0.1278 },
      'tokyo': { lat: 35.6762, lon: 139.6503 },
      'paris': { lat: 48.8566, lon: 2.3522 }
    };
    
    const coords = cityCoordinates[city.toLowerCase()] || 
                   cityCoordinates['new york']; // Fallback
    
    // Call Open-Meteo weather API (free, no key needed)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${coords.lat}&longitude=${coords.lon}&` +
      `current=temperature_2m,weathercode&timezone=auto`
    );
    
    const weatherData = await response.json();
    
    return {
      city,
      temperature: weatherData.current.temperature_2m,
      weatherCode: weatherData.current.weathercode,
      conditions: getWeatherDescription(weatherData.current.weathercode)
    };
  }
});

function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    61: 'Light rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    80: 'Rain showers'
  };
  return descriptions[code] || 'Unknown';
}
```

### **Step 2: Register Tool in API Route**

```typescript
// app/api/chat/route.ts

import { streamText, convertToModelMessages } from 'ai';
import { getWeather } from './tools';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const result = streamText({
    model: 'openai/gpt-4.1',
    system: 'You are a helpful assistant.',
    messages: convertToModelMessages(messages),
    tools: { getWeather } // Register the tool
  });
  
  return result.toUIMessageStreamResponse();
}
```

### **Step 3: Handle Tool Calls in UI**

```typescript
// app/(5-chatbot)/chat/page.tsx

import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";

// In message rendering:
{message.role === "assistant" && message.parts?.map((part, i) => {
  switch (part.type) {
    case "text":
      return (
        <Response key={`${message.id}-${i}`}>
          {part.text}
        </Response>
      );
      
    case "tool-getWeather":
      return (
        <Tool key={part.toolCallId || `${message.id}-${i}`}>
          <ToolHeader type={part.type} state={part.state} />
          <ToolContent>
            <ToolInput input={part.input} />
            <ToolOutput
              output={JSON.stringify(part.output, null, 2)}
              errorText={part.errorText}
            />
          </ToolContent>
        </Tool>
      );
      
    default:
      return null;
  }
})}
```

---

## 🚀 Tools in Our System

### **Our System Already Has 20+ Tools!**

From `frontend/app/api/agent-builder/create/route.ts`:

```typescript
const TOOL_LIBRARY = {
  // Data Sources
  web_search: {
    name: 'Web Search',
    description: 'Real-time web research using Perplexity AI',
    apiEndpoint: '/api/perplexity/chat'
  },
  
  memory_search: {
    name: 'Memory Search',
    description: 'Search indexed memories and conversation history',
    apiEndpoint: '/api/memories/search'
  },
  
  knowledge_graph: {
    name: 'Knowledge Graph',
    description: 'Entity and relationship extraction',
    apiEndpoint: '/api/entities/extract'
  },
  
  instant_answer: {
    name: 'Instant Answer',
    description: 'Sub-100ms grounded answers from knowledge graph',
    apiEndpoint: '/api/instant-answer'
  },
  
  // Processing Tools
  smart_extract: {
    name: 'Smart Extract',
    description: 'Intelligent hybrid extraction (pattern + AI)',
    apiEndpoint: '/api/smart-extract'
  },
  
  gepa_optimize: {
    name: 'GEPA Optimizer',
    description: 'Evolutionary prompt optimization',
    apiEndpoint: '/api/gepa/optimize'
  },
  
  context_assembly: {
    name: 'Context Assembly',
    description: 'Multi-source context enrichment',
    apiEndpoint: '/api/context/assemble'
  },
  
  // Specialized Agents (DSPy)
  dspy_market_analyst: {
    name: 'Market Analyst',
    description: 'Self-optimizing market intelligence with Ax framework',
    capabilities: ['Analyze market trends', 'Competitive analysis', 'SWOT analysis']
  },
  
  dspy_financial: {
    name: 'Financial Analyst',
    description: 'Financial modeling and projections',
    capabilities: ['ROI calculation', 'NPV/IRR analysis', 'Cash flow analysis']
  },
  
  dspy_investment_report: {
    name: 'Report Generator',
    description: 'Comprehensive report generation',
    capabilities: ['Multi-source synthesis', 'Recommendations', 'Executive summaries']
  },
  
  // And 10+ more tools!
};
```

### **Tool Calling in Agent Builder**

Our agent builder **already uses tool calling** to generate workflows:

```typescript
// User describes what they want
User: "Create a customer support workflow"

// LLM analyzes and calls tools
LLM internally: {
  "selectedTools": [
    { "toolKey": "web_search", "role": "Research best practices" },
    { "toolKey": "custom_agent", "role": "Classify tickets" },
    { "toolKey": "answer_generator", "role": "Generate responses" }
  ]
}

// System generates workflow with selected tools
Workflow: Web Search → Custom Agent → Answer Generator
```

---

## 📊 Advanced Tool Patterns

### **1. Multiple Tools**

```typescript
// app/api/chat/tools.ts

export const getWeather = tool({
  description: 'Get current weather for a city',
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => {
    // Weather API call
  }
});

export const getStockPrice = tool({
  description: 'Get current stock price for a ticker symbol',
  inputSchema: z.object({ 
    symbol: z.string().describe('Stock ticker symbol (e.g., AAPL, GOOGL)')
  }),
  execute: async ({ symbol }) => {
    // Stock API call
  }
});

export const calculateROI = tool({
  description: 'Calculate return on investment',
  inputSchema: z.object({
    initial: z.number().describe('Initial investment amount'),
    final: z.number().describe('Final value'),
    years: z.number().describe('Investment period in years')
  }),
  execute: async ({ initial, final, years }) => {
    const roi = ((final - initial) / initial) * 100;
    const annualizedROI = (Math.pow(final / initial, 1 / years) - 1) * 100;
    
    return {
      roi,
      annualizedROI,
      totalGain: final - initial,
      percentageGain: roi
    };
  }
});

// Register all tools
const result = streamText({
  model: 'gpt-4',
  tools: { 
    getWeather, 
    getStockPrice, 
    calculateROI 
  },
  messages
});
```

### **2. Tools with Complex Schemas**

```typescript
export const searchDatabase = tool({
  description: 'Search customer database with filters and sorting',
  
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    
    filters: z.object({
      status: z.enum(['active', 'inactive', 'pending']).optional(),
      country: z.string().optional(),
      subscription: z.enum(['free', 'pro', 'enterprise']).optional(),
      createdAfter: z.string().optional().describe('ISO date string')
    }).optional(),
    
    sort: z.object({
      field: z.enum(['name', 'createdAt', 'revenue']),
      direction: z.enum(['asc', 'desc'])
    }).optional(),
    
    limit: z.number().min(1).max(100).default(10)
  }),
  
  execute: async ({ query, filters, sort, limit }) => {
    // Complex database query
    const results = await db.customers.search({
      query,
      where: filters,
      orderBy: sort,
      take: limit
    });
    
    return {
      results,
      total: results.length,
      query,
      filters: filters || {}
    };
  }
});
```

### **3. Error Handling in Tools**

```typescript
export const getWeather = tool({
  description: 'Get weather for a city',
  inputSchema: z.object({ city: z.string() }),
  
  execute: async ({ city }) => {
    try {
      // Validate city name
      if (!city || city.trim().length === 0) {
        return {
          error: 'City name is required',
          city: null,
          temperature: null
        };
      }
      
      // Try to get coordinates
      const coords = await geocodeCity(city);
      
      if (!coords) {
        return {
          error: `Could not find city: ${city}. Please check spelling.`,
          city,
          temperature: null,
          suggestion: 'Try a major city name or include country (e.g., "Paris, France")'
        };
      }
      
      // Call weather API with retry
      let retries = 3;
      while (retries > 0) {
        try {
          const response = await fetch(weatherApiUrl, { timeout: 5000 });
          
          if (!response.ok) {
            throw new Error(`Weather API returned ${response.status}`);
          }
          
          const data = await response.json();
          
          return {
            city,
            temperature: data.current.temperature_2m,
            conditions: getWeatherDescription(data.current.weathercode),
            error: null
          };
          
        } catch (apiError) {
          retries--;
          if (retries === 0) throw apiError;
          await sleep(1000); // Wait before retry
        }
      }
      
    } catch (error: any) {
      console.error('Weather tool error:', error);
      
      return {
        error: 'Failed to fetch weather data. Please try again.',
        city,
        temperature: null,
        details: error.message
      };
    }
  }
});
```

---

## 🎨 Tool UI Components

### **Tool Display with Elements**

```typescript
// Beautiful tool card rendering

{part.type === "tool-getWeather" && (
  <Tool key={part.toolCallId}>
    <ToolHeader type={part.type} state={part.state} />
    <ToolContent>
      <ToolInput input={part.input} />
      <ToolOutput
        output={JSON.stringify(part.output, null, 2)}
        errorText={part.errorText}
      />
    </ToolContent>
  </Tool>
)}
```

**Tool States**:
- `pending` - Tool call initiated
- `loading` - Tool executing
- `success` - Tool completed successfully
- `error` - Tool failed

---

## 🚀 Tools Already in Our System

### **Our Workflow System IS Tool Calling!**

Every node in our workflow builder is essentially a tool:

```typescript
// From frontend/app/workflow/page.tsx

const nodeTypes = {
  'web_search': WebSearchNode,      // Tool: Search the web
  'memory_search': MemorySearchNode, // Tool: Search memories
  'llm': LLMNode,                    // Tool: Call language model
  'dspy_market_analyst': DSPyNode,   // Tool: Market analysis
  'knowledge_graph': KnowledgeGraphNode, // Tool: Entity extraction
  'answer_generator': AnswerNode     // Tool: Generate final answer
};

// Workflow execution is multi-step tool calling
async function executeWorkflow(workflow, input) {
  let results = [];
  
  for (const node of workflow.nodes) {
    // Each node is a tool call
    const toolResult = await executeNode(node, {
      input,
      previousResults: results
    });
    
    results.push(toolResult);
  }
  
  return results;
}
```

### **Agent Builder Uses Tool Selection**

```typescript
// From frontend/app/api/agent-builder/create/route.ts

// LLM selects tools from library
const llmResponse = {
  "selectedTools": [
    {
      "toolKey": "web_search",
      "role": "Market Researcher",
      "purpose": "Gather current market data"
    },
    {
      "toolKey": "dspy_market_analyst",
      "role": "Market Analyst",
      "purpose": "Analyze competitive landscape"
    },
    {
      "toolKey": "answer_generator",
      "role": "Report Writer",
      "purpose": "Create final report"
    }
  ]
};

// These become workflow nodes (visual tools)
const workflow = {
  nodes: llmResponse.selectedTools.map(tool => ({
    id: generateId(),
    type: tool.toolKey,
    role: tool.role,
    config: TOOL_LIBRARY[tool.toolKey]
  }))
};
```

---

## 📐 Tool Design Best Practices

### **1. Clear, Specific Descriptions**

**Bad**:
```typescript
description: 'Weather tool'
```

**Good**:
```typescript
description: 'Get current weather conditions and temperature for a specific city. Use when users ask about weather, temperature, conditions, or forecast. Returns temperature in Celsius and weather description.'
```

### **2. Well-Defined Schemas**

**Bad**:
```typescript
inputSchema: z.object({
  location: z.string()
})
```

**Good**:
```typescript
inputSchema: z.object({
  city: z.string().describe('City name (e.g., "San Francisco", "London")'),
  country: z.string().optional().describe('Country code for disambiguation (e.g., "US", "UK")'),
  units: z.enum(['celsius', 'fahrenheit']).default('celsius').describe('Temperature unit preference')
})
```

### **3. Robust Error Handling**

```typescript
execute: async ({ city }) => {
  try {
    const result = await fetchWeather(city);
    
    return {
      success: true,
      data: result,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.message,
      suggestion: 'Try a different city or check spelling'
    };
  }
}
```

### **4. Meaningful Return Values**

```typescript
// Return structured, useful data
return {
  city: 'San Francisco',
  temperature: 19,
  conditions: 'Partly cloudy',
  humidity: 65,
  windSpeed: 12,
  feelsLike: 18,
  lastUpdated: new Date().toISOString(),
  source: 'Open-Meteo API'
};

// Not just:
return { temp: 19 }
```

---

## 🔧 Tool Implementation in Our System

### **Example 1: Web Search Tool**

Already implemented in `frontend/app/api/perplexity/chat/route.ts`:

```typescript
// This is essentially a "webSearch" tool
export async function POST(req: NextRequest) {
  const { messages, searchQuery } = await req.json();
  
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: messages
    }),
  });
  
  const data = await response.json();
  
  return NextResponse.json({
    content: data.choices[0].message.content,
    sources: data.citations || [],
    model: data.model
  });
}

// Used as a tool in workflows:
const webSearchTool = {
  name: 'web_search',
  execute: async (query) => {
    return await fetch('/api/perplexity/chat', {
      method: 'POST',
      body: JSON.stringify({ searchQuery: query })
    }).then(r => r.json());
  }
};
```

### **Example 2: Entity Extraction Tool**

Already implemented in `frontend/app/api/entities/extract/route.ts`:

```typescript
// Knowledge graph as a tool
const extractEntitiesTool = tool({
  description: 'Extract entities (people, organizations, locations, dates, projects, technologies, concepts) and their relationships from text',
  
  inputSchema: z.object({
    text: z.string().describe('Text to analyze for entities'),
    entityTypes: z.array(z.enum([
      'PERSON', 'ORGANIZATION', 'LOCATION', 'DATE', 
      'PROJECT', 'TECHNOLOGY', 'CONCEPT'
    ])).optional().describe('Specific entity types to extract')
  }),
  
  execute: async ({ text, entityTypes }) => {
    const entities = extractEntities(text, entityTypes);
    const relationships = extractRelationships(entities);
    
    return {
      entities: entities.map(e => ({
        type: e.type,
        value: e.value,
        confidence: e.confidence
      })),
      relationships: relationships.map(r => ({
        from: r.from,
        type: r.type,
        to: r.to
      })),
      graph: buildGraph(entities, relationships)
    };
  }
});
```

### **Example 3: Calculation Tools**

```typescript
export const calculateFinancials = tool({
  description: 'Calculate financial metrics (ROI, NPV, IRR, payback period)',
  
  inputSchema: z.object({
    metric: z.enum(['roi', 'npv', 'irr', 'payback']).describe('Financial metric to calculate'),
    initialInvestment: z.number().describe('Initial investment amount'),
    cashFlows: z.array(z.number()).describe('Annual cash flows'),
    discountRate: z.number().optional().default(0.1).describe('Discount rate for NPV (default 10%)')
  }),
  
  execute: async ({ metric, initialInvestment, cashFlows, discountRate }) => {
    switch (metric) {
      case 'roi':
        const totalReturn = cashFlows.reduce((sum, cf) => sum + cf, 0);
        const roi = ((totalReturn - initialInvestment) / initialInvestment) * 100;
        return { roi, totalReturn, initialInvestment };
        
      case 'npv':
        const npv = cashFlows.reduce((sum, cf, year) => {
          return sum + cf / Math.pow(1 + discountRate, year + 1);
        }, -initialInvestment);
        return { npv, discountRate };
        
      case 'irr':
        // Newton-Raphson method for IRR calculation
        const irr = calculateIRR(initialInvestment, cashFlows);
        return { irr };
        
      case 'payback':
        let cumulative = -initialInvestment;
        let paybackPeriod = 0;
        
        for (let i = 0; i < cashFlows.length; i++) {
          cumulative += cashFlows[i];
          if (cumulative >= 0) {
            paybackPeriod = i + 1;
            break;
          }
        }
        
        return { paybackPeriod, years: paybackPeriod };
    }
  }
});
```

---

## 🔒 Security Considerations

### **1. Input Validation**

```typescript
inputSchema: z.object({
  city: z.string()
    .min(2).max(100)
    .regex(/^[a-zA-Z\s\-,]+$/)
    .describe('City name (letters, spaces, hyphens only)')
})
```

### **2. Rate Limiting**

```typescript
const toolCallCounts = new Map<string, number>();

execute: async ({ city }) => {
  const userId = getCurrentUserId();
  const count = toolCallCounts.get(userId) || 0;
  
  if (count > 100) {
    return {
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: 3600
    };
  }
  
  toolCallCounts.set(userId, count + 1);
  
  // Execute tool...
}
```

### **3. Authentication & Authorization**

```typescript
execute: async ({ customerId }) => {
  const currentUser = await getCurrentUser();
  
  // Check permissions
  if (!currentUser.hasRole('support') && customerId !== currentUser.id) {
    return {
      error: 'Unauthorized: Cannot access other customer data'
    };
  }
  
  // Execute tool...
}
```

---

## ✅ Tool Implementation Checklist

- [ ] Clear, specific description
- [ ] Well-defined input schema with `.describe()`
- [ ] Robust error handling
- [ ] Meaningful return values
- [ ] Input validation
- [ ] Rate limiting (if needed)
- [ ] Authentication checks (if needed)
- [ ] Timeout handling
- [ ] Retry logic for network calls
- [ ] Logging for debugging
- [ ] Unit tests for execute function

---

## 🎯 Next: Multi-Step Tool Calling

Our **workflow system** already does this:

```typescript
// Multi-step tool calling in workflows
Step 1: Call web_search → Get market data
Step 2: Call dspy_market_analyst → Analyze data
Step 3: Call dspy_investment_report → Generate report
Step 4: Call answer_generator → Format final answer

// Each step uses previous results
executeWorkflow(nodes, edges, initialInput)
```

---

**Tool calling transforms AI from knowledge base to active agent!** 🚀

