# Security Audit: eval() and Function() Usage

**Date**: 2025-10-21
**Status**: ⚠️ **REQUIRES REVIEW**
**Files Affected**: 22
**Risk Level**: MEDIUM to HIGH

---

## Executive Summary

This audit identifies all uses of `eval()`, `Function()`, and `new Function()` in the codebase. These constructs execute arbitrary code and pose security risks if used with unsanitized user input.

---

## Categorized Findings

### 🔴 HIGH RISK - Requires Immediate Action

#### 1. CEL Expression Evaluator
**File**: [`frontend/app/api/cel/execute/route.ts`](frontend/app/api/cel/execute/route.ts)
**Lines**: 92, 97-106, 111
**Usage**: `new Function()` to evaluate user-provided CEL expressions

**Risk**:
- Accepts arbitrary expressions from API requests
- Uses `with(context)` which bypasses scope restrictions
- Direct code execution without sandbox

**Current Mitigation**:
- Limited context objects provided
- String replacement for common patterns
- Try-catch error handling

**Recommended Fix**:
```typescript
// Option 1: Use a proper CEL library
import { CEL } from '@google-cloud/cel';
const cel = new CEL();
const ast = cel.compile(expression);
const result = ast.evaluate(context);

// Option 2: Use safe expression parser
import { parse } from 'expr-eval';
const parser = new Parser();
const expr = parser.parse(expression);
const result = expr.evaluate(context);

// Option 3: Implement whitelist-based evaluation
const ALLOWED_OPERATIONS = ['add', 'subtract', 'compare'];
function safeEvaluate(expression: string, context: any) {
  const ast = parseExpression(expression);
  validateAST(ast, ALLOWED_OPERATIONS);
  return evaluateAST(ast, context);
}
```

**Priority**: HIGH - Replace before production deployment

---

#### 2. Tool Calling Calculator
**File**: [`frontend/lib/tool-calling-system.ts:292`](frontend/lib/tool-calling-system.ts#L292)
**Usage**: `eval()` for mathematical expressions

**Risk**:
- Direct eval() of user input
- Regex sanitization `replace(/[^0-9+\-*/().\s]/g, '')` is insufficient
- Can be bypassed with expressions like `(()=>alert(1))()`

**Current Code**:
```typescript
const result = eval(params.expression.replace(/[^0-9+\-*/().\s]/g, ''));
```

**Recommended Fix**:
```typescript
import { Parser } from 'expr-eval';

const calculator = {
  name: 'calculator',
  description: 'Evaluate mathematical expressions',
  execute: async (params: { expression: string }) => {
    try {
      // Use safe math expression parser
      const parser = new Parser();
      const expr = parser.parse(params.expression);

      // Only allow mathematical operations
      const result = expr.evaluate({});

      return { result, expression: params.expression };
    } catch (error) {
      throw new Error(`Invalid expression: ${params.expression}`);
    }
  }
};
```

**Priority**: HIGH - Security vulnerability

---

### 🟡 MEDIUM RISK - Review and Document

#### 3. Documentation Examples
**Files**:
- `frontend/lib/brain-skills/README.md`
- `frontend/lib/brain-skills/INTEGRATION_GUIDE.md`
- `frontend/lib/brain-skills/QUICK_REFERENCE.md`

**Risk**: Documentation shows `eval()` examples that developers might copy

**Recommended Fix**: Update documentation to show safe alternatives

---

### 🟢 LOW RISK - Monitor

#### 4. Test and Benchmark Files
**Files**: Various test and benchmarking scripts

**Risk**: Limited to development/testing environments

**Action**: Document that these should never run in production

---

## Systematic Remediation Plan

### Phase 1: Immediate (This Sprint)
1. **Replace tool-calling-system.ts eval()** with expr-eval Parser
2. **Document CEL security risk** and create backlog item for proper CEL library
3. **Add security headers** to all API routes accepting expressions

### Phase 2: Short Term (1-2 Months)
4. **Implement proper CEL library** (Google CEL or equivalent)
5. **Add input validation** and rate limiting to expression endpoints
6. **Security testing** - penetration test expression evaluation endpoints

### Phase 3: Long Term (3-6 Months)
7. **Audit all user input** processing throughout the application
8. **Implement Content Security Policy** to prevent script injection
9. **Add security monitoring** for suspicious expression patterns

---

## Safe Alternatives

### For Mathematical Expressions
```bash
npm install expr-eval
```

```typescript
import { Parser } from 'expr-eval';

const parser = new Parser();
const expr = parser.parse('2 * (3 + 4)');
const result = expr.evaluate({}); // 14
```

### For CEL Expressions
```bash
npm install @google-cloud/cel
```

```typescript
import { CEL } from '@google-cloud/cel';

const cel = new CEL();
const expression = 'user.age >= 18 && user.country == "US"';
const program = cel.compile(expression);
const result = program.evaluate({ user: { age: 25, country: 'US' } });
```

### For JSON Path Queries
```bash
npm install jsonpath-plus
```

```typescript
import { JSONPath } from 'jsonpath-plus';

const data = { users: [{ name: 'Alice', age: 30 }] };
const result = JSONPath({ path: '$.users[?(@.age >= 25)]', json: data });
```

---

## Security Best Practices

1. **Never use eval() with user input** - Even with sanitization
2. **Use purpose-built parsers** - Libraries designed for safe evaluation
3. **Validate input** - Whitelist allowed operations/functions
4. **Limit scope** - Provide minimal context to evaluators
5. **Rate limit** - Prevent abuse of expression evaluation endpoints
6. **Log suspicious patterns** - Monitor for injection attempts
7. **Add timeouts** - Prevent infinite loops in expressions
8. **Test security** - Penetration testing for all expression endpoints

---

## Monitoring and Detection

Add to your monitoring system:

```typescript
// Monitor suspicious patterns
const SUSPICIOUS_PATTERNS = [
  /constructor/i,
  /__proto__/i,
  /prototype/i,
  /require\(/i,
  /import\(/i,
  /process\./i,
  /global\./i
];

function detectSuspiciousExpression(expression: string): boolean {
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(expression));
}

// Log and alert
if (detectSuspiciousExpression(expression)) {
  logger.warn('Suspicious expression detected', {
    expression,
    source: request.ip,
    user: request.user?.id
  });
  // Optional: block request
  throw new Error('Invalid expression');
}
```

---

## Approval Checklist

Before deploying to production:

- [ ] All HIGH RISK eval() usage replaced or secured
- [ ] Security testing completed on expression endpoints
- [ ] Rate limiting implemented
- [ ] Monitoring and alerting configured
- [ ] Documentation updated with safe patterns
- [ ] Team training on secure expression evaluation

---

## References

- [OWASP: Code Injection](https://owasp.org/www-community/attacks/Code_Injection)
- [CEL Specification](https://github.com/google/cel-spec)
- [expr-eval Library](https://github.com/silentmatt/expr-eval)
- [Sandboxed JavaScript Execution](https://github.com/patriksimek/vm2)

---

**Next Review Date**: 2025-11-21
**Security Contact**: [Your Security Team]
