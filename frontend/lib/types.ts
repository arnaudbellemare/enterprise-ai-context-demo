export interface ContextDelta {
  id: string;
  content: string;
  metadata: {
    helpful_count: number;
    harmful_count: number;
    last_used: Date;
    relevance_score: number;
    token_count: number;
    domain?: string;
    complexity?: number;
    type?: string;
    [key: string]: any; // Allow additional metadata properties
  };
  type: 'strategy' | 'concept' | 'failure_mode' | 'precedent';
  created_at: Date;
}

export interface ContextQuality {
  relevance: number;
  coherence: number;
  completeness: number;
  recency: number;
  token_efficiency: number;
  bullet_count: number;
}

export interface ConversationSession {
  id: string;
  userId: string;
  context: ContextDelta[];
  conversationHistory: ConversationMessage[];
  metadata: {
    created_at: Date;
    last_accessed: Date;
    message_count: number;
    domain_focus: string;
    complexity_trend: ComplexityMeasurement[];
  };
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface ComplexityMeasurement {
  timestamp: Date;
  complexity: number;
  domain?: string;
}

export interface EvolutionEvent {
  id: string;
  timestamp: Date;
  type: 'add' | 'remove' | 'update' | 'compress' | 'merge';
  bulletId: string;
  content: string;
  metadata: any;
  qualityBefore?: ContextQuality;
  qualityAfter?: ContextQuality;
  impact: number;
}

export interface OptimizationResult {
  type: string;
  improved: boolean;
  improvement: number;
  details: string;
}

export interface QualityAlert {
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  recommendation: string;
}

export interface QualityTrends {
  direction: 'improving' | 'declining' | 'stable';
  volatility: 'low' | 'medium' | 'high';
  patterns: string[];
  predictions: string[];
}

export interface QualityReport {
  timestamp: Date;
  currentQuality: ContextQuality;
  alerts: QualityAlert[];
  trends: QualityTrends;
  recommendations: string[];
  overallScore: number;
  qualityGrade: string;
}

export interface QualityThresholds {
  relevance: number;
  coherence: number;
  completeness: number;
  recency: number;
  token_efficiency: number;
}

export interface ContextManagerConfig {
  maxTokens: number;
  compressionThreshold: number;
  qualityThresholds: QualityThresholds;
  monitoringInterval: number;
}

export interface ContextOptimizationConfig {
  optimizationThreshold: number;
  maxOptimizationAttempts: number;
  enableAutoOptimization: boolean;
  qualityWeights: {
    relevance: number;
    coherence: number;
    completeness: number;
    recency: number;
    token_efficiency: number;
  };
}
