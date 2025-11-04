# GAMP Testing Strategy Explanation

## Why We Use Mocks

### 1. **Unit Testing vs Integration Testing**

**Unit Tests** (what we're doing):
- Test individual components in isolation
- Fast execution (milliseconds)
- No external dependencies
- Predictable and repeatable
- Can run in CI/CD without setup

**Integration Tests** (alternative approach):
- Test real connections to databases/APIs
- Slow execution (seconds to minutes)
- Requires external services running
- Can be flaky (network issues, API changes)
- Needs environment setup

### 2. **External Dependencies in GAMP Code**

Our GAMP modules have these external dependencies:

```typescript
// gamp-agent-system.ts
await fetch("http://localhost:11434/v1/chat/completions", ...)  // Ollama API

// pse-storage-service.ts
await this.supabase.from('pse_triplets').insert(...)  // Supabase database

// problem-solution-effect-extractor.ts
// Uses AI SDK which imports eventsource-parser
// Which requires TransformStream (browser API)
```

### 3. **What Happens Without Mocks?**

**Without mocks:**
- Tests would try to connect to real Ollama API (localhost:11434)
- Tests would try to connect to real Supabase database
- Tests would fail if services aren't running
- Tests would be slow (network latency)
- Tests would be flaky (network issues)
- Tests would cost money (API calls)

**With mocks:**
- Tests run instantly (no network calls)
- Tests are deterministic (same inputs = same outputs)
- Tests can run anywhere (no service dependencies)
- Tests are free (no API costs)

## What jest.setup.js Provides

### 1. **TransformStream Mock**

**Why needed:**
- `eventsource-parser` (AI SDK dependency) requires `TransformStream`
- `TransformStream` is a browser/Web API
- Not available in Node.js < 18 or Jest's jsdom environment
- When importing AI SDK code, it tries to use TransformStream immediately

**What it does:**
```javascript
// Provides a mock TransformStream so imports don't crash
global.TransformStream = class TransformStream { ... }
```

### 2. **fetch Mock**

**Why needed:**
- GAMP agents make HTTP requests to Ollama API
- `fetch` is not available in Node.js < 18
- Jest's jsdom might not have it

**What it does:**
```javascript
// Provides a mock fetch that tests can control
global.fetch = jest.fn()
```

### 3. **ReadableStream Mock**

**Why needed:**
- Often used with TransformStream
- AI SDK streaming responses use ReadableStream
- Not available in Node.js < 18

## Alternative Approaches

### Option 1: Use Real Services (Integration Tests)

```typescript
// Don't mock - use real services
// Requires:
// - Ollama running on localhost:11434
// - Supabase configured with test database
// - Network access
// - Slower tests (network latency)
```

**Pros:**
- Tests real integrations
- Catches integration bugs

**Cons:**
- Slow (network calls)
- Flaky (network issues)
- Requires setup
- Can't run in CI without services

### Option 2: Use Test Doubles (Current Approach)

```typescript
// Mock external dependencies
jest.mock('../../../lib/gamp/pse-storage-service')
global.fetch = jest.fn()
```

**Pros:**
- Fast (no network calls)
- Deterministic
- No setup required
- Can run anywhere

**Cons:**
- Doesn't test real integrations
- Mocks can drift from reality

### Option 3: Hybrid Approach (Recommended for Production)

**Unit tests:** Use mocks (fast, isolated)
**Integration tests:** Use real services (slow, comprehensive)

```typescript
// Unit test (fast, mocked)
describe('NoveltyScorer', () => {
  // Pure logic, no mocks needed
})

// Integration test (slow, real services)
describe('GAMP Integration', () => {
  // Uses real Ollama, real Supabase
  // Runs in CI with test services
})
```

## Current Test Structure

```
frontend/__tests__/lib/gamp/
├── novelty-scorer.test.ts          # Pure logic, no mocks
├── graph-path-explorer.test.ts     # Graph algorithms, minimal mocks
├── knowledge-graph-builder.test.ts  # Mocks PSE extractor
├── pse-storage-service.test.ts      # Mocks Supabase client
└── gamp-agent-system.test.ts        # Mocks fetch, graph explorer, novelty scorer
```

**Mock Strategy by File:**

1. **novelty-scorer.test.ts**: No mocks (pure mathematical functions)
2. **graph-path-explorer.test.ts**: Minimal mocks (only if needed)
3. **knowledge-graph-builder.test.ts**: Mocks `pse-storage-service` and `problem-solution-effect-extractor`
4. **pse-storage-service.test.ts**: Mocks Supabase client
5. **gamp-agent-system.test.ts**: Mocks fetch, graph explorer, novelty scorer, reality check layer

## Best Practices

1. **Mock at the boundary**: Mock external dependencies, not internal logic
2. **Test behavior, not implementation**: Test what the code does, not how
3. **Use real implementations when possible**: Prefer real code over mocks
4. **Keep mocks simple**: Complex mocks are hard to maintain
5. **Document why you're mocking**: Future developers need to understand

## Summary

**Why mocks?** To test code in isolation without external dependencies.

**What in jest.setup.js?** Browser/Web APIs that aren't available in Node.js/Jest environment:
- `TransformStream` (required by AI SDK)
- `fetch` (required by GAMP agents)
- `ReadableStream` (required by streaming APIs)

**Should we use real services?** For integration tests, yes. For unit tests, mocks are the right choice.

