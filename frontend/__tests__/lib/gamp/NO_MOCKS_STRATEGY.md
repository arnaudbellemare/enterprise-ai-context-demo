# No Mocks Testing Strategy

## Overview

All GAMP test files now use **real implementations** instead of mocks. This provides:
- Real integration testing
- Confidence that code works with actual services
- Detection of real-world integration issues

## Test Files Status

### ✅ 1. novelty-scorer.test.ts
**Status**: No mocks (pure mathematical functions)
- Tests pure logic calculations
- No external dependencies
- Fast, deterministic tests

### ✅ 2. graph-path-explorer.test.ts  
**Status**: No mocks (graph algorithms only)
- Tests graph traversal algorithms
- Uses real graph data structures
- No external API calls

### ✅ 3. knowledge-graph-builder.test.ts
**Status**: Uses real implementations
- Uses real `problemSolutionEffectExtractor`
- Uses real `pseStorageService`
- May make real API calls to extract triplets

### ✅ 4. pse-storage-service.test.ts
**Status**: Uses real Supabase client
- Creates real Supabase client connection
- Makes real database queries
- Handles missing Supabase gracefully
- Tests skip if Supabase not configured

### ✅ 5. gamp-agent-system.test.ts
**Status**: Uses real implementations
- Real `graphPathExplorer`
- Real `noveltyScorer`
- Real `realityCheckLayer`
- Real `fetch` calls to Ollama (if available)
- Tests skip if Ollama not available

## Configuration

### Environment Variables

Tests use real credentials from `jest.setup.js`:

```javascript
// Real Supabase credentials
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

// Real API keys
PERPLEXITY_API_KEY
```

### Optional Services

Some tests require optional services:

**Ollama API** (for GAMP agents):
- Set `ENABLE_OLLAMA_TESTS=true` to enable Ollama tests
- Default: Tests skip gracefully if Ollama not available
- Tests will fallback to default behavior if API fails

**Supabase** (for PSE storage):
- Tests check if Supabase is configured
- If not available, tests skip with warning
- Some tests verify in-memory mode works

## Running Tests

### Run All GAMP Tests
```bash
cd frontend
npm test -- __tests__/lib/gamp
```

### Run with Ollama Enabled
```bash
ENABLE_OLLAMA_TESTS=true npm test -- __tests__/lib/gamp
```

### Run Specific Test File
```bash
npm test -- __tests__/lib/gamp/novelty-scorer.test.ts
```

## Test Behavior

### Real API Calls
- Tests make real HTTP requests to Ollama
- Tests make real database queries to Supabase
- Timeouts are set appropriately (10-30 seconds)

### Graceful Degradation
- Tests skip if services not available
- Tests use fallback behavior if APIs fail
- Tests verify error handling works correctly

### Test Isolation
- Each test cleans up after itself
- Tests use unique identifiers (timestamps) to avoid conflicts
- Tests don't depend on each other

## Benefits

1. **Real Integration Testing**: Tests verify actual service integrations
2. **Catch Real Issues**: Find problems that mocks wouldn't catch
3. **Confidence**: Know code works with real services
4. **Documentation**: Tests serve as usage examples

## Trade-offs

1. **Slower**: Real API calls take time (10-30 seconds per test)
2. **Requires Services**: Need Supabase configured, optionally Ollama
3. **Network Dependent**: Tests may fail due to network issues
4. **Cost**: Real API calls may incur costs (minimal for tests)

## Recommendations

1. **CI/CD**: Run tests with real services in CI
2. **Local Development**: Use real services for integration testing
3. **Fast Unit Tests**: Keep pure logic tests (like novelty-scorer) fast
4. **Optional Services**: Skip tests if services not available

## Migration Notes

All mocks have been removed:
- ❌ `jest.mock()` calls removed
- ❌ Mock Supabase client removed
- ❌ Mock fetch calls removed
- ❌ Mock dependency modules removed

Real implementations now used:
- ✅ Real Supabase client (`createClient`)
- ✅ Real fetch (global fetch)
- ✅ Real extractors and services
- ✅ Real graph explorers and scorers

