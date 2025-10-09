# 🧪 Test Agent Builder Flow

## ✅ **Flow Verification:**

### **Step 1: Agent Builder Storage**
```typescript
// In agent-builder/page.tsx buildWorkflow()
const workflowData = {
  name: recommendation.name,
  description: recommendation.description,
  nodes: recommendation.nodes,
  edges: recommendation.edges,
  configs: recommendation.configs,
  generatedBy: 'Agent Builder',
  timestamp: new Date().toISOString()
};

localStorage.setItem('generatedWorkflow', JSON.stringify(workflowData));
console.log('✅ Workflow data stored:', workflowData);
window.open('/workflow', '_blank');
```

### **Step 2: Workflow Page Detection**
```typescript
// In workflow/page.tsx useEffect()
const generatedWorkflow = localStorage.getItem('generatedWorkflow');
console.log('🔍 Checking for generated workflow:', generatedWorkflow ? 'Found' : 'Not found');

if (generatedWorkflow) {
  const workflow = JSON.parse(generatedWorkflow);
  console.log('✅ Loading generated workflow:', workflow);
  loadGeneratedWorkflow(workflow);
  localStorage.removeItem('generatedWorkflow'); // Clear after loading
  console.log('🎉 Generated workflow loaded successfully!');
}
```

### **Step 3: Workflow Loading**
```typescript
// In workflow/page.tsx loadGeneratedWorkflow()
const loadGeneratedWorkflow = (workflow: any) => {
  const nodes = workflow.nodes.map((node: any, index: number) => ({
    id: node.id,
    type: node.type,
    position: { x: 100 + (index * 300), y: 200 },
    data: {
      label: node.label,
      apiEndpoint: node.apiEndpoint,
      icon: node.icon,
      iconColor: node.iconColor,
      status: 'idle',
    },
  }));

  setNodes(nodes);
  setEdges(workflow.edges);
  setNodeConfigs(workflow.configs);
  setCurrentWorkflowName(workflow.name);
  addLog(`🎉 Generated Workflow loaded: ${workflow.name}`);
};
```

---

## 🧪 **Test Instructions:**

### **1. Test the Complete Flow:**
1. **Go to:** `http://localhost:3000/agent-builder`
2. **Type:** "Create a real estate market analyzer for Miami"
3. **Click:** "Build Workflow" button
4. **Check:** New tab opens with `/workflow`
5. **Verify:** Console shows debugging messages
6. **Confirm:** Workflow loads with custom nodes

### **2. Expected Console Output:**
```
Agent Builder Console:
✅ Workflow data stored: {name: "Real Estate Market Analyzer", nodes: [...], ...}

Workflow Page Console:
🔍 Checking for generated workflow: Found
✅ Loading generated workflow: {name: "Real Estate Market Analyzer", ...}
🎉 Generated workflow loaded successfully!
```

### **3. Expected Visual Result:**
- ✅ Workflow page opens with custom nodes
- ✅ Nodes show: Web Search → Market Analyst → Investment Report → Risk Assessment
- ✅ Workflow name shows: "Real Estate Market Analyzer"
- ✅ Ready to execute immediately

---

## 🔍 **Debugging Steps:**

### **If It Doesn't Work:**

1. **Check Browser Console:**
   - Look for error messages
   - Verify localStorage data storage
   - Check if workflow data is valid JSON

2. **Check localStorage:**
   ```javascript
   // In browser console:
   localStorage.getItem('generatedWorkflow')
   ```

3. **Verify Data Structure:**
   ```javascript
   // Should contain:
   {
     name: "Real Estate Market Analyzer",
     description: "...",
     nodes: [...],
     edges: [...],
     configs: {...}
   }
   ```

4. **Check Network Tab:**
   - Verify API calls to `/api/agent-builder/create`
   - Check response contains recommendation data

---

## 📊 **Expected Data Flow:**

```
User Input: "Create real estate analyzer"
    ↓
API: /api/agent-builder/create
    ↓
Response: {recommendation: {name, nodes, edges, configs}}
    ↓
Frontend: Stores in localStorage
    ↓
Opens: /workflow in new tab
    ↓
Workflow Page: Detects localStorage data
    ↓
Loads: Custom workflow with generated nodes
    ↓
Result: Ready-to-execute custom workflow
```

---

## ✅ **Success Indicators:**

1. **Agent Builder:**
   - ✅ Recommendation appears in preview
   - ✅ "Build Workflow" button is enabled
   - ✅ Console shows "Workflow data stored"

2. **Workflow Page:**
   - ✅ Opens in new tab
   - ✅ Shows custom workflow name
   - ✅ Displays generated nodes
   - ✅ Console shows "Generated workflow loaded"
   - ✅ Ready to execute

3. **Visual Confirmation:**
   - ✅ Nodes are properly positioned
   - ✅ Edges connect the nodes
   - ✅ Node configurations are loaded
   - ✅ Workflow name is correct

---

## 🚨 **Troubleshooting:**

### **Common Issues:**

1. **localStorage not working:**
   - Check if browser allows localStorage
   - Verify data is being stored correctly

2. **Workflow not loading:**
   - Check if data structure matches expected format
   - Verify JSON parsing doesn't fail

3. **Nodes not appearing:**
   - Check if node positions are calculated correctly
   - Verify node data structure

4. **API not responding:**
   - Check if `/api/agent-builder/create` is accessible
   - Verify request/response format

---

## 🎯 **Test Results:**

**The flow should work perfectly!** 

When you click "Build Workflow":
1. ✅ Data gets stored in localStorage
2. ✅ New tab opens to `/workflow`
3. ✅ Custom workflow loads automatically
4. ✅ Ready to execute immediately

**If you see any issues, check the browser console for the debugging messages I added!** 🚀
