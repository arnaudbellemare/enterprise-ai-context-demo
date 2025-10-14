/**
 * HITL Escalation Engine - Enterprise Human-in-the-Loop System
 * 
 * Implements strategic human oversight for critical AI decisions:
 * - Risk-based escalation detection
 * - Human notification and response system
 * - Approval gates in workflows
 * - Feedback collection and learning
 * 
 * Inspired by Google ADK escalation patterns
 */

export interface EscalationCriteria {
  riskThreshold: number; // 0-1 scale
  confidenceThreshold: number; // 0-1 scale
  amountThreshold?: number; // Financial threshold
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  domain: 'finance' | 'legal' | 'medical' | 'security' | 'general';
}

export interface EscalationRequest {
  id: string;
  agentId: string;
  reason: string;
  context: any;
  criteria: EscalationCriteria;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  humanResponse?: HumanResponse;
  timeout: number; // seconds
}

export interface HumanResponse {
  decision: 'approve' | 'reject' | 'modify';
  reasoning: string;
  modifications?: any;
  confidence: number;
  timestamp: Date;
  expertType?: string;
}

export interface ApprovalGate {
  id: string;
  workflowId: string;
  nodeId: string;
  criteria: EscalationCriteria;
  approverRole: string;
  timeout: number;
  status: 'active' | 'approved' | 'rejected' | 'timeout';
}

export class HITLEscalationEngine {
  private escalationQueue: Map<string, EscalationRequest> = new Map();
  private approvalGates: Map<string, ApprovalGate> = new Map();
  private humanNotifications: Map<string, any> = new Map();

  /**
   * Check if task requires escalation based on criteria
   */
  shouldEscalate(task: {
    confidence: number;
    riskScore: number;
    amount?: number;
    domain: string;
    context: any;
  }): boolean {
    const criteria = this.getDomainCriteria(task.domain);
    
    // Critical escalation conditions
    if (task.confidence < criteria.confidenceThreshold) {
      return true;
    }
    
    if (task.riskScore > criteria.riskThreshold) {
      return true;
    }
    
    if (criteria.amountThreshold && task.amount && task.amount > criteria.amountThreshold) {
      return true;
    }
    
    // Domain-specific escalation rules
    if (this.hasDomainSpecificRisk(task.domain, task.context)) {
      return true;
    }
    
    return false;
  }

  /**
   * Escalate to human operator (like Google ADK escalateToHuman tool)
   */
  async escalateToHuman(params: {
    agentId: string;
    reason: string;
    context: any;
    urgency: 'critical' | 'high' | 'medium' | 'low';
    requiredExpertise?: string;
    domain: string;
    confidence: number;
    riskScore: number;
    amount?: number;
  }): Promise<HumanResponse> {
    
    const escalationId = `esc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const escalation: EscalationRequest = {
      id: escalationId,
      agentId: params.agentId,
      reason: params.reason,
      context: params.context,
      criteria: this.getDomainCriteria(params.domain),
      timestamp: new Date(),
      status: 'pending',
      timeout: this.getTimeoutForUrgency(params.urgency)
    };
    
    // Store escalation
    this.escalationQueue.set(escalationId, escalation);
    
    // Notify human operator
    await this.notifyHuman(escalation);
    
    // Wait for human response (with timeout)
    const response = await this.waitForHumanResponse(escalationId, escalation.timeout);
    
    return response;
  }

  /**
   * Create approval gate in workflow
   */
  async createApprovalGate(params: {
    workflowId: string;
    nodeId: string;
    criteria: EscalationCriteria;
    approverRole: string;
    timeout?: number;
  }): Promise<ApprovalGate> {
    
    const gateId = `gate_${params.workflowId}_${params.nodeId}`;
    
    const gate: ApprovalGate = {
      id: gateId,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      criteria: params.criteria,
      approverRole: params.approverRole,
      timeout: params.timeout || 3600, // 1 hour default
      status: 'active'
    };
    
    this.approvalGates.set(gateId, gate);
    
    return gate;
  }

  /**
   * Check approval gate and pause workflow if needed
   */
  async checkApprovalGate(params: {
    workflowId: string;
    nodeId: string;
    result: any;
  }): Promise<{
    approved: boolean;
    autoApproved: boolean;
    humanResponse?: HumanResponse;
    gateId?: string;
  }> {
    
    const gateId = `gate_${params.workflowId}_${params.nodeId}`;
    const gate = this.approvalGates.get(gateId);
    
    if (!gate) {
      return { approved: true, autoApproved: true };
    }
    
    // Check if approval is required based on criteria
    if (!this.shouldRequireApproval(params.result, gate.criteria)) {
      gate.status = 'approved';
      return { approved: true, autoApproved: true, gateId };
    }
    
    // Request human approval
    const response = await this.requestHumanApproval({
      gateId,
      title: `Approval required for ${params.nodeId}`,
      data: params.result,
      approverRole: gate.approverRole,
      timeout: gate.timeout
    });
    
    if (response.decision === 'approve') {
      gate.status = 'approved';
    } else {
      gate.status = 'rejected';
    }
    
    return {
      approved: response.decision === 'approve',
      autoApproved: false,
      humanResponse: response,
      gateId
    };
  }

  /**
   * Collect human feedback for learning
   */
  async collectFeedback(params: {
    taskId: string;
    agentOutput: any;
    feedbackType: 'validation' | 'correction' | 'rating';
    humanId?: string;
  }): Promise<HumanFeedback> {
    
    const feedbackId = `feedback_${params.taskId}_${Date.now()}`;
    
    // Display result to human for review
    const feedback = await this.displayForReview({
      taskId: params.taskId,
      output: params.agentOutput,
      questions: this.generateFeedbackQuestions(params.feedbackType),
      humanId: params.humanId
    });
    
    // Store feedback for learning
    await this.storeFeedback({
      feedbackId,
      taskId: params.taskId,
      agentOutput: params.agentOutput,
      humanFeedback: feedback,
      timestamp: new Date()
    });
    
    return feedback;
  }

  /**
   * Get domain-specific escalation criteria
   */
  private getDomainCriteria(domain: string): EscalationCriteria {
    const criteria: Record<string, EscalationCriteria> = {
      finance: {
        riskThreshold: 0.6,
        confidenceThreshold: 0.7,
        amountThreshold: 10000, // $10K
        urgencyLevel: 'high',
        domain: 'finance'
      },
      legal: {
        riskThreshold: 0.5,
        confidenceThreshold: 0.8,
        urgencyLevel: 'high',
        domain: 'legal'
      },
      medical: {
        riskThreshold: 0.3,
        confidenceThreshold: 0.9,
        urgencyLevel: 'critical',
        domain: 'medical'
      },
      security: {
        riskThreshold: 0.4,
        confidenceThreshold: 0.8,
        urgencyLevel: 'critical',
        domain: 'security'
      },
      general: {
        riskThreshold: 0.7,
        confidenceThreshold: 0.6,
        urgencyLevel: 'medium',
        domain: 'general'
      }
    };
    
    return criteria[domain] || criteria.general;
  }

  /**
   * Check for domain-specific risks
   */
  private hasDomainSpecificRisk(domain: string, context: any): boolean {
    switch (domain) {
      case 'finance':
        return this.hasFinancialRisk(context);
      case 'legal':
        return this.hasLegalRisk(context);
      case 'medical':
        return this.hasMedicalRisk(context);
      case 'security':
        return this.hasSecurityRisk(context);
      default:
        return false;
    }
  }

  private hasFinancialRisk(context: any): boolean {
    // Check for high-risk financial indicators
    return context?.riskLevel === 'high' ||
           context?.volatility > 0.3 ||
           context?.leverage > 5 ||
           context?.exposure > 1000000;
  }

  private hasLegalRisk(context: any): boolean {
    // Check for high-risk legal indicators
    return context?.contractType === 'merger' ||
           context?.liabilityAmount > 100000 ||
           context?.regulatoryRisk === 'high' ||
           context?.litigationRisk === 'high';
  }

  private hasMedicalRisk(context: any): boolean {
    // Check for high-risk medical indicators
    return context?.severity === 'critical' ||
           context?.diagnosisConfidence < 0.8 ||
           context?.treatmentRisk === 'high' ||
           context?.patientAge < 18 || context?.patientAge > 65;
  }

  private hasSecurityRisk(context: any): boolean {
    // Check for high-risk security indicators
    return context?.threatLevel === 'critical' ||
           context?.attackVector === 'privileged' ||
           context?.dataSensitivity === 'confidential' ||
           context?.systemCriticality === 'high';
  }

  /**
   * Get timeout based on urgency
   */
  private getTimeoutForUrgency(urgency: string): number {
    const timeouts = {
      critical: 300,   // 5 minutes
      high: 900,       // 15 minutes
      medium: 1800,    // 30 minutes
      low: 3600        // 1 hour
    };
    
    return timeouts[urgency as keyof typeof timeouts] || timeouts.medium;
  }

  /**
   * Notify human operator
   */
  private async notifyHuman(escalation: EscalationRequest): Promise<void> {
    // In production, this would integrate with:
    // - Slack notifications
    // - Email alerts
    // - SMS for critical issues
    // - Dashboard updates
    
    console.log(`🚨 HITL ESCALATION: ${escalation.reason}`);
    console.log(`   Agent: ${escalation.agentId}`);
    console.log(`   Urgency: ${escalation.criteria.urgencyLevel}`);
    console.log(`   Timeout: ${escalation.timeout}s`);
    console.log(`   Context:`, escalation.context);
    
    // Store notification for UI display
    this.humanNotifications.set(escalation.id, {
      id: escalation.id,
      title: `Escalation: ${escalation.reason}`,
      agentId: escalation.agentId,
      urgency: escalation.criteria.urgencyLevel,
      timestamp: escalation.timestamp,
      status: 'pending',
      context: escalation.context
    });
  }

  /**
   * Wait for human response (with timeout)
   */
  private async waitForHumanResponse(escalationId: string, timeout: number): Promise<HumanResponse> {
    // In production, this would:
    // - Poll for human response
    // - Handle timeout scenarios
    // - Manage concurrent escalations
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkResponse = () => {
        const escalation = this.escalationQueue.get(escalationId);
        
        if (escalation?.status === 'approved' || escalation?.status === 'rejected') {
          resolve(escalation.humanResponse!);
          return;
        }
        
        if (Date.now() - startTime > timeout * 1000) {
          escalation!.status = 'timeout';
          resolve({
            decision: 'reject',
            reasoning: 'Timeout waiting for human response',
            confidence: 0,
            timestamp: new Date()
          });
          return;
        }
        
        // Check again in 1 second
        setTimeout(checkResponse, 1000);
      };
      
      checkResponse();
    });
  }

  /**
   * Request human approval for workflow gate
   */
  private async requestHumanApproval(params: {
    gateId: string;
    title: string;
    data: any;
    approverRole: string;
    timeout: number;
  }): Promise<HumanResponse> {
    
    console.log(`🛑 APPROVAL GATE: ${params.title}`);
    console.log(`   Role Required: ${params.approverRole}`);
    console.log(`   Data:`, params.data);
    console.log(`   Timeout: ${params.timeout}s`);
    
    // In production, this would:
    // - Route to appropriate human based on role
    // - Display approval UI
    // - Handle approval/rejection workflow
    
    // For demo, simulate human response after delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      decision: 'approve', // In real system, this comes from human
      reasoning: 'Approved by human reviewer',
      confidence: 0.9,
      timestamp: new Date(),
      expertType: params.approverRole
    };
  }

  /**
   * Check if approval is required
   */
  private shouldRequireApproval(result: any, criteria: EscalationCriteria): boolean {
    // Check amount threshold
    if (criteria.amountThreshold && result.amount > criteria.amountThreshold) {
      return true;
    }
    
    // Check risk level
    if (result.riskScore > criteria.riskThreshold) {
      return true;
    }
    
    // Check confidence
    if (result.confidence < criteria.confidenceThreshold) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate feedback questions based on type
   */
  private generateFeedbackQuestions(type: string): string[] {
    const questions = {
      validation: [
        'Is this analysis accurate? (Yes/No)',
        'What would you improve? (Text)',
        'Rate quality 1-5: (Number)'
      ],
      correction: [
        'What errors do you see? (Text)',
        'Provide correct analysis: (Text)',
        'Rate accuracy 1-5: (Number)'
      ],
      rating: [
        'Rate overall quality 1-5: (Number)',
        'Rate accuracy 1-5: (Number)',
        'Rate completeness 1-5: (Number)',
        'Additional comments: (Text)'
      ]
    };
    
    return questions[type as keyof typeof questions] || questions.validation;
  }

  /**
   * Display result for human review
   */
  private async displayForReview(params: {
    taskId: string;
    output: any;
    questions: string[];
    humanId?: string;
  }): Promise<HumanFeedback> {
    
    console.log(`📝 FEEDBACK REQUEST: Task ${params.taskId}`);
    console.log(`   Output:`, params.output);
    console.log(`   Questions:`, params.questions);
    
    // In production, this would display UI for human review
    // For demo, return simulated feedback
    
    return {
      taskId: params.taskId,
      responses: {
        accuracy: 'Yes',
        improvements: 'Good analysis, could use more detail',
        rating: 4,
        comments: 'Overall solid work'
      },
      timestamp: new Date(),
      humanId: params.humanId || 'demo_user'
    };
  }

  /**
   * Store feedback for learning
   */
  private async storeFeedback(feedback: any): Promise<void> {
    // In production, this would store in database for training
    console.log(`💾 STORING FEEDBACK:`, feedback.feedbackId);
  }

  /**
   * Get pending escalations for UI
   */
  getPendingEscalations(): any[] {
    return Array.from(this.humanNotifications.values())
      .filter(notification => notification.status === 'pending');
  }

  /**
   * Get pending approval gates for UI
   */
  getPendingApprovalGates(): ApprovalGate[] {
    return Array.from(this.approvalGates.values())
      .filter(gate => gate.status === 'active');
  }

  /**
   * Process human response to escalation
   */
  async processHumanResponse(escalationId: string, response: HumanResponse): Promise<void> {
    const escalation = this.escalationQueue.get(escalationId);
    if (escalation) {
      escalation.status = response.decision === 'approve' ? 'approved' : 'rejected';
      escalation.humanResponse = response;
      
      // Update notification
      const notification = this.humanNotifications.get(escalationId);
      if (notification) {
        notification.status = escalation.status;
        notification.humanResponse = response;
      }
    }
  }
}

export interface HumanFeedback {
  taskId: string;
  responses: Record<string, any>;
  timestamp: Date;
  humanId?: string;
}

// Global instance
export const hitlEngine = new HITLEscalationEngine();
