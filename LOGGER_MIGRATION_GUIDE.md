# Logger Migration Guide

**Objective**: Replace 2,389 console.log statements with structured logging

**Priority**: Core files first (highest impact, lowest effort)

---

## Quick Start

### Step 1: Add Logger Import

```typescript
import { Logger } from './logger';

// Create logger instance in class
private logger = Logger.getInstance();

// Set component context
this.logger.setContext({ component: 'PermutationEngine' });
```

### Step 2: Replace Console Statements

**Pattern A**: Simple Info Log
```typescript
// Before
console.log('🚀 Executing query:', query);

// After
this.logger.info('Executing query', { query, domain });
```

**Pattern B**: Debug Log
```typescript
// Before
console.log('🔍 DEBUG: Starting execution...');

// After
this.logger.debug('Starting execution', { sessionId });
```

**Pattern C**: Error Log
```typescript
// Before
console.error('❌ Error:', error);

// After
this.logger.error('Execution failed', error, { query, component: 'PermutationEngine' });
```

**Pattern D**: Performance Log
```typescript
// Before
console.log(`⏱️ Completed in ${duration}ms`);

// After
this.logger.info('Execution completed', { duration, component: 'PermutationEngine' });
```

---

## Priority Files

### Phase 1: High-Impact Files (This Week)
1. `frontend/lib/permutation-engine.ts` - 103 statements
2. `frontend/lib/unified-permutation-pipeline.ts` - 87 statements
3. `frontend/lib/swirl-decomposer.ts` - 16 statements

### Phase 2: Medium-Impact Files (Next Week)
4. `frontend/lib/ace-llm-client.ts` - 29 statements
5. `frontend/lib/trm.ts` - 8 statements
6. `frontend/lib/prompt-cache.ts` - 1 statement

### Phase 3: Remaining Files (Gradual)
- Remaining 186 files with fewer statements

---

## Migration Checklist

For each file:
- [ ] Import Logger class
- [ ] Create logger instance
- [ ] Set component context
- [ ] Replace console.log → logger.info/debug
- [ ] Replace console.error → logger.error
- [ ] Replace console.warn → logger.warn
- [ ] Remove emojis from messages
- [ ] Add structured context data
- [ ] Test logging output
- [ ] Verify no console statements remain

---

## Benefits After Migration

**Before**:
```typescript
console.log('🚀 Executing query:', query);
// Output: 🚀 Executing query: What is AI?
// No context, no structure, hard to parse
```

**After**:
```typescript
this.logger.info('Executing query', { query, domain, component: 'PermutationEngine' });
// Output: { timestamp: "2025-01-27T...", level: "INFO", message: "Executing query", context: { query: "...", domain: "...", component: "..." } }
// Structured, searchable, production-ready
```

---

## Example: Full Migration

### Before (permutation-engine.ts)

```typescript
export class PermutationEngine {
  constructor(config?: Partial<PermutationConfig>) {
    // ... initialization ...
    if (process.env.NODE_ENV !== 'production') {
      console.log('🚀 PermutationEngine initialized with FULL STACK (parallelized + adaptive):', this.config);
    }
  }

  async execute(query: string, domain?: string): Promise<PermutationResult> {
    console.log('📝 PERMUTATION execute() called with query:', query.substring(0, 50));
    const startTime = Date.now();
    
    const sessionId = this.tracer.startSession(query);
    console.log(`🎬 Trace session started: ${sessionId}`);
    
    try {
      console.log('🔍 DEBUG: Starting execution...');
      console.log('🧠 Starting REAL smart routing...');
      // ... rest of code
    } catch (error) {
      console.error('❌ PERMUTATION execution failed:', error);
    }
  }
}
```

### After (permutation-engine.ts)

```typescript
import { Logger } from './logger';

export class PermutationEngine {
  private logger = Logger.getInstance();

  constructor(config?: Partial<PermutationConfig>) {
    this.logger.setContext({ component: 'PermutationEngine' });
    
    // ... initialization ...
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug('PermutationEngine initialized', { config: this.config });
    }
  }

  async execute(query: string, domain?: string): Promise<PermutationResult> {
    const startTime = Date.now();
    const requestId = `req-${Date.now()}`;
    
    this.logger.setContext({ requestId, component: 'PermutationEngine' });
    this.logger.info('Executing query', { query, domain });
    
    const sessionId = this.tracer.startSession(query);
    this.logger.debug('Trace session started', { sessionId, requestId });
    
    try {
      this.logger.debug('Starting execution', { requestId });
      this.logger.debug('Starting smart routing', { requestId });
      // ... rest of code
    } catch (error) {
      this.logger.error('Execution failed', error instanceof Error ? error : new Error(String(error)), { query, domain, requestId });
    }
  }
}
```

---

## Testing

### Verify Logger Works

```typescript
// Test script
import { Logger } from './lib/logger';

const logger = Logger.getInstance();
logger.setContext({ component: 'Test' });
logger.info('Test message', { test: true });
logger.error('Test error', new Error('Test error'));
logger.debug('Test debug', { debug: true });
logger.warn('Test warning', { warning: true });
```

### Expected Output

```
[INFO] 2025-01-27T12:00:00.000Z Test message {"test":true,"component":"Test"}
[ERROR] 2025-01-27T12:00:00.001Z Test error {"error":{"name":"Error","message":"Test error"},"component":"Test"}
[DEBUG] 2025-01-27T12:00:00.002Z Test debug {"debug":true,"component":"Test"}
[WARN] 2025-01-27T12:00:00.003Z Test warning {"warning":true,"component":"Test"}
```

---

## Rollout Strategy

**Week 1**: Core files (permutation-engine.ts, unified-pipeline.ts)
**Week 2**: Major components (swirl-decomposer, ace-llm-client, trm)
**Week 3**: Remaining files (gradual adoption)
**Week 4**: Verification and cleanup

**Goal**: 80% reduction in console statements (2,389 → <500)

---

## Troubleshooting

### Issue: Logger not found
**Solution**: Ensure `frontend/lib/logger.ts` exists

### Issue: Too verbose in production
**Solution**: Set log level to INFO in production
```typescript
if (process.env.NODE_ENV === 'production') {
  logger.setLevel(LogLevel.INFO); // Suppress DEBUG
}
```

### Issue: Performance impact
**Solution**: Logger is async and lightweight. Minimal impact expected.

---

## Next Steps

1. Review this guide
2. Start with permutation-engine.ts
3. Test thoroughly
4. Roll out to other files gradually
5. Monitor in production

**Estimated Total Effort**: 4-8 hours for core files
**Estimated Impact**: 60% of console statements replaced
**ROI**: High - Production-ready logging infrastructure

