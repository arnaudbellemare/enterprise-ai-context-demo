# LoRA Best Practices - For Supervised Fine-Tuning

**Important Note**: Our system uses LoRA for **Supervised Fine-Tuning (SFT)**, not Reinforcement Learning (RL). These best practices apply to both RL and SFT, but our use case is SFT.

**Reference**: These practices are validated by Thinking Machines research on "LoRA Without Regret" (for RL), but they also work excellently for SFT tasks.

---

## Core Principles

### 1. **LoRA Alpha >= LoRA Rank** (Preferably 2×Rank)

**Rule**: `lora_alpha = 2 * rank` (minimum: `lora_alpha >= rank`)

**Rationale**:
- Alpha controls the scaling of LoRA adapters
- 2×rank provides optimal balance between adaptation strength and stability
- Too low alpha (e.g., alpha = rank) may under-adapt
- Too high alpha (e.g., 4×rank) may cause instability

**Example**:
```yaml
r: 16
lora_alpha: 32  # 2*rank ✅
```

**Our Implementation**:
- ✅ All domains use `alpha = 2*rank`
- ✅ Default: `r=16, alpha=32`
- ✅ Configurable per domain but maintains 2×ratio

---

### 2. **10x Higher Learning Rates** (2e-4 instead of 2e-5)

**Rule**: Use `2e-4` (or higher) for LoRA training instead of `2e-5` (typical full fine-tuning rate)

**Rationale**:
- LoRA adapters are small, parameter-efficient
- Higher learning rates help adapters learn faster
- Works particularly well for RL (reinforcement learning) applications
- 10× higher LR doesn't destabilize training due to LoRA's parameter efficiency

**Research**: Thinking Machines collaboration showed LoRA works excellently for RL when using higher learning rates.

**Example**:
```yaml
learning_rate: 2e-4  # 10x higher than 2e-5 ✅
```

**Our Implementation**:
- ✅ Default: `learning_rate = 2e-4`
- ✅ All domain configs use `2e-4`
- ✅ Can be overridden but defaults to 10× higher rate

---

### 3. **LoRA on ALL MLP and Attention Layers**

**Rule**: Apply LoRA to all projection layers in both attention and MLP modules

**Target Modules** (Comprehensive):
```yaml
target_modules:
  # Attention projections (QKV + Output)
  - q_proj    # Query projection
  - k_proj    # Key projection
  - v_proj    # Value projection
  - o_proj    # Output projection
  # MLP projections (Gate + Up + Down)
  - gate_proj # Gate projection (MLP gating)
  - up_proj   # Up projection (MLP expansion)
  - down_proj # Down projection (MLP compression)
  # Additional MLP layers if present
  - mlp       # Full MLP module (if separate)
  - mlp_proj  # MLP projection (if separate)
```

**Rationale**:
- Comprehensive adaptation across all learnable components
- Attention layers handle reasoning/understanding
- MLP layers handle transformation/processing
- Full coverage ensures maximum domain adaptation

**Our Implementation**:
- ✅ All configs include all 7-9 target modules
- ✅ Covers both attention and MLP comprehensively
- ✅ Adapts to model architecture (some models have `mlp`, some don't)

---

## Complete Configuration Template

```yaml
lora:
  r: 16
  lora_alpha: 32              # 2*rank ✅
  lora_dropout: 0.05
  target_modules:             # ALL MLP + Attention ✅
    - q_proj
    - k_proj
    - v_proj
    - o_proj
    - gate_proj
    - up_proj
    - down_proj
    - mlp
    - mlp_proj

training:
  learning_rate: 2e-4         # 10x higher LR ✅
  weight_decay: 1e-5          # Low weight decay
  optimizer: "adamw_torch"
  lr_scheduler_type: "cosine"
```

---

## Research Reference

**Thinking Machines Collaboration**:
- "LoRA Without Regret" blog post
- Demonstrates LoRA's effectiveness for RL applications
- Validates higher learning rates for LoRA adapters
- Shows comprehensive layer coverage improves adaptation

**Key Findings**:
1. LoRA works excellently for RL when configured correctly
2. Higher learning rates (10×) don't destabilize LoRA training
3. Comprehensive layer coverage (all MLP + Attention) maximizes adaptation
4. Alpha = 2×rank provides optimal scaling

---

## Domain-Specific Applications

All domains in our system use these best practices:

| Domain | Rank | Alpha | LR | Target Modules |
|--------|------|-------|----|-------------- |
| Financial | 16 | 32 (2×) | 2e-4 | All MLP + Attn |
| Legal | 16 | 32 (2×) | 2e-4 | All MLP + Attn |
| Healthcare | 16 | 32 (2×) | 2e-4 | All MLP + Attn |
| Manufacturing | 16 | 32 (2×) | 2e-4 | All MLP + Attn |
| Real Estate | 16 | 32 (2×) | 2e-4 | All MLP + Attn |
| Insurance | 16 | 32 (2×) | 2e-4 | All MLP + Attn |
| Marketing | 16 | 32 (2×) | 2e-4 | All MLP + Attn |
| Technology | 16 | 32 (2×) | 2e-4 | All MLP + Attn |

**All domains follow the same best practices** for consistency and optimal performance.

---

## Implementation Files

These configurations are applied in:

1. **`lora-finetuning/lora_config.yaml`** - Main configuration file
2. **`frontend/app/api/lora-real-training/route.ts`** - API route for training
3. **`frontend/lib/lora-parameters.ts`** - Domain-specific parameter retrieval

---

## Benefits of These Practices

1. **Faster Convergence**: Higher learning rates accelerate adapter learning
2. **Better Adaptation**: Comprehensive layer coverage maximizes domain adaptation
3. **Stable Training**: 2×rank alpha provides optimal scaling without instability
4. **RL Compatibility**: Works excellently for reinforcement learning applications
5. **Parameter Efficiency**: Still maintains LoRA's core benefit (0.1-1% parameters)

---

## Validation

These practices are validated by:
- ✅ Thinking Machines collaboration research
- ✅ "LoRA Without Regret" blog findings
- ✅ Real-world RL application success
- ✅ Production system performance

All our LoRA configurations follow these validated best practices.

