# 🔍 Debug: Workflow Transfer Issue

## 🚨 **Problem**
The workflow preview in Agent Builder shows the correct generated workflow, but when clicking "Build Workflow", the `/workflow` page loads the default workflow instead of the generated one.

---

## 🧪 **Enhanced Debugging Added**

I've added comprehensive logging at every step to trace exactly where the issue occurs:

### **1. Agent Builder (Storage Phase)**
```javascript
// When building workflow:
console.log('✅ Workflow data stored:', workflowData);
console.log('✅ Workflow name:', workflowData.name);
console.log('✅ Number of nodes:', workflowData.nodes.length);
console.log('✅ Node labels:', workflowData.nodes.map(n => n.label));

// Verification:
console.log('✅ Verification - stored in localStorage:', stored ? 'YES' : 'NO');
console.log('✅ Verification - stored name:', parsed.name);
console.log('✅ Verification - stored nodes count:', parsed.nodes?.length);
```

### **2. Workflow Page (Loading Phase)**
```javascript
// When page loads:
console.log('🔍 Checking for generated workflow:', generatedWorkflow ? 'Found' : 'Not found');
console.log('✅ Loading generated workflow:', workflow);
console.log('✅ Generated workflow name:', workflow.name);
console.log('✅ Generated workflow nodes:', workflow.nodes?.length);
console.log('✅ Generated workflow nodes labels:', workflow.nodes?.map(n => n.label));
```

### **3. API Generation (Backend)**
```javascript
// When API generates workflow:
console.log('🔍 Processing request:', userRequest);
console.log('✅ Generated workflow:', recommendation.name);
console.log('📋 Nodes:', recommendation.nodes.map(n => n.label).join(' → '));
```

---

## 🧪 **Step-by-Step Debug Process**

### **Step 1: Clear Everything**
```javascript
// In browser console:
localStorage.clear();
console.clear();
```

### **Step 2: Test Agent Builder**
1. Go to `http://localhost:3000/agent-builder`
2. Enter: `"Property management in Montreal with legal advice for co-ownership and email responses"`
3. **Watch console for API response**

**Expected Console Output:**
```
🔍 Processing request: Property management in Montreal...
✅ Generated workflow: Montreal Property Management Assistant
📋 Nodes: Web Researcher → Legal Expert (Montreal) → Property Manager (Montreal) → Communication Specialist

📥 API Response: {recommendation: {...}}
Recommendation received: {name: "Montreal Property Management Assistant", nodes: [4], ...}
```

**❓ Question 1:** Does the API return the correct workflow name and nodes?

### **Step 3: Review Workflow Preview**
The UI should show:
```
## Montreal Property Management Assistant

📝 Description: Property management operations with Quebec legal compliance...

🔧 Workflow Components:
1. Web Researcher - Gather real-time information
2. Legal Expert (Montreal) - Legal analysis
3. Property Manager (Montreal) - Property operations  
4. Communication Specialist - Email drafting
```

**❓ Question 2:** Does the preview show the correct workflow?

### **Step 4: Click "Build Workflow"**
**Watch console for storage logs:**

**Expected Console Output:**
```
✅ Workflow data stored: {name: "Montreal Property Management Assistant", nodes: [4], ...}
✅ Workflow name: Montreal Property Management Assistant
✅ Number of nodes: 4
✅ Node labels: ["Web Researcher", "Legal Expert (Montreal)", "Property Manager (Montreal)", "Communication Specialist"]
✅ Verification - stored in localStorage: YES
✅ Verification - stored name: Montreal Property Management Assistant
✅ Verification - stored nodes count: 4
```

**❓ Question 3:** Does the storage show the correct workflow data?

### **Step 5: Check New Tab Console**
In the NEW `/workflow` tab, watch console for loading logs:

**Expected Console Output:**
```
🔍 Checking for generated workflow: Found
✅ Loading generated workflow: {name: "Montreal Property Management Assistant", ...}
✅ Generated workflow name: Montreal Property Management Assistant
✅ Generated workflow nodes: 4
✅ Generated workflow nodes labels: ["Web Researcher", "Legal Expert (Montreal)", ...]
🔧 loadGeneratedWorkflow called with: {name: "Montreal Property Management Assistant", ...}
🔧 Converted nodes: [{id: "node-1", data: {label: "Web Researcher", ...}}, ...]
🎉 Generated workflow loaded successfully!
```

**❓ Question 4:** Does the workflow page load the correct workflow?

### **Step 6: Verify Visual Result**
The workflow page should show:
- ✅ **Workflow name:** "Montreal Property Management Assistant" (not "Real Estate Market Analysis")
- ✅ **4 nodes:** Web Researcher, Legal Expert (Montreal), Property Manager (Montreal), Communication Specialist
- ✅ **Correct icons:** SEARCH, LEGAL, PROPERTY, EMAIL (no emojis)
- ✅ **Execution log:** Shows "Generated workflow loaded successfully!"

**❓ Question 5:** Does the visual result match the generated workflow?

---

## 🔧 **Potential Issues & Solutions**

### **Issue 1: API Not Generating Correct Workflow**
**Symptom:** Step 1 shows wrong workflow name/nodes

**Check:**
```javascript
// Test API directly in console:
fetch('/api/agent-builder/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userRequest: "Property management in Montreal with legal advice for co-ownership and email responses",
    conversationHistory: []
  })
})
.then(r => r.json())
.then(data => {
  console.log('Direct API Test:');
  console.log('Name:', data.recommendation.name);
  console.log('Nodes:', data.recommendation.nodes.map(n => n.label));
});
```

**Solution:** If wrong, the AI analysis logic needs adjustment

### **Issue 2: Preview Shows Wrong Workflow**
**Symptom:** Step 2 shows wrong preview

**Cause:** React state not updating with API response

**Solution:** Check if `setRecommendation(data.recommendation)` is working

### **Issue 3: Storage Fails**
**Symptom:** Step 4 shows wrong stored data

**Cause:** `recommendation` state is stale/empty

**Solution:** Verify `recommendation` state before building

### **Issue 4: localStorage Not Working**
**Symptom:** Step 5 shows "Not found"

**Check localStorage manually:**
```javascript
// In workflow page console:
const data = localStorage.getItem('generatedWorkflow');
console.log('localStorage data:', data);
```

**Solution:** Browser localStorage issues or timing problems

### **Issue 5: Loading Fails**
**Symptom:** Step 5 shows "Found" but wrong workflow loaded

**Cause:** `loadGeneratedWorkflow` function issue

**Solution:** Check node conversion logic

---

## 🎯 **Quick Test Script**

Paste this in Agent Builder console to test the complete flow:

```javascript
// Complete workflow transfer test
async function testWorkflowTransfer() {
  console.log('🧪 Starting workflow transfer test...');
  
  // Clear everything
  localStorage.clear();
  
  // Test API
  const response = await fetch('/api/agent-builder/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userRequest: "Property management in Montreal with legal advice for co-ownership and email responses",
      conversationHistory: []
    })
  });
  
  const data = await response.json();
  console.log('📥 API Response:', data.recommendation.name);
  console.log('📋 API Nodes:', data.recommendation.nodes.map(n => n.label));
  
  // Store workflow
  const workflowData = {
    name: data.recommendation.name,
    description: data.recommendation.description,
    nodes: data.recommendation.nodes,
    edges: data.recommendation.edges,
    configs: data.recommendation.configs,
    generatedBy: 'Agent Builder',
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem('generatedWorkflow', JSON.stringify(workflowData));
  
  // Verify storage
  const stored = localStorage.getItem('generatedWorkflow');
  const parsed = JSON.parse(stored);
  console.log('✅ Stored name:', parsed.name);
  console.log('✅ Stored nodes:', parsed.nodes.length);
  
  // Open workflow page
  setTimeout(() => {
    window.open('/workflow', '_blank');
  }, 100);
  
  console.log('🎉 Test complete! Check new tab console.');
}

// Run the test
testWorkflowTransfer();
```

---

## 📊 **Expected vs Actual Results**

### **Expected Flow:**
```
User Input → API Analysis → Correct Workflow Generated → Correct Preview → Correct Storage → Correct Loading → Correct Visual Result
```

### **Actual Flow (if broken):**
```
User Input → API Analysis → ??? → ??? → ??? → ??? → Wrong Visual Result
```

The debugging logs will show exactly where the flow breaks!

---

## 🚀 **Action Items**

1. **Run the complete debug process**
2. **Copy ALL console output** from both tabs
3. **Note which step fails** (1-5)
4. **Share the console logs** with me

This will pinpoint exactly where the workflow transfer is breaking! 🔍
