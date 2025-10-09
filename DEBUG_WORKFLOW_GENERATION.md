# 🔍 Debug: Workflow Generation Issue

## 🚨 **Problem**
The Agent Builder preview shows the correct workflow (e.g., "Montreal Property Management Assistant"), but when clicking "Build Workflow," it loads the wrong workflow (e.g., "Miami Real Estate").

---

## 🔬 **Debugging Steps Added**

I've added comprehensive logging at every step to trace the issue:

### **1. Frontend - Agent Builder (page.tsx)**
```typescript
// When API responds:
console.log('📥 API Response:', data);
console.log('✅ Recommendation received:', data.recommendation);

// When building workflow:
console.log('✅ Workflow data stored:', workflowData);
```

### **2. Backend - API Endpoint (route.ts)**
```typescript
// When processing request:
console.log('🔍 Processing request:', userRequest);
console.log('✅ Generated workflow:', recommendation.name);
console.log('📋 Nodes:', recommendation.nodes.map(n => n.label).join(' → '));
```

### **3. Workflow Page (page.tsx)**
```typescript
// When loading workflow:
console.log('🔍 Checking for generated workflow:', 'Found/Not found');
console.log('✅ Loading generated workflow:', workflow);
console.log('🔧 loadGeneratedWorkflow called with:', workflow);
console.log('🔧 Converted nodes:', nodes);
```

---

## 🧪 **Test Now with Full Debugging**

### **Step 1: Open Agent Builder**
```
http://localhost:3000/agent-builder
```

### **Step 2: Open Browser Console**
- Chrome/Edge: Press `F12` or `Cmd+Option+I` (Mac)
- Look at the "Console" tab

### **Step 3: Clear Console & localStorage**
```javascript
// In console:
console.clear();
localStorage.clear();
```

### **Step 4: Enter Your Request**
```
Property management in Montreal with legal advice for co-ownership and email responses
```

### **Step 5: Watch Console for API Response**
You should see:
```
🔍 Processing request: Property management in Montreal with legal advice...
✅ Generated workflow: Montreal Property Management Assistant
📋 Nodes: Web Researcher → Legal Expert (Montreal) → Property Manager (Montreal) → Communication Specialist

📥 API Response: {recommendation: {...}}
✅ Recommendation received: {name: "Montreal Property Management Assistant", nodes: [...], ...}
```

**❓ Question 1:** Does the console show the correct workflow name here?
- ✅ **YES** → Proceed to Step 6
- ❌ **NO (shows "Miami" or wrong name)** → **API generation is broken** (see Fix 1 below)

### **Step 6: Review Workflow Preview**
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
- ✅ **YES** → Proceed to Step 7
- ❌ **NO** → **UI rendering issue** (see Fix 2 below)

### **Step 7: Click "Build Workflow"**
Watch console for:
```
✅ Workflow data stored: {
  name: "Montreal Property Management Assistant",
  description: "...",
  nodes: [
    {id: "node-1", label: "Web Researcher", ...},
    {id: "node-2", label: "Legal Expert (Montreal)", ...},
    ...
  ],
  edges: [...],
  configs: {...}
}
```

**❓ Question 3:** Does the stored data show the correct workflow?
- ✅ **YES** → Proceed to Step 8
- ❌ **NO** → **State management issue** (see Fix 3 below)

### **Step 8: New Tab Opens - Check Console**
In the NEW tab, watch for:
```
🔍 Checking for generated workflow: Found
✅ Loading generated workflow: {name: "Montreal Property Management Assistant", ...}
🔧 loadGeneratedWorkflow called with: {name: "Montreal Property Management Assistant", ...}
🔧 Converted nodes: [
  {id: "node-1", data: {label: "Web Researcher", ...}},
  {id: "node-2", data: {label: "Legal Expert (Montreal)", ...}},
  ...
]
🎉 Generated workflow loaded successfully!
```

**❓ Question 4:** Does the workflow page load the correct workflow?
- ✅ **YES** → **Success! Everything works!**
- ❌ **NO (shows Miami or wrong workflow)** → **Loading issue** (see Fix 4 below)

---

## 🔧 **Fixes Based on Console Output**

### **Fix 1: API Generation Broken**
**Symptom:** Console shows wrong workflow name at API response step

**Check:**
```
🔍 Processing request: Property management in Montreal...
✅ Generated workflow: Real Estate Market Analyzer  ← WRONG!
```

**Cause:** API not detecting domain correctly

**Solution:**
Check what the `analyzeUserIntent` function returns:
```typescript
// Add to route.ts temporarily:
const analysis = analyzeUserIntent(request);
console.log('🔍 Analysis:', analysis);
```

Expected for your request:
```javascript
{
  domain: "property management" or "legal",
  locations: ["Montreal"],
  specializations: ["legal", "management"],
  requiresLegalAdvice: true,
  requiresEmailGeneration: true
}
```

If wrong, the keyword detection needs adjustment.

### **Fix 2: UI Rendering Issue**
**Symptom:** API returns correct workflow, but preview shows wrong one

**Cause:** React state not updating

**Solution:**
Check if `recommendation` state is being set:
```typescript
// In page.tsx, verify:
setRecommendation(data.recommendation);  // This should update the preview
```

### **Fix 3: State Management Issue**
**Symptom:** Preview correct, but wrong data stored in localStorage

**Cause:** `recommendation` state is stale

**Solution:**
```typescript
// Verify in buildWorkflow function:
console.log('Current recommendation state:', recommendation);
```

If it shows old data, the state isn't updating properly.

### **Fix 4: Loading Issue**
**Symptom:** Correct data in localStorage, but workflow page loads wrong one

**Check localStorage manually:**
```javascript
// In workflow page console:
const data = localStorage.getItem('generatedWorkflow');
console.log(JSON.parse(data));
```

If it shows correct data, but page shows wrong workflow:
- The workflow page might be loading from cache
- The `useEffect` might not be running
- Old workflow state persisting

**Solution:**
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear all browser cache
3. Restart dev server

---

## 📊 **Complete Debug Output Example**

### **Expected Console Flow:**

#### **Agent Builder Tab:**
```
🔍 Processing request: Property management in Montreal with legal advice for co-ownership and email responses
✅ Generated workflow: Montreal Property Management Assistant
📋 Nodes: Web Researcher → Legal Expert (Montreal) → Property Manager (Montreal) → Communication Specialist

📥 API Response: {recommendation: {name: "Montreal Property Management Assistant", ...}}
✅ Recommendation received: {name: "Montreal Property Management Assistant", nodes: [4], ...}

[User clicks "Build Workflow"]

✅ Workflow data stored: {
  name: "Montreal Property Management Assistant",
  description: "Property management operations with Quebec legal compliance and tenant communications",
  nodes: [
    {id: "node-1", type: "customizable", label: "Web Researcher", role: "Web Researcher", ...},
    {id: "node-2", type: "customizable", label: "Legal Expert (Montreal)", role: "Legal Expert (Montreal)", ...},
    {id: "node-3", type: "customizable", label: "Property Manager (Montreal)", role: "Property Manager (Montreal)", ...},
    {id: "node-4", type: "customizable", label: "Communication Specialist", role: "Communication Specialist", ...}
  ],
  edges: [...],
  configs: {...},
  generatedBy: "Agent Builder",
  timestamp: "2025-..."
}
```

#### **Workflow Page Tab (New):**
```
🔍 Checking for generated workflow: Found
✅ Loading generated workflow: {name: "Montreal Property Management Assistant", ...}
🔧 loadGeneratedWorkflow called with: {name: "Montreal Property Management Assistant", nodes: [4], ...}
🔧 Converted nodes: [
  {id: "node-1", type: "customizable", position: {x: 100, y: 200}, data: {label: "Web Researcher", ...}},
  {id: "node-2", type: "customizable", position: {x: 400, y: 200}, data: {label: "Legal Expert (Montreal)", ...}},
  {id: "node-3", type: "customizable", position: {x: 700, y: 200}, data: {label: "Property Manager (Montreal)", ...}},
  {id: "node-4", type: "customizable", position: {x: 1000, y: 200}, data: {label: "Communication Specialist", ...}}
]
🔧 Edges: [
  {id: "edge-1", source: "node-1", target: "node-2"},
  {id: "edge-2", source: "node-2", target: "node-3"},
  {id: "edge-3", source: "node-3", target: "node-4"}
]
🔧 Configs: {
  node-1: {query: "...", searchQuery: "...", useRealAI: true},
  node-2: {query: "...", systemPrompt: "You are a Legal Expert (Montreal)...", preferredModel: "gemma-3", ...},
  node-3: {query: "...", systemPrompt: "You are an experienced property manager in Montreal...", preferredModel: "gemma-3", ...},
  node-4: {query: "...", systemPrompt: "You are a professional email writer...", preferredModel: "gemma-3", ...}
}
🎉 Generated workflow loaded successfully!
```

---

## 🎯 **Action Items**

1. **Clear everything:**
   ```javascript
   localStorage.clear();
   console.clear();
   ```

2. **Test with your exact prompt:**
   ```
   Property management in Montreal with legal advice for co-ownership and email responses
   ```

3. **Copy ALL console output** and share it with me

4. **Take screenshots** of:
   - Agent Builder preview
   - Workflow page nodes
   - Console output

This will help identify exactly where the issue is! 🔍

---

## 🚀 **Quick Test Script**

Paste this in Agent Builder console to test directly:

```javascript
// Test the API directly
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
  console.log('🎯 Direct API Test:');
  console.log('Workflow Name:', data.recommendation.name);
  console.log('Nodes:', data.recommendation.nodes.map(n => n.label));
  console.log('Full Data:', data.recommendation);
});
```

This bypasses the UI and tests the API directly! 🎉
