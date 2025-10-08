import { NextRequest, NextResponse } from 'next/server';

/**
 * Production-Ready Workflow Execution Engine
 * Executes custom workflows with real API calls
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      nodes,
      edges,
      configs,
      userId,
      initialData = {}
    } = await req.json();

    if (!nodes || nodes.length === 0) {
      return NextResponse.json(
        { error: 'Nodes are required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const executionLog: any[] = [];
    let workflowData: any = {
      userId: userId || `workflow-${Date.now()}`,
      ...initialData,
    };

    // Get execution order (topological sort)
    const executionOrder = getTopologicalOrder(nodes, edges);

    // Execute each node in order
    for (const nodeId of executionOrder) {
      const node = nodes.find((n: any) => n.id === nodeId);
      if (!node) continue;

      const nodeConfig = configs[nodeId] || node.data?.config || {};
      const nodeStartTime = Date.now();

      executionLog.push({
        nodeId,
        nodeName: node.data.label,
        status: 'executing',
        timestamp: new Date().toISOString(),
      });

      try {
        // Execute the node
        const result = await executeNode(
          node.data.id,
          node.data.apiEndpoint,
          workflowData,
          nodeConfig
        );

        // Merge result into workflow data
        workflowData = { ...workflowData, ...result };

        executionLog.push({
          nodeId,
          nodeName: node.data.label,
          status: 'complete',
          duration: Date.now() - nodeStartTime,
          result,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        executionLog.push({
          nodeId,
          nodeName: node.data.label,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
        });

        // Continue execution (graceful degradation)
        console.error(`Node ${nodeId} failed:`, error);
      }
    }

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      executionLog,
      finalData: workflowData,
      metrics: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        executionTime: totalTime,
        successfulNodes: executionLog.filter((l) => l.status === 'complete').length,
        failedNodes: executionLog.filter((l) => l.status === 'error').length,
      },
    });
  } catch (error: any) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Workflow execution failed' },
      { status: 500 }
    );
  }
}

/**
 * Execute individual node based on type
 */
async function executeNode(
  nodeType: string,
  apiEndpoint: string,
  workflowData: any,
  config: any
): Promise<any> {
  switch (nodeType) {
    case 'memorySearch':
      return await executeMemorySearch(apiEndpoint, workflowData, config);
    
    case 'webSearch':
      return await executeWebSearch(apiEndpoint, workflowData, config);
    
    case 'contextAssembly':
      return await executeContextAssembly(apiEndpoint, workflowData, config);
    
    case 'modelRouter':
      return await executeModelRouter(apiEndpoint, workflowData, config);
    
    case 'gepaOptimize':
      return await executeGEPAOptimize(apiEndpoint, workflowData, config);
    
    case 'langstruct':
      return await executeLangStruct(apiEndpoint, workflowData, config);
    
    case 'answer':
      return await executeAnswer(apiEndpoint, workflowData, config);
    
    case 'axOptimize':
      return await executeAxOptimize(apiEndpoint, workflowData, config);
    
    default:
      throw new Error(`Unknown node type: ${nodeType}`);
  }
}

async function executeMemorySearch(endpoint: string, data: any, config: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: data.query || data.optimizedPrompt || 'default query',
      userId: data.userId,
      matchThreshold: config.matchThreshold,
      matchCount: config.matchCount,
      collection: config.collection,
    }),
  });

  if (!response.ok) throw new Error('Memory search failed');
  const result = await response.json();
  return { memoryResults: result.documents || [] };
}

async function executeWebSearch(endpoint: string, data: any, config: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ 
        role: 'user', 
        content: data.optimizedQuery || data.query || 'default query' 
      }],
      searchRecencyFilter: config.recencyFilter,
    }),
  });

  if (!response.ok) throw new Error('Web search failed');
  const result = await response.json();
  return { webResults: result.citations || [] };
}

async function executeContextAssembly(endpoint: string, data: any, config: any) {
  const allResults = [
    ...(data.memoryResults || []),
    ...(data.webResults || []),
    ...(data.extractedData ? [data.extractedData] : [])
  ];

  // Simple merge and deduplicate
  const merged = allResults.slice(0, config.maxResults || 20);
  
  return { 
    context: merged,
    contextSummary: `Merged ${merged.length} items from ${allResults.length} total results`
  };
}

async function executeModelRouter(endpoint: string, data: any, config: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: data.query || 'default query',
      autoSelectModel: config.autoSelect,
      preferredModel: config.preferredModel,
    }),
  });

  if (!response.ok) throw new Error('Model routing failed');
  const result = await response.json();
  return { 
    selectedModel: result.model || config.preferredModel,
    modelReasoning: result.modelConfig?.useCase 
  };
}

async function executeGEPAOptimize(endpoint: string, data: any, config: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: data.query || 'default prompt',
      context: JSON.stringify(data.context || []),
      max_iterations: config.iterations,
    }),
  });

  if (!response.ok) throw new Error('GEPA optimization failed');
  const result = await response.json();
  return { 
    optimizedPrompt: result.optimized_prompt || data.query,
    gepaMetrics: result.metrics 
  };
}

async function executeLangStruct(endpoint: string, data: any, config: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: JSON.stringify(data.context || data.query),
      useRealLangStruct: config.useRealLangStruct,
    }),
  });

  if (!response.ok) throw new Error('LangStruct extraction failed');
  const result = await response.json();
  return { 
    extractedData: result.extracted_data,
    langstructMetrics: result.metrics 
  };
}

async function executeAnswer(endpoint: string, data: any, config: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: data.optimizedPrompt || data.query || 'default query',
      documents: data.context || [],
      preferredModel: data.selectedModel || config.preferredModel,
    }),
  });

  if (!response.ok) throw new Error('Answer generation failed');
  const result = await response.json();
  return { 
    finalAnswer: result.answer,
    answerModel: result.model 
  };
}

async function executeAxOptimize(endpoint: string, data: any, config: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nodeType: 'memorySearch', // or dynamic based on context
      input: {
        query: data.query,
        userId: data.userId,
      },
      config,
    }),
  });

  if (!response.ok) throw new Error('Ax optimization failed');
  const result = await response.json();
  return { axResult: result.result };
}

/**
 * Topological sort for execution order
 */
function getTopologicalOrder(nodes: any[], edges: any[]): string[] {
  const order: string[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();

  const visit = (nodeId: string) => {
    if (temp.has(nodeId)) {
      throw new Error('Circular dependency detected');
    }
    if (visited.has(nodeId)) return;

    temp.add(nodeId);

    const incomingEdges = edges.filter((e) => e.target === nodeId);
    for (const edge of incomingEdges) {
      visit(edge.source);
    }

    temp.delete(nodeId);
    visited.add(nodeId);
    order.push(nodeId);
  };

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      visit(node.id);
    }
  });

  return order;
}

