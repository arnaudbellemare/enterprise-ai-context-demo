# Arena Comparison - Available Tasks

## 🎯 **Tasks in Arena Comparison**

When you visit `/agent-builder-v2`, you'll see these tasks available:

---

### **1. 🔥 Crypto Liquidations (Real-Time)**
**Description**: Find actual liquidations in last 24h  
**Example**: "What are the actual crypto liquidations that happened in the last 24 hours? Include amounts, exchanges, and whether they were longs or shorts."

**Features**:
- Real Browserbase execution with Playwright
- ACE Framework with smart model routing
- Real-time data extraction

---

### **2. Check Crypto Prices**
**Description**: Get current cryptocurrency prices  
**Example**: "Go to CoinGecko and get the current price of Bitcoin, Ethereum, and Solana"

**Features**:
- Browser automation comparison
- Direct web scraping

---

### **3. Browse Hacker News**
**Description**: Find trending discussions  
**Example**: "Go to Hacker News and find the top 3 trending technology discussions"

**Features**:
- Web navigation and extraction
- Content analysis

---

### **4. Review GitHub PR**
**Description**: Navigate and review pull requests  
**Example**: "Go to https://github.com/microsoft/vscode and review the latest open pull request"

**Features**:
- Complex web navigation
- Code review analysis

---

### **5. 🚀 ACE Framework Integration Demo**
**Description**: Complete system demonstration with all technologies  
**Example**: "Demonstrate the full ACE Framework capabilities: Smart Model Routing, Context Engineering, Knowledge Graph integration, Statistical Validation, and Multi-Agent Orchestration. Show how all components work together to provide superior performance compared to traditional approaches."

**Features**:
- Smart Model Routing (Ollama + Perplexity)
- Context Engineering
- Knowledge Graph integration
- Statistical Validation
- Multi-Agent Orchestration

**Endpoint**: `/api/arena/execute-comprehensive-demo`

---

### **6. 🏦 Financial LoRA Analysis**
**Description**: Compare LoRA methods for financial AI tasks  
**Example**: "Analyze the performance of LoRA, QLoRA, rsLoRA, and DORA fine-tuning methods on financial tasks including XBRL tagging, sentiment analysis, market analysis, and risk assessment. Compare costs, accuracy, and practical deployment considerations."

**Features**:
- LoRA method comparison
- Financial task analysis
- Cost/accuracy trade-offs
- AX LLM integration (DSPy + GEPA + Ollama)

**Endpoint**: `/api/finance/lora-comparison`

---

### **7. 🚀 Advanced ACE Framework**
**Description**: ReAct + Multimodal + Benchmarks + Fine-tuning  
**Example**: "Execute a comprehensive financial analysis using the advanced ACE Framework with ReAct reasoning, multimodal data visualization, systematic benchmarking, and domain-specific fine-tuning. Demonstrate superior performance compared to traditional approaches."

**Features**:
- **ReAct-style reasoning** (systematic Thought → Action → Observation)
- **Multimodal data processing** (visualization, anomaly detection)
- **Systematic benchmarking** (138 financial tasks)
- **Domain-specific fine-tuning** (DORA method)

**Components**:
1. Task Analysis and Planning
2. ReAct Reasoning (if enabled)
3. Multimodal Processing (if enabled)
4. Benchmark Evaluation (if requested)
5. Fine-tuning Integration
6. Final Synthesis

**Endpoint**: `/api/finance/advanced-ace`

---

### **8. 🌐 Multi-Domain AI Platform** ⭐ **NEW!**
**Description**: Financial, Medical, Legal, Manufacturing, SaaS, Marketing, Education, Research, Retail, Logistics  
**Example**: "Select a domain and execute specialized AI analysis with domain-specific ReAct reasoning, industry benchmarks (1200+ tasks), and regulatory compliance. Supports all major industries with expert-level performance."

**Features**:
- **10 Industry Domains**
- **Domain Selector UI** (appears when task is selected)
- **1,200+ Benchmark Tasks** across all domains
- **Domain-Specific ReAct Reasoning**
- **Regulatory Compliance** built-in
- **Industry-Specific Metrics**

**How It Works**:
1. Select "🌐 Multi-Domain AI Platform" task
2. **Domain selector appears** with 10 industry buttons
3. Choose your industry (Financial, Medical, Legal, etc.)
4. Enter your task or use the default
5. Click "Run Our System"
6. See domain-specific analysis with:
   - ReAct reasoning steps
   - Industry benchmarks
   - Regulatory compliance
   - Expert recommendations

**Supported Domains**:
| Domain | Tasks | Key Applications |
|--------|-------|------------------|
| **Financial** | 138 | XBRL, Risk, Portfolio, Trading |
| **Medical** | 150 | Diagnosis, Imaging, Treatment |
| **Legal** | 120 | Contracts, Research, Compliance |
| **Manufacturing** | 130 | Quality, Maintenance, Optimization |
| **SaaS** | 110 | Customer Success, Analytics |
| **Marketing** | 120 | Campaigns, Attribution |
| **Education** | 100 | Learning, Assessment |
| **Research** | 100 | Literature, Analysis |
| **Retail** | 110 | Demand, Pricing, Inventory |
| **Logistics** | 100 | Routes, Warehouse |

**Endpoint**: `/api/multi-domain/execute`

**Request Body**:
```json
{
  "domain": "medical",
  "task": "Analyze patient symptoms and provide differential diagnosis",
  "useReAct": true,
  "runBenchmark": true,
  "taskData": {}
}
```

**Response Structure**:
```json
{
  "success": true,
  "result": {
    "domain": "medical",
    "domainInfo": {
      "name": "Medical & Healthcare",
      "complexity": "Very High",
      "regulations": ["HIPAA", "FDA", "ISO 13485"]
    },
    "executionSteps": [...],
    "finalResult": "Comprehensive analysis...",
    "confidence": 0.93,
    "performanceMetrics": {...},
    "regulatoryCompliance": {...}
  }
}
```

---

## 🎮 **How to Use the Arena**

### **Step 1: Select Test Case**
- Choose from 8 predefined tasks
- Each task demonstrates different capabilities

### **Step 2: Configure (for Multi-Domain)**
- If you select "🌐 Multi-Domain AI Platform"
- **A domain selector will appear**
- Choose from 10 industries

### **Step 3: Execute Comparison**
- Click "Run Browserbase" to test Browserbase
- Click "Run Our System" to test ACE Framework
- Or click "Run Both Systems" to compare side-by-side

### **Step 4: View Results**
- Live execution status
- Performance metrics (duration, cost, accuracy)
- Execution logs
- Confidence scores
- Verifiable proof (for real executions)

---

## 📊 **What You'll See**

### **Browserbase Results**
- Browser automation approach
- Screenshot-based verification
- Step-by-step execution logs

### **ACE Framework Results**
- Smart model routing
- Context engineering
- Knowledge graph integration
- Statistical validation
- Multi-agent orchestration
- **Domain-specific reasoning** (for multi-domain tasks)

### **Performance Comparison**
- Duration (seconds)
- Cost (dollars)
- Accuracy (percentage)
- Steps taken
- Confidence level

---

## 🚀 **Statistical Significance Testing**

At the bottom of the page, you'll find:

### **Run Statistical Benchmark**
- Executes systematic benchmark tests
- McNemar's test for statistical significance
- Paired t-tests for performance comparison
- Cohen's d for effect size
- Scientific proof that ACE Framework is superior

---

## 🎯 **Key Differentiators**

### **Browserbase**
- Browser automation
- Screenshot-based
- Manual URL specification needed
- Limited intelligence

### **ACE Framework**
- Smart model routing (Ollama + Perplexity)
- No screenshots needed
- Intelligent task understanding
- Context engineering
- Knowledge graph
- Statistical validation
- **Domain-specific expertise** (10 industries)

---

## ✅ **Everything is Live**

All 8 tasks are fully functional:
1. ✅ Crypto Liquidations
2. ✅ Crypto Prices
3. ✅ Hacker News
4. ✅ GitHub PR Review
5. ✅ ACE Framework Demo
6. ✅ Financial LoRA Analysis
7. ✅ Advanced ACE Framework
8. ✅ **Multi-Domain AI Platform** ⭐

**Server**: http://localhost:3000  
**Arena**: http://localhost:3000/agent-builder-v2

Try the **Multi-Domain AI Platform** task to see the domain selector in action!
