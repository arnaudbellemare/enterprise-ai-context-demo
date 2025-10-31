# Elasticsearch Integration Plan for PERMUTATION

**Status**: Planning  
**Integration Target**: [Elasticsearch](https://github.com/elastic/elasticsearch)  
**Date**: January 2025

## Overview

Elasticsearch integration will enhance PERMUTATION with:
- **Better vector search** for expert trajectory matching (currently using simple keyword matching)
- **Hybrid search** (vector + full-text) for improved relevance
- **Scalable storage** for knowledge base, reasoning patterns, and ACE bullets
- **Native RAG support** with production-ready infrastructure

## Current State

### Current Storage
- **Supabase + pgvector**: Vector embeddings (1536 dimensions)
- **Simple keyword matching**: Jaccard similarity for expert trajectories
- **PostgreSQL tables**: Knowledge base, reasoning patterns, ACE bullets

### Current Limitations
1. **Expert trajectory matching**: Basic keyword overlap (Jaccard similarity)
2. **No hybrid search**: Only vector or only text, not both
3. **Scalability**: PostgreSQL may become bottleneck at scale
4. **No advanced relevance tuning**: Limited ranking flexibility

## Integration Architecture

### Phase 1: Core Infrastructure ✅ (Created)

**Files Created:**
- `frontend/lib/elasticsearch/elasticsearch-client.ts` - Core client wrapper
- `frontend/lib/elasticsearch/expert-trajectories-store.ts` - Expert trajectories with vector search

**Features:**
- Vector similarity search with cosine similarity
- Hybrid search (vector + full-text with boost weights)
- Bulk indexing support
- Fallback to Supabase if Elasticsearch unavailable

### Phase 2: SRL Integration (Next)

**Enhance SRL trajectory matching:**
```typescript
// Current: Simple keyword matching
const similarity = jaccardSimilarity(queryWords, trajectoryWords);

// New: Semantic vector search
const bestTrajectory = await trajectoriesStore.findBestTrajectory(
  query,
  domain,
  queryEmbedding
);
```

**Files to Update:**
- `frontend/lib/srl/swirl-srl-enhancer.ts` - Use Elasticsearch for trajectory matching
- `frontend/lib/srl-ebm-router.ts` - Enhanced domain detection with Elasticsearch

### Phase 3: Knowledge Base Integration

**Use Cases:**
- Knowledge base semantic search
- Reasoning patterns retrieval
- ACE bullets similarity search

**Indices to Create:**
- `knowledge_base` - Domain knowledge articles
- `reasoning_patterns` - Stored reasoning chains
- `ace_playbook_bullets` - ACE strategies

### Phase 4: Hybrid Search Pipeline

**Integrate into:**
- Unified pipeline for context retrieval
- RAG pipeline for document search
- Multi-domain query routing

## Setup Instructions

### Option 1: Elastic Cloud (Recommended)

1. Create account at [elastic.co](https://www.elastic.co/)
2. Create deployment
3. Get Cloud ID and API key

```env
ELASTICSEARCH_CLOUD_ID=your-cloud-id
ELASTICSEARCH_API_KEY=your-api-key
```

### Option 2: Local Development (Docker)

Based on [Elasticsearch start-local script](https://github.com/elastic/elasticsearch):

```bash
curl -fsSL https://elastic.co/start-local | sh
```

Or manually:
```bash
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:9.2.0
```

### Environment Variables

```env
# Option 1: Self-hosted
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your-password

# Option 2: Elastic Cloud
ELASTICSEARCH_CLOUD_ID=your-cloud-id
ELASTICSEARCH_API_KEY=your-api-key
```

## Integration Points

### 1. SRL Expert Trajectories

**Current**: Keyword-based matching in `swirl-srl-enhancer.ts`

**New**: Vector search via `ExpertTrajectoriesElasticsearchStore`

**Benefits:**
- Semantic similarity (understands meaning, not just keywords)
- Better matching for domain-specific queries
- Scalable to thousands of trajectories

### 2. Knowledge Base

**Current**: Supabase vector search

**New**: Elasticsearch hybrid search

**Benefits:**
- Combine semantic and keyword search
- Better relevance ranking
- Advanced filtering and aggregations

### 3. Reasoning Patterns

**Current**: Supabase storage

**New**: Elasticsearch with semantic retrieval

**Benefits:**
- Find similar reasoning patterns across domains
- Learn from successful patterns
- Cross-domain knowledge transfer

## Implementation Steps

1. **Install dependencies**
   ```bash
   npm install @elastic/elasticsearch
   ```

2. **Create indices** (run once on startup)
   ```typescript
   await client.createIndex('expert_trajectories', 1536);
   await client.createIndex('knowledge_base', 1536);
   await client.createIndex('reasoning_patterns', 1536);
   ```

3. **Migrate existing data** (one-time migration script)
   - Export from Supabase
   - Generate embeddings if missing
   - Bulk index to Elasticsearch

4. **Update SRL enhancer** to use Elasticsearch
   - Replace keyword matching
   - Add embedding generation
   - Use vector search

5. **Add fallback logic**
   - Try Elasticsearch first
   - Fallback to Supabase if unavailable
   - Log which backend was used

## Benefits Summary

### Performance
- Faster vector search (optimized indexing)
- Parallel query execution
- Better caching strategies

### Quality
- Semantic understanding vs keyword matching
- Hybrid search improves relevance
- Tunable boost weights

### Scalability
- Horizontal scaling
- Better for large datasets
- Production-ready infrastructure

### Features
- Native RAG support
- Advanced aggregations
- Real-time search updates

## Fallback Strategy

**Graceful Degradation:**
1. Try Elasticsearch first
2. If unavailable, fallback to Supabase
3. Log which backend was used
4. No breaking changes to API

## Next Steps

1. ✅ Create Elasticsearch client wrapper
2. ✅ Create expert trajectories store
3. ⏭️ Install `@elastic/elasticsearch` package
4. ⏭️ Update SRL enhancer to use Elasticsearch
5. ⏭️ Add embedding generation pipeline
6. ⏭️ Create migration script
7. ⏭️ Test with real queries
8. ⏭️ Benchmark against Supabase baseline

