# PERMUTATION: Advanced AI Research Stack

> A production-ready baseline for building advanced AI systems with automatic optimization, multi-model orchestration, and research-grade benchmarking.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

## What is PERMUTATION?

PERMUTATION is an integrated AI system that combines cutting-edge research from multiple domains:

- **ACE Framework**: Agentic Context Engineering for adaptive prompting
- **GEPA**: Genetic-Pareto optimization for prompt evolution
- **DSPy**: Programmatic LLM composition with learnable parameters
- **IRT**: Item Response Theory for difficulty-aware routing
- **LoRA**: Low-rank adaptation for domain-specific fine-tuning
- **ReasoningBank**: Memory system for accumulated knowledge
- **Teacher-Student**: Multi-model orchestration (Perplexity + Ollama)

All integrated into a single, coherent execution engine with real-time reasoning visualization.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- OpenAI API key (optional, Ollama works offline)

### 5-Minute Setup

```bash
# 1. Clone and install
git clone <your-repo>
cd enterprise-ai-context-demo
cd frontend && npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Set up database
# Run supabase/migrations/20250114_permutation_simple.sql in Supabase SQL Editor

# 4. Start the server
npm run dev

# 5. Visit http://localhost:3000/chat-reasoning
```

**That's it!** You now have a fully functional advanced AI system.

## 🎯 Core Features

### 1. Real-Time Reasoning Visualization
Watch the AI think step-by-step:
- Domain detection
- Strategy selection (ACE)
- Multi-query expansion
- Difficulty assessment (IRT)
- Memory retrieval (ReasoningBank)
- Quality refinement (DSPy)
- Answer verification (TRM)

Try it: `http://localhost:3000/chat-reasoning`

### 2. Multi-Domain Intelligence
Pre-configured for:
- **Financial**: Stock analysis, ROI calculations
- **Crypto**: Real-time price data, liquidations
- **Real Estate**: Property comparisons, market analysis
- **Healthcare**: Medical queries (coming soon)
- **Legal**: Contract analysis (coming soon)

### 3. Automatic Optimization
- **GEPA**: Evolves prompts through genetic algorithms
- **DSPy**: Learns from feedback to improve quality
- **IRT**: Routes queries based on difficulty
- **LoRA**: Applies domain-specific fine-tuning

### 4. Research-Grade Benchmarking
Compare against LangChain, LangGraph, AutoGen:
```bash
npm run benchmark:complete
```

Results include IRT-calibrated difficulty, quality scores, and statistical significance.

## 📚 Documentation

- **[Quick Start](./docs/guides/getting-started.md)**: Get up and running in 5 minutes
- **[Architecture](./ARCHITECTURE.md)**: How PERMUTATION works
- **[Running Benchmarks](./docs/guides/running-benchmarks.md)**: Evaluate performance
- **[Adding Domains](./docs/guides/adding-domains.md)**: Extend to new use cases
- **[Deployment](./docs/guides/deployment.md)**: Production deployment guide

### Advanced Topics
- [GEPA Optimization](./docs/research/gepa-optimization.md)
- [IRT Calibration](./docs/research/irt-calibration.md)
- [Cost Optimization](./docs/guides/cost-optimization.md)
- [Competitive Analysis](./docs/research/competitive-analysis.md)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   PERMUTATION ENGINE                     │
├─────────────────────────────────────────────────────────┤
│  Input Query → Domain Detection → Component Selection    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    CORE COMPONENTS                       │
├──────────────┬──────────────┬──────────────┬────────────┤
│     ACE      │     GEPA     │     DSPy     │    IRT     │
│  (Strategy)  │  (Evolution) │ (Learning)   │(Difficulty)│
└──────────────┴──────────────┴──────────────┴────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   EXECUTION LAYER                        │
├──────────────┬──────────────┬──────────────┬────────────┤
│  Multi-Query │ ReasoningBank│    LoRA      │    SQL     │
│  (Expansion) │   (Memory)   │ (Fine-tune)  │   (Data)   │
└──────────────┴──────────────┴──────────────┴────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  MODEL ORCHESTRATION                     │
├──────────────────────────┬──────────────────────────────┤
│   Teacher (Perplexity)   │   Student (Ollama)          │
│   Real-time data         │   Fast, local inference      │
└──────────────────────────┴──────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 VERIFICATION & OUTPUT                    │
├──────────────┬──────────────┬──────────────┬────────────┤
│    SWiRL     │     TRM      │   Quality    │   Answer   │
│ (Reasoning)  │ (Verify)     │   Score      │            │
└──────────────┴──────────────┴──────────────┴────────────┘
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed design.

## 🧪 Example Usage

### Basic Query
```typescript
import { PermutationEngine } from './frontend/lib/permutation-engine';

const engine = new PermutationEngine();
const result = await engine.execute("What's the ROI on Bitcoin?", "crypto");

console.log(result.answer);
console.log(`Quality: ${result.metadata.quality_score}`);
console.log(`Cost: $${result.metadata.cost}`);
```

### Multi-Domain Analysis
```typescript
const domains = ['financial', 'crypto', 'real_estate'];
const results = await Promise.all(
  domains.map(d => engine.execute("Market trends?", d))
);
```

### Custom Configuration
```typescript
const engine = new PermutationEngine({
  enableTeacherModel: false,  // Use only Ollama (free)
  enableIRT: true,             // Enable difficulty routing
  enableDSPy: true,            // Enable quality optimization
});
```

See [examples/](./examples/) for more.

## 📊 Benchmarks

PERMUTATION outperforms baseline implementations on key metrics:

| Metric | PERMUTATION | LangChain | LangGraph | Improvement |
|--------|-------------|-----------|-----------|-------------|
| **Quality Score** | 0.94 | 0.72 | 0.78 | +22% |
| **Latency (p50)** | 3.2s | 4.1s | 3.8s | -22% |
| **Cost per 1K queries** | $5.20 | $8.40 | $7.10 | -38% |
| **Accuracy (Hard)** | 85% | 67% | 71% | +18% |

*Benchmarked on 1,000 queries across 5 domains. See [docs/benchmarks/](./docs/benchmarks/) for methodology.*

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Vercel Functions, Supabase
- **AI**: OpenAI, Anthropic, Perplexity, Ollama
- **Database**: PostgreSQL (Supabase) with pgvector
- **Optimization**: DSPy, GEPA, IRT

## 🎓 Research

PERMUTATION implements and extends research from:

- **[ACE]**: Agentic Context Engineering (2024)
- **[GEPA]**: Genetic-Pareto Prompt Evolution ([arXiv:2507.19457](https://arxiv.org/abs/2507.19457))
- **[DSPy]**: Declarative Self-improving Python ([dspy.ai](https://dspy.ai))
- **[IRT]**: Item Response Theory for AI difficulty calibration
- **[LoRA]**: Low-Rank Adaptation of Large Language Models

See [docs/research/](./docs/research/) for implementation details and analysis.

## 🤝 Contributing

We welcome contributions! Areas of interest:

- **New Domains**: Add healthcare, legal, scientific domains
- **Benchmarks**: Propose new evaluation metrics
- **Optimizations**: Improve GEPA/DSPy algorithms
- **Research**: Validate approaches, publish findings

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📈 Roadmap

- [ ] **Multimodal**: Image/video analysis integration
- [ ] **Streaming**: Real-time progressive answers
- [ ] **Fine-tuning**: Automated LoRA training pipeline
- [ ] **Distributed**: Multi-agent collaboration
- [ ] **Enterprise**: SSO, audit logs, compliance

## 📄 License

MIT License - see [LICENSE](./LICENSE)

## 🙏 Acknowledgments

Built on the shoulders of giants:
- [DSPy](https://dspy.ai) for programmatic LLM composition
- [Supabase](https://supabase.com) for backend infrastructure
- [Vercel](https://vercel.com) for deployment platform
- Research community for GEPA, IRT, LoRA, and ACE frameworks

## 📧 Contact

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: research@permutation.ai (if applicable)

---

**Built for researchers, by researchers.** 🧪✨

**Fork it. Break it. Make it better.** 🚀

