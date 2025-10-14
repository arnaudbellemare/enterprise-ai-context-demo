# PERMUTATION Examples

This directory contains example code showing how to use PERMUTATION in different scenarios.

## Examples

### 1. [basic-query.ts](./basic-query.ts)
**Simplest usage** - Execute a single query and view results.

```bash
npx tsx examples/basic-query.ts
```

**Learn**:
- How to create a PermutationEngine
- How to execute a query
- How to access results and metadata
- How to view reasoning steps

---

### 2. [multi-domain.ts](./multi-domain.ts)
**Multi-domain analysis** - Run queries across multiple domains and compare.

```bash
npx tsx examples/multi-domain.ts
```

**Learn**:
- How to run parallel queries
- How to compare results across domains
- How to aggregate costs and metrics
- How to find best performing domain

---

### 3. [custom-config.ts](./custom-config.ts)
**Configuration optimization** - Compare different configurations.

```bash
npx tsx examples/custom-config.ts
```

**Learn**:
- How to customize component selection
- Quality vs. cost vs. speed tradeoffs
- Recommended configs for different scenarios
- How to optimize for your use case

---

## Running Examples

### Prerequisites

Make sure you've completed the [Quick Start](../QUICK_START.md):
1. ✅ Supabase configured
2. ✅ Environment variables set
3. ✅ Database migrated
4. ✅ Dependencies installed

### Run All Examples

```bash
# From project root
npx tsx examples/basic-query.ts
npx tsx examples/multi-domain.ts
npx tsx examples/custom-config.ts
```

## Example Output

### Basic Query
```
Answer: Bitcoin is currently trading at $67,340 USD...
Quality Score: 0.94
Cost: $0.005
Duration: 3200ms
```

### Multi-Domain
```
FINANCIAL:
  Quality: 0.93
  Cost: $0.004
  
CRYPTO:
  Quality: 0.91
  Cost: $0.007
```

### Custom Config
```
MAX QUALITY: Quality 0.94, Cost $0.008
FREE:        Quality 0.81, Cost $0.00
BALANCED:    Quality 0.92, Cost $0.005
```

## Next Steps

After running these examples:

1. Read [ARCHITECTURE.md](../ARCHITECTURE.md) to understand how it works
2. Try [adding a new domain](../docs/guides/adding-domains.md)
3. Run [benchmarks](../docs/guides/running-benchmarks.md)
4. Deploy to [production](../docs/guides/deployment.md)

## Advanced Examples (Coming Soon)

- [ ] **Streaming responses** - Real-time progressive answers
- [ ] **Custom components** - Add your own optimization technique
- [ ] **Batch processing** - Process 1000s of queries efficiently
- [ ] **A/B testing** - Compare configurations scientifically
- [ ] **Custom domains** - Build domain-specific agents

## Contributing Examples

Have a useful example? [Contribute it!](../CONTRIBUTING.md)

Requirements:
- Clear comments explaining each step
- Expected output documented
- Runnable with default setup
- Under 100 lines of code

