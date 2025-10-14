# ⚡ Agentic Memory Network - Quick Start

Get up and running with Instant Answers and Knowledge Graph-powered memory in 5 minutes!

---

## 🎯 What You Get

✨ **Instant Answers** - Grounded answers from your users' data using knowledge graph retrieval  
🧠 **Agentic Memory Network** - Automatically learns about people, projects, and concepts  
🔗 **Knowledge Graph** - Entity and relationship tracking for intelligent retrieval  
⚙️ **Context Engineering** - Real-time context enrichment from user data and interactions

---

## 🚀 Quick Start (5 minutes)

### Step 1: Start the Server

```bash
cd frontend
npm run dev
```

Navigate to: **http://localhost:3000/instant-answers**

---

### Step 2: Train Your Memory Network

Use the "Train Memory Network" panel to add your first interaction:

**User Message:**
```
I'm working on the AI optimization project with Sarah. We're implementing machine learning algorithms to improve efficiency.
```

**AI Response:**
```
Great! The AI optimization project sounds exciting. How is Sarah contributing to the machine learning implementation?
```

Click **"Add to Memory"** ✨

---

### Step 3: Ask an Instant Question

In the main search box, try:

```
What do you know about Sarah and the AI project?
```

You'll get an **instant, grounded answer** like:

> "Based on what I know about Sarah, AI optimization project, machine learning. I see 3 connections between these elements. What specific aspect would you like to explore?"

---

### Step 4: Explore the Context

Click the **"Context"** tab to see:
- 👤 **People**: Sarah
- 📦 **Projects**: AI optimization project  
- 💡 **Concepts**: machine learning, algorithms, efficiency
- 🔗 **Relationships**: Sarah works_on AI optimization project

---

### Step 5: Check Network Stats

Click **"Network Stats"** to see:
- Total Entities: 5
- Relationships: 3
- Conversations: 1
- Network Density: 0.6

The network grows smarter with every interaction! 🌱

---

## 📡 API Usage

### Get Instant Answer

```typescript
const response = await fetch('/api/instant-answer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "What projects is Sarah working on?",
    userId: "user-123",
    includeContext: true
  })
});

const data = await response.json();
console.log(data.answer);         // Instant answer
console.log(data.confidence);     // 0.85
console.log(data.entities_used);  // 3
```

### Train the Network

```typescript
const response = await fetch('/api/instant-answer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: userMessage,
    userId: "user-123",
    processInteraction: true,
    userMessage: "I'm working on the AI project",
    aiResponse: "Tell me more about the project"
  })
});
```

### Enrich Agent Context

```typescript
const response = await fetch('/api/context/enrich', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: userQuery,
    userId: "user-123",
    conversationHistory: ["Previous message 1", "Previous message 2"],
    includeSources: ['memory_network', 'conversation_history']
  })
});

const enrichedContext = await response.json();
```

### Extract Entities

```typescript
const response = await fetch('/api/entities/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Sarah is working on the AI optimization project",
    userId: "user-123"
  })
});

const { entities, relationships } = await response.json();
```

---

## 🎨 Example Queries to Try

### People & Collaboration
```
Who is working on AI optimization?
What do you know about Sarah?
Who collaborates with John?
```

### Projects
```
What projects am I working on?
Tell me about the AI optimization project
Which projects involve machine learning?
```

### Concepts & Learning
```
What concepts am I learning about?
What do I know about machine learning?
Which technologies am I exploring?
```

### Relationships
```
How is Sarah connected to the AI project?
What's the relationship between machine learning and optimization?
Who works with whom?
```

---

## 🧠 How It Works

### 1. **Entity Extraction**

From: *"Sarah is working on the AI optimization project"*

Extracts:
- 👤 **Person**: Sarah (confidence: 0.85)
- 📦 **Project**: AI optimization project (confidence: 0.90)
- 💡 **Concept**: AI (confidence: 0.95)

### 2. **Relationship Mapping**

Creates:
- Sarah `works_on` AI optimization project (strength: 0.85)
- AI `related_to` AI optimization project (strength: 0.70)

### 3. **Knowledge Graph Building**

```
    Sarah
      |
   works_on
      |
      v
AI Optimization ---- related_to ---- AI
    Project                       (concept)
```

### 4. **Instant Retrieval**

Query: *"What is Sarah working on?"*

1. Matches entity: "Sarah"
2. Traverses relationships: `works_on`
3. Finds: "AI optimization project"
4. Assembles context from connected entities
5. Generates grounded answer

---

## 📊 Understanding Confidence Scores

| Score | Meaning | Action |
|-------|---------|--------|
| **>0.8** | High confidence | Use answer directly |
| **0.5-0.8** | Medium confidence | Show with disclaimer |
| **<0.5** | Low confidence | Ask for more context |

---

## 🔗 Integration with Your Agent

```typescript
// Enhanced agent with memory network
const enhancedAgentChat = async (userMessage: string) => {
  // 1. Get instant answer
  const instant = await fetch('/api/instant-answer', {
    method: 'POST',
    body: JSON.stringify({ query: userMessage, userId: user.id })
  }).then(r => r.json());

  // 2. Get enriched context
  const context = await fetch('/api/context/enrich', {
    method: 'POST',
    body: JSON.stringify({
      query: userMessage,
      userId: user.id,
      includeSources: ['memory_network', 'conversation_history']
    })
  }).then(r => r.json());

  // 3. Call your agent with enriched context
  const response = await callYourAgent({
    context: context.structured_context,
    instantAnswer: instant.answer,
    userMessage
  });

  // 4. Train network with interaction
  await fetch('/api/instant-answer', {
    method: 'POST',
    body: JSON.stringify({
      query: userMessage,
      userId: user.id,
      processInteraction: true,
      userMessage,
      aiResponse: response
    })
  });

  return response;
};
```

---

## 🎯 Best Practices

### ✅ Do This

- Add real user-AI conversations to train the network
- Use natural language in queries
- Let the network grow organically
- Check confidence scores before using answers
- Include multiple context sources for better results

### ❌ Avoid This

- Sending synthetic/templated data
- Processing the same interaction multiple times
- Using single-word queries
- Ignoring confidence scores
- Training on poor-quality data

---

## 📈 Monitoring Growth

### Check Network Stats

```typescript
const stats = await fetch('/api/instant-answer?userId=user-123')
  .then(r => r.json());

console.log('Total entities:', stats.total_entities);
console.log('Total relationships:', stats.total_relationships);
console.log('Network density:', stats.network_density);
console.log('Entity breakdown:', stats.entity_breakdown);
```

### Healthy Network Indicators

- ✅ **Network density**: 0.3 - 0.8 (sweet spot)
- ✅ **Entity variety**: Mix of people, projects, concepts
- ✅ **Relationship diversity**: Multiple relationship types
- ✅ **Conversation count**: Growing over time

---

## 🚨 Troubleshooting

### "I don't have enough context"

**Problem**: Network doesn't have enough data  
**Solution**: Add more interactions using the training interface

### Low Confidence Scores

**Problem**: Weak entity/relationship connections  
**Solution**: Add more detailed conversations with clear entity mentions

### Slow Performance

**Problem**: Large network (>10,000 entities)  
**Solution**: Implement entity archiving or use database backend

### Incorrect Entity Extraction

**Problem**: Extracting wrong entities  
**Solution**: Improve text quality, use more context

---

## 🔄 Example Workflow

### Building a Personal Assistant

```typescript
// Day 1: Train on projects
await trainNetwork(
  "I'm leading the Sales Dashboard project",
  "Great! What features are you building?"
);

await trainNetwork(
  "We're adding analytics and real-time reporting",
  "Those sound like valuable features!"
);

// Day 2: Ask about progress
const answer = await getInstantAnswer(
  "What features am I building for the Sales Dashboard?"
);
// Returns: "Based on what I know about Sales Dashboard project, 
//           analytics, real-time reporting..."

// Day 3: Team collaboration
await trainNetwork(
  "John is helping with the analytics component",
  "How is John contributing to analytics?"
);

// Day 4: Check connections
const answer = await getInstantAnswer(
  "Who is working on the Sales Dashboard with me?"
);
// Returns: "John is collaborating with you on the Sales Dashboard 
//           project, specifically on the analytics component..."
```

---

## 📚 Next Steps

1. ✅ **Try the UI**: `/instant-answers` - Get familiar with features
2. ✅ **Add 5-10 interactions**: Build your initial knowledge graph
3. ✅ **Test queries**: Try different question types
4. ✅ **Check the guide**: Read [INSTANT_ANSWERS_GUIDE.md](./INSTANT_ANSWERS_GUIDE.md)
5. ✅ **Integrate**: Add to your existing agents

---

## 🎉 What's Possible

With a well-trained memory network:

- ⚡ Answer questions **instantly** without database queries
- 🧠 Remember **everything** about your users' work
- 🔗 Find **connections** between people, projects, concepts
- 📊 Track **progress** over time
- 🤝 Enable **collaborative** intelligence
- 🎯 Provide **personalized** experiences

---

## 📖 Full Documentation

- [Complete Guide](./INSTANT_ANSWERS_GUIDE.md) - Full API reference and advanced features
- [Memory System](./MEMORY_SYSTEM_GUIDE.md) - Vector search and document processing
- [System Overview](./COMPLETE_SYSTEM_OVERVIEW.md) - Architecture and integration

---

**Built with ❤️ for instant, intelligent answers**

Start building your knowledge graph today! 🚀

