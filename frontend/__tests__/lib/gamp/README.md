# GAMP Testing Guide

This directory contains tests for the GAMP (Graph-based Agent Multi-agent Pathfinding) system.

## Test Types

### 1. Unit Tests (Default)

**Files**: `*.test.ts` (not `*.e2e.test.ts`)

**Purpose**: Fast tests that verify logic, structure, and error handling without external dependencies.

**Run with**:
```bash
npm test
# or
npm test -- --testPathPattern=gamp
```

**Characteristics**:
- Fast execution (< 10s total)
- No external API calls
- Tests fallback behavior
- Uses mocked fetch when unavailable
- Good for CI/CD pipelines

### 2. E2E Tests with Real API

**Files**: `*.e2e.test.ts` (e.g., `gamp-real-api.e2e.test.ts`)

**Purpose**: Integration tests with real Ollama API calls to verify end-to-end functionality.

**Requirements**:
- Ollama running locally (`ollama serve`)
- Model available (e.g., `llama3.2:latest`)
- Set `ENABLE_OLLAMA_TESTS=true`

**Run with**:
```bash
# Quick way (recommended)
npm run test:e2e:ollama

# Manual way
ENABLE_OLLAMA_TESTS=true npm run test:e2e
```

**Characteristics**:
- Slower execution (60-90s per test)
- Real LLM API calls
- Tests full integration
- Requires Ollama setup
- Good for local verification before deployment

## Setup for E2E Tests

### 1. Install Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

### 2. Start Ollama Server

```bash
ollama serve
```

### 3. Pull a Model

```bash
# Recommended: Fast and capable
ollama pull llama3.2:latest

# Alternative: More powerful but slower
ollama pull llama3.1:8b
```

### 4. Run E2E Tests

```bash
cd frontend
npm run test:e2e:ollama
```

## Test Files

| File | Type | Purpose |
|------|------|---------|
| `gamp-integration-e2e.test.ts` | Unit | Tests GAMP flow with fallback behavior |
| `gamp-real-api.e2e.test.ts` | E2E | Tests GAMP with real Ollama API calls |
| `ACTUAL_TEST_STATUS.md` | Doc | Documents test status and limitations |
| `GAMP_INTEGRATION_STATUS.md` | Doc | Documents GAMP integration points |
| `HONEST_TEST_STATUS.md` | Doc | Honest assessment of test coverage |

## Configuration Files

| File | Purpose |
|------|---------|
| `jest.config.js` | Default config for unit tests |
| `jest.config.e2e.js` | Config for E2E tests |
| `jest.setup.js` | Setup for unit tests (may use mock fetch) |
| `jest.setup-real-api.js` | Setup for E2E tests (uses real fetch) |

## E2E Test Coverage

The E2E tests verify:

✅ **Query Decomposition**: Chief Scientist breaks down complex queries
✅ **Path Discovery**: Multi-agent system discovers solution paths
✅ **Domain Expert Evaluation**: Experts evaluate path quality
✅ **Novelty Scoring**: Innovation Assessor scores novelty
✅ **Fact Checking**: Fact Checker verifies factuality
✅ **Path Ranking**: Paths ranked by overall score
✅ **Performance**: Measures real API latency
✅ **Error Handling**: Graceful degradation when API fails

## Common Issues

### Issue: Tests Skip with "Ollama not available"

**Solution**: Start Ollama server
```bash
ollama serve
```

### Issue: "Model not found"

**Solution**: Pull the required model
```bash
ollama pull llama3.2:latest
```

### Issue: Tests Timeout

**Cause**: Real API calls take time (5-15s per agent)

**Solution**: Increase timeout in test file (already set to 90s)

### Issue: Tests Fail with fetch Error

**Cause**: Node.js version < 18 (fetch not available)

**Solution**: Upgrade to Node.js 18+ or 20+
```bash
node --version  # Should be v18.0.0 or higher
```

## Performance Expectations

### Unit Tests
- Total time: < 10s
- Per test: < 1s
- No network I/O

### E2E Tests
- Total time: 2-5 minutes
- Per test: 15-90s
- Network I/O: 5-15s per agent call

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd frontend && npm install
      - run: cd frontend && npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install Ollama
        run: curl -fsSL https://ollama.com/install.sh | sh
      - name: Start Ollama
        run: ollama serve &
      - name: Pull Model
        run: ollama pull llama3.2:latest
      - run: cd frontend && npm install
      - run: cd frontend && npm run test:e2e:ollama
```

## Best Practices

1. **Run unit tests frequently** during development
2. **Run E2E tests before commits** to verify integration
3. **Keep unit tests fast** (< 10s total)
4. **Document any new E2E test requirements** in this README
5. **Use descriptive test names** for easy debugging
6. **Log key metrics** (latency, scores) in E2E tests for monitoring

## Debugging Tips

### Enable Verbose Logging

Unit tests suppress console output. E2E tests keep all logs.

### Check Ollama Health

```bash
curl http://localhost:11434/api/tags
```

### Test Single File

```bash
# Unit test
npm test -- gamp-integration-e2e.test.ts

# E2E test
ENABLE_OLLAMA_TESTS=true npm run test:e2e -- gamp-real-api.e2e.test.ts
```

### View Test Output

```bash
npm test -- --verbose
```

## Contributing

When adding new tests:

1. Unit tests go in `*.test.ts` files
2. E2E tests go in `*.e2e.test.ts` files
3. Update this README with new test requirements
4. Update `ACTUAL_TEST_STATUS.md` with coverage changes
5. Ensure both unit and E2E tests pass before PR

## Resources

- [GAMP Architecture](../../../lib/gamp/README.md)
- [Ollama Documentation](https://ollama.com/docs)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
