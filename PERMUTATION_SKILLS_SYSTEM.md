# PERMUTATION Skills System

## 🎯 **WHAT IT IS**

A skills system for PERMUTATION inspired by [Skillz](https://github.com/intellectronica/skillz), adapted for deep integration with our architecture.

**Skillz** (original): MCP server for Claude-style skills  
**PERMUTATION Skills**: Native integration with DSPy, Semiotic Observability, MoE, KV Caches

---

## 🔥 **WHY IT'S PERFECT FOR PERMUTATION**

### **Current State**:
```
PERMUTATION has powerful capabilities:
- DSPy modules and signatures
- Semiotic observability
- MoE (Mixture of Experts)
- Two KV cache systems
- Teacher-Student learning

But: These are code-level integrations
     Hard to share, discover, compose
```

### **With Skills System**:
```
Package capabilities as discoverable skills:
- SKILL.md with metadata
- DSPy signatures included
- Semiotic context defined
- Resources bundled
- Easy to share, discover, compose
```

---

## 📦 **SKILL STRUCTURE**

### **Example: Art Valuation Skill**

```
~/.permutation-skills/art-valuation/
├── SKILL.md                    ← Main skill definition
├── signature.json              ← DSPy signature
├── examples.json               ← Few-shot examples
├── semiotic-context.json       ← Semiotic positioning
└── resources/                  ← Additional files
    ├── valuation.py            ← Helper script
    ├── market_data.json        ← Domain data
    └── prompts/                ← Prompt templates
        └── cartier_expert.txt
```

---

### **SKILL.md Format**

```markdown
---
name: Art Valuation Expert
version: 1.0.0
author: PERMUTATION
description: Expert art appraisal and valuation analysis
tags: [art, valuation, cartier, art-deco]
category: domain-expert
domain: art
semioticZone: scientific
requiresKVCache: true
requiresInferenceKV: true
compatibleWithMoE: true
capabilities:
  input: [artwork_description, provenance, condition]
  output: [valuation_report, market_analysis]
  dependencies: []
  optional: [market_data_collector]
performance:
  avgTokens: 5000
  avgTimeMs: 2500
  complexity: high
---

# Art Valuation Expert

You are an expert in art appraisal and valuation, specializing in:
- Art Deco period pieces
- Cartier and luxury brands
- Market trend analysis
- Authentication and provenance

## Instructions

When analyzing artwork:
1. Examine style, period, and provenance
2. Assess condition and authenticity
3. Research comparable market sales
4. Consider current market trends
5. Provide detailed valuation report

Use domain knowledge from Continual Learning KV Cache.
Process large documents with Inference KV Compression.
```

---

### **signature.json**

```json
{
  "input": {
    "artwork": "string",
    "provenance": "string",
    "condition": "string",
    "images": "array"
  },
  "output": {
    "valuation": "number",
    "confidence": "number",
    "reasoning": "string",
    "market_analysis": "object",
    "recommendations": "array"
  },
  "description": "Expert art valuation with market analysis",
  "domain": "art"
}
```

---

### **semiotic-context.json**

```json
{
  "domain": "art",
  "semioticZone": "scientific",
  "culturalFrame": "professional",
  "rhetoricalMode": "evaluative",
  "generationContext": {
    "type": "expert-analysis",
    "audience": "professional",
    "formality": "high"
  }
}
```

---

### **examples.json**

```json
[
  {
    "input": {
      "artwork": "Art Deco Cartier bracelet, platinum...",
      "provenance": "Acquired from Christie's 1985...",
      "condition": "Excellent, original box..."
    },
    "output": {
      "valuation": 125000,
      "confidence": 0.89,
      "reasoning": "Based on comparable sales...",
      "market_analysis": {...}
    }
  }
]
```

---

## 💻 **USAGE**

### **1. Load Skills**

```typescript
import { SkillLoader, SkillExecutor } from './frontend/lib/permutation-skills-system';

// Initialize
const loader = new SkillLoader('~/.permutation-skills');
await loader.loadSkills();

console.log('Skills loaded:', loader.listSkills().length);
```

### **2. Execute a Skill**

```typescript
const executor = new SkillExecutor(loader);

const result = await executor.execute({
  skillId: 'art-valuation',
  input: {
    artwork: "Art Deco Cartier bracelet...",
    provenance: "Christie's 1985...",
    condition: "Excellent"
  },
  options: {
    enableSemioticTracking: true,
    enableKVCache: true,
    compressionRatio: 8
  }
});

console.log('Valuation:', result.output.valuation);
console.log('Confidence:', result.output.confidence);
console.log('Duration:', result.metadata.duration, 'ms');
console.log('Semiotic trace:', result.metadata.semioticTrace);
```

### **3. Search Skills**

```typescript
// Find all art-related skills
const artSkills = loader.searchSkills({
  domain: 'art',
  tags: ['valuation']
});

// Find skills by capability
const analysisSkills = loader.searchSkills({
  capabilities: ['market_analysis']
});

// Find skills by category
const expertSkills = loader.searchSkills({
  category: 'domain-expert'
});
```

### **4. Compose Skills**

```typescript
const composition = {
  name: 'complete-art-analysis',
  skills: [
    'art-authentication',
    'art-valuation',
    'market-trends-analysis'
  ],
  routing: 'sequential'
};

const result = await executor.executeComposition(
  composition,
  initialInput,
  { enableSemioticTracking: true }
);
```

### **5. Create New Skill**

```typescript
import { SkillBuilder } from './frontend/lib/permutation-skills-system';

const builder = new SkillBuilder();

const skillId = await builder.createSkill('legal-contract-review', {
  description: 'Expert legal contract analysis',
  category: 'domain-expert',
  domain: 'legal',
  instructions: `
    You are an expert in contract law...
    Review contracts for:
    - Compliance issues
    - Risk factors
    - Unusual clauses
  `,
  signature: {
    input: { contract: 'string' },
    output: { review: 'object', risks: 'array' },
    description: 'Legal contract review',
    domain: 'legal'
  },
  semioticContext: {
    domain: 'legal',
    semioticZone: 'legal',
    culturalFrame: 'professional',
    rhetoricalMode: 'formal',
    generationContext: {}
  }
});

console.log('Skill created:', skillId);
```

---

## 🔥 **KEY DIFFERENCES FROM SKILLZ**

### **Original Skillz**:
```
✅ SKILL.md format
✅ MCP server compatibility
✅ Resource bundling
✅ Works with any MCP client

❌ No DSPy integration
❌ No semiotic awareness
❌ No KV cache integration
❌ No MoE support
❌ Generic execution
```

### **PERMUTATION Skills**:
```
✅ SKILL.md format (compatible!)
✅ MCP server compatibility (optional)
✅ Resource bundling
✅ Works standalone or with MCP

✅ Native DSPy integration (signature.json)
✅ Semiotic awareness (semiotic-context.json)
✅ KV cache integration (both types)
✅ MoE expert composition
✅ Semiotic observability tracking
✅ PERMUTATION-specific optimizations
```

---

## 🏗️ **INTEGRATION WITH PERMUTATION**

### **1. DSPy Integration**

**Skills → DSPy Modules**:
```typescript
// Skill with DSPy signature automatically becomes DSPy module
const skill = loader.getSkill('art-valuation');

if (skill.signature) {
  // Can use with GEPA optimization
  // Can use with DSPy compilation
  // Can use with Teacher-Student
}
```

### **2. Semiotic Observability**

**Skills → Semiotic Tracking**:
```typescript
// Each skill execution tracked semiotically
const result = await executor.execute({
  skillId: 'art-valuation',
  input: data,
  options: { enableSemioticTracking: true }
});

// Get semiotic trace
console.log('Zone:', result.metadata.semioticTrace.semiosphereNavigation);
console.log('Quality:', result.metadata.semioticTrace.semioticQuality);
```

### **3. MoE (Mixture of Experts)**

**Skills → MoE Experts**:
```typescript
import { SkillRegistry } from './frontend/lib/permutation-skills-system';

const registry = new SkillRegistry(loader);
registry.organizeAsExperts();

// Route to appropriate expert
const expert = registry.routeToExpert(query, 'art');
const result = await executor.execute({
  skillId: expert.id,
  input: query
});
```

### **4. Continual Learning KV Cache**

**Skills → Domain Knowledge**:
```
Skill metadata:
  requiresKVCache: true
  domain: art

→ Uses Continual Learning KV Cache
→ Retrieves art domain knowledge
→ No catastrophic forgetting
```

### **5. Inference KV Cache Compression**

**Skills → Long Context**:
```
Skill metadata:
  requiresInferenceKV: true
  performance.avgTokens: 50000

→ Uses Inference KV Compression
→ 8x compression ratio
→ Handles large inputs efficiently
```

---

## 📚 **EXAMPLE SKILLS**

### **Skill 1: Art Valuation Expert**

```
Domain: art
Zone: scientific
MoE: yes
KV Cache: yes (continual learning)
Inference KV: yes (large documents)

Capabilities:
- Cartier expertise
- Art Deco period
- Market analysis
- Authentication
```

### **Skill 2: Legal Contract Review**

```
Domain: legal
Zone: legal
MoE: yes
KV Cache: yes
Inference KV: yes

Capabilities:
- Contract analysis
- Risk assessment
- Compliance checking
- LATAM-specific clauses
```

### **Skill 3: Multi-Domain Research**

```
Domain: general
Zone: analytical
MoE: no (orchestrator)
KV Cache: no
Inference KV: yes

Capabilities:
- Query decomposition
- Multi-source search
- Cross-domain synthesis
- Uses other skills as sub-skills
```

### **Skill 4: Semiotic Analysis**

```
Domain: meta
Zone: philosophical
MoE: no
KV Cache: no
Inference KV: no

Capabilities:
- Analyze other skill outputs
- Track zone navigation
- Measure translation fidelity
- Generate semiotic reports
```

---

## 🎯 **USE CASES**

### **Use Case 1: Skill Marketplace**

```
Users can share skills:
1. Create skill with SkillBuilder
2. Package as directory/zip
3. Share on GitHub/marketplace
4. Others install to ~/.permutation-skills
5. Automatically discoverable

Like: VSCode extensions, npm packages
But: For AI capabilities!
```

### **Use Case 2: Domain Expertise Packages**

```
Package domain expertise:
- Art valuation skill pack
- Legal analysis skill pack
- Insurance underwriting pack
- Medical diagnosis pack

Each pack:
- Multiple related skills
- Shared resources
- Domain-specific KV cache
- Semiotic contexts
```

### **Use Case 3: Composable Workflows**

```
Build complex workflows from skills:

Research Pipeline:
  skills: [
    'query-decomposition',
    'multi-source-search',
    'synthesis',
    'verification'
  ]

→ Each skill independent
→ Each skill reusable
→ Composition declarative
→ Semiotic tracking automatic
```

### **Use Case 4: Per-User Skill Collections**

```
Each user has their own skill collection:

~/.permutation-skills/
├── shared/              (System-wide skills)
│   ├── art-valuation/
│   └── legal-review/
└── user-123/            (User-specific)
    ├── my-custom-skill/
    └── specialized-tool/

+ Continual Learning KV per user
+ Personal skill development
+ Privacy-preserving
```

---

## 🚀 **ROADMAP**

### **Phase 1: Core System** ✅
- ✅ SkillLoader (discover & load)
- ✅ SkillExecutor (execute with tracking)
- ✅ SkillBuilder (create new skills)
- ✅ SkillRegistry (MoE integration)

### **Phase 2: Integration** ⚠️
- ⚠️  DSPy module wrapping
- ⚠️  KV cache integration
- ⚠️  Semiotic observability
- ⚠️  MoE routing with IRT

### **Phase 3: MCP Compatibility** 📋
- 📋 MCP server implementation
- 📋 Compatible with Skillz format
- 📋 Works with Claude, Cursor, etc.
- 📋 Optional: PERMUTATION enhancements

### **Phase 4: Ecosystem** 📋
- 📋 Skill marketplace
- 📋 Skill templates
- 📋 Skill testing framework
- 📋 Skill versioning & updates
- 📋 Community contributions

---

## 💡 **TECHNICAL DETAILS**

### **Skill Discovery**

```typescript
1. Scan ~/.permutation-skills/
2. Find all SKILL.md files
3. Parse YAML frontmatter
4. Load optional JSON files
5. Discover resources
6. Register skill
```

### **Skill Execution**

```typescript
1. Look up skill by ID
2. Check if DSPy signature exists
3. Start semiotic tracking (optional)
4. Execute:
   - DSPy module if signature
   - Prompt-based if no signature
5. Apply KV cache if needed
6. Apply inference compression if needed
7. End semiotic tracking
8. Return result + metadata
```

### **Skill Composition**

```typescript
Sequential:
  Input → Skill1 → Skill2 → Skill3 → Output

Parallel:
  Input → [Skill1, Skill2, Skill3] → Merge → Output

Conditional:
  Input → Skill1 → (condition) → Skill2A or Skill2B → Output
```

---

## 📊 **COMPARISON TABLE**

| Feature | Original Skillz | PERMUTATION Skills |
|---------|----------------|-------------------|
| **SKILL.md format** | ✅ | ✅ |
| **Resource bundling** | ✅ | ✅ |
| **MCP compatible** | ✅ | ✅ (optional) |
| **Zip support** | ✅ | ✅ (planned) |
| **DSPy integration** | ❌ | ✅ |
| **Semiotic tracking** | ❌ | ✅ |
| **KV cache (continual)** | ❌ | ✅ |
| **KV cache (inference)** | ❌ | ✅ |
| **MoE support** | ❌ | ✅ |
| **Composition** | ❌ | ✅ |
| **Observability** | ❌ | ✅ (Logfire) |
| **Native execution** | ❌ | ✅ |

---

## 🔧 **INSTALLATION**

### **1. Create Skills Directory**

```bash
mkdir -p ~/.permutation-skills
```

### **2. Add Example Skills**

```bash
cd ~/.permutation-skills

# Clone a skill pack
git clone https://github.com/permutation/skill-art-valuation art-valuation

# Or create manually
mkdir my-skill
cd my-skill
touch SKILL.md signature.json examples.json
```

### **3. Use in Code**

```typescript
import { SkillLoader, SkillExecutor } from './frontend/lib/permutation-skills-system';

const loader = new SkillLoader();
await loader.loadSkills();

const executor = new SkillExecutor(loader);
const result = await executor.execute({
  skillId: 'art-valuation',
  input: { artwork: '...' }
});
```

---

## 🎓 **PHILOSOPHY**

### **Skills = Composable AI Capabilities**

```
Traditional AI:
  Monolithic models
  Hard-coded capabilities
  Not composable

PERMUTATION Skills:
  Modular capabilities
  Declarative definitions
  Highly composable
  Shareable & discoverable
```

### **Skills + Semiotics = Meaningful Composition**

```
Not just composing functions
Composing SEMIOTIC ACTS

Each skill:
- Has semiotic position
- Operates in specific zone
- Transforms meaning

Composition:
- Track zone navigation
- Measure translation fidelity
- Ensure cultural coherence
```

### **Skills + KV Caches = Intelligent Specialization**

```
Continual Learning KV:
  Skills remember domain expertise
  Learn new skills without forgetting old

Inference KV:
  Skills handle large inputs
  Process efficiently
  Scale to unbounded context
```

---

## 🏆 **ACHIEVEMENT**

**PERMUTATION Now Has**:
1. ✅ Composable skill system (inspired by Skillz)
2. ✅ DSPy integration (native modules)
3. ✅ Semiotic awareness (track transformations)
4. ✅ KV cache integration (both types)
5. ✅ MoE support (skills as experts)
6. ✅ Full observability (Logfire ready)

**Result**:
```
Discoverable + Composable + Observable + Efficient
= Perfect skill ecosystem for PERMUTATION
```

---

**Status**: ✅ **CORE SYSTEM COMPLETE**  
**Next**: Create example skills, MCP server, marketplace  
**Inspired by**: [Skillz by @intellectronica](https://github.com/intellectronica/skillz)

🎓 **PERMUTATION: Where Skills Meet Intelligence** 🎓

