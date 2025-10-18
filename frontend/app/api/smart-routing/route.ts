import { NextRequest, NextResponse } from 'next/server';
import { SmartRouter, TaskType, RoutingDecision } from '../../../lib/smart-router';
import { zodValidator } from '../../../lib/zod-enhanced-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Domain analysis function
function analyzeQueryDomain(query: string): { domain: string; confidence: number } {
  const queryLower = query.toLowerCase();
  
  // Healthcare domain keywords (check FIRST to override technology detection)
  if (/\b(clinical|efficacy|diagnostic|medical|patient|treatment|healthcare|therapy|medicine|symptom|disease|condition|doctor|physician|hospital|clinical trial|health|wellness|diabetic|retinopathy|pathology|medical diagnosis|clinical assessment|therapeutic|pharmaceutical|epidemiology)\b/i.test(queryLower)) {
    return { domain: 'healthcare', confidence: 0.95 };
  }
  
  // Legal domain keywords (check early for priority)
  if (/\b(legal|law|jurisdiction|compliance|regulation|court|judge|attorney|lawyer|contract|agreement|liability|legal implications|multinational|corporation|employment law)\b/i.test(queryLower)) {
    return { domain: 'legal', confidence: 0.9 };
  }
  
  // Finance domain keywords
  if (/\b(portfolio|investment|risk|return|financial|market|stock|bond|asset|capital|revenue|profit|loss|trading|analyst|valuation|diversified|sp&p|index|funds|equity|corporate|inflation|interest rate)\b/i.test(queryLower)) {
    return { domain: 'finance', confidence: 0.9 };
  }
  
  // Technology domain keywords (check later to avoid overriding healthcare/legal)
  if (/\b(architecture|microservices|concurrent|users|system|technical|api|database|server|cloud|infrastructure|scalability|performance|optimization|machine learning|ai|algorithm|software|development|programming)\b/i.test(queryLower)) {
    return { domain: 'technology', confidence: 0.9 };
  }
  
  
  // Education domain keywords
  if (/\b(learning|education|student|teacher|curriculum|pedagogy|teaching|academic|school|university|course|lesson|instruction|personalized|learning pathway|abilities|learning styles)\b/i.test(queryLower)) {
    return { domain: 'education', confidence: 0.9 };
  }
  
  // Crypto domain keywords
  if (/\b(crypto|bitcoin|ethereum|blockchain|cryptocurrency|mining|wallet|exchange|trading|defi|nft|token)\b/i.test(queryLower)) {
    return { domain: 'crypto', confidence: 0.9 };
  }
  
  // Default to general
  return { domain: 'general', confidence: 0.5 };
}

// Complexity analysis function
function analyzeQueryComplexity(query: string): { level: string; score: number } {
  const queryLength = query.length;
  const wordCount = query.split(' ').length;
  const hasNumbers = /\d+/.test(query);
  const hasTechnicalTerms = /\b(analysis|evaluate|assess|comprehensive|detailed|complex|sophisticated|advanced|technical|optimization|implementation|architecture)\b/i.test(query);
  const hasMultipleConcepts = (query.match(/\b(and|with|including|considering|taking into account|in terms of|regarding|concerning)\b/gi) || []).length;
  
  let complexityScore = 0;
  
  // Length factors
  if (queryLength > 200) complexityScore += 2;
  else if (queryLength > 100) complexityScore += 1;
  
  // Word count factors
  if (wordCount > 30) complexityScore += 2;
  else if (wordCount > 15) complexityScore += 1;
  
  // Content factors
  if (hasNumbers) complexityScore += 1;
  if (hasTechnicalTerms) complexityScore += 2;
  if (hasMultipleConcepts > 2) complexityScore += 2;
  else if (hasMultipleConcepts > 0) complexityScore += 1;
  
  // Determine complexity level
  if (complexityScore >= 6) return { level: 'high', score: complexityScore };
  else if (complexityScore >= 3) return { level: 'medium', score: complexityScore };
  else return { level: 'low', score: complexityScore };
}

// Enhanced routing decision function with domain analysis
async function createRoutingDecision(query: string, task: TaskType): Promise<RoutingDecision> {
  // Analyze query content to determine domain and complexity
  const domainAnalysis = analyzeQueryDomain(query);
  const complexityAnalysis = analyzeQueryComplexity(query);
  
  console.log(`   Domain Analysis: ${domainAnalysis.domain} (${domainAnalysis.confidence})`);
  console.log(`   Complexity Analysis: ${complexityAnalysis.level} (${complexityAnalysis.score})`);
  
  // Route based on task type, domain, and complexity
  if (task.type === 'ocr') {
    if (task.requirements.accuracy_required > 90) {
      return {
        primary_component: 'Teacher Model (Perplexity)',
        fallback_component: 'ACE Framework',
        use_cache: true,
        cache_key: `ocr_${query.substring(0, 20)}`,
        cache_ttl_seconds: 3600,
        estimated_cost: 0.005,
        estimated_latency_ms: 2500,
        reasoning: 'Teacher Model (96.6% OCR) for highest accuracy, ACE Framework (93.3% OCR) as fallback'
      };
    } else {
      return {
        primary_component: 'ACE Framework',
        fallback_component: 'Ollama Student',
        use_cache: true,
        cache_key: `ocr_${query.substring(0, 20)}`,
        cache_ttl_seconds: 1800,
        estimated_cost: 0.002,
        estimated_latency_ms: 1800,
        reasoning: 'ACE Framework for good accuracy at lower cost'
      };
    }
  } else if (task.type === 'irt') {
    return {
      primary_component: 'TRM Engine',
      fallback_component: 'Ollama Student',
      use_cache: true,
      cache_key: `irt_${query.substring(0, 20)}`,
      cache_ttl_seconds: 7200,
      estimated_cost: 0.001,
      estimated_latency_ms: 1200,
      reasoning: 'TRM Engine (91.4% IRT) optimized for item response theory tasks'
    };
  } else if (task.type === 'optimization') {
    return {
      primary_component: 'GEPA Optimizer',
      fallback_component: 'TRM Engine',
      use_cache: false,
      estimated_cost: 0.003,
      estimated_latency_ms: 2000,
      reasoning: 'GEPA Optimizer (95% optimization impact) for advanced optimization tasks'
    };
  } else {
    // Route based on domain and complexity analysis
    const domain = domainAnalysis.domain;
    const complexity = complexityAnalysis.level;
    const confidence = domainAnalysis.confidence;
    
    // Check for real-time data requirements
    const needsRealTime = /\b(latest|recent|current|today|now|2025|trending|discussions|news)\b/i.test(query);
    
    // High complexity queries need advanced processing
    if (complexity === 'high' || confidence > 0.8) {
      if (domain === 'finance' || domain === 'crypto') {
        return {
          primary_component: 'TRM Engine',
          fallback_component: 'Teacher Model (Perplexity)',
          use_cache: true,
          cache_key: `${domain}_${query.substring(0, 20)}`,
          cache_ttl_seconds: 7200,
          estimated_cost: 0.001,
          estimated_latency_ms: 1200,
          reasoning: `TRM Engine for ${domain} domain with high complexity analysis`
        };
      } else if (domain === 'technology' || needsRealTime) {
        return {
          primary_component: 'TRM Engine',
          fallback_component: 'Teacher Model (Perplexity)',
          use_cache: true,
          cache_key: `${domain}_${query.substring(0, 20)}`,
          cache_ttl_seconds: 1800,
          estimated_cost: 0.002,
          estimated_latency_ms: 2000,
          reasoning: `TRM Engine for ${domain} domain with real-time data requirements`
        };
      } else if (domain === 'healthcare') {
        return {
          primary_component: 'ACE Framework',
          fallback_component: 'Teacher Model (Perplexity)',
          use_cache: true,
          cache_key: `${domain}_${query.substring(0, 20)}`,
          cache_ttl_seconds: 7200,
          estimated_cost: 0.002,
          estimated_latency_ms: 1800,
          reasoning: `ACE Framework for ${domain} domain with high complexity analysis`
        };
      } else if (domain === 'legal') {
        return {
          primary_component: 'TRM Engine',
          fallback_component: 'ACE Framework',
          use_cache: true,
          cache_key: `${domain}_${query.substring(0, 20)}`,
          cache_ttl_seconds: 7200,
          estimated_cost: 0.001,
          estimated_latency_ms: 1200,
          reasoning: `TRM Engine for ${domain} domain with high complexity analysis`
        };
      } else if (domain === 'technology') {
        return {
          primary_component: 'TRM Engine',
          fallback_component: 'GEPA Optimizer',
          use_cache: true,
          cache_key: `${domain}_${query.substring(0, 20)}`,
          cache_ttl_seconds: 7200,
          estimated_cost: 0.001,
          estimated_latency_ms: 1200,
          reasoning: `TRM Engine for ${domain} domain with high complexity analysis`
        };
      } else if (domain === 'education') {
        return {
          primary_component: 'Ollama Student',
          fallback_component: 'TRM Engine',
          use_cache: true,
          cache_key: `${domain}_${query.substring(0, 20)}`,
          cache_ttl_seconds: 3600,
          estimated_cost: 0.000,
          estimated_latency_ms: 800,
          reasoning: `Ollama Student for ${domain} domain with high complexity analysis`
        };
      }
    }
    
    // Medium complexity queries or real-time data needs
    if (complexity === 'medium' || needsRealTime) {
      if (domain === 'finance' || domain === 'technology' || domain === 'legal' || needsRealTime) {
        return {
          primary_component: 'TRM Engine',
          fallback_component: 'Teacher Model (Perplexity)',
          use_cache: true,
          cache_key: `${domain}_${query.substring(0, 20)}`,
          cache_ttl_seconds: needsRealTime ? 1800 : 3600,
          estimated_cost: needsRealTime ? 0.002 : 0.001,
          estimated_latency_ms: needsRealTime ? 2000 : 1200,
          reasoning: needsRealTime ? `TRM Engine for real-time data in ${domain} domain` : `TRM Engine for ${domain} domain with medium complexity`
        };
      } else if (domain === 'healthcare') {
        return {
          primary_component: 'ACE Framework',
          fallback_component: 'Ollama Student',
          use_cache: true,
          cache_key: `${domain}_${query.substring(0, 20)}`,
          cache_ttl_seconds: 3600,
          estimated_cost: 0.002,
          estimated_latency_ms: 1800,
          reasoning: `ACE Framework for ${domain} domain with medium complexity`
        };
      }
    }
    
    // Low complexity or general queries
    return {
      primary_component: 'Ollama Student',
      fallback_component: 'TRM Engine',
      use_cache: true,
      cache_key: `general_${query.substring(0, 20)}`,
      cache_ttl_seconds: 3600,
      estimated_cost: 0.000,
      estimated_latency_ms: 800,
      reasoning: `Ollama Student for ${domain} domain with low complexity - fast and free`
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query,
      taskType = 'general',
      priority = 'medium',
      requirements = {
        accuracy_required: 80,
        max_latency_ms: 5000,
        max_cost: 0.01,
        requires_real_time_data: false
      }
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🎯 Smart Routing: Processing query "${query}"`);

    // Create task type
    const task: TaskType = {
      type: taskType as any,
      priority: priority as any,
      requirements
    };

    // Validate input with enhanced Zod validation
    const domainAnalysis = analyzeQueryDomain(query);
    const validation = zodValidator.validateDomainInput(domainAnalysis.domain, {
      query,
      complexity: task.requirements.accuracy_required > 90 ? 'high' : task.requirements.accuracy_required > 70 ? 'medium' : 'low',
      requiresRealTimeData: task.requirements.requires_real_time_data
    });

    if (!validation.success) {
      console.log(`❌ Smart Routing Validation Failed: ${validation.errors?.join(', ')}`);
      return NextResponse.json(
        { 
          error: 'Input validation failed',
          details: validation.errors,
          diagnostics: zodValidator.getValidationDiagnostics(domainAnalysis.domain, { query })
        },
        { status: 400 }
      );
    }

    // Create a routing decision based on task type and validated input
    const routingDecision = await createRoutingDecision(query, task);

    // Validate routing decision
    const routingValidation = zodValidator.validateRoutingDecision(routingDecision);
    if (!routingValidation.success) {
      console.log(`❌ Routing Decision Validation Failed: ${routingValidation.errors?.join(', ')}`);
      return NextResponse.json(
        { 
          error: 'Routing decision validation failed',
          details: routingValidation.errors
        },
        { status: 500 }
      );
    }

    console.log(`✅ Smart Routing Decision: ${routingDecision.primary_component}`);
    console.log(`   Domain: ${domainAnalysis.domain} (${domainAnalysis.confidence})`);
    console.log(`   Reasoning: ${routingDecision.reasoning}`);
    console.log(`   Estimated Cost: $${routingDecision.estimated_cost}`);
    console.log(`   Estimated Latency: ${routingDecision.estimated_latency_ms}ms`);

    return NextResponse.json({
      success: true,
      query,
      taskType,
      routingDecision,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Smart Routing Error:', error);
    return NextResponse.json(
      { 
        error: 'Smart routing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Smart Routing System',
    description: 'Intelligent task routing based on task type, performance requirements, and component capabilities',
    capabilities: {
      taskTypes: ['ocr', 'irt', 'reasoning', 'optimization', 'query_expansion', 'synthesis', 'general'],
      priorities: ['low', 'medium', 'high', 'critical'],
      routingFactors: [
        'Task type detection',
        'Performance requirements (accuracy, latency, cost)',
        'Component capabilities from benchmarks',
        'Cost optimization',
        'Cache availability'
      ]
    },
    usage: {
      endpoint: 'POST /api/smart-routing',
      parameters: {
        query: 'Required: The task or query to route',
        taskType: 'Optional: Type of task (default: general)',
        priority: 'Optional: Priority level (default: medium)',
        requirements: 'Optional: Performance requirements object'
      },
      example: {
        query: 'Analyze this document for OCR',
        taskType: 'ocr',
        priority: 'high',
        requirements: {
          accuracy_required: 95,
          max_latency_ms: 3000,
          max_cost: 0.005,
          requires_real_time_data: false
        }
      }
    },
    timestamp: new Date().toISOString()
  });
}
