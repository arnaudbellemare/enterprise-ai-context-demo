# 🚀 Memory System Usage Examples

Quick examples showing how to use the new memory system.

## 📦 Installation

```typescript
import { 
  memoryClient,
  addMemory,
  searchMemories,
  unifiedSearch,
  createCollection 
} from '@/lib/memory-client';
```

## 🔥 Quick Start Examples

### 1. Add a Memory

```typescript
// Simple memory
const result = await addMemory({
  text: "'Twas brillig, and the slithy toves did gyre and gimble in the wabe...",
  collection: "poems",
  userId: user.id
});

console.log(result.resource_id); // Memory ID
```

### 2. Search Memories

```typescript
// Search in a specific collection
const response = await searchMemories({
  query: "what is a borogove?",
  sources: ["vault"],
  options: {
    vault: {
      collection: "poems"
    }
  },
  userId: user.id
});

console.log(response.documents);
```

### 3. Get AI Answer from Memories

```typescript
// Ask a question and get an AI-generated answer
const response = await searchMemories({
  query: "which attacks does the jabberwock have?",
  sources: ["vault"],
  answer: true,
  answerModel: "claude-3-sonnet",
  options: {
    vault: {
      collection: "poems"
    }
  },
  userId: user.id
});

console.log(response.answer);
console.log(response.answerModel); // Model that was used
```

### 4. Multi-Source Search

```typescript
// Search both indexed memories and live web
const response = await searchMemories({
  query: "latest AI developments",
  sources: ["indexed", "web"],
  answer: true,
  userId: user.id
});

// Check for errors (graceful degradation)
if (response.errors.length > 0) {
  console.warn("Some sources failed:", response.errors);
}

// Still get results from successful sources
console.log(response.documents);
console.log(response.answer);
```

### 5. Unified Hybrid Search

```typescript
// Best of both worlds: indexed + live search
const response = await unifiedSearch({
  query: "quantum computing breakthroughs",
  userId: user.id,
  sources: ["indexed", "web"],
  mergeStrategy: "hybrid", // intelligent mixing
  maxResults: 20,
  answer: true,
  answerModel: "claude-3-sonnet"
});

console.log(`Found ${response.totalResults} results`);
console.log(`Indexed: ${response.sourceBreakdown.indexed}`);
console.log(`Live: ${response.sourceBreakdown.live}`);
console.log(response.answer);
```

## 📚 Collection Management

### Create a Collection

```typescript
const { collection } = await createCollection({
  name: "research-papers",
  description: "My AI research collection",
  metadata: {
    category: "research",
    tags: ["AI", "ML", "NLP"]
  },
  userId: user.id
});

console.log(collection.id);
```

### List Collections

```typescript
const { collections, total } = await memoryClient.listCollections(user.id);

collections.forEach(col => {
  console.log(`${col.name}: ${col.memoriesCount} memories`);
});
```

### Update Collection

```typescript
await memoryClient.updateCollection(
  collectionId,
  user.id,
  {
    description: "Updated description",
    metadata: { updated: true }
  }
);
```

## 📄 Document Processing

### Upload and Process a Document

```typescript
// Upload a PDF, TXT, or other document
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const result = await memoryClient.uploadDocument(
  file,
  user.id,
  "research-papers" // optional collection
);

console.log(`Document ${result.documentId} is ${result.status}`);

// Document is automatically:
// 1. Uploaded to storage
// 2. Split into chunks
// 3. Embeddings generated
// 4. Indexed for search
```

### Monitor Processing Status

```typescript
// Poll for document status
const checkStatus = async (documentId: string) => {
  const { data } = await supabase
    .from('documents')
    .select('status, chunks_count')
    .eq('id', documentId)
    .single();
    
  return data;
};

// Or use real-time subscriptions
const subscription = supabase
  .channel('document-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'documents',
    filter: `id=eq.${documentId}`
  }, (payload) => {
    console.log('Document status:', payload.new.status);
    if (payload.new.status === 'ready') {
      console.log(`Processed ${payload.new.chunks_count} chunks`);
    }
  })
  .subscribe();
```

## 🤖 Multi-Model Answer Generation

### Auto-Select Best Model

```typescript
// System automatically picks best model based on query type
const mathQuery = await memoryClient.generateAnswer(
  "solve: 2x + 5 = 15",
  [],
  { autoSelectModel: true }
);
console.log(mathQuery.model); // "o1-mini" (math specialist)

const codeQuery = await memoryClient.generateAnswer(
  "write a function to reverse a string",
  [],
  { autoSelectModel: true }
);
console.log(codeQuery.model); // "gpt-4o" (code specialist)

const generalQuery = await memoryClient.generateAnswer(
  "what's the weather like?",
  [],
  { autoSelectModel: true }
);
console.log(generalQuery.model); // "claude-3-haiku" (fast general)
```

### Force Specific Model

```typescript
const response = await memoryClient.generateAnswer(
  "complex scientific question...",
  documents,
  { 
    preferredModel: "claude-3-sonnet",
    autoSelectModel: false 
  }
);
```

### List Available Models

```typescript
const { models } = await memoryClient.listModels();

models.forEach(model => {
  console.log(`${model.name}:`);
  console.log(`  Provider: ${model.provider}`);
  console.log(`  Use Case: ${model.useCase}`);
  console.log(`  Speed: ${model.speed}`);
});
```

## 🔍 Advanced Search Patterns

### Search with Similarity Threshold

```typescript
const response = await memoryClient.indexedSearch(
  "machine learning algorithms",
  user.id,
  {
    matchThreshold: 0.8, // Only high-similarity results
    matchCount: 5,
    collection: "research"
  }
);
```

### Prioritize Indexed Results

```typescript
const response = await unifiedSearch({
  query: "my personal notes about project X",
  userId: user.id,
  sources: ["indexed", "web"],
  mergeStrategy: "indexed-first", // 70% indexed, 30% web
  maxResults: 20
});
```

### Prioritize Live Results

```typescript
const response = await unifiedSearch({
  query: "breaking news today",
  userId: user.id,
  sources: ["indexed", "web"],
  mergeStrategy: "live-first", // 70% web, 30% indexed
  maxResults: 20
});
```

## 🎯 Real-World Use Cases

### Personal Knowledge Assistant

```typescript
// 1. Add personal notes
await addMemory({
  text: "Meeting notes: Discussed Q4 strategy with team...",
  collection: "work-notes",
  tags: ["meetings", "Q4", "strategy"],
  userId: user.id
});

// 2. Search later
const response = await searchMemories({
  query: "what did we discuss about Q4?",
  sources: ["vault"],
  options: {
    vault: { collection: "work-notes" }
  },
  answer: true,
  userId: user.id
});

console.log(response.answer);
```

### Research Assistant

```typescript
// 1. Upload research papers
for (const file of researchPapers) {
  await memoryClient.uploadDocument(file, user.id, "research");
}

// 2. Query with web context
const response = await unifiedSearch({
  query: "recent advances in transformer architectures",
  userId: user.id,
  sources: ["indexed", "web"],
  mergeStrategy: "hybrid",
  answer: true,
  answerModel: "claude-3-sonnet"
});

console.log(response.answer);
console.log(response.documents); // Both papers and web results
```

### Code Documentation Search

```typescript
// 1. Add code snippets
await addMemory({
  text: `
    function authenticate(token: string) {
      // JWT verification logic
      const decoded = jwt.verify(token, SECRET);
      return decoded;
    }
  `,
  collection: "code-snippets",
  tags: ["auth", "jwt", "typescript"],
  metadata: { language: "typescript", category: "auth" },
  userId: user.id
});

// 2. Search code
const response = await searchMemories({
  query: "how do I verify JWT tokens?",
  sources: ["vault"],
  options: {
    vault: { collection: "code-snippets" }
  },
  answer: true,
  answerModel: "gpt-4o", // Good for code
  userId: user.id
});
```

### Customer Support Knowledge Base

```typescript
// 1. Build KB from support tickets
await addMemory({
  text: "Q: How do I reset my password? A: Click 'Forgot Password'...",
  collection: "support-kb",
  tags: ["password", "account", "faq"],
  userId: user.id
});

// 2. Answer customer questions
const response = await searchMemories({
  query: "customer can't log in",
  sources: ["vault"],
  options: {
    vault: { collection: "support-kb" }
  },
  answer: true,
  answerModel: "claude-3-haiku", // Fast responses
  userId: user.id
});

// Return answer to customer
return response.answer;
```

## 🔒 Error Handling

```typescript
try {
  const response = await searchMemories({
    query: "test query",
    sources: ["vault", "web", "slack"],
    userId: user.id
  });

  // Check for partial failures
  if (response.errors.length > 0) {
    response.errors.forEach(err => {
      console.error(`${err.source} error:`, err.message);
    });
  }

  // Still use successful results
  console.log(`Got ${response.documents.length} results`);
  
} catch (error) {
  console.error("Complete failure:", error);
}
```

## 📊 Performance Monitoring

```typescript
const startTime = Date.now();

const response = await unifiedSearch({
  query: "complex query",
  userId: user.id,
  sources: ["indexed", "web"],
  answer: true
});

console.log(`Total time: ${Date.now() - startTime}ms`);
console.log(`Search time: ${response.processingTime}ms`);
console.log(`Results: ${response.totalResults}`);
console.log(`Model: ${response.answerModel}`);
```

## 🎨 React Hook Example

```typescript
// hooks/useMemorySearch.ts
import { useState } from 'react';
import { searchMemories, type MemorySearchOptions } from '@/lib/memory-client';

export function useMemorySearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const search = async (options: MemorySearchOptions) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await searchMemories(options);
      setResults(response);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { search, loading, error, results };
}

// Component usage
function SearchComponent() {
  const { search, loading, results } = useMemorySearch();
  const { user } = useUser();

  const handleSearch = async () => {
    await search({
      query: "my search query",
      sources: ["indexed", "web"],
      answer: true,
      userId: user.id
    });
  };

  return (
    <div>
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      {results?.answer && (
        <div>{results.answer}</div>
      )}
    </div>
  );
}
```

---

**🚀 Ready to build intelligent memory-powered applications!**

