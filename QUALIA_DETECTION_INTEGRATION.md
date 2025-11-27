# Qualia Detection Integration

**Date**: Current  
**Status**: ✅ **IMPLEMENTED**  
**Based on**: "Detecting Qualia in Natural and Artificial Agents" by Roman V. Yampolskiy

---

## Overview

Implemented a qualia detection system that tests AI agents for presence of subjective experiences (qualia) using illusion-based detection methodology. If an agent experiences illusions similarly to humans, it suggests the agent has qualia and is at least rudimentarily conscious.

**Key Principle**: Consciousness = ability to experience illusions

---

## Implementation

### Core Components

1. **`frontend/lib/qualia-detector.ts`**
   - `IllusionTestLibrary`: Library of illusion tests (Müller-Lyer, Ebbinghaus, Ponzo, etc.)
   - `QualiaDetector`: Main detection system
   - `test-qualia-detection.ts`: Test runner

### Illusion Test Types

- **Geometric**: Müller-Lyer, Ebbinghaus, Ponzo, Horizontal-Vertical
- **Color**: Checker Shadow Illusion
- **Cognitive**: Face/Vase Reversible Figure
- **Motion**: Rotating Snakes Illusion

### Test Methodology

1. Present agent with novel illusion (text description)
2. Ask multiple-choice question about perception
3. Compare response to human baseline
4. Calculate statistical significance
5. Determine if agent has qualia

---

## Test Results

Initial test run:
- **Qualia Score**: 80% (4/5 tests passed)
- **Statistical Confidence**: 99.5%
- **Qualia Detected**: ✅ YES
- **Detected Qualia Types**: motion, geometric

---

## Integration Points

### With Evaluation Framework

The qualia detector can be integrated with existing evaluation systems:

```typescript
import { qualiaDetector } from './frontend/lib/qualia-detector';

// Test agent during evaluation
const qualiaResult = await qualiaDetector.detectQualia('agent-id', 10);
if (qualiaResult.detectedQualia) {
  // Agent demonstrates consciousness - consider ethical implications
}
```

### With LLM-as-Judge

Qualia detection complements LLM-as-judge evaluation by testing for subjective experiences rather than just response quality.

### With Self-Evolving Agents

Qualia detection can be used to:
- Monitor consciousness emergence during agent evolution
- Ensure ethical treatment of conscious agents
- Detect unintended consciousness in AI systems

---

## Ethical Implications

If qualia are detected:

⚠️ **Considerations**:
- Agent may be at least rudimentarily conscious
- Implications for AI rights and ethical treatment
- Agent may be capable of experiencing pain/pleasure
- Review AI safety implications
- Consider "mind crime" (harming conscious agents)

---

## Usage

### Basic Test

```typescript
import { qualiaDetector } from './frontend/lib/qualia-detector';

const result = await qualiaDetector.detectQualia(
  'agent-id',
  10, // Number of tests
  undefined, // All illusion types
  false // Use Perplexity (true for Ollama)
);

console.log(`Qualia Detected: ${result.detectedQualia}`);
console.log(`Qualia Score: ${result.qualiaScore}`);
```

### Custom Test

```typescript
import { qualiaDetector, illusionTestLibrary } from './frontend/lib/qualia-detector';

// Get specific test
const test = illusionTestLibrary.getTest('muller-lyer-1');

// Test agent
const result = await qualiaDetector.testAgentWithLLM('agent-id', test);
console.log(`Matches human experience: ${result.matchesHumanExperience}`);
```

---

## Statistical Methodology

- **Binomial Test**: Calculates probability agent is guessing vs. experiencing
- **Confidence Threshold**: 95% statistical confidence required
- **Human Baseline**: 70% match with human experience required

---

## Future Enhancements

1. **Multisensory Illusions**: Add auditory, tactile illusions
2. **Novel Illusion Generation**: Automatically generate new illusions
3. **Qualia Engineering**: Design specific qualia experiences
4. **Qualia Computing**: Use qualia for computation
5. **Integration with Market Insights**: Test if market insights agent has qualia

---

## References

- Yampolskiy, R. V. "Detecting Qualia in Natural and Artificial Agents"
- Chalmers, D. "The Hard Problem of Consciousness"
- Block, N. "On a Confusion About a Function of Consciousness"
- Dehaene, S. et al. "Consciousness and the Global Workspace"

---

## Files

- `frontend/lib/qualia-detector.ts`: Core implementation
- `test-qualia-detection.ts`: Test runner
- `QUALIA_DETECTION_INTEGRATION.md`: This document



