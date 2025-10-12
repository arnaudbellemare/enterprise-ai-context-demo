/**
 * HITL Demo API - Enterprise Human-in-the-Loop Demonstration
 * 
 * Demonstrates the complete HITL system with escalation, approval gates,
 * and feedback collection for enterprise deployment scenarios.
 */

import { NextRequest, NextResponse } from 'next/server';
import { hitlEngine } from '../../../../lib/hitl-escalation-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenario = 'financial_high_risk' } = body;

    console.log(`🎭 HITL Demo - Scenario: ${scenario}`);

    const demos = {
      financial_high_risk: await demoFinancialHighRisk(),
      legal_contract_review: await demoLegalContractReview(),
      medical_diagnosis: await demoMedicalDiagnosis(),
      security_incident: await demoSecurityIncident(),
      approval_workflow: await demoApprovalWorkflow()
    };

    const demo = demos[scenario] || demos.financial_high_risk;

    return NextResponse.json({
      scenario,
      demo,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('HITL Demo error:', error);
    return NextResponse.json(
      { error: 'Demo failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Demo 1: Financial High-Risk Investment
 */
async function demoFinancialHighRisk() {
  console.log('💰 HITL Demo: Financial High-Risk Investment');
  
  // Simulate financial agent analysis
  const investment = {
    amount: 150000, // $150K - above threshold
    riskScore: 0.8, // High risk
    confidence: 0.6, // Low confidence
    asset: 'Cryptocurrency Portfolio',
    expectedReturn: 25,
    volatility: 0.4
  };

  // Check if escalation is needed
  const shouldEscalate = hitlEngine.shouldEscalate({
    confidence: investment.confidence,
    riskScore: investment.riskScore,
    amount: investment.amount,
    domain: 'finance',
    context: investment
  });

  console.log(`   Should escalate: ${shouldEscalate}`);
  console.log(`   Reason: Amount $${investment.amount} > $50K, Risk ${investment.riskScore} > 0.7, Confidence ${investment.confidence} < 0.8`);

  if (shouldEscalate) {
    // Escalate to human
    const escalation = await hitlEngine.escalateToHuman({
      agentId: 'dspyFinancialAgent',
      reason: 'High-risk investment requires human approval',
      context: investment,
      urgency: 'high',
      requiredExpertise: 'senior financial advisor',
      domain: 'finance',
      confidence: investment.confidence,
      riskScore: investment.riskScore,
      amount: investment.amount
    });

    return {
      title: 'Financial High-Risk Investment',
      description: 'Agent detects high-risk investment requiring human oversight',
      scenario: {
        investment,
        shouldEscalate,
        escalation,
        criteria: {
          amountThreshold: 50000,
          riskThreshold: 0.7,
          confidenceThreshold: 0.8
        }
      },
      humanDecision: escalation,
      outcome: escalation.decision === 'approve' ? 'Investment approved by human' : 'Investment rejected by human',
      learning: 'Agent learns from human decision for future similar investments'
    };
  }

  return {
    title: 'Financial Investment (Auto-approved)',
    description: 'Investment meets all criteria for automatic approval',
    scenario: { investment, shouldEscalate: false },
    outcome: 'Investment automatically approved by agent'
  };
}

/**
 * Demo 2: Legal Contract Review
 */
async function demoLegalContractReview() {
  console.log('⚖️ HITL Demo: Legal Contract Review');
  
  const contract = {
    type: 'merger',
    liabilityAmount: 2500000,
    complexity: 'high',
    confidence: 0.7,
    riskLevel: 'high'
  };

  const shouldEscalate = hitlEngine.shouldEscalate({
    confidence: contract.confidence,
    riskScore: 0.8,
    domain: 'legal',
    context: contract
  });

  if (shouldEscalate) {
    const escalation = await hitlEngine.escalateToHuman({
      agentId: 'legalAgent',
      reason: 'Merger contract requires senior lawyer review',
      context: contract,
      urgency: 'high',
      requiredExpertise: 'senior corporate lawyer',
      domain: 'legal',
      confidence: contract.confidence,
      riskScore: 0.8
    });

    return {
      title: 'Legal Contract Review',
      description: 'Merger contract flagged for human legal review',
      scenario: { contract, shouldEscalate },
      humanDecision: escalation,
      outcome: escalation.decision === 'approve' ? 'Contract approved by senior lawyer' : 'Contract requires modifications'
    };
  }

  return {
    title: 'Legal Contract (Auto-processed)',
    description: 'Standard contract meets criteria for automatic processing',
    scenario: { contract, shouldEscalate: false },
    outcome: 'Contract automatically processed by agent'
  };
}

/**
 * Demo 3: Medical Diagnosis
 */
async function demoMedicalDiagnosis() {
  console.log('🏥 HITL Demo: Medical Diagnosis');
  
  const diagnosis = {
    condition: 'Acute Myocardial Infarction',
    confidence: 0.85,
    severity: 'critical',
    patientAge: 72,
    symptoms: ['chest pain', 'shortness of breath', 'nausea'],
    riskFactors: ['diabetes', 'hypertension', 'smoking history']
  };

  const shouldEscalate = hitlEngine.shouldEscalate({
    confidence: diagnosis.confidence,
    riskScore: 0.9, // Very high risk
    domain: 'medical',
    context: diagnosis
  });

  if (shouldEscalate) {
    const escalation = await hitlEngine.escalateToHuman({
      agentId: 'medicalAgent',
      reason: 'Critical diagnosis requires physician confirmation',
      context: diagnosis,
      urgency: 'critical',
      requiredExpertise: 'cardiologist',
      domain: 'medical',
      confidence: diagnosis.confidence,
      riskScore: 0.9
    });

    return {
      title: 'Medical Diagnosis',
      description: 'Critical diagnosis requires physician oversight',
      scenario: { diagnosis, shouldEscalate },
      humanDecision: escalation,
      outcome: escalation.decision === 'approve' ? 'Diagnosis confirmed by cardiologist' : 'Diagnosis requires additional tests'
    };
  }

  return {
    title: 'Medical Diagnosis (Auto-processed)',
    description: 'Routine diagnosis meets criteria for automatic processing',
    scenario: { diagnosis, shouldEscalate: false },
    outcome: 'Diagnosis automatically processed by agent'
  };
}

/**
 * Demo 4: Security Incident
 */
async function demoSecurityIncident() {
  console.log('🔒 HITL Demo: Security Incident');
  
  const incident = {
    type: 'privileged access abuse',
    severity: 'critical',
    affectedSystems: ['customer database', 'payment system'],
    dataSensitivity: 'confidential',
    threatLevel: 'critical'
  };

  const shouldEscalate = hitlEngine.shouldEscalate({
    confidence: 0.9,
    riskScore: 0.95, // Extremely high risk
    domain: 'security',
    context: incident
  });

  if (shouldEscalate) {
    const escalation = await hitlEngine.escalateToHuman({
      agentId: 'securityAgent',
      reason: 'Critical security incident requires immediate human response',
      context: incident,
      urgency: 'critical',
      requiredExpertise: 'security analyst',
      domain: 'security',
      confidence: 0.9,
      riskScore: 0.95
    });

    return {
      title: 'Security Incident',
      description: 'Critical security incident requires human intervention',
      scenario: { incident, shouldEscalate },
      humanDecision: escalation,
      outcome: escalation.decision === 'approve' ? 'Security response approved by analyst' : 'Additional security measures required'
    };
  }

  return {
    title: 'Security Incident (Auto-handled)',
    description: 'Low-risk incident handled automatically',
    scenario: { incident, shouldEscalate: false },
    outcome: 'Incident automatically handled by security agent'
  };
}

/**
 * Demo 5: Approval Workflow
 */
async function demoApprovalWorkflow() {
  console.log('🛑 HITL Demo: Approval Workflow');
  
  // Create approval gate
  const gate = await hitlEngine.createApprovalGate({
    workflowId: 'demo_workflow',
    nodeId: 'financial_decision',
    criteria: {
      riskThreshold: 0.6,
      confidenceThreshold: 0.7,
      amountThreshold: 100000,
      urgencyLevel: 'high',
      domain: 'finance'
    },
    approverRole: 'financial_manager',
    timeout: 1800 // 30 minutes
  });

  // Simulate workflow execution reaching approval gate
  const result = {
    amount: 150000,
    riskScore: 0.7,
    confidence: 0.75,
    recommendation: 'Proceed with investment'
  };

  // Check approval gate
  const approvalResult = await hitlEngine.checkApprovalGate({
    workflowId: 'demo_workflow',
    nodeId: 'financial_decision',
    result
  });

  return {
    title: 'Approval Workflow',
    description: 'Workflow paused at approval gate for human review',
    scenario: {
      gate,
      result,
      approvalResult
    },
    outcome: approvalResult.approved ? 'Workflow approved and resumed' : 'Workflow paused pending approval',
    workflowStatus: approvalResult.approved ? 'running' : 'paused'
  };
}
