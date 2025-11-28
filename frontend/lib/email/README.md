# Email System Architecture

## Principles Applied

1. **State belongs in files** - Configuration in JSON, not hardcoded
2. **Structured data** - Types and interfaces, not loose objects
3. **Separation of concerns** - Each module has a single responsibility
4. **Registry pattern** - Replaces large switch statements
5. **Error handling** - Structured errors, not string messages

## Module Structure

```
lib/email/
├── response-registry.ts      # Registry pattern for response generators
├── response-config.json      # Configuration (state in files)
├── context-builder.ts         # Context extraction and building
├── language-detection.ts     # Language detection with caching
├── error-handling.ts         # Structured error handling
└── README.md                 # This file
```

## Usage

### Registering Response Generators

```typescript
import { responseRegistry } from '@/lib/email/response-registry';

responseRegistry.register('water-damage-incident', {
  generator: generateWaterDamageResponse,
  subjectGenerator: (ctx) => ctx.unitNumber 
    ? `Re: Water Damage - Unit ${ctx.unitNumber}`
    : `Re: ${ctx.originalEmail.subject}`,
  requiresHumanReview: (ctx) => ctx.classification.confidence < 0.7
});
```

### Generating Responses

```typescript
import { buildResponseContext } from '@/lib/email/context-builder';
import { generateResponse } from '@/lib/email/response-registry';

const context = buildResponseContext(classification, originalEmail);
const result = generateResponse(context);
```

### Error Handling

```typescript
import { validateEmailRequest, createEmailError } from '@/lib/email/error-handling';

const validation = validateEmailRequest(request);
if (!validation.valid) {
  throw createEmailError(
    EmailErrorCode.INVALID_INPUT,
    'Invalid email request',
    { errors: validation.errors }
  );
}
```

## Benefits

1. **Maintainability** - Easy to add new templates without modifying switch statements
2. **Testability** - Each module can be tested independently
3. **Type Safety** - Structured types prevent errors
4. **Performance** - Caching and optimization isolated to specific modules
5. **Extensibility** - Registry pattern allows dynamic registration

## Migration Path

The old switch statement can be gradually migrated:

1. Extract response generators to separate functions
2. Register them in the registry
3. Update route handler to use registry
4. Remove switch statement

This allows incremental migration without breaking existing functionality.

