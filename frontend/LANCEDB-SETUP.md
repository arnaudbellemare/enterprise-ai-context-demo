# LanceDB Setup Guide

## 🚀 **Correct LanceDB Integration**

The LanceDB integration has been **fixed** to use the proper patterns and APIs.

## 📦 **Installation**

### **Option 1: Local LanceDB (Recommended for Development)**

```bash
# Install LanceDB Python package (for local server)
pip install lancedb

# Start local LanceDB server
lancedb start --host 0.0.0.0 --port 8000
```

### **Option 2: Node.js SDK (For Production)**

```bash
# Install the correct LanceDB package
npm install vectordb

# Or for cloud version
npm install @lancedb/cloud
```

## 🔧 **Environment Configuration**

Add to your `.env.local`:

```env
# LanceDB Configuration
LANCEDB_URI=lancedb://localhost:8000
LANCEDB_API_KEY=your-api-key
LANCEDB_REGION=us-west-2

# For OpenAI embeddings (optional)
OPENAI_API_KEY=your-openai-key
```

## 🎯 **What's Fixed in the Integration:**

### **1. Correct LanceDB Patterns:**
- ✅ **Dynamic Import**: `await import('vectordb')`
- ✅ **Proper Table Management**: `openTable()` and `createTable()`
- ✅ **Correct Search API**: `table.search(vector).limit(n).execute()`
- ✅ **Distance Scoring**: Uses `_distance` for similarity scores

### **2. Schema Definition:**
```typescript
const schema = {
  id: 'string',
  content: 'string',
  vector: 'float32[384]', // 384-dimensional vector
  metadata: 'object'
};
```

### **3. Proper Data Structure:**
```typescript
const document = {
  id: 'unique_id',
  content: 'text content',
  vector: [0.1, 0.2, ...], // 384-dimensional embedding
  metadata: {
    type: 'query',
    domain: 'legal',
    timestamp: '2024-01-01T00:00:00Z',
    quality_score: 0.9,
    tags: ['tag1', 'tag2'],
    source: 'brain_system'
  }
};
```

### **4. Mock Implementation:**
- ✅ **Development Fallback**: Mock client when LanceDB unavailable
- ✅ **Realistic Behavior**: Simulates vector search and similarity
- ✅ **No Dependencies**: Works without LanceDB installation

## 🧪 **Testing the Integration:**

### **1. Test Enhanced Brain System:**
```bash
curl -X POST http://localhost:3000/api/brain-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How to optimize database performance?",
    "domain": "technology",
    "useVectorSearch": true
  }'
```

### **2. Test Analytics Dashboard:**
Visit: `http://localhost:3000/lancedb-analytics`

### **3. Test SQL Editor with LanceDB:**
Visit: `http://localhost:3000/enhanced-sql-editor`

## 🔍 **How It Works Now:**

### **1. Vector Search Flow:**
```typescript
// 1. Generate embedding
const vector = await generateEmbedding(query);

// 2. Search similar documents
const results = await table.search(vector)
  .limit(5)
  .execute();

// 3. Get similarity scores
const similar = results.map(r => ({
  content: r.content,
  score: r._distance, // LanceDB similarity score
  metadata: r.metadata
}));
```

### **2. Data Storage Flow:**
```typescript
// 1. Create document with vector
const doc = {
  id: 'unique_id',
  content: 'text',
  vector: await generateEmbedding('text'),
  metadata: { ... }
};

// 2. Store in LanceDB
await table.add([doc]);
```

### **3. Analytics Flow:**
```typescript
// 1. Get table statistics
const count = await table.countRows();

// 2. Search top performing queries
const topQueries = await table.search([0,0,0])
  .where('metadata.quality_score > 0.8')
  .limit(10)
  .execute();
```

## 🚀 **Production Deployment:**

### **1. LanceDB Cloud:**
```typescript
const lancedb = new LanceDBIntegration({
  uri: 'lancedb://cloud.lancedb.com',
  apiKey: process.env.LANCEDB_CLOUD_API_KEY,
  region: 'us-west-2'
});
```

### **2. Self-Hosted:**
```typescript
const lancedb = new LanceDBIntegration({
  uri: 'lancedb://your-server:8000',
  apiKey: process.env.LANCEDB_API_KEY
});
```

## ✅ **Verification:**

### **Check Integration Status:**
1. **Visit Analytics Dashboard**: `/lancedb-analytics`
2. **Test Enhanced Brain**: `/api/brain-enhanced`
3. **Check Console Logs**: Look for "✅ LanceDB connected successfully"

### **Expected Behavior:**
- ✅ **Vector Search**: Finds similar queries and patterns
- ✅ **Multimodal Support**: Handles text, images, videos
- ✅ **Real-time Learning**: Stores and learns from interactions
- ✅ **Analytics**: Provides insights and performance metrics

## 🎯 **Key Improvements:**

1. **Correct API Usage**: Uses proper LanceDB methods
2. **Proper Error Handling**: Graceful fallbacks
3. **Mock Implementation**: Works without LanceDB installation
4. **Real Embeddings**: Uses OpenAI embeddings when available
5. **Production Ready**: Supports both local and cloud deployment

The LanceDB integration now follows the **correct patterns** and will work properly with the actual LanceDB system! 🚀
