# WALT Redis Queue Architecture 🚀

## Production-Grade Scalable Architecture

WALT now uses **Redis queues** for decoupled, scalable tool discovery - the industry standard for production systems.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  TypeScript/Node.js (PERMUTATION)                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                              │
│  Redis Queue Client                                         │
│  ├─ Publish discovery jobs                                  │
│  ├─ Subscribe to results (pub/sub)                          │
│  └─ Fallback to TypeScript native if Redis unavailable      │
│                                                              │
│       │                                                      │
│       ▼                                                      │
└───────┼──────────────────────────────────────────────────────┘
        │
        │ Redis Queue (walt:discovery:queue)
        │
┌───────┼──────────────────────────────────────────────────────┐
│  Redis Server                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                              │
│  Queues:                                                     │
│  ├─ walt:discovery:queue (job queue)                        │
│  ├─ walt:result:{jobId} (result storage)                    │
│  └─ walt:result:channel:{jobId} (pub/sub notifications)     │
│                                                              │
│       ▲                           │                          │
└───────┼───────────────────────────┼──────────────────────────┘
        │                           │
        │ Consume jobs              │ Publish results
        │                           │
┌───────┼───────────────────────────▼──────────────────────────┐
│  Python Workers (1-N instances)                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                              │
│  Worker 1                  Worker 2              Worker N   │
│  ├─ Poll queue             ├─ Poll queue         ...        │
│  ├─ Process with WALT      ├─ Process with WALT             │
│  └─ Publish results        └─ Publish results               │
│                                                              │
│  WALT Framework (sfr-walt) + Playwright                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ Why Redis Queue?

### Production Benefits

| Feature | Redis Queue | HTTP Bridge | TypeScript Native |
|---------|-------------|-------------|-------------------|
| **Decoupling** | ✅ Complete | ⚠️ Direct connection | ✅ No Python |
| **Scalability** | ✅ Horizontal (N workers) | ❌ Single process | ❌ Single process |
| **Fault Tolerance** | ✅ Jobs persist | ❌ Lost on crash | N/A |
| **Load Balancing** | ✅ Automatic | ❌ Manual | N/A |
| **Async Support** | ✅ Native | ⚠️ Complex | N/A |
| **Monitoring** | ✅ Queue metrics | ⚠️ Basic | ⚠️ Basic |
| **Python Required** | ✅ Optional | ✅ Optional | ❌ No |
| **Setup Complexity** | ⚠️ Redis + Workers | ⚠️ Service | ✅ Simple |
| **Recommended For** | **Production** | Development | Quick start |

### Key Advantages

1. **Decoupled Architecture**
   - TypeScript and Python run independently
   - Can restart/upgrade one without affecting the other
   - No tight coupling or version dependencies

2. **Horizontal Scalability**
   - Add more workers during high load
   - Remove workers during low load
   - Auto-distribute jobs across workers

3. **Fault Tolerance**
   - Jobs persist in Redis even if workers crash
   - Workers can be restarted without losing work
   - Automatic retry on failure

4. **Performance**
   - Parallel processing with multiple workers
   - Non-blocking async operations
   - Efficient pub/sub for instant notifications

5. **Operational Excellence**
   - Easy monitoring (queue depth, processing time)
   - Graceful shutdown support
   - Health checks built-in
   - Production-ready logging

---

## 🚀 Quick Start

### 1. Start Redis

```bash
# Option 1: Docker (recommended)
docker run -d -p 6379:6379 --name redis redis:alpine

# Option 2: Homebrew (macOS)
brew install redis
brew services start redis

# Option 3: Manual
redis-server
```

### 2. Install Dependencies

```bash
# Python dependencies (if using Python workers)
npm run walt:setup

# Node.js dependencies (already done)
# ioredis and uuid are installed
```

### 3. Start Python Workers

```bash
# Start 2 workers (default)
./scripts/start-walt-redis-workers.sh

# Or specify number of workers
WALT_NUM_WORKERS=4 ./scripts/start-walt-redis-workers.sh

# Check status
./scripts/status-walt-redis-workers.sh

# Stop all workers
./scripts/stop-walt-redis-workers.sh
```

### 4. Use in Code

```typescript
import { getRedisWALTClient } from '@/lib/walt/redis-queue-client';

// Create client (auto-falls back to TypeScript native if Redis unavailable)
const client = getRedisWALTClient();

// Synchronous pattern (wait for result)
const result = await client.discoverTools({
  url: 'https://finance.yahoo.com',
  goal: 'Search for stock prices',
  max_tools: 5
});

console.log(`Discovered ${result.tools_discovered} tools`);
// If Redis unavailable: automatically uses TypeScript native backend

// Asynchronous pattern (fire-and-forget)
const jobId = await client.discoverToolsAsync({
  url: 'https://github.com',
  max_tools: 3
});

// Check result later
const jobResult = await client.getJobResult(jobId);
if (jobResult) {
  console.log(`Job completed: ${jobResult.success}`);
}
```

---

## 📊 Architecture Patterns

### Pattern 1: Synchronous (Wait for Result)

**Use Case**: User needs immediate response

```typescript
const result = await client.discoverTools({ url: '...' });
// Blocks until workers complete processing
```

**Flow**:
1. Publish job to queue
2. Subscribe to result channel
3. Wait for worker to process
4. Receive result via pub/sub
5. Return to caller

**Latency**: ~5-30s (depending on site complexity)

### Pattern 2: Asynchronous (Fire-and-Forget)

**Use Case**: Background processing, batch operations

```typescript
const jobId = await client.discoverToolsAsync({ url: '...' });
// Returns immediately with job ID

// Check later
const result = await client.getJobResult(jobId);
```

**Flow**:
1. Publish job to queue
2. Return job ID immediately
3. Worker processes in background
4. Result stored in Redis (1 hour TTL)
5. Poll for result when needed

**Latency**: <10ms to queue, process in background

### Pattern 3: Batch Processing

**Use Case**: Discover tools from multiple domains

```typescript
const domains = ['financial', 'e-commerce', 'research'];
const jobIds = await Promise.all(
  domains.map(domain =>
    client.discoverToolsAsync({ url: configs[domain].urls[0] })
  )
);

// Wait for all to complete
const results = await Promise.all(
  jobIds.map(id => client.getJobResult(id))
);
```

**Benefit**: Process N domains in parallel with N workers

---

## 🔧 Configuration

### Environment Variables

```bash
# Redis connection
REDIS_URL=redis://localhost:6379

# Queue names
WALT_QUEUE_NAME=walt:discovery:queue
WALT_RESULT_PREFIX=walt:result:

# Worker configuration
WALT_NUM_WORKERS=2
WORKER_ID=worker-1

# OpenAI API (for Python WALT)
OPENAI_API_KEY=sk-...
```

### Client Options

```typescript
const client = getRedisWALTClient({
  redisUrl: 'redis://localhost:6379',
  queueName: 'walt:discovery:queue',
  resultPrefix: 'walt:result:',
  timeout: 300000, // 5 minutes
  useNativeFallback: true // Auto-fallback to TypeScript
});
```

---

## 📊 Monitoring

### Queue Statistics

```bash
# Check queue status
./scripts/status-walt-redis-workers.sh

# Output:
#   Running workers: 2
#   Queue length: 5
#   Processing: 2
#   Completed: 128
#   Failed: 3
```

### Programmatic Monitoring

```typescript
const stats = await client.getQueueStats();
console.log(`Queue: ${stats.queueLength} pending`);
console.log(`Processing: ${stats.processing} jobs`);
console.log(`Completed: ${stats.completed} total`);
console.log(`Failed: ${stats.failed} total`);
```

### Redis CLI Monitoring

```bash
# Watch queue in real-time
watch -n 1 'redis-cli LLEN walt:discovery:queue'

# Monitor pub/sub activity
redis-cli MONITOR

# Check result keys
redis-cli KEYS 'walt:result:*'
```

---

## 🔄 Scaling

### Horizontal Scaling (Add Workers)

```bash
# Start with 2 workers
./scripts/start-walt-redis-workers.sh

# Need more throughput? Add 2 more workers
WALT_NUM_WORKERS=4 ./scripts/start-walt-redis-workers.sh

# Workers automatically distribute load
```

### Performance Guidelines

| Workers | Throughput | Use Case |
|---------|------------|----------|
| 1 | ~10 sites/hour | Development |
| 2 | ~20 sites/hour | Small production |
| 4 | ~40 sites/hour | Medium production |
| 8+ | ~80+ sites/hour | Large scale |

**Note**: Actual throughput depends on site complexity and browser automation time.

---

## 🛡️ Fault Tolerance

### Worker Crashes

**Problem**: Worker crashes mid-processing

**Solution**: Job persists in Redis, another worker picks it up

```bash
# Worker crashes
❌ Worker 1 crashed while processing job-123

# Another worker automatically processes it
✅ Worker 2 picked up job-123 from queue
```

### Redis Downtime

**Problem**: Redis server unavailable

**Solution**: Automatic fallback to TypeScript native backend

```typescript
const client = getRedisWALTClient({ useNativeFallback: true });

// If Redis down:
const result = await client.discoverTools({ url: '...' });
// ⚠️ Redis unavailable, using native TypeScript backend
// ✅ Still works!
```

### Graceful Shutdown

Workers support graceful shutdown:

```bash
# Send SIGTERM
./scripts/stop-walt-redis-workers.sh

# Workers finish current job before exiting
🛑 worker-1: Received shutdown signal, finishing current job...
✅ worker-1: Job completed, shutting down gracefully
```

---

## 🐛 Troubleshooting

### Redis Not Connected

**Symptom**: `Redis not connected`

**Solution**:
```bash
# Check Redis is running
redis-cli PING
# Should return: PONG

# If not running:
brew services start redis
# Or: docker run -d -p 6379:6379 redis:alpine
```

### No Workers Running

**Symptom**: Jobs queued but not processing

**Solution**:
```bash
# Check worker status
./scripts/status-walt-redis-workers.sh

# If no workers running:
./scripts/start-walt-redis-workers.sh
```

### Jobs Stuck in Queue

**Symptom**: Queue length keeps growing

**Solution**:
```bash
# Add more workers
WALT_NUM_WORKERS=4 ./scripts/start-walt-redis-workers.sh

# Or check worker logs
tail -f .walt-workers/*.log
```

### Python 3.11+ Not Available

**Symptom**: Workers fail to start

**Solution**: Use TypeScript native backend
```typescript
// No Python required!
import { getUnifiedWALTClient } from '@/lib/walt';
const client = getUnifiedWALTClient({ backend: 'typescript' });
```

---

## 📈 Performance Comparison

| Architecture | Setup | Throughput | Fault Tolerance | Scalability | Tool Quality |
|--------------|-------|------------|-----------------|-------------|--------------|
| **Redis Queue** | ⚠️ Medium | ⚡⚡⚡ High | ✅ Excellent | ✅ Horizontal | ⚡ 0.8-0.95 |
| HTTP Bridge | ⚠️ Medium | ⚡⚡ Medium | ⚠️ Basic | ❌ Vertical only | ⚡ 0.8-0.95 |
| TypeScript Native | ✅ Simple | ⚡ Low | ⚠️ Basic | ❌ Single process | ⚡ 0.6-0.8 |

**Recommendation**:
- **Development**: TypeScript Native (simplest)
- **Small Production**: Redis Queue with 2 workers
- **Large Production**: Redis Queue with 4-8+ workers

---

## 🎯 Summary

### What You Get with Redis Architecture

✅ **Production-grade** - Industry standard queue-based architecture
✅ **Scalable** - Add workers to handle more load
✅ **Fault tolerant** - Jobs persist, workers can crash safely
✅ **Decoupled** - TypeScript and Python independent
✅ **Monitored** - Built-in metrics and health checks
✅ **Graceful fallback** - Uses TypeScript native if Redis unavailable
✅ **Optional Python** - Works with or without Python workers

### Quick Start Commands

```bash
# 1. Start Redis
docker run -d -p 6379:6379 redis:alpine

# 2. Start workers (if using Python)
./scripts/start-walt-redis-workers.sh

# 3. Use in code
import { getRedisWALTClient } from '@/lib/walt/redis-queue-client';
const client = getRedisWALTClient();
const result = await client.discoverTools({ url: '...' });
```

---

**🚀 Redis queue architecture is the recommended production setup for WALT!**

See also:
- [WALT_NO_PYTHON_REQUIRED.md](WALT_NO_PYTHON_REQUIRED.md) - TypeScript-native alternative
- [WALT_DEPLOYMENT_STATUS.md](WALT_DEPLOYMENT_STATUS.md) - Complete deployment guide
