# 🏢 Quebec Property Management Workflow - ENHANCED

## ✅ **What I Fixed:**

The previous workflow detected "property" and created a generic "Property Research Assistant" which wasn't suitable for your needs.

### **Your Specific Requirements:**
- ⚖️ **Legal advice for Quebec co-ownership properties**
- 🏢 **Property management operations in Montreal**
- 📧 **Email response generation for tenant communications**
- 🇨🇦 **Quebec-specific regulations and compliance**

---

## 🆕 **New Specialized Nodes:**

### **1. ⚖️ Legal Advisor**
- **Purpose:** Quebec property law and co-ownership regulations
- **Specialization:** Quebec Civil Code compliance
- **API:** `/api/agent/chat` (AI-powered)
- **System Prompt:** "You are a legal expert specializing in Quebec property law and co-ownership regulations..."

### **2. 🏢 Property Manager**
- **Purpose:** Property management operations in Montreal
- **Specialization:** Tenant relations, building maintenance, Quebec regulations
- **API:** `/api/agent/chat` (AI-powered)
- **System Prompt:** "You are an experienced property manager in Montreal, Quebec..."

### **3. 📄 Document Analyzer**
- **Purpose:** Analyze legal documents, leases, and contracts
- **Specialization:** Extract key information and provide summaries
- **API:** `/api/answer` (Ollama-powered)

---

## 🎯 **New Industry Templates:**

### **Legal Industry:**
```typescript
Keywords: ['legal', 'law', 'lawyer', 'attorney', 'regulation', 
          'compliance', 'contract', 'advice', 'co-ownership', 
          'quebec', 'montreal']
```

**Workflow Generated:**
- **Quebec Property Legal Advisor** (if property/co-ownership mentioned)
- **Legal Research Assistant** (general legal queries)

### **Property Management Industry:**
```typescript
Keywords: ['property management', 'property manager', 'tenant', 
          'lease', 'maintenance', 'building', 'condo', 'co-ownership']
```

**Workflow Generated:**
- **Montreal Property Management Assistant** (if legal/advice mentioned)
- **Property Manager Workflow** (general property management)

---

## 🚀 **How to Use - Try Again:**

### **Step 1: Go to Agent Builder**
```
http://localhost:3000/agent-builder
```

### **Step 2: Use These Prompts:**

#### **Option A - Specific to Your Needs:**
```
I need a workflow for property management in Montreal where I can get legal 
advice for co-ownership properties in Quebec, and help drafting professional 
emails to respond to tenant inquiries.
```

#### **Option B - Shorter Version:**
```
Create a Quebec co-ownership legal advisor for property management in Montreal 
with email generation for tenant communications
```

#### **Option C - Focus on Legal:**
```
Legal advice for co-ownership properties in Quebec with email response generation
```

### **Step 3: Review the Generated Workflow**

You should now see:

**📋 Workflow Name:** "Quebec Property Legal Advisor" or "Montreal Property Management Assistant"

**🔧 Components:**
1. **🌐 Web Search** - Research Quebec property laws and regulations
2. **⚖️ Legal Advisor** - Quebec-specific legal advice (AI-powered with specialized prompt)
3. **🏢 Property Manager** - Montreal property management expertise
4. **📧 Email Generator** - Professional email drafting for tenant communications

**🔄 Flow:** Web Search → Legal Advisor → Property Manager → Email Generator

### **Step 4: Click "Build Workflow"**

The workflow will:
- ✅ Open in a new tab at `/workflow`
- ✅ Load with your custom nodes and configurations
- ✅ Ready to execute with proper Quebec/Montreal context

---

## 🎯 **What Each Node Will Do:**

### **1. 🌐 Web Search (Perplexity)**
```
Query: "Quebec co-ownership laws and property management regulations in Montreal"
```
- Searches current Quebec Civil Code articles
- Finds recent regulation changes
- Gathers Montreal-specific property management rules

### **2. ⚖️ Legal Advisor (AI - Gemma-3)**
```
System Prompt: "You are a legal expert specializing in Quebec property 
law and co-ownership regulations. Provide accurate, detailed legal 
advice based on Quebec Civil Code and current regulations."
```
**Input:** Web search results + your specific legal question  
**Output:** Detailed legal analysis with Quebec Civil Code references

### **3. 🏢 Property Manager (AI - Gemma-3)**
```
System Prompt: "You are an experienced property manager in Montreal, 
Quebec. Provide professional advice on property management operations, 
tenant relations, and building maintenance specific to Quebec regulations."
```
**Input:** Legal advice + your property management scenario  
**Output:** Actionable property management recommendations

### **4. 📧 Email Generator (AI - Gemma-3)**
```
System Prompt: "You are a professional email writer. Generate clear, 
courteous, and professional emails appropriate for property management 
and tenant communications in Montreal, Quebec."
```
**Input:** Legal advice + property manager recommendations + your email context  
**Output:** Professional email draft ready to send

---

## 💼 **Example Use Cases:**

### **Use Case 1: Co-ownership Meeting Question**
**Your Query:**
```
A co-owner wants to install a satellite dish on the building. What are 
the Quebec regulations, and how should I respond as property manager?
```

**Workflow Execution:**
1. **Web Search:** Finds Quebec co-ownership laws about building modifications
2. **Legal Advisor:** Analyzes Civil Code articles on common areas and modifications
3. **Property Manager:** Provides practical steps for handling the request
4. **Email Generator:** Drafts response email to the co-owner

### **Use Case 2: Tenant Complaint Response**
**Your Query:**
```
A tenant is complaining about heating issues in December. Draft a 
professional response that addresses their concerns while maintaining 
our legal obligations under Quebec tenant law.
```

**Workflow Execution:**
1. **Web Search:** Quebec heating regulations and landlord obligations
2. **Legal Advisor:** Legal requirements for heating in rental units
3. **Property Manager:** Emergency protocol and maintenance scheduling
4. **Email Generator:** Professional, empathetic email response

### **Use Case 3: Co-ownership Bylaw Question**
**Your Query:**
```
Can our co-ownership restrict short-term rentals (Airbnb)? What does 
Quebec law say, and how should we communicate this to co-owners?
```

**Workflow Execution:**
1. **Web Search:** Recent Quebec legislation on short-term rentals
2. **Legal Advisor:** Analysis of co-ownership declaration powers
3. **Property Manager:** Implementation strategies for the building
4. **Email Generator:** Communication to all co-owners about the policy

---

## 📊 **Expected Workflow Structure:**

```
┌─────────────────┐
│  🌐 Web Search  │ → Perplexity API
│  (Quebec Laws)  │   Real-time legal research
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ ⚖️ Legal Advisor│ → Gemma-3 AI Model
│ (Quebec Expert) │   Legal analysis & advice
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 🏢 Property Mgr │ → Gemma-3 AI Model
│ (Montreal Ops)  │   Practical recommendations
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 📧 Email Gen    │ → Gemma-3 AI Model
│ (Professional)  │   Tenant communication
└─────────────────┘
```

---

## ✅ **Verification Checklist:**

After building the workflow, check:

- [ ] Workflow name shows "Quebec Property Legal Advisor" or "Montreal Property Management Assistant"
- [ ] 4 nodes are visible: Web Search, Legal Advisor, Property Manager, Email Generator
- [ ] Nodes are properly connected in sequence
- [ ] Each node has the correct icon (🌐, ⚖️, 🏢, 📧)
- [ ] Console shows "Generated workflow loaded successfully!"

---

## 🎯 **Next Steps After Building:**

1. **Execute the Workflow:**
   - Enter your specific legal question or property management scenario
   - Click "▶️ Execute Workflow"
   - Watch each node process in sequence

2. **Review Results:**
   - Each node's output builds on the previous one
   - Final email will be ready to use or customize

3. **Continue Chat:**
   - Click "Continue Chat" to discuss results
   - Ask follow-up questions
   - Request modifications to the email draft

---

## 🔧 **Customization Options:**

You can modify the workflow by asking the Agent Builder:

```
"Add a document analyzer to review lease agreements"
"Include a risk assessment node for legal compliance"
"Add a content generator for property management reports"
```

---

## 🚨 **Important Notes:**

1. **Quebec-Specific:** All AI nodes are configured with Quebec/Montreal context
2. **Legal Disclaimer:** This provides informational legal guidance, not professional legal advice
3. **Customizable:** You can modify queries and prompts for each node
4. **Real-Time Data:** Web Search uses Perplexity for current information
5. **AI Models:** Uses Gemma-3 via Ollama for reliable, local processing

---

## 📞 **Support:**

If the workflow doesn't match your needs, describe what's missing:
- "Add X node for Y purpose"
- "Change Z node to focus on..."
- "I need to handle [specific scenario]"

The Agent Builder will regenerate with your modifications! 🚀
