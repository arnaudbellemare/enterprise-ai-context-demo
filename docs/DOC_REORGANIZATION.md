# Documentation Reorganization Plan

## Goal
Transform this repository into a clean, minimal, readable, hackable, and maximally forkable "strong baseline" stack for advanced AI research.

## Current State
- **284 markdown files** in root directory
- Mix of development logs, guides, benchmarks, and research notes
- Difficult to navigate for new users/forkers

## New Structure

```
enterprise-ai-context-demo/
├── README.md                    # Clean, focused introduction
├── QUICK_START.md               # 5-minute getting started
├── ARCHITECTURE.md              # System design overview
├── CONTRIBUTING.md              # How to contribute
├── LICENSE                      # MIT License
├── docs/
│   ├── architecture/            # System design docs
│   │   ├── permutation-engine.md
│   │   ├── ace-framework.md
│   │   ├── dspy-integration.md
│   │   └── data-flow.md
│   ├── guides/                  # How-to guides
│   │   ├── getting-started.md
│   │   ├── running-benchmarks.md
│   │   ├── adding-domains.md
│   │   ├── cost-optimization.md
│   │   └── deployment.md
│   ├── benchmarks/              # Benchmark results & methodology
│   │   ├── methodology.md
│   │   ├── results.md
│   │   └── comparison.md
│   ├── research/                # Research notes & analysis
│   │   ├── gepa-optimization.md
│   │   ├── irt-calibration.md
│   │   ├── lora-integration.md
│   │   └── competitive-analysis.md
│   └── archive/                 # Development logs (for reference)
│       └── [all status/progress files]
├── examples/                    # Example code & usage
│   ├── basic-query.ts
│   ├── multi-domain.ts
│   └── custom-agent.ts
└── frontend/
    └── [existing structure]
```

## Core Documentation (Keep & Organize)

### Architecture Docs
- System design and component interaction
- Core concepts (ACE, GEPA, DSPy, IRT, etc.)
- Data flow diagrams

### User Guides
- Quick start (5 minutes)
- Running benchmarks
- Adding new domains
- Cost optimization
- Deployment guide

### Benchmarks
- Methodology
- Results summary
- Competitive comparison

### Research Notes
- GEPA optimization insights
- IRT calibration methodology
- LoRA integration approach
- Competitive analysis

## Archive (Move to docs/archive/)

Development logs and status files:
- All files with COMPLETE, STATUS, SUCCESS, PROGRESS, SUMMARY, PROOF
- Implementation verification logs
- Test results (keep summary in benchmarks/)
- Git push confirmations
- Session summaries

## Benefits

1. **Forkability**: Clear structure, easy to understand
2. **Discoverability**: Organized documentation by purpose
3. **Professionalism**: Clean root directory
4. **Maintainability**: Clear separation of concerns
5. **Research Potential**: Archive preserves development journey for reference

## Implementation Steps

1. ✅ Create docs/ structure
2. Create new core documentation
3. Move files to appropriate locations
4. Update README with new structure
5. Create QUICK_START.md
6. Create ARCHITECTURE.md
7. Consolidate benchmarks
8. Archive development logs
9. Create examples/
10. Update package.json scripts

