/**
 * Reversibility Auditing System
 * 
 * Based on Daoist Cybernetics: "Embedded auditing and feedback allow ongoing
 * assessment and correction—ensuring decisions are explainable and reversible."
 * 
 * Tracks all ReasoningBank decisions with ability to undo them.
 */

export interface DecisionLog {
  id: string;
  timestamp: Date;
  operation: string; // 'consolidate', 'extract', 'aggregate', 'delete'
  context: any;
  reversible: boolean;
  undoAction?: () => Promise<void>;
  redoAction?: () => Promise<void>;
  stateSnapshot?: any; // Snapshot before operation
}

export interface UndoResult {
  success: boolean;
  decisionId: string;
  restoredState?: any;
  error?: string;
}

export class ReversibilityAuditor {
  private decisionLog: DecisionLog[] = [];
  private maxLogSize = 1000; // Keep last 1000 decisions
  
  /**
   * Log a decision with undo capability
   */
  async logDecision(
    operation: string,
    context: any,
    stateSnapshot?: any
  ): Promise<DecisionLog> {
    const log: DecisionLog = {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      operation,
      context,
      reversible: true,
      stateSnapshot,
    };
    
    this.decisionLog.push(log);
    
    // Trim log if too large
    if (this.decisionLog.length > this.maxLogSize) {
      this.decisionLog = this.decisionLog.slice(-this.maxLogSize);
    }
    
    return log;
  }
  
  /**
   * Register undo action for a decision
   */
  registerUndoAction(decisionId: string, undoAction: () => Promise<void>): void {
    const log = this.decisionLog.find(l => l.id === decisionId);
    if (log) {
      log.undoAction = undoAction;
    }
  }
  
  /**
   * Register redo action for a decision
   */
  registerRedoAction(decisionId: string, redoAction: () => Promise<void>): void {
    const log = this.decisionLog.find(l => l.id === decisionId);
    if (log) {
      log.redoAction = redoAction;
    }
  }
  
  /**
   * Undo a decision
   */
  async undoDecision(decisionId: string): Promise<UndoResult> {
    const log = this.decisionLog.find(l => l.id === decisionId);
    
    if (!log) {
      return {
        success: false,
        decisionId,
        error: 'Decision not found',
      };
    }
    
    if (!log.reversible) {
      return {
        success: false,
        decisionId,
        error: 'Decision is not reversible',
      };
    }
    
    if (!log.undoAction) {
      return {
        success: false,
        decisionId,
        error: 'No undo action registered',
      };
    }
    
    try {
      await log.undoAction();
      return {
        success: true,
        decisionId,
        restoredState: log.stateSnapshot,
      };
    } catch (error) {
      return {
        success: false,
        decisionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Redo a decision
   */
  async redoDecision(decisionId: string): Promise<UndoResult> {
    const log = this.decisionLog.find(l => l.id === decisionId);
    
    if (!log || !log.redoAction) {
      return {
        success: false,
        decisionId,
        error: 'Decision not found or not redoable',
      };
    }
    
    try {
      await log.redoAction();
      return {
        success: true,
        decisionId,
      };
    } catch (error) {
      return {
        success: false,
        decisionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Get decision history
   */
  getDecisionHistory(limit: number = 100): DecisionLog[] {
    return this.decisionLog.slice(-limit).reverse();
  }
  
  /**
   * Get decisions by operation type
   */
  getDecisionsByOperation(operation: string): DecisionLog[] {
    return this.decisionLog.filter(l => l.operation === operation);
  }
  
  /**
   * Get recent reversible decisions
   */
  getReversibleDecisions(limit: number = 50): DecisionLog[] {
    return this.decisionLog
      .filter(l => l.reversible && l.undoAction)
      .slice(-limit)
      .reverse();
  }
  
  /**
   * Clear decision log
   */
  clearLog(): void {
    this.decisionLog = [];
  }
  
  /**
   * Export decision log for analysis
   */
  exportLog(): string {
    return JSON.stringify(this.decisionLog, null, 2);
  }
}

// Singleton instance
export const reversibilityAuditor = new ReversibilityAuditor();

