# 🚀 OpenAI Setup Guide

## Why OpenAI Instead of Free Models?

### ✅ **Advantages of Using OpenAI:**

1. **DSPy Support** - Full compatibility with DSPy automatic prompt optimization
2. **Ax LLM Support** - Native support for Ax framework
3. **GEPA Support** - Works with GEPA optimization
4. **Higher Quality** - Much better results than free models
5. **Reliability** - Stable, production-ready API
6. **Affordable** - GPT-4o-mini is very cheap ($0.15/1M input tokens)

### 📊 **Cost Comparison:**

| Model | Input Cost | Output Cost | Quality |
|-------|-----------|-------------|---------|
| GPT-4o-mini | $0.15/1M tokens | $0.60/1M tokens | ⭐⭐⭐⭐⭐ |
| GPT-4o | $2.50/1M tokens | $10.00/1M tokens | ⭐⭐⭐⭐⭐ |
| Free OpenRouter | $0.00 | $0.00 | ⭐⭐⭐ |

**Typical Workflow Cost**: $0.001 - $0.01 per execution (very affordable!)

---

## 🔑 Setup Instructions

### 1. Get OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### 2. Add to `.env.local`

```bash
# OpenAI API Key (for DSPy, Ax LLM, GEPA)
OPENAI_API_KEY=sk-your-key-here

# Perplexity API Key (for web search)
PERPLEXITY_API_KEY=pplx-your-key-here

# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Keep OpenRouter for fallback
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 3. Restart Development Server

```bash
cd frontend
npm run dev
```

---

## 🎯 What This Enables

### **1. DSPy Automatic Optimization**
```typescript
import { MarketResearchAnalyzer } from '@/lib/dspy-workflows';

const analyzer = new MarketResearchAnalyzer();
const result = await analyzer.forward({
  marketData: '...',
  industry: 'Real Estate'
});
// DSPy automatically optimizes prompts using OpenAI
```

### **2. Ax LLM Framework**
```typescript
// Ax automatically routes to best model
const axAI = new AxAI({
  name: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  config: { model: 'gpt-4o-mini' }
});
```

### **3. GEPA Optimization**
- Automatic prompt evolution
- Reflection-based optimization
- Multi-generation improvement
- Metric-driven refinement

### **4. High-Quality Workflow Results**
- Better market analysis
- More accurate investment reports
- Professional-grade outputs
- Consistent quality

---

## 📊 Model Selection Guide

### **GPT-4o-mini** (Recommended Default)
- **Use for**: Most tasks, general analysis, reports
- **Cost**: Very low ($0.15/1M input tokens)
- **Quality**: Excellent for 95% of tasks
- **Speed**: Fast

### **GPT-4o** (Premium)
- **Use for**: Complex reasoning, investment analysis, critical decisions
- **Cost**: Low ($2.50/1M input tokens)
- **Quality**: Best available
- **Speed**: Medium

### **GPT-3.5-turbo** (Budget)
- **Use for**: Simple tasks, quick responses
- **Cost**: Lowest ($0.50/1M input tokens)
- **Quality**: Good for basic tasks
- **Speed**: Very fast

---

## 🔧 Configuration in Code

The system automatically uses OpenAI when the key is configured:

### Answer API (`/api/answer`)
```typescript
const MODEL_CONFIGS = {
  'gpt-4o-mini': { model: 'gpt-4o-mini', ... },
  'gpt-4o': { model: 'gpt-4o', ... },
  'gpt-3.5-turbo': { model: 'gpt-3.5-turbo', ... }
};

// Auto-routing
'investment': 'gpt-4o',  // Use GPT-4o for investment reports
'report': 'gpt-4o',      // Use GPT-4o for reports
'analysis': 'gpt-4o-mini', // Use GPT-4o-mini for analysis
'general': 'gpt-4o-mini'   // Use GPT-4o-mini for general tasks
```

### Agent Chat (`/api/agent/chat`)
```typescript
const axAI = new AxAI({
  name: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  config: { model: 'gpt-4o-mini' }
});
```

---

## 🚀 Testing

1. **Execute Workflow**:
   - Go to `localhost:3000/workflow`
   - Click "Load Example"
   - Click "Execute Workflow"
   
2. **Expected Results**:
   ```
   🌐 Market Research → ✅ (Perplexity)
   📈 Market Analyst → ✅ (GPT-4o-mini via Ax)
   ✅ Investment Report → ✅ (GPT-4o)
   ```

3. **Check Terminal**:
   ```
   ✅ Ax Framework initialized with OpenAI
   ✅ REAL GEPA optimization applied
   ✅ Final response generated via Ax + GEPA framework!
   ```

---

## 💰 Cost Estimation

### Typical Workflow Execution:
- **Market Research**: $0.00 (Perplexity)
- **Market Analyst**: ~$0.001 (GPT-4o-mini, ~5K tokens)
- **Investment Report**: ~$0.005 (GPT-4o, ~2K tokens)
- **Total**: ~$0.006 per workflow

### 1000 Workflow Executions:
- **Cost**: ~$6.00
- **Quality**: Professional-grade results
- **Features**: Full DSPy + Ax + GEPA support

**Much more affordable than manual analysis!**

---

## 🎯 Benefits Summary

✅ **DSPy Works** - Automatic prompt optimization  
✅ **Ax LLM Works** - Advanced framework support  
✅ **GEPA Works** - Prompt evolution enabled  
✅ **High Quality** - Professional-grade outputs  
✅ **Affordable** - $0.001-$0.01 per workflow  
✅ **Reliable** - Production-ready API  
✅ **Fast** - Sub-second responses  

---

## 📚 Related Documentation

- `DSPY_INTEGRATION_GUIDE.md` - DSPy usage guide
- `WHY_BEST_FRAMEWORK.md` - Framework comparison
- `COMPLETE_SYSTEM_STATUS.md` - System overview

---

**🔥 With OpenAI, you get the FULL power of DSPy, Ax LLM, and GEPA!**
