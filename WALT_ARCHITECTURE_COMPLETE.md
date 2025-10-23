# WALT Integration - Complete Architecture Guide

## 🎯 Three Production-Ready Architectures

WALT offers three deployment architectures, each optimized for different use cases:

1. **Redis Queue** (Recommended for Production)
2. **TypeScript Native** (Recommended for Quick Start)
3. **HTTP Bridge** (Legacy, still supported)

---

## 📊 Architecture Comparison

| Feature | Redis Queue | TypeScript Native | HTTP Bridge |
|---------|-------------|-------------------|-------------|
| **Setup Complexity** | ⚠️ Medium (Redis + Workers) | ✅ Simple (npm install) | ⚠️ Medium (Flask service) |
| **Python Required** | Optional (for higher quality) | ❌ No | Optional (for higher quality) |
| **Scalability** | ✅✅✅ Horizontal (N workers) | ❌ Single process | ❌ Single process |
| **Fault Tolerance** | ✅✅✅ Jobs persist in queue | ⚠️ Basic (retry logic) | ⚠️ Basic (retry logic) |
| **Async Support** | ✅✅✅ Native (fire-and-forget) | ❌ Sync only | ⚠️ Requires polling |
| **Monitoring** | ✅✅✅ Queue metrics, workers | ⚠️ Basic logs | ⚠️ Basic logs |
| **Throughput** | ⚡⚡⚡ High (parallel workers) | ⚡ Low (single process) | ⚡⚡ Medium |
| **Tool Quality** | 0.8-0.95 (Python) / 0.6-0.8 (TS) | 0.6-0.8 | 0.8-0.95 (Python only) |
| **Decoupling** | ✅✅✅ Complete | N/A (no Python) | ⚠️ Direct HTTP |
| **Production Ready** | ✅✅✅ Excellent | ✅✅ Good | ✅ Good |
| **Recommended For** | **Production (scalable)** | **Quick start, development** | Legacy support |

---

## 🚀 Architecture 1: Redis Queue (RECOMMENDED FOR PRODUCTION)

### Overview

```
TypeScript → Redis Queue ← Python Workers (1-N)
              ↓
           Results
```

### When to Use

✅ **Use Redis Queue When:**
- You need to scale horizontally (handle high load)
- You want fault tolerance (jobs persist)
- You need async processing (fire-and-forget)
- You require production monitoring
- You have 100+ sites to discover from
- You need 24/7 operation

❌ **Don't Use If:**
- Quick start / development environment
- Single-site testing
- Don't want to manage Redis

### Quick Start

```bash
# 1. Start Redis
docker run -d -p 6379:6379 redis:alpine

# 2. Start Python workers (optional, for higher quality)
npm run walt:setup
npm run walt:redis:start

# 3. Use in code
import { getRedisWALTClient } from '@/lib/walt';
const client = getRedisWALTClient();
const result = await client.discoverTools({ url: '...' });
```

### Benefits

- **Scalability**: Add workers to handle more load
- **Fault Tolerance**: Jobs survive crashes
- **Async Operations**: Fire-and-forget pattern
- **Monitoring**: Queue depth, processing stats
- **Graceful Fallback**: Uses TypeScript if Redis down

### Full Documentation

📖 [WALT_REDIS_ARCHITECTURE.md](WALT_REDIS_ARCHITECTURE.md)

---

## ⚡ Architecture 2: TypeScript Native (RECOMMENDED FOR QUICK START)

### Overview

```
TypeScript → Playwright for Node.js
```

### When to Use

✅ **Use TypeScript Native When:**
- Quick start / development
- No Python available
- Simple single-site testing
- Don't want infrastructure complexity
- Immediate deployment needed
- Low to medium discovery needs (<20 sites)

❌ **Don't Use If:**
- Need highest tool quality (0.9+ confidence)
- High throughput requirements
- Need horizontal scaling

### Quick Start

```bash
# 1. Install Playwright browsers (one-time)
npx playwright install chromium

# 2. Use immediately
import { getUnifiedWALTClient } from '@/lib/walt';
const client = getUnifiedWALTClient({ backend: 'typescript' });
const result = await client.discoverTools({ url: '...' });
```

### Benefits

- **Zero Setup**: Works immediately with npm install
- **No Python**: Uses existing Node.js/TypeScript stack
- **Simple**: Single process, easy to debug
- **Good Quality**: 0.6-0.8 confidence tools

### Full Documentation

📖 [WALT_NO_PYTHON_REQUIRED.md](WALT_NO_PYTHON_REQUIRED.md)

---

## 🔗 Architecture 3: HTTP Bridge (LEGACY)

### Overview

```
TypeScript → HTTP (port 5000) → Python Flask Service
```

### When to Use

✅ **Use HTTP Bridge When:**
- Already have Flask service set up
- Need Python for other reasons
- Don't want Redis infrastructure
- Moderate discovery needs (20-50 sites)

❌ **Don't Use If:**
- Need scalability (use Redis Queue instead)
- Don't want Python (use TypeScript Native instead)
- Starting fresh (use Redis Queue or TypeScript Native)

### Quick Start

```bash
# 1. Set up Python service
npm run walt:setup
npm run walt:start  # Starts Flask on port 5000

# 2. Use in code
import { getUnifiedWALTClient } from '@/lib/walt';
const client = getUnifiedWALTClient({ backend: 'python' });
const result = await client.discoverTools({ url: '...' });
```

### Status

**Legacy Support** - Still works, but Redis Queue is recommended for new deployments.

---

## 🎯 Decision Matrix

### By Use Case

| Use Case | Recommended Architecture | Reasoning |
|----------|-------------------------|-----------|
| **Quick Start / Development** | TypeScript Native | Zero setup, works immediately |
| **Small Production (<20 sites)** | TypeScript Native | Simple, reliable, good enough quality |
| **Medium Production (20-100 sites)** | Redis Queue (2 workers) | Scalable, fault tolerant |
| **Large Production (100+ sites)** | Redis Queue (4-8 workers) | Horizontal scaling, high throughput |
| **24/7 Operation** | Redis Queue | Fault tolerance, monitoring |
| **Highest Tool Quality** | Redis Queue (Python workers) | 0.8-0.95 confidence |
| **No Python Available** | TypeScript Native | Only option without Python |
| **No Redis Available** | TypeScript Native or HTTP Bridge | Fall back options |

### By Team Size

| Team Size | Recommended | Reasoning |
|-----------|-------------|-----------|
| **Solo Developer** | TypeScript Native | Simplicity matters |
| **Small Team (2-5)** | TypeScript Native or Redis (1-2 workers) | Balance simplicity and scale |
| **Medium Team (5-20)** | Redis Queue (2-4 workers) | Production requirements |
| **Large Team (20+)** | Redis Queue (4-8+ workers) | Full scalability needs |

### By Load Profile

| Discovery Volume | Architecture | Worker Count |
|-----------------|--------------|--------------|
| **1-10 sites/day** | TypeScript Native | N/A |
| **10-50 sites/day** | TypeScript Native or Redis | 1 worker |
| **50-200 sites/day** | Redis Queue | 2-4 workers |
| **200+ sites/day** | Redis Queue | 4-8+ workers |

---

## 🔧 Setup Commands by Architecture

### TypeScript Native

```bash
# One command setup
npx playwright install chromium

# Use immediately
import { getUnifiedWALTClient } from '@/lib/walt';
const client = getUnifiedWALTClient({ backend: 'typescript' });
```

### Redis Queue

```bash
# 1. Start Redis
docker run -d -p 6379:6379 redis:alpine

# 2. Start workers
npm run walt:setup              # Install Python deps
npm run walt:redis:start        # Start 2 workers

# 3. Use
import { getRedisWALTClient } from '@/lib/walt';
const client = getRedisWALTClient();
```

### HTTP Bridge

```bash
# 1. Start Flask service
npm run walt:setup
npm run walt:start              # Port 5000

# 2. Use
import { getUnifiedWALTClient } from '@/lib/walt';
const client = getUnifiedWALTClient({ backend: 'python' });
```

---

## 🎖️ Recommendations by Scenario

### Scenario 1: "I just want to try WALT"

**Recommendation**: TypeScript Native

```bash
npx playwright install chromium
npx tsx test-walt-native.ts
```

**Why**: Zero infrastructure, works immediately.

---

### Scenario 2: "I'm deploying to production with moderate load"

**Recommendation**: Redis Queue (2 workers)

```bash
docker run -d -p 6379:6379 redis:alpine
npm run walt:redis:start
```

**Why**: Scalable, fault tolerant, production-ready.

---

### Scenario 3: "I need maximum throughput"

**Recommendation**: Redis Queue (8 workers)

```bash
docker run -d -p 6379:6379 redis:alpine
WALT_NUM_WORKERS=8 npm run walt:redis:start
```

**Why**: Horizontal scaling, high throughput.

---

### Scenario 4: "I don't have Python 3.11+"

**Recommendation**: TypeScript Native (only option)

```bash
npx playwright install chromium
# Use TypeScript backend exclusively
```

**Why**: No Python required, still gets good quality tools.

---

### Scenario 5: "I need the highest quality tools possible"

**Recommendation**: Redis Queue with Python workers

```bash
# Requires Python 3.11+
npm run walt:setup
npm run walt:redis:start
```

**Why**: Python sfr-walt produces 0.8-0.95 confidence tools.

---

## 📈 Migration Paths

### From TypeScript Native → Redis Queue

```bash
# 1. Start Redis
docker run -d -p 6379:6379 redis:alpine

# 2. Start workers
npm run walt:redis:start

# 3. Update code
- import { getUnifiedWALTClient } from '@/lib/walt';
- const client = getUnifiedWALTClient({ backend: 'typescript' });
+ import { getRedisWALTClient } from '@/lib/walt';
+ const client = getRedisWALTClient();

# Done! Redis automatically scales better.
```

### From HTTP Bridge → Redis Queue

```bash
# 1. Stop Flask service
npm run walt:stop

# 2. Start Redis + workers
docker run -d -p 6379:6379 redis:alpine
npm run walt:redis:start

# 3. Update code
- import { getUnifiedWALTClient } from '@/lib/walt';
- const client = getUnifiedWALTClient({ backend: 'python' });
+ import { getRedisWALTClient } from '@/lib/walt';
+ const client = getRedisWALTClient();

# Benefit: Better scalability and fault tolerance.
```

---

## 📚 Documentation Index

1. **[WALT_REDIS_ARCHITECTURE.md](WALT_REDIS_ARCHITECTURE.md)** - Complete Redis queue guide
2. **[WALT_NO_PYTHON_REQUIRED.md](WALT_NO_PYTHON_REQUIRED.md)** - TypeScript native guide
3. **[WALT_DEPLOYMENT_STATUS.md](WALT_DEPLOYMENT_STATUS.md)** - Overall deployment status
4. **[WALT_QUICKSTART.md](WALT_QUICKSTART.md)** - Quick start for all architectures
5. **[PYTHON_TYPESCRIPT_INTEGRATION.md](PYTHON_TYPESCRIPT_INTEGRATION.md)** - HTTP bridge details

---

## 🎯 Final Recommendation

### For Most Users

**Start with TypeScript Native**, upgrade to Redis Queue when needed:

```bash
# Day 1: Quick start
npx playwright install chromium
# Use TypeScript Native backend

# Week 2: Need more throughput?
docker run -d -p 6379:6379 redis:alpine
npm run walt:redis:start
# Switch to Redis Queue backend

# Easy upgrade path with no code changes!
```

### For Production Systems

**Use Redis Queue from the start**:

```bash
# Production-ready from day 1
docker run -d -p 6379:6379 redis:alpine
npm run walt:setup
npm run walt:redis:start

# Scale by adding more workers
WALT_NUM_WORKERS=4 npm run walt:redis:start
```

---

## 🎉 Summary

**Three architectures**, all production-ready:

1. **Redis Queue** 🚀 - Scalable, fault-tolerant, production-grade
2. **TypeScript Native** ⚡ - Simple, fast, no infrastructure
3. **HTTP Bridge** 🔗 - Legacy, still supported

**Choose based on your needs:**
- **Just trying WALT?** → TypeScript Native
- **Production deployment?** → Redis Queue
- **Need max quality?** → Redis Queue + Python workers
- **No Python?** → TypeScript Native

**All architectures support graceful fallbacks** - Redis Queue falls back to TypeScript Native if Redis unavailable.

🎉 **WALT is ready for any deployment scenario!** 🎉
