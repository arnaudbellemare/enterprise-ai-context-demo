# How to Run PERMUTATION Lite Test

## Quick Start

### Terminal 1: Start Server
```bash
cd frontend
npm run dev
```

Wait for: `✓ Ready in X.Xs` and `○ Local: http://localhost:3000`

### Terminal 2: Run Test
```bash
cd /Users/cno/enterprise-ai-context-demo/enterprise-ai-context-demo-2/enterprise-ai-context-demo
node test-permutation-lite-real.js "What should be the insurance premium on a painting of Alec Monopoly?" art
```

---

## Test Query Examples

```bash
# Alec Monopoly painting
node test-permutation-lite-real.js "What should be the insurance premium on a painting of Alec Monopoly?" art

# Art Deco Cartier bracelet
node test-permutation-lite-real.js "What should the insurance premium be for a 1925 Art Deco Cartier platinum bracelet valued at $85,000?" art

# Custom query
node test-permutation-lite-real.js "your query here" "domain"
```

---

## What You'll See

1. **Real answer** from PERMUTATION Lite
2. **Quality score** (0.70 - 0.85 typical range)
3. **Performance metrics** (time, cost)
4. **Layer execution** (which layers ran)
5. **Full JSON response** saved to `permutation-lite-test-result.json`

---

## Troubleshooting

**"Server not running"**
- Start dev server first: `npm run dev` in `frontend/` directory

**"LLM API error"**
- Check OpenRouter API key in `.env.local`
- Or ensure Ollama is running: `ollama serve`

**"No answer"**
- Check console for errors
- Verify LLM provider is configured

---

*Quick Start Guide*

