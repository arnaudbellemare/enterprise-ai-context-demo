# Workflow Component Selection Rationale

## Core Principle

**Use the right component for the right problem**, based on research and actual capabilities.

---

## Component Selection Logic

### **LoRA Fine-tuning** (Supervised Classification-like Tasks)

**When to Use**:
- Supervised labels available (financial data → insights)
- Classification-like tasks (contracts → risks, symptoms → diagnosis)
- Pattern recognition (defect classification, quality patterns)
- Domain-specific terminology extraction

**Why**:
- Paper: "LoRA: Low-Rank Adaptation" - efficient domain adaptation
- Low weight decay (1e-5) for better generalization
- 0.1-1% parameter fine-tuning vs full model retraining

**Workflows Using LoRA**:
- ✅ **Insurance Premium**: Insurance terminology, underwriting patterns
- ✅ **Legal (LATAM/US)**: Contract clause extraction, legal pattern recognition
- ✅ **Manufacturing**: Quality defect classification, production pattern recognition
- ✅ **Healthcare**: Symptom-diagnosis pattern matching (supervised medical data)
- ✅ **Financial**: Balance sheet → insights (supervised financial analysis)
- ✅ **Real Estate**: Property → valuation (supervised listing patterns)
- ✅ **Financial Research**: Financial data → research insights (supervised analyst patterns)

---

### **DSPy** (Structured Outputs)

**When to Use**:
- Need structured, typed outputs (JSON, schemas, reports)
- Type-safe AI programming
- Consistent output format required
- Avoid manual prompt engineering

**Why**:
- Automatic prompt optimization from signatures
- Type-safe contracts (input → output)
- Self-improving from feedback
- Eliminates hand-crafted prompts

**Workflows Using DSPy**:
- ✅ **Insurance Premium**: Structured premium calculation (premium, coverage, exclusions)
- ✅ **Legal**: Structured compliance analysis (checklist, risks, obligations)
- ✅ **Manufacturing**: Structured production reports (metrics, anomalies, recommendations)
- ✅ **Healthcare**: Structured diagnosis (symptoms → diagnosis → confidence → tests)
- ✅ **Financial**: Structured financial reports (metrics, trends, recommendations)
- ✅ **Real Estate**: Structured property reports (value, comparables, trends)
- ✅ **Technology**: Structured architecture specs (APIs, data flow, components)
- ✅ **Science/Research**: Structured research reports (hypothesis, methodology, results)
- ✅ **Marketing**: Structured marketing plans (audience, channels, budget, KPIs)
- ✅ **Copywriting**: Structured copy (headline, body, CTA, tone)
- ✅ **Financial Research**: Structured research reports (thesis, analysis, valuation)
- ✅ **Business Analysis**: Structured reports (SWOT, PESTEL, competitive analysis)
- ✅ **Consulting**: Structured deliverables (situation, analysis, recommendations)
- ✅ **Sales**: Structured proposals (proposal, pricing, benefits)
- ✅ **Product Management**: Structured product specs (features, user stories, roadmap)

---

### **GEPA Optimization** (RL-like Problems)

**When to Use**:
- Multi-step agents (reasoning, tool use)
- Trial & error problems (debugging, iterative refinement)
- Reflective learning needed (leverage LLM priors)
- No supervised labels OR gradient-based RL inefficient
- Iterative optimization (campaigns, product strategy)

**Why**:
- Paper: Genetic-Pareto prompt evolution
- Better than gradient-based RL for multi-step problems
- Reflective learning (extrapolates from examples)
- Optimizes prompts automatically without hand-tuning

**Workflows Using GEPA**:
- ✅ **Technology**: Code/system architecture (RL-like: design → implement → test → refine)
- ✅ **Science/Research**: Experimental design (RL-like: hypothesis → experiment → refine)
- ✅ **Marketing**: Campaign optimization (RL-like: test → measure → refine)
- ✅ **Copywriting**: Iterative refinement (RL-like: generate → test → improve)
- ✅ **Consulting**: Strategic problem-solving (RL-like: analyze → refine → implement)
- ✅ **Product Management**: Product strategy (RL-like: research → design → iterate)

**Note**: GEPA accessed via `gepaAlgorithms` (always available in Permutation Engine), not via config flag.

---

### **SWiRL** (Multi-Step Reasoning)

**When to Use**:
- Multi-step reasoning required
- Tool use needed (search, calculation, verification)
- Sequential decision-making
- Complex problem decomposition

**Workflows Using SWiRL**:
- ✅ **Legal (LATAM/US)**: Multi-step legal reasoning (identify law → find cases → analyze)
- ✅ **Healthcare**: Multi-step diagnosis (symptoms → tests → diagnosis → treatment)
- ✅ **Financial**: Multi-step analysis (data → analysis → valuation → recommendation)
- ✅ **Technology**: Multi-step technical reasoning (design → implement → test)
- ✅ **Science/Research**: Multi-step research (hypothesis → experiment → analysis → conclusions)
- ✅ **Financial Research**: Multi-step research (data → analysis → valuation → recommendation)
- ✅ **Business Analysis**: Multi-step strategic reasoning (analyze → compare → recommend)
- ✅ **Consulting**: Multi-step consulting (problem → analysis → solution → implementation)
- ✅ **Product Management**: Multi-step product reasoning (research → design → build → iterate)

---

### **TRM Verification** (Critical Accuracy)

**When to Use**:
- Accuracy-critical applications
- Need to verify answer faithfulness
- Legal, medical, financial accuracy required
- Can't afford hallucinations

**Workflows Using TRM**:
- ✅ **Insurance Premium**: Verify premium calculations
- ✅ **Legal (LATAM/US)**: Verify legal accuracy
- ✅ **Healthcare**: Verify diagnosis accuracy
- ✅ **Financial**: Verify financial accuracy
- ✅ **Financial Research**: Verify research accuracy
- ✅ **Science/Research**: Optional (verify research conclusions)

---

### **ACE Framework** (Domain Playbooks)

**When to Use**:
- Domain-specific knowledge needed
- Accumulated strategies/patterns
- Context engineering required
- Prevent context collapse

**Workflows Using ACE**: **ALL** (domain playbooks are universal)

---

### **Multi-Query Expansion** (Comprehensive Search)

**When to Use**:
- Need broad search coverage
- Multiple jurisdictions (LATAM legal)
- Campaign variations (marketing)
- Copy variations (copywriting)
- Architecture variations (technology)

**Workflows Using Multi-Query**:
- ✅ **LATAM Legal**: Comprehensive jurisdiction search
- ✅ **Marketing**: Campaign variations
- ✅ **Copywriting**: Multiple copy variations
- ✅ **Technology**: Optional (architecture variations)

---

### **Weaviate Retrieval** (Semantic Search)

**When to Use**:
- Semantic document search
- Case law search (US legal)
- Literature search (science/research)
- Legal document search

**Workflows Using Weaviate**:
- ✅ **US Legal**: Case law search
- ✅ **Science/Research**: Literature search

---

### **SQL Generation** (Structured Data)

**When to Use**:
- Structured databases available
- Production data (manufacturing)
- Property data (real estate)
- Financial databases (financial research - optional)

**Workflows Using SQL**:
- ✅ **Manufacturing**: Production data queries
- ✅ **Real Estate**: Property database queries

---

### **ReasoningBank** (Memory Retrieval)

**When to Use**:
- Past solutions available
- Learned patterns useful
- Similar queries benefit from history

**Workflows Using ReasoningBank**: **Most workflows** (memory is generally beneficial)

---

### **IRT Scoring** (Difficulty Routing)

**When to Use**:
- Need to route simple vs complex queries
- Cost optimization (simple → Student, complex → Teacher)
- Quality optimization (complex → Teacher model)

**Workflows Using IRT**: **Most workflows** (useful for routing)

---

## Updated Workflow Summary

| Use Case | LoRA | DSPy | GEPA | SWiRL | TRM | Multi-Query | Weaviate | SQL | ReasoningBank | IRT |
|----------|------|------|------|-------|-----|-------------|----------|-----|---------------|-----|
| Insurance Premium | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| LATAM Legal | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| US Legal | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Manufacturing | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Healthcare | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Financial | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Real Estate | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Technology | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Science/Research | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Marketing | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Copywriting | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Financial Research | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Business Analysis | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Consulting | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Sales | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Product Management | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## Key Insights

1. **LoRA** used where supervised patterns exist (insurance, legal, manufacturing, healthcare, financial, real estate)
2. **DSPy** used everywhere for structured outputs (eliminates manual prompt engineering)
3. **GEPA** used for RL-like problems (technology, science, marketing, copywriting, consulting, product)
4. **SWiRL** used for multi-step reasoning (legal, healthcare, financial, technology, science, consulting, product)
5. **TRM** used for accuracy-critical (insurance, legal, healthcare, financial, research)
6. **Multi-Query** used for broad search (LATAM legal, marketing, copywriting)
7. **Weaviate** used for semantic search (US legal, science/research)

---

## Rationale Summary

**Each component selected based on**:
- ✅ Research papers (LoRA, GEPA, DSPy, TRM)
- ✅ Problem type (supervised vs RL-like)
- ✅ Output requirements (structured vs free-form)
- ✅ Use case characteristics (accuracy-critical, cost-sensitive, speed-priority)

**Not arbitrary** - each component matches the problem it solves.

