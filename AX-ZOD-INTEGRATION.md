# Ax + Zod Integration Implementation

## 🎯 Overview

This implementation brings the **Ax + Zod integration architecture** from [PR #394](https://github.com/ax-llm/ax/pull/394) to our PERMUTATION system, creating a sophisticated validation pipeline where Zod schemas travel with Ax signatures from definition to runtime enforcement.

## 🏗️ Architecture

```
Zod Schema → AxZodRegistry → AxSignatureFactory → AxAssertion Pipeline → Runtime Validation
     ↓              ↓              ↓                    ↓                    ↓
z.object(...)   schema cache   AxSignature        ZodAssertionAdapter   Streaming Validator
                                with zodMeta       (.parse/.safeParse)   (per-field/final)
```

### Components

1. **AxZodRegistry**: Schema cache and management
   - Registers and caches Zod schemas
   - Stores generated Ax signatures
   - Provides schema lookup and listing

2. **AxSignatureFactory**: Builds Ax signatures from Zod schemas
   - Extracts field information from Zod schemas
   - Converts to Ax signature format (`input:type -> output:type`)
   - Caches signatures for performance

3. **ZodAssertionAdapter**: Runtime validation
   - Validates input against Zod schemas
   - Supports both `parse` (strict) and `safeParse` (lenient) modes
   - Returns detailed error information

4. **StreamingValidator**: Real-time validation with telemetry
   - Validates streaming responses
   - Provides validation metrics (time, field count, error count)
   - Supports multiple assertion levels

5. **AxZodIntegration**: Main integration class
   - Orchestrates all components
   - Creates domain-specific generators
   - Wraps generators with validation logic

## 📊 Registered Schemas

### Domain Schemas
- **finance**: Financial analysis with risk tolerance and time horizon
- **legal**: Legal analysis with jurisdiction and practice area
- **healthcare**: Healthcare analysis with clinical context and urgency
- **technology**: Technology analysis with architecture and scale
- **education**: Education analysis with grade level and subject
- **general**: General-purpose analysis

### Component Schemas
- **routing**: Routing decision validation
- **trm**: TRM Engine input validation
- **gepa**: GEPA optimization validation
- **performance**: Performance metrics validation

## 🚀 Usage

### Basic Usage

```typescript
import { createDomainGenerator, validateInput } from './lib/ax-zod-bridge';
import { ai } from '@ax-llm/ax';

// 1. Create a domain-specific generator
const financeGenerator = createDomainGenerator('finance', {
  description: 'Expert financial analysis',
  assertionLevel: 'strict',  // strict | lenient | none
  mode: 'parse'              // parse | safeParse
});

// 2. Prepare input
const input = {
  query: 'What are the current market trends in AI stocks?',
  complexity: 'high',
  requiresRealTimeData: true,
  riskTolerance: 'moderate',
  timeHorizon: 'long'
};

// 3. Validate input
const validation = validateInput('finance', input);
if (!validation.success) {
  console.error('Validation failed:', validation.errors);
  return;
}

// 4. Execute generator
const llm = ai({ name: 'openai', apiKey: process.env.OPENAI_API_KEY });
const result = await financeGenerator.forward(llm, validation.data);

console.log('Result:', result);
console.log('Telemetry:', validation.telemetry);
```

### Advanced Usage

```typescript
import { AxZodIntegration, AxZodRegistry } from './lib/ax-zod-bridge';

// Create custom integration
const integration = new AxZodIntegration();

// List available generators
const available = integration.getAvailableGenerators();
console.log('Available generators:', available);

// Get registered schema
const registry = AxZodRegistry.getInstance();
const financeSchema = registry.getSchema('finance');

// Get cached signature
const signature = registry.getSignature('finance');
console.log('Finance signature:', signature);

// Create generator with custom options
const generator = integration.createGenerator('legal', {
  description: 'Expert legal analysis for LATAM jurisdictions',
  assertionLevel: 'strict',
  mode: 'parse'
});
```

### API Endpoint Usage

```bash
# GET - Check integration status
curl http://localhost:3000/api/ax-zod-demo

# POST - Generate with domain-specific generator
curl -X POST http://localhost:3000/api/ax-zod-demo \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "finance",
    "query": "What are the current market trends in AI stocks?",
    "options": {
      "assertionLevel": "strict",
      "mode": "parse",
      "input": {
        "complexity": "high",
        "requiresRealTimeData": true,
        "riskTolerance": "moderate",
        "timeHorizon": "long"
      }
    }
  }'
```

## 🔧 Integration with PERMUTATION System

### Brain System Integration

```typescript
import { createDomainGenerator, validateInput } from './lib/ax-zod-bridge';

// In brain/route.ts
async function executeWithZodValidation(domain: string, query: string) {
  // 1. Create generator
  const generator = createDomainGenerator(domain as any, {
    description: `Expert ${domain} analysis`,
    assertionLevel: 'strict'
  });
  
  // 2. Prepare and validate input
  const input = {
    query,
    complexity: calculateComplexity(query),
    requiresRealTimeData: domain === 'finance' || domain === 'legal'
  };
  
  const validation = validateInput(domain, input);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
  }
  
  // 3. Execute with validated input
  const llm = ai({ name: 'openai', apiKey: process.env.OPENAI_API_KEY });
  const result = await generator.forward(llm, validation.data);
  
  return {
    result,
    telemetry: validation.telemetry
  };
}
```

### Teacher-Student Integration

```typescript
import { createDomainGenerator } from './lib/ax-zod-bridge';

// Use validated generators in Teacher-Student pattern
async function teacherStudentWithValidation(query: string, domain: string) {
  // Teacher uses validated generator
  const teacherGenerator = createDomainGenerator(domain as any, {
    description: 'Expert teacher analysis',
    assertionLevel: 'strict'
  });
  
  // Student uses validated generator
  const studentGenerator = createDomainGenerator(domain as any, {
    description: 'Student learning analysis',
    assertionLevel: 'lenient'  // More lenient for learning
  });
  
  // Execute teacher-student pattern with validation
  const teacherLLM = ai({ name: 'openai', apiKey: process.env.OPENAI_API_KEY });
  const studentLLM = ai({ name: 'ollama', model: 'gemma3:4b' });
  
  const teacherResult = await teacherGenerator.forward(teacherLLM, { query, complexity: 'high' });
  const studentResult = await studentGenerator.forward(studentLLM, { query, complexity: 'medium' });
  
  return { teacherResult, studentResult };
}
```

## 📈 Validation Telemetry

Every validation returns telemetry data:

```typescript
{
  success: boolean,
  data?: any,
  errors?: string[],
  telemetry: {
    validationTime: number,      // Time taken to validate (ms)
    fieldCount: number,           // Number of fields validated
    errorCount: number            // Number of validation errors
  }
}
```

## 🎯 Assertion Levels

### Strict
- Uses `parse()` - throws on validation failure
- Best for production systems
- Ensures data integrity

### Lenient
- Uses `safeParse()` - returns error object
- Best for development and testing
- Provides detailed error information

### None
- Skips validation
- Best for performance-critical paths
- Use with caution

## 🔄 Future Integration (When PR #394 Merges)

When PR #394 is merged into Ax LLM, our implementation will seamlessly upgrade to:

```typescript
// Direct Zod schema support in ax()
const generator = ax(DomainSchemas.finance, {
  description: 'Expert finance analysis',
  zod: {
    assertionLevel: 'strict',
    mode: 'parse'
  }
});

// Schema travels through entire pipeline automatically
// Zod Schema → AxZodRegistry → AxSignature → AxAssertion → Runtime Validation
```

## 📊 Current Status

✅ **Implemented**:
- Zod schema registration and caching
- Ax signature generation from Zod schemas
- Runtime validation pipeline
- Streaming validator with telemetry
- Domain-specific generators
- Input/output validation
- Error handling and reporting

✅ **Production Ready**:
- All 10 schemas registered
- All generators available
- Full validation pipeline operational
- API endpoints tested and working

🚀 **Next Steps**:
1. Integrate with existing PERMUTATION components
2. Add to brain system routing
3. Enhance Teacher-Student pattern
4. Add comprehensive logging
5. Monitor validation metrics

## 🎉 Benefits

1. **Type Safety**: Full TypeScript + Zod validation
2. **Runtime Safety**: Catch errors before they reach LLMs
3. **Performance**: Cached signatures and schemas
4. **Telemetry**: Detailed validation metrics
5. **Flexibility**: Multiple assertion levels
6. **Future Proof**: Ready for PR #394 integration
7. **Production Ready**: Tested and validated

## 📚 References

- [Ax LLM PR #394](https://github.com/ax-llm/ax/pull/394) - Deepen Zod integration in Ax
- [Zod Documentation](https://zod.dev)
- [Ax LLM Documentation](https://axllm.dev)
- `frontend/lib/zod-enhanced-validation.ts` - Our Zod schemas
- `frontend/lib/ax-zod-bridge.ts` - Integration implementation
- `frontend/app/api/ax-zod-demo/route.ts` - Demo endpoint
