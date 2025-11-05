/**
 * Workflow Metrics Integration
 * 
 * Tracks extended intelligence metrics for workflow execution.
 * Integrates with extended intelligence metrics and context quality dashboard.
 */

import { extendedIntelligenceMetrics, ContextQualityMetrics, ExtendedIntelligenceMetrics } from './extended-intelligence-metrics';
import { contextQualityDashboard } from './context-quality-dashboard';

/**
 * Node-level metrics for extended intelligence
 */
export interface WorkflowNodeMetrics {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  agentContribution: number;           // 0-1: Agent's contribution to answer quality
  contextContribution: number;          // 0-1: Context's contribution to answer quality
  extendedIntelligence: number;         // 0-1: Overall extended intelligence (agent+context)
  intelligenceExtension: number;       // 0-1: How much context extends intelligence
  contextQuality: ContextQualityMetrics;
  timestamp: number;
}

/**
 * Overall workflow metrics
 */
export interface WorkflowOverallMetrics {
  avgAgentContribution: number;
  avgContextContribution: number;
  avgExtendedIntelligence: number;
  avgIntelligenceExtension: number;
  workflowQuality: number;              // Overall workflow quality (0-1)
}

/**
 * Complete workflow metrics
 */
export interface WorkflowMetrics {
  workflowId: string;
  workflowName: string;
  totalNodes: number;
  executedNodes: number;
  executionTime: number;
  startTime: number;
  endTime?: number;
  nodeMetrics: WorkflowNodeMetrics[];
  overallMetrics: WorkflowOverallMetrics;
}

/**
 * Parameters for tracking node metrics
 */
export interface TrackNodeMetricsParams {
  query: string;
  domain: string;
  agent: string;
  agentAnswer?: string;                 // Optional: Answer without context (for comparison)
  contextAnswer?: string;                // Optional: Answer with context (for comparison)
  contextQuality?: ContextQualityMetrics;
  agentQuality?: {
    quality: number;
    relevance: number;
    coherence: number;
    completeness: number;
  };
  contextTokens?: number;
  agentTokens?: number;
  sessionId?: string;
}

/**
 * Workflow Metrics Tracker
 * 
 * Tracks extended intelligence metrics for workflow execution.
 */
class WorkflowMetricsTracker {
  private workflows: Map<string, WorkflowMetrics> = new Map();
  
  /**
   * Start tracking a workflow
   */
  startWorkflow(workflowId: string, workflowName: string, totalNodes: number = 0): void {
    const workflow: WorkflowMetrics = {
      workflowId,
      workflowName,
      totalNodes,
      executedNodes: 0,
      executionTime: 0,
      startTime: Date.now(),
      nodeMetrics: [],
      overallMetrics: {
        avgAgentContribution: 0,
        avgContextContribution: 0,
        avgExtendedIntelligence: 0,
        avgIntelligenceExtension: 0,
        workflowQuality: 0,
      },
    };
    
    this.workflows.set(workflowId, workflow);
  }
  
  /**
   * Track metrics for a workflow node
   */
  async trackNodeMetrics(
    workflowId: string,
    nodeId: string,
    nodeName: string,
    nodeType: string,
    params: TrackNodeMetricsParams
  ): Promise<WorkflowNodeMetrics> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found. Call startWorkflow first.`);
    }
    
    let metrics: ExtendedIntelligenceMetrics | null = null;
    
    // If we have both agent and context answers, calculate extended intelligence metrics
    if (params.agentAnswer && params.contextAnswer && params.contextQuality && params.agentQuality) {
      metrics = await extendedIntelligenceMetrics.recordMetrics({
        query: params.query,
        domain: params.domain,
        agent: params.agent,
        agentAnswer: params.agentAnswer,
        contextAnswer: params.contextAnswer,
        contextQuality: params.contextQuality,
        agentQuality: params.agentQuality,
        contextTokens: params.contextTokens || 0,
        agentTokens: params.agentTokens || 0,
        sessionId: params.sessionId || workflowId,
      });
    }
    
    // Record context quality if available
    if (params.contextQuality) {
      contextQualityDashboard.recordQuality(params.contextQuality);
    }
    
    const nodeMetrics: WorkflowNodeMetrics = {
      nodeId,
      nodeName,
      nodeType,
      agentContribution: metrics?.agentContribution.quality || 0,
      contextContribution: metrics?.contextContribution.qualityImprovement || 0,
      extendedIntelligence: metrics?.extendedIntelligence.overallQuality || 0,
      intelligenceExtension: metrics?.extendedIntelligence.intelligenceExtension || 0,
      contextQuality: params.contextQuality || {
        relevance: 0,
        coherence: 0,
        completeness: 0,
        efficiency: 0,
        freshness: 0,
        diversity: 0,
      },
      timestamp: Date.now(),
    };
    
    workflow.nodeMetrics.push(nodeMetrics);
    workflow.executedNodes++;
    
    // Update overall metrics
    this.updateOverallMetrics(workflow);
    
    return nodeMetrics;
  }
  
  /**
   * Update overall workflow metrics
   * Only calculates metrics from nodes with actual agent comparison.
   * Nodes without comparison don't contribute to extended intelligence metrics.
   */
  private updateOverallMetrics(workflow: WorkflowMetrics): void {
    if (workflow.nodeMetrics.length === 0) return;
    
    // Only calculate metrics from nodes with actual agent comparison
    // Nodes without comparison don't contribute to extended intelligence metrics
    const nodesWithComparison = workflow.nodeMetrics.filter(m => m.extendedIntelligence > 0);
    
    if (nodesWithComparison.length === 0) {
      // No nodes with agent comparison - workflow quality is undefined
      workflow.overallMetrics = {
        avgAgentContribution: 0,
        avgContextContribution: 0,
        avgExtendedIntelligence: 0,
        avgIntelligenceExtension: 0,
        workflowQuality: 0,
      };
      return;
    }
    
    // Calculate averages only from nodes with agent comparison
    const agentContributions = nodesWithComparison.map(m => m.agentContribution);
    const contextContributions = nodesWithComparison.map(m => m.contextContribution);
    const extendedIntelligenceScores = nodesWithComparison.map(m => m.extendedIntelligence);
    const intelligenceExtensions = nodesWithComparison.map(m => m.intelligenceExtension);
    
    workflow.overallMetrics = {
      avgAgentContribution: agentContributions.reduce((sum, m) => sum + m, 0) / agentContributions.length,
      avgContextContribution: contextContributions.reduce((sum, m) => sum + m, 0) / contextContributions.length,
      avgExtendedIntelligence: extendedIntelligenceScores.reduce((sum, m) => sum + m, 0) / extendedIntelligenceScores.length,
      avgIntelligenceExtension: intelligenceExtensions.reduce((sum, m) => sum + m, 0) / intelligenceExtensions.length,
      workflowQuality: extendedIntelligenceScores.reduce((sum, m) => sum + m, 0) / extendedIntelligenceScores.length,
    };
  }
  
  /**
   * End workflow tracking and return metrics
   */
  endWorkflow(workflowId: string): WorkflowMetrics {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found. Call startWorkflow first.`);
    }
    
    workflow.endTime = Date.now();
    workflow.executionTime = workflow.endTime - workflow.startTime;
    
    // Final update of overall metrics
    this.updateOverallMetrics(workflow);
    
    return workflow;
  }
  
  /**
   * Get metrics for a specific workflow
   */
  getWorkflowMetrics(workflowId: string): WorkflowMetrics | null {
    return this.workflows.get(workflowId) || null;
  }
  
  /**
   * Get all workflow metrics
   */
  getAllWorkflowMetrics(): WorkflowMetrics[] {
    return Array.from(this.workflows.values());
  }
  
  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.workflows.clear();
  }

  /**
   * Clear metrics for a specific workflow
   */
  clear(workflowId: string): void {
    this.workflows.delete(workflowId);
  }
}

/**
 * Execute metrics tracker node
 * 
 * This function is called when a workflow node of type 'metricsTracker' is executed.
 */
export async function executeMetricsTrackerNode(
  config: any,
  workflowData: any
): Promise<{
  metricsRecorded: boolean;
  workflowId: string;
  nodeId: string;
  message: string;
}> {
  const workflowId = workflowData.workflowId || `workflow-${Date.now()}`;
  const nodeId = `metrics-tracker-${Date.now()}`;
  
  // Track context quality if configured
  if (config.trackContextQuality && workflowData.context) {
    // Calculate context quality metrics
    const contextQuality: ContextQualityMetrics = {
      relevance: config.contextQuality?.relevance || 0.8,
      coherence: config.contextQuality?.coherence || 0.75,
      completeness: config.contextQuality?.completeness || 0.8,
      efficiency: config.contextQuality?.efficiency || 0.7,
      freshness: config.contextQuality?.freshness || 0.9,
      diversity: config.contextQuality?.diversity || 0.7,
    };
    
    // Record in dashboard
    contextQualityDashboard.recordQuality(contextQuality);
    
    return {
      metricsRecorded: true,
      workflowId,
      nodeId,
      message: 'Context quality metrics recorded',
    };
  }
  
  return {
    metricsRecorded: false,
    workflowId,
    nodeId,
    message: 'No metrics to record (context not available or tracking disabled)',
  };
}

// Export singleton instance
export const workflowMetricsTracker = new WorkflowMetricsTracker();
