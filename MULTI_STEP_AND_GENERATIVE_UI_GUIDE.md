# Multi-Step Conversations & Generative UI

## 🎯 Overview

Multi-step conversations allow AI to chain multiple tool calls together and synthesize results. Generative UI renders custom React components based on tool data instead of debugging displays.

**The Problem**: Without multi-step, AI must choose ONE action:
- ❌ Either call tools
- ❌ Or generate text response
- ❌ Not both!

**The Solution**: Enable multi-step with `stopWhen` configuration!

---

## 🔄 Multi-Step Conversations

### **Why Multi-Step is Required**

**Without Multi-Step**:
```
User: "What's the weather in SF and NYC?"
↓
AI: Calls getWeather("San Francisco") and getWeather("New York")
↓
Result: Raw tool data displayed
❌ No synthesis or comparison
```

**With Multi-Step**:
```
User: "What's the weather in SF and NYC?"
↓
Step 1: AI calls getWeather("SF") and getWeather("NYC") in parallel
↓
Step 2: AI processes both results
↓
Step 3: AI generates: "San Francisco is 19°C and sunny, while New York is 12°C and cloudy. SF is warmer by 7 degrees."
✅ Natural language synthesis!
```

---

### **Implementation**

#### **Enable Multi-Step in API Route**

```typescript
// app/api/chat/route.ts

import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { getWeather } from './tools';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const result = streamText({
    model: 'openai/gpt-4.1',
    
    system: `You are a helpful assistant. When using tools, only mention capabilities you actually have. 
    
The weather tool provides:
✅ Current temperature
✅ Current conditions
✅ Humidity levels

The weather tool does NOT provide:
❌ Weather forecasts
❌ Historical data
❌ Hourly predictions

Be honest about these limitations.`,
    
    messages: convertToModelMessages(messages),
    
    tools: { getWeather },
    
    stopWhen: stepCountIs(5) // Enable up to 5 steps
  });
  
  return result.toUIMessageStreamResponse();
}
```

#### **Understanding Steps**

```
Step 1: Initial tool call(s)
  ↓
Step 2: Process results, call more tools if needed
  ↓
Step 3: Further processing or additional tool calls
  ↓
Step 4: Generate text response with all data
  ↓
Step 5: Buffer for edge cases
```

**Step Count Guidelines**:
- `stepCountIs(2)` - Simple tool + response
- `stepCountIs(5)` - Most use cases (default)
- `stepCountIs(10)` - Complex multi-tool scenarios

**Cost Consideration**: Each step uses tokens, balance capability with cost.

---

## 🎨 Generative UI

### **What is Generative UI?**

Instead of showing debug tool displays, render **custom React components** based on tool data.

**Traditional Approach** (Debug UI):
```typescript
<Tool>
  <ToolHeader type="tool-getWeather" state="success" />
  <ToolContent>
    <ToolInput input={{ city: "Tokyo" }} />
    <ToolOutput output='{"temperature": 23, "conditions": "sunny"}' />
  </ToolContent>
</Tool>
```

**Generative UI Approach** (Custom Component):
```typescript
<Weather weatherData={{ 
  city: "Tokyo", 
  temperature: 23, 
  conditions: "sunny",
  humidity: 65 
}} />
```

---

### **Implementation**

#### **Step 1: Create Custom Component**

```typescript
// app/(5-chatbot)/chat/weather.tsx

import { Cloud, Sun, CloudRain, CloudSnow, CloudFog, CloudLightning } from "lucide-react";

export interface WeatherData {
  city: string;
  temperature: number;
  weatherCode: number;
  humidity?: number;
  conditions?: string;
}

function getWeatherIcon(weatherCode: number) {
  if (weatherCode === 0) return <Sun size={48} className="text-yellow-300" />;
  if (weatherCode === 1 || weatherCode === 2) return <Cloud size={48} className="text-gray-300" />;
  if (weatherCode === 3) return <CloudFog size={48} className="text-gray-400" />;
  if (weatherCode >= 51 && weatherCode <= 67) return <CloudRain size={48} className="text-blue-300" />;
  if (weatherCode >= 71 && weatherCode <= 77) return <CloudSnow size={48} className="text-blue-100" />;
  if (weatherCode >= 80 && weatherCode <= 99) return <CloudLightning size={48} className="text-yellow-400" />;
  return <Sun size={48} className="text-yellow-300" />;
}

function getWeatherCondition(weatherCode: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    51: 'Light drizzle',
    61: 'Light rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Light snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    95: 'Thunderstorm'
  };
  return conditions[weatherCode] || 'Unknown conditions';
}

export default function Weather({ weatherData }: { weatherData: WeatherData }) {
  const condition = weatherData.conditions || getWeatherCondition(weatherData.weatherCode);
  
  return (
    <div className="text-white p-6 rounded-2xl backdrop-blur-lg bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 shadow-lg max-w-sm">
      <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'monospace' }}>
        {weatherData.city}
      </h2>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-5xl font-light mb-1" style={{ fontFamily: 'monospace' }}>
            {weatherData.temperature}°C
          </p>
          <p className="text-lg opacity-90" style={{ fontFamily: 'monospace' }}>
            {condition}
          </p>
        </div>
        
        <div className="ml-6" aria-hidden="true">
          {getWeatherIcon(weatherData.weatherCode)}
        </div>
      </div>
      
      {weatherData.humidity && (
        <div className="mt-4 flex items-center">
          <CloudFog size={16} aria-hidden="true" />
          <span className="ml-2 text-sm" style={{ fontFamily: 'monospace' }}>
            Humidity: {weatherData.humidity}%
          </span>
        </div>
      )}
    </div>
  );
}
```

#### **Step 2: Conditional Rendering in Chat**

```typescript
// app/(5-chatbot)/chat/page.tsx

import Weather from "./weather";

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
      // Generative UI: Show custom Weather component for successful results
      if (part.state === "output-available" && part.output) {
        return (
          <Weather
            key={part.toolCallId || `${message.id}-${i}`}
            weatherData={part.output}
          />
        );
      }
      
      // Fallback: Show Tool component for loading/error states
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

## 🚀 Generative UI in Our System

### **Our Workflow System IS Generative UI!**

The visual workflow builder generates custom node components based on tool type:

```typescript
// From frontend/app/workflow/page.tsx

const nodeTypes = {
  customizable: ({ data }: any) => (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-4 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-black text-white rounded flex items-center justify-center text-xs font-bold">
          {data.icon || data.label[0]}
        </div>
        <h3 className="font-bold text-sm text-black" style={{ fontFamily: 'monospace' }}>
          {data.label || 'Node'}
        </h3>
      </div>
      
      {data.role && (
        <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'monospace' }}>
          {data.role}
        </p>
      )}
      
      {data.description && (
        <p className="text-xs text-gray-500" style={{ fontFamily: 'monospace' }}>
          {data.description}
        </p>
      )}
    </div>
  )
};

// Each tool type gets a custom visual representation
const webSearchNode = { icon: '🔍', label: 'Web Search', ... };
const llmNode = { icon: '🤖', label: 'LLM', ... };
const marketAnalystNode = { icon: '📊', label: 'Market Analyst', ... };
```

---

## 📊 Advanced Generative UI Patterns

### **1. Dynamic Component Selection**

```typescript
// Map tool types to custom components
const TOOL_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'tool-getWeather': Weather,
  'tool-getStockPrice': StockPriceCard,
  'tool-calculateROI': ROIDisplay,
  'tool-searchDatabase': DatabaseResults,
  'tool-generateChart': ChartVisualization
};

// Render appropriate component
{message.parts?.map((part, i) => {
  if (part.type === 'text') {
    return <Response key={i}>{part.text}</Response>;
  }
  
  // Get custom component for this tool
  const Component = TOOL_COMPONENTS[part.type];
  
  if (Component && part.state === 'output-available' && part.output) {
    return <Component key={i} data={part.output} />;
  }
  
  // Fallback to generic Tool component
  return <Tool key={i} {...part} />;
})}
```

### **2. Interactive Components**

```typescript
// Weather component with interactive features
export function InteractiveWeather({ weatherData }: { weatherData: WeatherData }) {
  const [unit, setUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  
  const displayTemp = unit === 'celsius' 
    ? weatherData.temperature 
    : (weatherData.temperature * 9/5) + 32;
  
  return (
    <div className="weather-card">
      <div className="flex justify-between items-center mb-4">
        <h2>{weatherData.city}</h2>
        
        {/* Interactive toggle */}
        <button
          onClick={() => setUnit(unit === 'celsius' ? 'fahrenheit' : 'celsius')}
          className="px-2 py-1 bg-white/20 rounded text-sm hover:bg-white/30"
        >
          °{unit === 'celsius' ? 'C' : 'F'}
        </button>
      </div>
      
      <p className="text-5xl">{displayTemp.toFixed(1)}°</p>
      <p>{weatherData.conditions}</p>
    </div>
  );
}
```

### **3. Animated Transitions**

```typescript
import { motion } from 'framer-motion';

export function AnimatedWeather({ weatherData }: { weatherData: WeatherData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="weather-card"
    >
      {/* Weather content */}
    </motion.div>
  );
}
```

---

## 🎯 Our System's Generative UI

### **Agent Builder Preview Panel**

Our agent builder already uses generative UI extensively:

```typescript
// From frontend/app/agent-builder/page.tsx

// When LLM generates workflow, we render custom UI
{recommendation && (
  <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg">
    {/* Workflow Metadata */}
    <div className="mb-4">
      <h3 className="text-lg font-bold text-black mb-2">
        {recommendation.name}
      </h3>
      <p className="text-sm text-gray-600">
        {recommendation.description}
      </p>
    </div>
    
    {/* Workflow Nodes (Generative UI based on tools selected) */}
    <div className="space-y-2 mb-4">
      <h4 className="text-sm font-medium text-black">Workflow Steps:</h4>
      {recommendation.nodes.map((node, index) => (
        <div key={node.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
          {/* Custom component per node type */}
          <div className="w-8 h-8 bg-black text-white rounded flex items-center justify-center">
            {node.icon || index + 1}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-black">{node.label}</p>
            <p className="text-xs text-gray-500">{node.role || node.description}</p>
          </div>
        </div>
      ))}
    </div>
    
    {/* Deployment Section (Interactive UI) */}
    <div className="grid grid-cols-3 gap-3">
      <button
        onClick={() => deployToWorkflow(recommendation)}
        className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
      >
        Deploy to Workflow Builder
      </button>
      {/* ... more interactive buttons */}
    </div>
  </div>
)}
```

This is **pure generative UI**:
- LLM generates workflow structure
- UI dynamically renders based on selected tools
- Each node type gets custom styling
- Interactive buttons for deployment

---

## 📊 Advanced Multi-Step Patterns

### **1. Sequential Tool Calls**

```typescript
// Tool 1 result feeds into Tool 2
const result = streamText({
  model: 'gpt-4',
  tools: {
    searchCompany,
    getFinancials,
    analyzeMetrics
  },
  stopWhen: stepCountIs(6)
});

// Example flow:
// Step 1: searchCompany("Apple") → { ticker: "AAPL", founded: 1976 }
// Step 2: getFinancials("AAPL") → { revenue: 394B, ... }
// Step 3: analyzeMetrics(financials) → { roi: 45%, growth: 12% }
// Step 4: Generate synthesis response
```

### **2. Parallel Tool Calls**

```typescript
// Multiple tools called simultaneously
User: "Compare weather in SF, NYC, and London"

// Step 1: AI calls all three in parallel
await Promise.all([
  getWeather("San Francisco"),
  getWeather("New York"),
  getWeather("London")
]);

// Step 2: AI synthesizes comparison
"San Francisco: 19°C sunny
New York: 12°C cloudy
London: 15°C rainy

Warmest: San Francisco
Coldest: New York"
```

### **3. Conditional Tool Calls**

```typescript
// AI decides which tool to call based on context
User: "I need financial analysis for a tech startup"

// Step 1: AI analyzes request type
// Step 2: Calls appropriate tool
if (industry === 'tech') {
  callTool('techStartupAnalyzer');
} else if (industry === 'retail') {
  callTool('retailAnalyzer');
}

// Step 3: Based on results, may call more tools
if (results.needsMarketData) {
  callTool('marketResearch');
}

// Step 4: Generate comprehensive response
```

---

## 🎨 Generative UI Component Library

### **Stock Price Card**

```typescript
// components/StockPriceCard.tsx

export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

export function StockPriceCard({ data }: { data: StockData }) {
  const isPositive = data.change >= 0;
  
  return (
    <div className="bg-gradient-to-br from-green-400 to-blue-500 text-white p-6 rounded-2xl max-w-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold" style={{ fontFamily: 'monospace' }}>
            {data.symbol}
          </h3>
          <p className="text-4xl font-light mt-2" style={{ fontFamily: 'monospace' }}>
            ${data.price.toFixed(2)}
          </p>
        </div>
        
        <div className={`px-3 py-1 rounded ${isPositive ? 'bg-green-600' : 'bg-red-600'}`}>
          <p className="text-sm font-medium" style={{ fontFamily: 'monospace' }}>
            {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
          </p>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="opacity-90">Change:</span>
          <span className="font-medium" style={{ fontFamily: 'monospace' }}>
            ${data.change.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-90">Volume:</span>
          <span className="font-medium" style={{ fontFamily: 'monospace' }}>
            {(data.volume / 1000000).toFixed(2)}M
          </span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-90">Market Cap:</span>
          <span className="font-medium" style={{ fontFamily: 'monospace' }}>
            ${(data.marketCap / 1000000000).toFixed(2)}B
          </span>
        </div>
      </div>
    </div>
  );
}
```

### **ROI Calculator Display**

```typescript
// components/ROIDisplay.tsx

export interface ROIData {
  roi: number;
  annualizedROI: number;
  totalGain: number;
  percentageGain: number;
  years: number;
  initialInvestment: number;
  finalValue: number;
}

export function ROIDisplay({ data }: { data: ROIData }) {
  const isProfit = data.roi > 0;
  
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 max-w-md">
      <h3 className="text-xl font-bold text-black mb-4" style={{ fontFamily: 'monospace' }}>
        Investment Analysis
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'monospace' }}>
            Total ROI
          </p>
          <p className={`text-3xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'monospace' }}>
            {data.roi.toFixed(2)}%
          </p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'monospace' }}>
            Annualized
          </p>
          <p className="text-3xl font-bold text-black" style={{ fontFamily: 'monospace' }}>
            {data.annualizedROI.toFixed(2)}%
          </p>
        </div>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span className="text-gray-600" style={{ fontFamily: 'monospace' }}>Initial Investment:</span>
          <span className="font-bold text-black" style={{ fontFamily: 'monospace' }}>
            ${data.initialInvestment.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span className="text-gray-600" style={{ fontFamily: 'monospace' }}>Final Value:</span>
          <span className="font-bold text-black" style={{ fontFamily: 'monospace' }}>
            ${data.finalValue.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-green-50 rounded">
          <span className="text-gray-600" style={{ fontFamily: 'monospace' }}>Total Gain:</span>
          <span className="font-bold text-green-600" style={{ fontFamily: 'monospace' }}>
            +${data.totalGain.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span className="text-gray-600" style={{ fontFamily: 'monospace' }}>Period:</span>
          <span className="font-bold text-black" style={{ fontFamily: 'monospace' }}>
            {data.years} years
          </span>
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Best Practices

### **1. Component Mapping**

```typescript
// Create a registry of components
const GENERATIVE_COMPONENTS = {
  weather: Weather,
  stock: StockPriceCard,
  roi: ROIDisplay,
  chart: ChartComponent,
  table: TableComponent
};

// Dynamic rendering
const Component = GENERATIVE_COMPONENTS[toolType];
return Component ? <Component data={toolOutput} /> : <ToolFallback />;
```

### **2. Graceful Degradation**

```typescript
// Always provide fallback
{part.state === 'output-available' && part.output ? (
  <CustomComponent data={part.output} />
) : (
  <Tool>
    <ToolHeader type={part.type} state={part.state} />
    <ToolContent>
      <ToolInput input={part.input} />
      <ToolOutput output={part.output} errorText={part.errorText} />
    </ToolContent>
  </Tool>
)}
```

### **3. Loading States**

```typescript
{part.state === 'loading' && (
  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
    <span className="text-sm text-gray-600" style={{ fontFamily: 'monospace' }}>
      Fetching weather data...
    </span>
  </div>
)}
```

---

## 🚀 Multi-Step Examples from Our System

### **Workflow Execution IS Multi-Step**

```typescript
// From frontend/app/api/workflow/execute/route.ts

export async function POST(req: NextRequest) {
  const { workflow, input } = await req.json();
  
  const results = [];
  
  // Multi-step execution
  for (const node of workflow.nodes) {
    console.log(`Step ${results.length + 1}: Executing ${node.type}`);
    
    const stepResult = await executeNode(node, {
      input,
      previousResults: results, // Each step uses previous results
      availableTools: TOOL_LIBRARY
    });
    
    results.push(stepResult);
    
    // Conditional execution based on results
    if (stepResult.error && node.errorHandler) {
      const errorNode = workflow.nodes.find(n => n.id === node.errorHandler);
      if (errorNode) {
        const errorResult = await executeNode(errorNode, { error: stepResult.error });
        results.push(errorResult);
      }
    }
  }
  
  return NextResponse.json({
    success: true,
    results,
    steps: results.length
  });
}
```

---

## 📈 Performance Considerations

### **Token Usage**

```typescript
// Each step uses tokens
// Step 1: Tool call → ~100 tokens
// Step 2: Tool result in context → ~200 tokens
// Step 3: Text generation → ~500 tokens
// Total: ~800 tokens

// Optimize by limiting steps
stopWhen: stepCountIs(3) // Instead of 10
```

### **Latency**

```typescript
// Fast model (gpt-4.1): ~2s per step
// Step 1: 2s (tool call)
// Step 2: 2s (process results)
// Total: ~4s

// Reasoning model (gpt-5-mini): ~12s per step
// Step 1: 12s (tool call with thinking)
// Step 2: 12s (synthesis with thinking)
// Total: ~24s

// Choose model based on UX requirements
```

---

## ✅ Key Takeaways

1. **Multi-Step** = AI can chain tool calls and synthesize
2. **stopWhen: stepCountIs(N)** enables multi-step
3. **Generative UI** = Custom React components for tool results
4. **Conditional Rendering** = Custom components for success, Tool component for loading/error
5. **Our System Already Does This** = Workflows are multi-step tool execution with visual UI

---

**Multi-step conversations + Generative UI = Intelligent, beautiful AI applications!** 🚀

