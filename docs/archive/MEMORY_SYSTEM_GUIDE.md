# 🧠 Enterprise AI Memory System

A comprehensive memory and search system built with vector embeddings, multi-model routing, and intelligent query handling - similar to Hyperspell but integrated with your existing GEPA/AX stack.

## 📋 Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [Usage Examples](#usage-examples)
5. [Database Schema](#database-schema)
6. [Setup Instructions](#setup-instructions)

## ✨ Features

### 1. **Indexed Search with Vector Embeddings** ✅
- **Vector Database**: PostgreSQL with pgvector extension
- **Embeddings Model**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Similarity Search**: IVFFLAT index for fast cosine similarity
- **Chunking**: Automatic document chunking with overlap for better retrieval

### 2. **Multi-Model Answer Selection** ✅
- **Smart Model Router**: Automatically selects best model based on query type
- **Query Types**: Math, Code, Scientific, Reasoning, General
- **Supported Models**:
  - `claude-3-haiku` - Fast, general-purpose (default)
  - `claude-3-sonnet` - Balanced performance for complex queries
  - `gpt-4o-mini` - Fast, efficient for general tasks
  - `gpt-4o` - Advanced reasoning for complex queries
  - `o1-mini` - Specialized for math, code, scientific reasoning

### 3. **Multi-Source Search with Error Handling** ✅
- **Graceful Degradation**: Returns partial results if some sources fail
- **Error Collection**: Detailed error reporting per source
- **Sources**:
  - `vault` - Indexed memories from your personal vault
  - `indexed` - Vector-based similarity search
  - `web` - Live web search via Perplexity
  - `documents` - Uploaded and processed documents

### 4. **Collection/Tagging System** ✅
- **Organize Memories**: Group memories into collections (e.g., "poems", "docs", "research")
- **Metadata Support**: Rich metadata for each memory and collection
- **Auto-Creation**: Collections are created automatically when referenced
- **Tagging**: Tag memories for better organization

### 5. **Document Processing Pipeline** ✅
- **Background Jobs**: Async processing via Supabase Edge Functions
- **Chunking**: Smart text chunking with configurable size and overlap
- **Batch Embeddings**: Efficient batch processing of document chunks
- **Status Tracking**: Real-time status updates (uploading → processing → ready)

### 6. **Unified Search** ✅
- **Hybrid Search**: Combines indexed and live search results
- **Merge Strategies**:
  - `hybrid` - Intelligent mixing based on relevance
  - `indexed-first` - Prioritize indexed results (70/30)
  - `live-first` - Prioritize live results (70/30)
- **Deduplication**: Automatic removal of duplicate results

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│  /api/memories/add        - Add new memories                │
│  /api/memories/search     - Multi-source memory search      │
│  /api/search/indexed      - Vector similarity search        │
│  /api/search/unified      - Hybrid indexed + live search    │
│  /api/answer              - Multi-model answer generation   │
│  /api/embeddings/generate - Generate vector embeddings      │
│  /api/documents/upload    - Upload and process documents    │
│  /api/collections         - Manage memory collections       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Backend                          │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL + pgvector    - Vector storage & search         │
│  Edge Functions           - Document processing pipeline    │
│  Storage                  - Document file storage           │
│  Row Level Security       - User data isolation             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
├─────────────────────────────────────────────────────────────┤
│  OpenAI                   - Embeddings generation           │
│  Anthropic (Claude)       - Answer generation               │
│  Perplexity               - Live web search                 │
└─────────────────────────────────────────────────────────────┘
```

## 📡 API Endpoints

### Memory Management

#### Add Memory
```typescript
POST /api/memories/add
{
  "text": "Your content here",
  "collection": "poems",  // optional
  "source": "vault",      // vault, document, web, etc.
  "metadata": {},         // optional metadata
  "tags": ["tag1"],       // optional tags
  "userId": "user-id"
}

Response:
{
  "success": true,
  "resource_id": "memory-uuid",
  "collection": "poems",
  "status": "ready"
}
```

#### Search Memories (Multi-Source)
```typescript
POST /api/memories/search
{
  "query": "what did joe think about my poetry?",
  "sources": ["vault", "web"],
  "options": {
    "vault": {
      "collection": "poems"  // optional filter
    }
  },
  "answer": true,            // generate answer
  "answerModel": "claude-3-sonnet",
  "userId": "user-id"
}

Response:
{
  "documents": [...],
  "errors": [],
  "answer": "Based on your documents...",
  "answerModel": "claude-3-sonnet",
  "totalResults": 10,
  "processingTime": 1234
}
```

### Search APIs

#### Indexed Search (Vector Similarity)
```typescript
POST /api/search/indexed
{
  "query": "machine learning algorithms",
  "userId": "user-id",
  "collection": "research",     // optional
  "matchThreshold": 0.7,        // similarity threshold
  "matchCount": 10              // max results
}

Response:
{
  "documents": [
    {
      "id": "uuid",
      "content": "...",
      "similarity": 0.89,
      "metadata": {...}
    }
  ],
  "totalResults": 5,
  "processingTime": 234
}
```

#### Unified Search (Hybrid)
```typescript
POST /api/search/unified
{
  "query": "latest AI research",
  "userId": "user-id",
  "sources": ["indexed", "web"],
  "mergeStrategy": "hybrid",    // hybrid, indexed-first, live-first
  "maxResults": 20,
  "answer": true
}

Response:
{
  "documents": [...],
  "sourceBreakdown": {
    "indexed": 8,
    "live": 12
  },
  "answer": "...",
  "mergeStrategy": "hybrid",
  "processingTime": 1543
}
```

### Answer Generation

#### Multi-Model Answer
```typescript
POST /api/answer
{
  "query": "solve this equation: 2x + 5 = 15",
  "documents": [...],            // optional context
  "preferredModel": "o1-mini",   // optional
  "autoSelectModel": true        // auto-select based on query type
}

Response:
{
  "answer": "To solve 2x + 5 = 15...",
  "model": "o1-mini",
  "modelConfig": {
    "provider": "openai",
    "useCase": "Reasoning model for math, code, science"
  },
  "queryType": "math",
  "processingTime": 890
}
```

#### List Available Models
```typescript
GET /api/answer

Response:
{
  "models": [
    {
      "name": "claude-3-haiku",
      "provider": "anthropic",
      "useCase": "Lightweight, fast model",
      "speed": "very-fast"
    },
    ...
  ]
}
```

### Collections

#### Create Collection
```typescript
POST /api/collections
{
  "name": "research-papers",
  "description": "My research collection",
  "metadata": {},
  "userId": "user-id"
}
```

#### List Collections
```typescript
GET /api/collections?userId=user-id

Response:
{
  "collections": [
    {
      "id": "uuid",
      "name": "research-papers",
      "memoriesCount": 45,
      "createdAt": "..."
    }
  ],
  "total": 5
}
```

### Document Processing

#### Upload Document
```typescript
POST /api/documents/upload
FormData {
  file: File,
  userId: "user-id",
  collection: "research-papers"  // optional
}

Response:
{
  "success": true,
  "documentId": "uuid",
  "status": "processing",
  "message": "Document uploaded and processing started"
}
```

## 💡 Usage Examples

### Python SDK Style (TypeScript Implementation)

```typescript
// Add a memory
const memoryStatus = await fetch('/api/memories/add', {
  method: 'POST',
  body: JSON.stringify({
    text: "'Twas brillig, and the slithy toves...",
    collection: "poems",
    userId: currentUser.id
  })
});

const { resource_id } = await memoryStatus.json();

// Search memories
const response = await fetch('/api/memories/search', {
  method: 'POST',
  body: JSON.stringify({
    query: "what is a borogove?",
    sources: ["vault"],
    options: {
      vault: { collection: "poems" }
    },
    userId: currentUser.id
  })
});

const { documents } = await response.json();

// Get answer
const answerResponse = await fetch('/api/memories/search', {
  method: 'POST',
  body: JSON.stringify({
    query: "which attacks does the jabberwock have?",
    sources: ["vault"],
    answer: true,
    answerModel: "claude-3-sonnet",
    options: {
      vault: { collection: "poems" }
    },
    userId: currentUser.id
  })
});

const { answer } = await answerResponse.json();
```

### Multi-Source Query with Error Handling

```typescript
const response = await fetch('/api/memories/search', {
  method: 'POST',
  body: JSON.stringify({
    query: "latest developments in quantum computing",
    sources: ["indexed", "web"],
    answer: true,
    userId: currentUser.id
  })
});

const { documents, errors, answer } = await response.json();

// Check for errors (graceful degradation)
if (errors.length > 0) {
  console.warn('Some sources failed:', errors);
  // But we still have results from successful sources!
}

// Use the answer
console.log(answer);
```

## 🗄️ Database Schema

### Tables

#### `collections`
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (TEXT, unique per user)
- `description` (TEXT)
- `metadata` (JSONB)
- `created_at`, `updated_at`

#### `memories`
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `collection_id` (UUID, FK → collections)
- `content` (TEXT)
- `embedding` (vector(1536))
- `source` (TEXT: vault, document, web, etc.)
- `metadata` (JSONB)
- `tags` (TEXT[])
- `status` (TEXT: processing, ready, failed)
- `created_at`, `updated_at`, `last_accessed_at`

#### `documents`
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `collection_id` (UUID, FK → collections)
- `filename`, `file_type`, `file_size`
- `storage_path` (TEXT)
- `status` (TEXT: uploading, processing, ready, failed)
- `chunks_count` (INTEGER)

#### `document_chunks`
- `id` (UUID, PK)
- `document_id` (UUID, FK → documents)
- `memory_id` (UUID, FK → memories)
- `chunk_index` (INTEGER)
- `content` (TEXT)

#### `query_history`
- Analytics table for tracking queries, models used, performance metrics

### Functions

#### `match_memories()`
Vector similarity search function:
```sql
SELECT * FROM match_memories(
  query_embedding := '[0.1, 0.2, ...]',
  match_threshold := 0.7,
  match_count := 10,
  filter_user_id := 'user-uuid',
  filter_collection_id := 'collection-uuid',
  filter_source := 'vault'
);
```

## 🚀 Setup Instructions

### 1. Database Setup

```bash
# Run the migration
cd supabase
supabase db push

# Or manually run the SQL
psql $DATABASE_URL < migrations/002_vector_memory_system.sql
```

### 2. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
PERPLEXITY_API_KEY=your-perplexity-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Deploy Edge Functions

```bash
# Deploy document processing function
supabase functions deploy ingest-document

# Set secrets
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set SUPABASE_URL=your-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
```

### 4. Create Storage Bucket

```bash
# In Supabase dashboard or via CLI
supabase storage create documents

# Set up storage policies for user access
```

## 🎯 Key Differences from Hyperspell

| Feature | Hyperspell | Your Implementation |
|---------|-----------|-------------------|
| **Vector DB** | Proprietary | PostgreSQL + pgvector |
| **Embeddings** | Custom | OpenAI text-embedding-3-small |
| **Answer Models** | Llama 3.1, Gemma2, etc. | Claude, GPT-4o, O1 |
| **Integration** | Standalone | Integrated with GEPA/AX |
| **Data Connectors** | Built-in (Slack, Gmail) | Custom via your APIs |
| **Pricing** | SaaS subscription | Self-hosted, API costs only |

## 🔥 Advanced Features

### Continuous Learning with GEPA
Integrate memory search with your existing GEPA optimizer:

```typescript
// Use memory search in GEPA optimization
const memoryResults = await fetch('/api/memories/search', {
  method: 'POST',
  body: JSON.stringify({
    query: userQuery,
    sources: ["indexed", "web"],
    userId: user.id
  })
});

// Feed results to GEPA for prompt optimization
const gepaResponse = await fetch('/api/gepa/optimize', {
  method: 'POST',
  body: JSON.stringify({
    prompt: basePrompt,
    context: memoryResults.documents
  })
});
```

### AX Framework Integration
Use AX for advanced prompt engineering with retrieved memories:

```typescript
import { AxAI } from '@ax-llm/ax';

// Initialize AX with memory-augmented prompts
const ai = new AxAI({
  name: 'memory-assistant',
  description: 'AI with memory context',
});

// Retrieve memories first
const memories = await searchMemories(query);

// Use AX with memory context
const result = await ai.chat([
  { role: 'system', content: buildContextFromMemories(memories) },
  { role: 'user', content: query }
]);
```

## 📊 Performance Metrics

- **Embedding Generation**: ~100ms for single text
- **Vector Search**: ~50-200ms for 10k vectors
- **Document Processing**: ~1-5s per document (depends on size)
- **Multi-Source Search**: ~500-2000ms (parallel execution)
- **Answer Generation**: 
  - Haiku: ~500ms
  - Sonnet: ~1500ms
  - O1-mini: ~3000ms

## 🛡️ Security

- **Row Level Security**: All tables protected by RLS
- **User Isolation**: Each user can only access their own data
- **Service Role**: Backend APIs use service role for admin operations
- **Token Validation**: User tokens validated on every request

---

**Built with ❤️ using Next.js, Supabase, OpenAI, and Anthropic**

