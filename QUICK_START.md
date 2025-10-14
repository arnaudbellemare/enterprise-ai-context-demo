```
╔═══════════════════════════════════════════════════════════════════════════╗
║   ██████╗ ███████╗██████╗ ███╗   ███╗██╗   ██╗████████╗ █████╗ ████████╗ ║
║   ██╔══██╗██╔════╝██╔══██╗████╗ ████║██║   ██║╚══██╔══╝██╔══██╗╚══██╔══╝ ║
║   ██████╔╝█████╗  ██████╔╝██╔████╔██║██║   ██║   ██║   ███████║   ██║    ║
║   ██╔═══╝ ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║   ██║   ██╔══██║   ██║    ║
║   ██║     ███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝   ██║   ██║  ██║   ██║    ║
║   ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝   ╚═╝    ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

# Quick Start Guide

Get PERMUTATION running in 5 minutes.

## Prerequisites

Before you begin, make sure you have:

- ✅ **Node.js 18+** installed ([download](https://nodejs.org/))
- ✅ **Supabase account** (free tier works - [sign up](https://supabase.com))
- ✅ (Optional) **OpenAI API key** for best quality
- ✅ (Optional) **Perplexity API key** for real-time data

## Step 1: Clone and Install (1 minute)

```bash
git clone <your-repo-url>
cd enterprise-ai-context-demo
cd frontend
npm install
```

## Step 2: Set Up Supabase (2 minutes)

### 2a. Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name it "permutation-ai"
4. Copy your **Project URL** and **API Key**

### 2b. Run Migration
1. In Supabase dashboard, go to **SQL Editor**
2. Open `supabase/migrations/20250114_permutation_simple.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click **Run**

**That's it!** Your database is set up with:
- ACE playbook storage
- ReasoningBank memories
- Sample financial/crypto data
- Execution history tracking

## Step 3: Configure Environment (30 seconds)

Create `.env.local` in the `frontend/` directory:

```bash
# Required - Supabase (from step 2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional - For best quality
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...

# Optional - Ollama (free, local)
OLLAMA_BASE_URL=http://localhost:11434
```

**Minimal setup** (works without API keys):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Start the Server (30 seconds)

```bash
npm run dev
```

You should see:
```
✓ Ready in 2.3s
○ Local: http://localhost:3000
```

## Step 5: Try It Out! (1 minute)

### Option A: Real-Time Reasoning (Recommended)

1. Open http://localhost:3000/chat-reasoning
2. Type: **"What are the current Bitcoin liquidations?"**
3. Watch the AI think step-by-step!

You'll see:
- ✅ Domain detection → crypto
- ✅ ACE strategies loading
- ✅ Multi-query expansion (60 variations)
- ✅ IRT difficulty assessment
- ✅ ReasoningBank memory retrieval
- ✅ Quality optimization (DSPy)
- ✅ Answer verification (TRM)

### Option B: Agent Builder

1. Open http://localhost:3000/agent-builder
2. Try: **"Create an agent that tracks stock prices"**
3. The system will automatically:
   - Configure ACE framework
   - Set up ReasoningBank
   - Apply financial domain optimization

### Option C: Arena Comparison

1. Open http://localhost:3000/arena
2. Compare PERMUTATION vs. baseline models
3. See quality scores, latency, and cost differences

## Verify It's Working

Run the test suite:

```bash
npx tsx test-permutation-complete.ts
```

You should see:
```
✅ Domain Detection: PASS
✅ ACE Framework: PASS
✅ Multi-Query: PASS (60 variations)
✅ IRT Assessment: PASS
✅ ReasoningBank: PASS (3 memories retrieved)
✅ LoRA Config: PASS
✅ DSPy Refinement: PASS (quality 0.94)
✅ TRM Verification: PASS (92% confidence)

✅ ALL TESTS PASSED (8/8)
```

## What Just Happened?

You now have a **production-ready AI system** that:

1. ✅ **Thinks transparently** - See every reasoning step
2. ✅ **Learns from experience** - ReasoningBank stores successful patterns
3. ✅ **Optimizes automatically** - DSPy refines prompts without hand-crafting
4. ✅ **Routes intelligently** - IRT sends hard queries to powerful models
5. ✅ **Adapts to domains** - LoRA applies specialized knowledge
6. ✅ **Verifies answers** - TRM catches errors before showing you

## Next Steps

### Learn the System
- [Architecture](./ARCHITECTURE.md) - How it all works
- [Benchmarks](./docs/benchmarks/methodology.md) - Performance evaluation
- [Research](./docs/research/) - Implementation details

### Customize It
- [Adding Domains](./docs/guides/adding-domains.md) - Extend to new use cases
- [Cost Optimization](./docs/guides/cost-optimization.md) - Reduce API costs
- [Fine-tuning LoRA](./docs/guides/lora-training.md) - Domain-specific models

### Deploy It
- [Deployment Guide](./docs/guides/deployment.md) - Production setup
- [Scaling](./docs/guides/scaling.md) - Handle high traffic

## Troubleshooting

### Error: "Supabase connection failed"
**Solution**: Check your `.env.local`:
```bash
# Make sure these are set correctly
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Error: "No API key found"
**Solution**: PERMUTATION works without API keys (uses Ollama), but for best quality:
```bash
# Add to .env.local
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
```

### "npm install" fails
**Solution**: Make sure you're in the `frontend/` directory:
```bash
cd frontend
npm install
```

### Ollama not working
**Solution**: Install Ollama for free local inference:
```bash
# macOS
brew install ollama
ollama pull llama2

# Linux
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama2
```

### SQL migration fails
**Solution**: Make sure you're using the correct migration file:
- For minimal setup: `supabase/migrations/20250114_permutation_simple.sql`
- For complete setup: `supabase/migrations/20250114_permutation_complete.sql`

## Getting Help

- 📚 [Documentation](./docs/)
- 💬 [GitHub Discussions](https://github.com/your-repo/discussions)
- 🐛 [Report Issues](https://github.com/your-repo/issues)
- 📧 Email: support@permutation.ai

## What's Different from Other AI Systems?

| Feature | ChatGPT | LangChain | PERMUTATION |
|---------|---------|-----------|-------------|
| See reasoning steps | ❌ | ❌ | ✅ Real-time |
| Learns from usage | ❌ | ❌ | ✅ ReasoningBank |
| Auto-optimizes | ❌ | ❌ | ✅ DSPy + GEPA |
| Difficulty routing | ❌ | ❌ | ✅ IRT |
| Cost transparency | ❌ | ❌ | ✅ Per query |
| Local + cloud | ❌ | ⚠️ Partial | ✅ Hybrid |

## Advanced Configuration

### Use Only Free Models (Ollama)

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OLLAMA_BASE_URL=http://localhost:11434

# No OpenAI or Perplexity keys needed!
```

**Trade-off**: Faster setup, zero cost, but slightly lower quality for complex queries.

### Use Only Cloud Models (Best Quality)

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
ANTHROPIC_API_KEY=sk-ant-...
```

**Trade-off**: Best quality, but costs ~$0.005-0.010 per query.

### Hybrid (Recommended)

```bash
# .env.local - Use Ollama for easy queries, cloud for hard queries
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
OLLAMA_BASE_URL=http://localhost:11434
```

**Trade-off**: Best balance - IRT routes easy queries to free models, hard queries to paid models.

## Example Queries to Try

### Financial Analysis
```
"Calculate ROI of $10,000 S&P 500 investment from Jan 2020 to now"
```

### Crypto (Real-time)
```
"What are the current Bitcoin liquidations in the last 24 hours?"
```

### Real Estate
```
"Compare average home prices in San Francisco vs Austin"
```

### General Knowledge
```
"Explain quantum computing and its practical applications"
```

### Multi-step Reasoning
```
"If I invest $5,000 in Bitcoin and $5,000 in S&P 500, which is better?"
```

## Success! 🎉

You now have a research-grade AI system running locally!

**Fork it. Break it. Make it better.** 🚀

---

**Total Setup Time**: ~5 minutes  
**Cost**: $0 (with Ollama) to ~$0.005/query (with cloud models)  
**Quality**: 0.85-0.96 (depending on configuration)

**Next**: Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand how it works!

