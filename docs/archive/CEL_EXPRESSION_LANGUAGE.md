# 🧮 Common Expression Language (CEL) Integration

## ✅ **CEL Nodes Added to Universal Workflow System**

The system now supports CEL (Common Expression Language) nodes for powerful data manipulation, conditional routing, and global state management.

---

## 🎯 **What CEL Nodes Can Do**

### **1. Data Transformation**
```
Expression: input.results[0].score * 100
Result: Transform data from previous nodes
```

### **2. Conditional Routing**
```
Expression: input.score >= 0.8 ? "high_priority" : "normal_priority"
Result: Route workflow based on conditions
```

### **3. Global State Management**
```
Expression: state.customer.tier = "gold"
Result: Set global variables across workflow
```

### **4. Complex Calculations**
```
Expression: (input.price * 1.15) + state.tax_rate
Result: Perform calculations with context
```

### **5. Data Validation**
```
Expression: input.email.contains("@") && input.email.length > 5
Result: Validate data before processing
```

---

## 🔧 **CEL Node Types**

### **1. CEL Expression Node**
- **Icon:** `CEL`
- **Purpose:** Execute any CEL expression
- **Endpoint:** `/api/cel/execute`
- **Use Case:** General data manipulation

### **2. Data Transformer Node**
- **Icon:** `TRANSFORM`
- **Purpose:** Transform data between nodes
- **Endpoint:** `/api/cel/execute`
- **Use Case:** Data conversion and formatting

### **3. Conditional Router Node**
- **Icon:** `ROUTE`
- **Purpose:** Route workflow based on conditions
- **Endpoint:** `/api/cel/execute`
- **Use Case:** Decision making in workflows

### **4. State Manager Node**
- **Icon:** `STATE`
- **Purpose:** Manage global workflow state
- **Endpoint:** `/api/cel/execute`
- **Use Case:** Persistent variables across nodes

---

## 📝 **CEL Syntax Examples**

### **Variable Access**
```javascript
// Global state
state.customer.tier
state.settings.region
state.cache.last_update

// Previous node data
input.results[0]
input.score
input.metadata["region"]

// Workflow context
workflow.input_as_text
workflow.current_node
workflow.start_time
```

### **Comparisons**
```javascript
input.score >= 0.8
state.customer.tier == "gold"
input.tags != null
workflow.priority > 5
```

### **Mathematical Operations**
```javascript
(input.score * 100) - 20
input.price * (1 + state.tax_rate)
Math.round(input.percentage * 100) / 100
```

### **String Operations**
```javascript
"The region is: " + input.metadata["region"]
input.email.contains("@")
String(input.name).toUpperCase()
```

### **Array Operations**
```javascript
input.authors[size(input.authors) - 1]
size(input.results)
input.tags.contains("urgent")
```

### **Conditional Logic**
```javascript
input.score > (state.flags.beta ? 0.9 : 0.8)
state.customer.tier == "premium" ? "fast_track" : "normal"
```

---

## 🎨 **No Emojis - Clean Professional Design**

### **Icon System:**
- **SEARCH** - Web search nodes
- **LEGAL** - Legal expert nodes
- **PROPERTY** - Property management nodes
- **CEL** - CEL expression nodes
- **TRANSFORM** - Data transformation nodes
- **ROUTE** - Conditional routing nodes
- **STATE** - State management nodes
- **AI** - Generic AI agent nodes

### **Visual Design:**
- Clean text labels instead of emojis
- Professional color coding
- Consistent typography
- Dark theme support

---

## 🧪 **Example Workflows with CEL**

### **Example 1: Customer Scoring Workflow**

**Nodes:**
1. **WEB** - Customer Data Search
2. **CEL** - Calculate Score: `(input.purchase_history * 0.4) + (input.engagement * 0.6)`
3. **ROUTE** - Conditional Routing: `input.score >= 0.8 ? "premium" : "standard"`
4. **EMAIL** - Personalized Response Generator

### **Example 2: Property Investment Analysis**

**Nodes:**
1. **SEARCH** - Market Research
2. **LEGAL** - Legal Compliance Check
3. **CEL** - Investment Score: `(input.market_value / input.purchase_price) * input.location_score`
4. **STATE** - Update Portfolio: `state.portfolio.total_value += input.investment_amount`
5. **REPORT** - Generate Investment Report

### **Example 3: Content Moderation Workflow**

**Nodes:**
1. **CONTENT** - Content Analysis
2. **CEL** - Moderation Score: `input.offensive_words.length > 0 ? 0 : input.quality_score`
3. **ROUTE** - Route Decision: `input.moderation_score < 0.5 ? "reject" : "approve"`
4. **EMAIL** - Notification System

---

## 🔧 **CEL API Endpoint**

### **POST `/api/cel/execute`**

**Request Body:**
```json
{
  "expression": "input.score * 100",
  "variables": {
    "multiplier": 1.15
  },
  "state": {
    "customer_tier": "gold"
  },
  "previousData": {
    "score": 0.85
  },
  "workflowContext": {
    "nodeId": "node-2",
    "nodeLabel": "Score Calculator",
    "workflowName": "Customer Analysis"
  }
}
```

**Response:**
```json
{
  "result": 85,
  "newState": {
    "last_score": 85
  },
  "variables": {
    "multiplier": 1.15
  },
  "routing": {
    "nextNode": "high_score_handler",
    "condition": "score >= 80"
  }
}
```

---

## 🎯 **AI Workflow Generation with CEL**

The AI will automatically include CEL nodes when it detects:

### **Keywords that trigger CEL nodes:**
- `transform` - Data transformation
- `calculate` - Mathematical operations
- `expression` - CEL expressions
- `conditional` - Conditional logic
- `route` - Workflow routing
- `state` - Global state management
- `variables` - Variable handling
- `logic` - Business logic
- `cel` - Explicit CEL usage

### **Example AI-Generated Workflow:**

**User Input:** "Create a workflow that calculates customer scores and routes them based on tier"

**AI Generates:**
```yaml
Workflow Name: "Customer Scoring & Routing System"
Nodes:
  1. SEARCH - Customer Data Gatherer
  2. CEL - Score Calculator
  3. ROUTE - Tier Router
  4. EMAIL - Response Generator

CEL Expressions:
  - Score: (input.purchases * 0.3) + (input.engagement * 0.7)
  - Route: input.score >= 80 ? "premium" : input.score >= 60 ? "standard" : "basic"
```

---

## 🚀 **How to Use CEL Nodes**

### **1. In Agent Builder:**
```
"Create a workflow that transforms customer data and routes based on calculated scores"
```

### **2. Manual Configuration:**
- Add CEL node to workflow
- Configure expression in node settings
- Set variables and state as needed

### **3. Expression Examples:**
```javascript
// Simple calculation
input.price * 1.15

// Conditional routing
input.priority == "high" ? "urgent_queue" : "normal_queue"

// State management
state.total_customers += 1

// Data validation
input.email.contains("@") && input.email.length > 5
```

---

## 🎨 **Professional Design Features**

### **No Emojis Policy:**
- ✅ Clean text labels: `SEARCH`, `LEGAL`, `CEL`
- ✅ Professional appearance
- ✅ Better accessibility
- ✅ Consistent branding

### **Dark Theme Support:**
- ✅ Dark gray backgrounds
- ✅ White text on dark backgrounds
- ✅ Gray input boxes
- ✅ Blue accent colors

### **Icon System:**
- ✅ Text-based icons
- ✅ Color-coded by function
- ✅ Consistent sizing
- ✅ Professional appearance

---

## 🎯 **Benefits of CEL Integration**

### **1. Powerful Data Manipulation**
- Transform data between nodes
- Perform complex calculations
- Validate data integrity

### **2. Intelligent Routing**
- Conditional workflow paths
- Dynamic decision making
- Business logic automation

### **3. Global State Management**
- Persistent variables
- Cross-node communication
- Workflow memory

### **4. Professional Appearance**
- No emojis - clean design
- Consistent branding
- Better accessibility

---

## 🚀 **Ready to Use!**

CEL nodes are now fully integrated into the universal workflow system. The AI will automatically detect when CEL functionality is needed and generate appropriate nodes with expressions.

**Test it now:**
1. Go to Agent Builder
2. Request: "Create a workflow that calculates scores and routes based on conditions"
3. See CEL nodes automatically generated
4. Execute and watch the expressions work!

The system now provides enterprise-grade workflow capabilities with clean, professional design! 🎉
