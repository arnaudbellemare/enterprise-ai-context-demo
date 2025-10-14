# Contributing to PERMUTATION

Thank you for your interest in contributing! PERMUTATION is designed to be a **research harness** and **benchmark suite** for advanced AI techniques.

## Types of Contributions

We welcome contributions in several areas:

### 1. 🔬 Research Implementations

Implement new research techniques:
- New optimization algorithms (beyond GEPA)
- Novel routing strategies (beyond IRT)
- Advanced memory systems (beyond ReasoningBank)
- Multi-agent collaboration patterns

**Requirements**:
- Link to published paper or preprint
- Faithful implementation of the technique
- Benchmark results vs. baseline
- Documentation of methodology

**Example**: See `docs/research/gepa-optimization.md` for reference

### 2. 📊 Benchmarks

Propose or run new benchmarks:
- New evaluation metrics
- Domain-specific test suites
- Comparison with other frameworks
- Ablation studies

**Requirements**:
- Reproducible methodology
- Statistical significance testing
- Clear reporting format
- Baseline comparisons

**Example**: See `docs/benchmarks/methodology.md`

### 3. 🎯 New Domains

Extend PERMUTATION to new domains:
- Healthcare
- Legal
- Scientific research
- Education
- Manufacturing
- etc.

**Requirements**:
- Domain-specific test queries (minimum 50)
- LoRA configuration
- ReasoningBank seed memories
- (Optional) SQL schema for structured data

**Example**: See `docs/guides/adding-domains.md`

### 4. 🛠️ Code Quality

Improve the codebase:
- Refactoring for clarity
- Performance optimizations
- Bug fixes
- Test coverage improvements

**Requirements**:
- Follow existing code style
- Add tests for new code
- Update documentation
- No breaking changes (without discussion)

### 5. 📚 Documentation

Improve or add documentation:
- Clarify existing docs
- Add examples
- Create tutorials
- Fix typos

**Requirements**:
- Clear, concise writing
- Code examples that run
- Proper markdown formatting

## Getting Started

### 1. Fork & Clone

```bash
git clone https://github.com/your-username/permutation.git
cd permutation
cd frontend
npm install
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
# or
git checkout -b research/new-technique
```

Branch naming:
- `feature/*` - New features
- `fix/*` - Bug fixes
- `research/*` - Research implementations
- `benchmark/*` - New benchmarks
- `docs/*` - Documentation only

### 3. Make Your Changes

Follow the guidelines below for your contribution type.

### 4. Test Your Changes

```bash
# Run all tests
npm run test:comprehensive

# Run specific tests
npm run test:integration
npm run benchmark:complete
```

Ensure all tests pass before submitting.

### 5. Commit

Use clear commit messages:

```bash
git commit -m "feat: Add healthcare domain with IRT calibration"
# or
git commit -m "fix: Correct IRT difficulty calculation for multi-hop queries"
# or
git commit -m "research: Implement MCTS-based prompt optimization (arXiv:XXXX.XXXXX)"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `research:` - Research implementation
- `benchmark:` - New benchmark
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Test improvements
- `perf:` - Performance improvement

### 6. Push & Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Contribution Guidelines by Type

### Research Implementation

If you're implementing a research paper:

1. **Create research doc**: `docs/research/your-technique.md`
   ```markdown
   # Your Technique Name
   
   ## Paper
   - Title: ...
   - Authors: ...
   - Link: arXiv:XXXX.XXXXX
   
   ## Implementation Details
   [How you implemented it faithfully]
   
   ## Benchmark Results
   [Comparison vs. baseline]
   
   ## Usage
   [How to use in PERMUTATION]
   ```

2. **Implement the technique**: Create new file in `frontend/lib/your-technique.ts`

3. **Add to PermutationEngine**: Integrate as optional component

4. **Benchmark**: Run full benchmark suite
   ```bash
   npm run benchmark:complete
   ```

5. **Document results**: Add to `docs/benchmarks/results.md`

### Benchmark Contribution

If you're adding a new benchmark:

1. **Create benchmark file**: `frontend/benchmarks/your-benchmark.ts`

2. **Use standard format**:
   ```typescript
   export async function runYourBenchmark() {
     const results = {
       name: 'Your Benchmark',
       methodology: '...',
       queries: [...],
       results: [],
       statistics: {
         mean_quality: 0,
         std_dev: 0,
         p_value: 0,  // vs. baseline
       }
     };
     
     // Run tests
     for (const query of queries) {
       const result = await engine.execute(query);
       results.results.push(result);
     }
     
     // Calculate statistics
     return results;
   }
   ```

3. **Add to benchmark suite**: Update `package.json`:
   ```json
   "scripts": {
     "benchmark:your-benchmark": "npx tsx frontend/benchmarks/your-benchmark.ts"
   }
   ```

4. **Document methodology**: `docs/benchmarks/your-benchmark.md`

5. **Submit results**: PR with results JSON and analysis

### Domain Contribution

If you're adding a new domain:

1. **Create domain config**: `frontend/lib/domains/your-domain.ts`
   ```typescript
   export const yourDomainConfig = {
     name: 'your_domain',
     lora: { rank: 8, alpha: 16, weight_decay: 0.01 },
     irt_base_difficulty: 0.5,
     test_queries: [
       'Example query 1',
       'Example query 2',
       // ... at least 50 queries
     ]
   };
   ```

2. **Seed ReasoningBank**: Create migration
   ```sql
   INSERT INTO reasoning_bank (content, domain, success_count)
   VALUES
     ('Strategy 1 for your domain', 'your_domain', 1),
     ('Strategy 2 for your domain', 'your_domain', 1);
   ```

3. **(Optional) Add SQL tables**:
   ```sql
   CREATE TABLE your_domain_data (
     id UUID PRIMARY KEY,
     -- your fields
   );
   ```

4. **Add detection rules**: Update `detectDomain()` in `permutation-engine.ts`

5. **Test thoroughly**:
   ```bash
   npm run test:domain:your-domain
   ```

6. **Document**: `docs/domains/your-domain.md`

## Code Style

### TypeScript

- Use TypeScript strict mode
- Export interfaces for public APIs
- Document complex functions
- Prefer functional programming
- Use async/await (not .then())

Example:
```typescript
/**
 * Calculates IRT difficulty for a query
 * @param query - The user query
 * @param domain - Domain classification
 * @returns Difficulty score (0-1)
 */
export async function calculateIRTDifficulty(
  query: string,
  domain: string
): Promise<number> {
  // Implementation
}
```

### File Organization

```
frontend/lib/
├── permutation-engine.ts    # Main engine
├── ace-framework.ts         # ACE implementation
├── dspy-refine.ts          # DSPy implementation
├── irt-calculator.ts       # IRT implementation
└── domains/                # Domain-specific code
    ├── financial.ts
    ├── crypto.ts
    └── your-domain.ts
```

### Testing

- Write tests for new functions
- Use realistic test data
- Test edge cases
- Benchmark performance

Example:
```typescript
import { test, expect } from '@jest/globals';
import { calculateIRTDifficulty } from './irt-calculator';

test('IRT difficulty for simple query', async () => {
  const difficulty = await calculateIRTDifficulty(
    'What is 2+2?',
    'general'
  );
  expect(difficulty).toBeLessThan(0.3);  // Easy
});

test('IRT difficulty for complex query', async () => {
  const difficulty = await calculateIRTDifficulty(
    'Calculate the eigen decomposition of...',
    'scientific'
  );
  expect(difficulty).toBeGreaterThan(0.7);  // Hard
});
```

## Review Process

1. **Automated Checks**
   - Linting (eslint)
   - Type checking (tsc)
   - Tests (jest)
   - Build (next build)

2. **Code Review**
   - At least one maintainer approval
   - Focus on correctness, clarity, performance
   - Research implementations: verify against paper

3. **Benchmark Review**
   - Statistical significance required
   - Reproducible results
   - Fair comparison

4. **Merge**
   - Squash commits (for clean history)
   - Update CHANGELOG.md
   - Close related issues

## Research Ethics

If you're implementing published research:

1. ✅ **Cite the paper**: Link to original work
2. ✅ **Credit authors**: Mention in documentation
3. ✅ **Faithful implementation**: Don't modify the technique
4. ✅ **Report honestly**: No cherry-picking results
5. ✅ **Reproducibility**: Share methodology and data

## Benchmark Ethics

If you're running benchmarks:

1. ✅ **Fair comparison**: Use same hardware, models, prompts
2. ✅ **Statistical rigor**: Report std dev, confidence intervals, p-values
3. ✅ **Transparency**: Share all results (not just best)
4. ✅ **Reproducibility**: Document exact setup
5. ✅ **Versioning**: Note version of all tools/models

## Communication

- **Questions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Bugs**: [GitHub Issues](https://github.com/your-repo/issues)
- **Chat**: [Discord](https://discord.gg/your-server)
- **Email**: research@permutation.ai

## Recognition

Contributors will be recognized in:
- README.md (Contributors section)
- CHANGELOG.md (Per release)
- Published papers (if significant research contribution)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Example Contribution Flow

### Adding a New Research Technique

```bash
# 1. Fork and clone
git clone https://github.com/your-username/permutation.git
cd permutation

# 2. Create branch
git checkout -b research/mcts-prompt-optimization

# 3. Implement
# Create frontend/lib/mcts-optimizer.ts
# Add to permutation-engine.ts

# 4. Document
# Create docs/research/mcts-optimization.md

# 5. Benchmark
npm run benchmark:complete
# Save results to docs/benchmarks/mcts-results.json

# 6. Test
npm run test:comprehensive

# 7. Commit
git add .
git commit -m "research: Implement MCTS prompt optimization (arXiv:2401.12345)"

# 8. Push and PR
git push origin research/mcts-prompt-optimization
# Create PR on GitHub with description and results
```

---

**Thank you for contributing to PERMUTATION!** 🎉

Your work helps advance the state of AI research and makes better tools for everyone.

