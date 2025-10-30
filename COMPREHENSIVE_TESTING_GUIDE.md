# 🚀 PERMUTATION System Comprehensive Testing Guide

This guide explains how to run comprehensive tests for the PERMUTATION AI system to validate all its capabilities and components.

## 📋 Overview

The PERMUTATION system integrates 11 core components:
- **SWiRL** (Step-Wise Reinforcement Learning)
- **TRM** (Tiny Recursion Models)
- **ACE** (Agentic Context Engineering)
- **GEPA** (Genetic-Pareto Evolution for Prompt Optimization)
- **IRT** (Item Response Theory)
- **ReasoningBank** (Semantic Memory System)
- **LoRA** (Low-Rank Adaptation)
- **DSPy** (Declarative Self-improving Python)
- **Multi-Query Expansion**
- **Local Embeddings**
- **Teacher-Student System**

## 🛠️ Test Files

### 1. `comprehensive-permutation-system-test.js`
The main test file that validates all system capabilities:
- **10 Test Categories**: System health, core components, API endpoints, query processing, multi-domain analysis, real-time processing, edge cases, performance, output quality, and integration
- **Comprehensive Coverage**: Tests all 11 components and 20+ API endpoints
- **Quality Validation**: Ensures output structure, reasoning quality, and metadata accuracy
- **Performance Testing**: Measures response times, concurrent requests, and scalability

### 2. `run-comprehensive-test.js`
Test runner with multiple configurations:
- **Quick Test**: Fast validation of core functionality (1 minute)
- **Standard Test**: Full system validation with all components (5 minutes)
- **Comprehensive Test**: Complete validation including edge cases (10 minutes)
- **Performance Test**: Focus on performance and stress testing (15 minutes)
- **Integration Test**: Test component integration and data flow (5 minutes)

### 3. `validate-test-environment.js`
Environment validator that ensures the system is ready for testing:
- **System Requirements**: Node.js version, memory, disk space
- **Service Availability**: Frontend server, Supabase, LLM services, Ollama
- **Configuration**: Environment variables, API keys, database schema
- **Dependencies**: Frontend, backend, and test dependencies

## 🚀 Quick Start

### 1. Validate Environment
```bash
# Check if system is ready for testing
node validate-test-environment.js
```

### 2. Run Quick Test
```bash
# Fast validation of core functionality
node run-comprehensive-test.js quick
```

### 3. Run Standard Test
```bash
# Full system validation
node run-comprehensive-test.js standard
```

### 4. Run All Tests
```bash
# Run all test configurations
node run-comprehensive-test.js all
```

## 📊 Test Configurations

### Quick Test
- **Duration**: 1 minute
- **Focus**: Core functionality validation
- **Domains**: general, technology
- **Query Types**: simple, complex
- **Use Case**: Quick validation before deployment

### Standard Test
- **Duration**: 5 minutes
- **Focus**: Full system validation
- **Domains**: general, technology, financial, healthcare
- **Query Types**: simple, complex, realtime, multistep
- **Use Case**: Regular testing and validation

### Comprehensive Test
- **Duration**: 10 minutes
- **Focus**: Complete validation with edge cases
- **Domains**: All 7 domains (general, technology, financial, healthcare, crypto, legal, real_estate)
- **Query Types**: All types including edge cases
- **Use Case**: Thorough validation before major releases

### Performance Test
- **Duration**: 15 minutes
- **Focus**: Performance and scalability
- **Domains**: general
- **Query Types**: simple, complex
- **Concurrency**: 10 parallel requests
- **Use Case**: Performance benchmarking and optimization

### Integration Test
- **Duration**: 5 minutes
- **Focus**: Component integration and data flow
- **Domains**: general, technology
- **Query Types**: complex, multistep
- **Use Case**: Testing component interactions

## 🔍 Test Categories

### 1. System Health Check
- Server status
- Database connection
- LLM services availability
- Cache system status

### 2. Core Components
Tests all 11 core components:
- SWiRL (Step-Wise RL)
- TRM (Tiny Recursion Model)
- ACE (Agentic Context Engineering)
- GEPA (Genetic-Pareto Evolution)
- IRT (Item Response Theory)
- ReasoningBank
- LoRA (Low-Rank Adaptation)
- DSPy Integration
- Multi-Query Expansion
- Local Embeddings
- Teacher-Student System

### 3. API Endpoints
Tests 20+ API endpoints:
- Main execution endpoint
- Smart routing
- Cost optimization
- Performance monitoring
- Dynamic scaling
- Benchmarking
- Trace inspection
- Brain skills

### 4. Query Processing
Tests different query types:
- Simple queries
- Complex queries
- Real-time queries
- Multi-step queries
- Edge cases

### 5. Multi-Domain Analysis
Tests across 7 domains:
- Healthcare
- Financial
- Crypto
- Technology
- Legal
- Real Estate
- General

### 6. Real-Time Data Processing
Tests real-time capabilities:
- Latest trends queries
- Current market data
- Live information retrieval

### 7. Edge Cases and Error Handling
Tests system robustness:
- Empty queries
- Very long queries
- Special characters
- Philosophical questions
- Potentially harmful queries
- Impossible queries

### 8. Performance and Scalability
Tests system performance:
- Response time measurement
- Concurrent request handling
- Memory usage monitoring
- Cache performance

### 9. Output Quality Validation
Validates output quality:
- Answer completeness
- Reasoning quality
- Metadata accuracy
- Trace completeness

### 10. Integration and Workflow
Tests system integration:
- End-to-end workflow
- Component integration
- Data flow validation
- Error recovery

## 📈 Expected Results

### Success Criteria
- **Overall Success Rate**: ≥ 90% (Excellent), ≥ 80% (Good), ≥ 70% (Fair)
- **Response Time**: < 10 seconds for complex queries
- **Concurrent Requests**: ≥ 80% success rate
- **Component Coverage**: All 11 components functional
- **API Endpoints**: ≥ 80% endpoints available

### Performance Targets
- **Quality Score**: > 0.90
- **IRT Difficulty**: 0.0-1.0 scale
- **Latency p50**: < 3.2s
- **Cost per Query**: < $0.01
- **Cache Hit Rate**: > 40%

## 🐛 Troubleshooting

### Common Issues

#### 1. Environment Not Ready
```bash
# Check environment validation
node validate-test-environment.js

# Common fixes:
# - Start frontend server: npm run dev
# - Set environment variables in .env.local
# - Start Ollama service: ollama serve
```

#### 2. API Endpoints Not Available
```bash
# Check if frontend is running
curl http://localhost:3000/api/health

# Start frontend if needed
cd frontend && npm run dev
```

#### 3. Database Connection Issues
```bash
# Check Supabase configuration
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify database schema is migrated
```

#### 4. LLM Service Issues
```bash
# Check API keys
echo $OPENAI_API_KEY
echo $PERPLEXITY_API_KEY
echo $ANTHROPIC_API_KEY

# Test LLM connectivity
curl -X POST http://localhost:3000/api/llm/status
```

### Debug Mode
```bash
# Run with detailed logging
DEBUG=* node comprehensive-permutation-system-test.js

# Run specific test category
node comprehensive-permutation-system-test.js --category=core_components
```

## 📊 Test Reports

### Generated Reports
- `comprehensive-test-results.json`: Detailed test results
- `comprehensive-test-report-YYYY-MM-DD.json`: Summary report
- `validation-report-YYYY-MM-DD.json`: Environment validation report

### Report Structure
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "summary": {
    "totalTests": 150,
    "passedTests": 142,
    "failedTests": 8,
    "successRate": 94.7,
    "totalTime": 300000
  },
  "testDetails": {
    "system_health": [...],
    "core_components": [...],
    "api_endpoints": [...]
  },
  "performanceMetrics": {...},
  "componentCoverage": {...},
  "errorAnalysis": {...}
}
```

## 🔧 Customization

### Adding New Tests
```javascript
// In comprehensive-permutation-system-test.js
async testCustomFeature() {
  const response = await this.testEndpoint('/api/custom-feature', 'POST', {
    query: "Test custom feature",
    domain: "general"
  });
  return response.success && response.data?.customResult;
}
```

### Modifying Test Configuration
```javascript
// In run-comprehensive-test.js
const customConfig = {
  name: 'Custom Test',
  description: 'Custom test configuration',
  timeout: 120000,
  parallel: 4,
  domains: ['custom_domain'],
  queryTypes: ['custom_type']
};
```

## 📚 Additional Resources

- **System Architecture**: See `ARCHITECTURE.md`
- **API Documentation**: See `docs/api/`
- **Component Details**: See `frontend/lib/`
- **Benchmark Results**: See `BENCHMARKS.md`

## 🎯 Best Practices

1. **Always validate environment** before running tests
2. **Start with quick test** for basic validation
3. **Use standard test** for regular validation
4. **Run comprehensive test** before major releases
5. **Monitor performance metrics** during testing
6. **Review test reports** for insights and improvements
7. **Fix issues** before proceeding to next test level

## 🚨 Important Notes

- Tests require the frontend server to be running (`npm run dev`)
- Some tests require external API keys (OpenAI, Perplexity, Anthropic)
- Ollama service is optional but recommended for local testing
- Database migrations must be completed before testing
- Tests may take 1-15 minutes depending on configuration
- Concurrent tests may impact system performance

---

**Ready to test?** Start with: `node validate-test-environment.js`