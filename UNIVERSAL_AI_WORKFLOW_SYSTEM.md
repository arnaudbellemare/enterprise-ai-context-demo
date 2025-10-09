# 🤖 Universal AI-Driven Workflow System

## 🎯 **Revolutionary Change: AI Builds Your Workflow**

The system now uses **AI-powered workflow generation** where the AI intelligently analyzes your request and builds the perfect workflow automatically. No more hardcoded node types or templates!

---

## ✨ **How It Works**

### **1. You Describe What You Want**
```
"Property management in Montreal with legal advice for co-ownership and email drafting"
```

### **2. AI Analyzes Your Request**
The system automatically detects:
- **Domain**: Property management
- **Location**: Montreal
- **Requirements**: Legal advice, co-ownership, email generation
- **Complexity**: High (multiple specializations)

### **3. AI Plans the Workflow**
```
Workflow Name: "Property Legal Assistant (Montreal)"
Description: "Legal guidance and property management operations for Montreal"

Stages:
1. Web Researcher → Gather real-time Quebec property law information
2. Legal Expert (Montreal) → Quebec-specific legal analysis
3. Property Manager (Montreal) → Operations guidance
4. Communication Specialist → Professional email drafting
```

### **4. AI Generates Universal Nodes**
Each node is a **Universal AI Agent** that adapts to its role:

```typescript
Node 1: {
  label: "Web Researcher",
  role: "Web Researcher",
  systemPrompt: "You are a Web Researcher. Gather real-time information and current data. 
                 You specialize in Montreal regulations and practices...",
  endpoint: "/api/perplexity/chat"
}

Node 2: {
  label: "Legal Expert (Montreal)",
  role: "Legal Expert (Montreal)",
  systemPrompt: "You are a Legal Expert (Montreal). You provide accurate legal analysis 
                 based on current laws. You specialize in Montreal regulations and practices. 
                 You specialize in property law, co-ownership regulations...",
  endpoint: "/api/agent/chat"
}
```

### **5. Workflow Executes Intelligently**
Each node:
- ✅ Receives context from previous nodes
- ✅ Uses its custom system prompt
- ✅ Adapts to its position in the workflow
- ✅ Routes to the appropriate API automatically

---

## 🧠 **AI Intelligence Features**

### **Automatic Domain Detection**
The AI detects what type of workflow you need:

| Your Keywords | Detected Domain | Workflow Type |
|--------------|----------------|---------------|
| "property", "real estate", "co-ownership" | Property | Property Legal Assistant |
| "finance", "investment", "trading" | Finance | Financial Analysis |
| "legal", "law", "compliance" | Legal | Legal Advisory System |
| "marketing", "social media", "campaign" | Marketing | Marketing Automation |
| "customer", "support", "service" | Customer Service | Support Assistant |
| "medical", "healthcare", "patient" | Healthcare | Healthcare Research |
| "tech", "software", "development" | Technology | Tech Research |

### **Automatic Location Detection**
```
Mentions "Quebec" → Adds Quebec-specific legal context
Mentions "Montreal" → Focuses on Montreal regulations
Mentions "Miami" → Adapts to Miami market conditions
```

### **Automatic Capability Detection**
```
Mentions "research"/"find" → Adds Web Search node
Mentions "legal"/"law" → Adds Legal Expert node
Mentions "email"/"respond" → Adds Email Generator node
Mentions "analyze"/"data" → Adds Data Analyst node
```

---

## 🎨 **Universal Node System**

### **No More Hardcoded Nodes!**

**OLD SYSTEM:**
```
Fixed nodes: Legal Advisor, Market Analyst, Investment Report...
Each has specific hardcoded behavior
Limited to predefined use cases
```

**NEW SYSTEM:**
```
Universal AI Agent nodes
Each adapts to ANY role dynamically
Works for UNLIMITED use cases
```

### **How Universal Nodes Work:**

```typescript
// The AI generates this dynamically:
{
  id: "node-1",
  label: "Legal Expert (Quebec)",  // ← AI decides the role
  role: "Legal Expert (Quebec)",
  description: "Provide legal analysis and regulatory guidance specific to Quebec",
  apiEndpoint: "/api/agent/chat",  // ← AI picks the right endpoint
  systemPrompt: "You are a Legal Expert (Quebec). You provide accurate legal 
                 analysis and regulatory guidance based on current laws and 
                 regulations. You specialize in Quebec regulations and practices. 
                 You specialize in property law, co-ownership regulations...",
  icon: "⚖️",  // ← AI picks relevant icon
  iconColor: "bg-slate-600"
}
```

### **Dynamic System Prompts:**

The AI generates context-aware system prompts that include:
- **Role definition** (what the node should be)
- **Specialization** (domain expertise)
- **Location context** (geo-specific knowledge)
- **Position awareness** (first/middle/last in workflow)
- **Output expectations** (what to produce)

**Example Generated Prompts:**

```
First Node:
"You are a Web Researcher. You conduct thorough research, analyze information, 
and provide evidence-based insights. As the first step in this workflow, you 
set the foundation by gathering and organizing key information. Provide detailed, 
professional, and actionable research."

Middle Node:
"You are a Legal Expert (Quebec). You provide accurate legal analysis and 
regulatory guidance based on current laws and regulations. You specialize in 
Quebec regulations and practices. You specialize in property law, co-ownership 
regulations, and landlord-tenant relations. You build upon the findings from 
the Web Researcher and prepare insights for the Property Manager (Montreal). 
Provide detailed, professional, and actionable advice."

Last Node:
"You are a Communication Specialist. You write clear, professional, and 
effective communications. You specialize in Montreal regulations and practices. 
As the final step, you synthesize all previous analysis into a professional 
email. Provide detailed, professional, and actionable email."
```

---

## 🚀 **API Architecture**

### **Three Core APIs:**

#### **1. `/api/perplexity/chat` (Web Search)**
- **Use**: Real-time web research
- **When**: Node needs current information
- **Auto-selected for**: "Web Researcher" nodes

#### **2. `/api/agent/chat` (AI Conversation)**
- **Use**: Intelligent analysis and reasoning
- **When**: Node needs to process and analyze
- **Auto-selected for**: Most agent nodes (Legal Expert, Property Manager, etc.)

#### **3. `/api/answer` (Data Processing)**
- **Use**: Data analysis and report generation
- **When**: Node needs to synthesize or generate reports
- **Auto-selected for**: Report Generator, Data Analyst nodes

### **Universal Routing:**
```typescript
if (endpoint === '/api/perplexity/chat') {
  // Web search with dynamic query
} else if (endpoint === '/api/answer') {
  // Data processing with context
} else {
  // AI agent with system prompt
}
```

---

## 📋 **Example Workflows Generated**

### **Example 1: Quebec Property Management**

**Your Input:**
```
"Property management in Montreal with legal advice for co-ownership and email responses"
```

**AI Generates:**
```yaml
Workflow Name: "Montreal Property Management Assistant"
Description: "Property management operations with Quebec legal compliance and tenant communications"

Nodes:
  1. Web Researcher
     - Gather Quebec property laws and regulations
     - Endpoint: /api/perplexity/chat
     - Icon: 🔍

  2. Legal Expert (Montreal)
     - Quebec-specific legal analysis
     - Endpoint: /api/agent/chat
     - Icon: ⚖️
     - System Prompt: "You are a Legal Expert (Montreal)..."

  3. Property Manager (Montreal)
     - Property operations guidance
     - Endpoint: /api/agent/chat
     - Icon: 🏢
     - System Prompt: "You are an experienced property manager in Montreal..."

  4. Communication Specialist
     - Professional email drafting
     - Endpoint: /api/agent/chat
     - Icon: 📧
     - System Prompt: "You are a professional email writer..."

Flow: 🔍 → ⚖️ → 🏢 → 📧
```

### **Example 2: Financial Analysis**

**Your Input:**
```
"Analyze stock portfolio with risk assessment and investment recommendations"
```

**AI Generates:**
```yaml
Workflow Name: "Portfolio Analysis System"
Description: "Comprehensive financial portfolio analysis with risk assessment and recommendations"

Nodes:
  1. Data Analyst
     - Statistical analysis and interpretation
     - Endpoint: /api/answer
     - Icon: 📊

  2. Risk Assessment Specialist
     - Risk evaluation and analysis
     - Endpoint: /api/agent/chat
     - Icon: ⚠️

  3. Investment Report Generator
     - Investment report compilation
     - Endpoint: /api/answer
     - Icon: 💰

  4. Financial Analyst
     - Financial analysis and evaluation
     - Endpoint: /api/agent/chat
     - Icon: 📈

Flow: 📊 → ⚠️ → 💰 → 📈
```

### **Example 3: Marketing Campaign**

**Your Input:**
```
"Create marketing content for social media campaign with email automation"
```

**AI Generates:**
```yaml
Workflow Name: "Content Creation Pipeline"
Description: "Automated content creation for marketing campaigns and social media"

Nodes:
  1. Marketing Strategist
     - Campaign planning and strategy
     - Endpoint: /api/agent/chat
     - Icon: 🎯

  2. Content Generator
     - Written content creation
     - Endpoint: /api/answer
     - Icon: ✍️

  3. Social Media Specialist
     - Social media content optimization
     - Endpoint: /api/agent/chat
     - Icon: 📱

  4. Communication Specialist
     - Email marketing automation
     - Endpoint: /api/agent/chat
     - Icon: 📧

Flow: 🎯 → ✍️ → 📱 → 📧
```

### **Example 4: Healthcare Research**

**Your Input:**
```
"Medical research on diabetes treatments with data analysis"
```

**AI Generates:**
```yaml
Workflow Name: "Healthcare Research Assistant"
Description: "Medical research and healthcare data analysis workflow"

Nodes:
  1. Healthcare Researcher
     - Medical research and analysis
     - Endpoint: /api/agent/chat
     - Icon: ⚕️

  2. Data Analyst
     - Statistical analysis
     - Endpoint: /api/answer
     - Icon: 📊

  3. Content Generator
     - Research report compilation
     - Endpoint: /api/answer
     - Icon: ✍️

  4. Insight Synthesizer
     - Synthesize findings
     - Endpoint: /api/agent/chat
     - Icon: 🤖

Flow: ⚕️ → 📊 → ✍️ → 🤖
```

---

## 🎯 **Testing the System**

### **Test Scenarios:**

#### **1. Quebec Property Legal (Your Use Case)**
```bash
Input: "I need legal advice for co-ownership properties in Quebec with email responses"

Expected Workflow:
✅ Web Researcher → Legal Expert (Quebec) → Property Manager → Communication Specialist
✅ All nodes have Quebec-specific context
✅ Email generation included
✅ Legal compliance built-in
```

#### **2. General Purpose**
```bash
Input: "Research and analyze technology trends"

Expected Workflow:
✅ Web Researcher → Tech Analyst → Data Analyst → Insight Synthesizer
✅ Generic but functional
✅ Adapts to tech domain
```

#### **3. Customer Service**
```bash
Input: "Handle customer complaints with professional email responses"

Expected Workflow:
✅ Customer Support Specialist → Communication Specialist
✅ Simple 2-node workflow
✅ Focused on support and communication
```

#### **4. Complex Multi-Domain**
```bash
Input: "Analyze Miami real estate market for investment with legal compliance and email updates"

Expected Workflow:
✅ Web Researcher → Market Analyst → Legal Expert → Investment Report → Communication Specialist
✅ 5-node complex workflow
✅ Multi-domain integration
✅ Location-specific (Miami)
```

---

## 🔥 **Key Advantages**

### **1. Zero Hardcoding**
- No predefined node types
- No fixed templates
- Unlimited flexibility

### **2. True Intelligence**
- AI understands intent
- AI adapts to context
- AI optimizes flow

### **3. Location-Aware**
- Auto-detects locations
- Adds geo-specific context
- Complies with local regulations

### **4. Domain-Expert**
- Specializes per domain
- Uses appropriate terminology
- Provides professional outputs

### **5. Scalable**
- Works for ANY industry
- Works for ANY task
- Works for ANY complexity

---

## 🛠️ **How to Use**

### **Step 1: Go to Agent Builder**
```
http://localhost:3000/agent-builder
```

### **Step 2: Describe Your Needs**

Be specific but natural:
```
✅ Good: "Property management in Montreal with Quebec legal advice and email generation"
✅ Good: "Financial portfolio analysis with risk assessment for tech stocks"
✅ Good: "Marketing campaign for e-commerce with social media content"

❌ Too vague: "help me"
❌ Too vague: "create workflow"
❌ Too vague: "ai agent"
```

### **Step 3: Review AI's Recommendation**

The AI will show:
- ✅ Workflow name and description
- ✅ Each node's role and purpose
- ✅ Visual flow diagram
- ✅ Estimated capabilities

### **Step 4: Build & Execute**

Click "Build Workflow" → Opens in workflow builder → Execute!

### **Step 5: Iterate**

If not perfect, tell the AI:
```
"Add a document analyzer node"
"Focus more on legal compliance"
"Include financial projections"
```

---

## 🎓 **Technical Details**

### **Workflow Generation Process:**

```
1. analyzeUserIntent(request)
   ↓ Extracts: domain, locations, requirements, complexity

2. planWorkflowStructure(analysis)
   ↓ Creates: workflow plan with stages

3. generateAdaptiveNodes(plan)
   ↓ Generates: universal nodes with roles

4. generateEdges(nodes)
   ↓ Creates: connections between nodes

5. generateNodeConfigurations(nodes, analysis)
   ↓ Generates: system prompts and configs
```

### **Node Configuration Structure:**

```typescript
{
  query: string,              // What to ask/process
  useRealAI: boolean,         // Use real API (always true)
  systemPrompt: string,       // Dynamic AI role prompt
  preferredModel: string,     // AI model preference
  role: string,               // Node's role description
  context: {
    domain: string,           // Industry/domain
    locations: string[],      // Geographic context
    outputType: string,       // Expected output
    position: number,         // Node position
    totalNodes: number        // Total workflow nodes
  }
}
```

### **Universal Node Execution:**

```typescript
// Extract node configuration
const nodeConfig = nodeConfigs[nodeId];
const apiEndpoint = node.data.apiEndpoint;

// Generate system prompt (if not provided)
const systemPrompt = nodeConfig.systemPrompt || 
  `You are a ${node.data.label}. ${node.data.role}`;

// Build context-aware task
const task = `Context: ${previousNodeData}\nTask: ${nodeConfig.query}`;

// Route to appropriate API
if (apiEndpoint === '/api/perplexity/chat') {
  // Web search
} else if (apiEndpoint === '/api/answer') {
  // Data processing
} else {
  // AI agent (default)
  fetch('/api/agent/chat', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: task }
    ]
  });
}
```

---

## 🚀 **Next Steps**

1. **Test Your Use Case:**
   ```
   "Property management in Montreal with legal advice for co-ownership and email drafting"
   ```

2. **Try Different Scenarios:**
   - Financial analysis
   - Marketing automation
   - Customer support
   - Healthcare research
   - Technology analysis

3. **Provide Feedback:**
   - What works well?
   - What needs improvement?
   - What's missing?

---

## 🎉 **Summary**

You now have a **truly intelligent AI workflow system** where:

✅ AI analyzes your request  
✅ AI designs the perfect workflow  
✅ AI generates adaptive nodes  
✅ AI creates context-aware prompts  
✅ AI routes to appropriate APIs  
✅ Everything adapts dynamically  

**No templates. No hardcoding. Just pure AI intelligence.** 🤖✨

---

## 📞 **Support**

If you encounter issues or have suggestions:
1. Check browser console for debugging info
2. Verify all API endpoints are running
3. Try rephrasing your request
4. Check the generated workflow structure

The system logs everything for debugging! 🔍
