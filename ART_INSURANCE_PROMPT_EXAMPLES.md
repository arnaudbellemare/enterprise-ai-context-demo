# Art Insurance Premium Query Examples

## For Chat-Reasoning API (lite-gamp mode)

### Example 1: High-Value Contemporary Art Transport
```
I need to evaluate the insurance premium for a high-value Alec Monopoly contemporary painting (estimated value $850,000) that will be traveling from London to New York for an art gallery exhibition, then to Los Angeles for a private collector showcase. The artwork requires climate-controlled transport, specialized art handlers, and comprehensive coverage including transit, exhibition, and storage periods. What are the key insurance considerations, premium estimates, and risk mitigation strategies?
```

### Example 2: International Art Exhibition (Shorter)
```
What are the insurance premium requirements for a $500,000 contemporary painting traveling from London to New York for a gallery exhibition? Include transit, exhibition, and storage coverage considerations.
```

### Example 3: Multi-Location Art Tour
```
Evaluate insurance premium options for a $1.2M contemporary art piece that will travel from London → New York → Los Angeles → Miami for multiple exhibitions. What coverage is needed for transit, exhibitions, temporary storage, and what are typical premium ranges?
```

### Example 4: Art Gallery Exhibition (Detailed)
```
I'm organizing an art gallery exhibition featuring high-value contemporary paintings (ranging from $200K to $1.5M). The artworks will be shipped from multiple locations (London, Paris, Tokyo) to New York for a 3-month exhibition, then to Los Angeles for a private collector showcase. What insurance coverage do I need, what are the typical premium ranges (as percentage of artwork value), and what risk mitigation strategies should I implement?
```

## What to Expect with lite-gamp Mode

When you use these prompts in chat-reasoning with `mode: "lite-gamp"`:

1. **GAMP Activation**: IRT threshold 0.3 - should activate for complex queries
   - Graph reasoning with P-S-E triplets
   - Path discovery and novelty scoring

2. **Context Engineering 2.0**: Always runs
   - Enriched context with 5+ context deltas
   - Proactive need inference
   - Entropy reduction

3. **REFRAG Query Reformulation**: Enabled
   - Multiple query variants for better retrieval

4. **GEPA + DSPy Optimization**: Full workflow
   - 10 iterations until convergence
   - 20 rollouts per step
   - ChainOfThought + ReAct strategies

5. **Real Answer Generation**: 
   - Uses Ollama (no timeout)
   - Synthesizes all enriched context
   - Includes GAMP insights and Context Engineering 2.0 analysis

## API Usage

```bash
curl -X POST http://localhost:3000/api/chat-reasoning \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I need to evaluate the insurance premium for a high-value Alec Monopoly contemporary painting (estimated value $850,000) that will be traveling from London to New York for an art gallery exhibition, then to Los Angeles for a private collector showcase. The artwork requires climate-controlled transport, specialized art handlers, and comprehensive coverage including transit, exhibition, and storage periods. What are the key insurance considerations, premium estimates, and risk mitigation strategies?",
    "mode": "lite-gamp",
    "domain": "financial",
    "stream": false
  }'
```

Or use the frontend UI:
- Go to http://localhost:3000
- Select "LITE-GAMP" mode
- Paste one of the prompts above
- Submit and watch the reasoning process

