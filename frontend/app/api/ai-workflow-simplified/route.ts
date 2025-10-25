/**
 * SIMPLIFIED AI WORKFLOW API ROUTE
 * 
 * This API route demonstrates AI workflow concepts with Permutation AI
 * using a simplified approach that works with the current setup.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  simplifiedAIWorkflowSystem,
  emailApprovalWorkflow, 
  poApprovalWorkflow, 
  artValuationWorkflow,
  resumeEmailApproval,
  resumePOApproval,
  resumeArtValuation,
  type EmailApprovalRequest,
  type POApprovalDecision,
  type ArtValuationWorkflow,
  type AIWorkflowContext
} from '../../../lib/ai-workflow-simplified';

// Simple logger for API routes
const logger = {
  info: (message: string, data?: any) => console.log(`[AI-Workflow-API] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[AI-Workflow-API] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.warn(`[AI-Workflow-API] ${message}`, data || '')
};

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, workflowType, ...data } = body;

    logger.info('Simplified AI Workflow API request', { action, workflowType });

    switch (action) {
      case 'start_workflow':
        return await handleStartWorkflow(workflowType, data);
      
      case 'resume_workflow':
        return await handleResumeWorkflow({ ...data, workflowType });
      
      case 'get_workflow_status':
        return await handleGetWorkflowStatus(data);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: start_workflow, resume_workflow, get_workflow_status'
        }, { status: 400 });
    }

  } catch (error: any) {
    logger.error('Simplified AI Workflow API error', { error: error.message });
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'info') {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Simplified AI Workflow Integration API',
          description: 'Demonstrates AI workflow concepts with Permutation AI using simplified approach',
          endpoints: {
            'POST /': 'Start, resume, or get status of AI workflows',
            'GET ?action=info': 'Get API information',
            'GET ?action=examples': 'Get usage examples',
            'GET ?action=stats': 'Get workflow statistics'
          },
          workflows: {
            emailApproval: 'AI-powered email approval with human-in-the-loop',
            poApproval: 'AI-powered PO approval with automated decisions',
            artValuation: 'AI-powered art valuation with expert review'
          },
          features: {
            hooks: 'Human-in-the-loop decision making',
            webhooks: 'External system integration',
            aiClassification: 'AI-powered content classification',
            autoApproval: 'Automated approval for high-confidence decisions',
            expertReview: 'Expert review for complex cases'
          }
        }
      });
    }

    if (action === 'examples') {
      return NextResponse.json({
        success: true,
        data: {
          examples: {
            emailApproval: {
              description: 'Start email approval workflow',
              request: {
                action: 'start_workflow',
                workflowType: 'emailApproval',
                emailId: 'email_123',
                emailBody: 'Please approve the budget increase request...',
                context: {
                  userId: 'user_456',
                  department: 'Finance',
                  role: 'Manager',
                  permissions: ['approve_budget'],
                  preferences: {
                    autoApprove: true,
                    maxAmount: 10000,
                    requireHumanReview: false
                  }
                }
              },
              resume: {
                action: 'resume_workflow',
                hookToken: 'email_approval:email_123:user_456',
                workflowType: 'emailApproval',
                humanDecision: {
                  approved: true,
                  sender: 'john.doe@company.com',
                  comment: 'Approved after review'
                }
              }
            },
            poApproval: {
              description: 'Start PO approval workflow',
              request: {
                action: 'start_workflow',
                workflowType: 'poApproval',
                poId: 'PO_789',
                poData: {
                  amount: 5000,
                  vendor: 'Supplier ABC',
                  items: ['Office supplies', 'Software licenses']
                },
                context: {
                  userId: 'user_456',
                  department: 'Procurement',
                  role: 'Buyer',
                  permissions: ['approve_po'],
                  preferences: {
                    autoApprove: true,
                    maxAmount: 5000,
                    requireHumanReview: true
                  }
                }
              },
              resume: {
                action: 'resume_workflow',
                hookToken: 'po_approval:PO_789:user_456',
                workflowType: 'poApproval',
                humanDecision: {
                  poId: 'PO_789',
                  approved: true,
                  approvedBy: 'manager@company.com',
                  comment: 'Approved within budget',
                  timestamp: new Date().toISOString(),
                  aiConfidence: 0.85,
                  humanOverride: false
                }
              }
            },
            artValuation: {
              description: 'Start art valuation workflow',
              request: {
                action: 'start_workflow',
                workflowType: 'artValuation',
                artworkId: 'art_101',
                artwork: {
                  title: 'Sunset Over Mountains',
                  artist: 'John Smith',
                  medium: 'Oil on Canvas',
                  year: 2020,
                  provenance: 'Gallery XYZ'
                },
                valuationRequest: {
                  purpose: 'insurance',
                  urgency: 'medium',
                  clientId: 'client_202'
                }
              },
              resume: {
                action: 'resume_workflow',
                hookToken: 'art_valuation:art_101:insurance',
                workflowType: 'artValuation',
                expertReview: {
                  artworkId: 'art_101',
                  humanReview: {
                    reviewerId: 'expert_123',
                    approved: true,
                    comments: 'Expert valuation confirms AI estimate',
                    finalValue: 75000
                  }
                }
              }
            }
          }
        }
      });
    }

    if (action === 'stats') {
      const stats = simplifiedAIWorkflowSystem.getWorkflowStats();
      const pendingHooks = simplifiedAIWorkflowSystem.getPendingHooks();
      
      return NextResponse.json({
        success: true,
        data: {
          stats,
          pendingHooks,
          message: 'Workflow statistics retrieved successfully'
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: info, examples, stats'
    }, { status: 400 });

  } catch (error: any) {
    logger.error('Simplified AI Workflow API GET error', { error: error.message });
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// ============================================================
// WORKFLOW HANDLERS
// ============================================================

async function handleStartWorkflow(workflowType: string, data: any) {
  switch (workflowType) {
    case 'emailApproval':
      const emailResult = await emailApprovalWorkflow(
        data.emailId,
        data.emailBody,
        data.context
      );
      return NextResponse.json({
        success: true,
        data: {
          workflowType: 'emailApproval',
          result: emailResult,
          message: 'Email approval workflow started'
        }
      });

    case 'poApproval':
      const poResult = await poApprovalWorkflow(
        data.poId,
        data.poData,
        data.context
      );
      return NextResponse.json({
        success: true,
        data: {
          workflowType: 'poApproval',
          result: poResult,
          message: 'PO approval workflow started'
        }
      });

    case 'artValuation':
      const artResult = await artValuationWorkflow(
        data.artworkId,
        data.artwork,
        data.valuationRequest
      );
      return NextResponse.json({
        success: true,
        data: {
          workflowType: 'artValuation',
          result: artResult,
          message: 'Art valuation workflow started'
        }
      });

    default:
      return NextResponse.json({
        success: false,
        error: `Unknown workflow type: ${workflowType}`
      }, { status: 400 });
  }
}

async function handleResumeWorkflow(data: any) {
  const { hookToken, workflowType, humanDecision, expertReview } = data;

  try {
    let result;
    
    switch (workflowType) {
      case 'emailApproval':
        result = await resumeEmailApproval(hookToken, humanDecision);
        break;
      
      case 'poApproval':
        result = await resumePOApproval(hookToken, humanDecision);
        break;
      
      case 'artValuation':
        result = await resumeArtValuation(hookToken, expertReview);
        break;
      
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown workflow type: ${workflowType}`
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Workflow resumed successfully',
        result,
        workflowType,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('Failed to resume workflow', { error: error.message, hookToken, workflowType });
    return NextResponse.json({
      success: false,
      error: `Failed to resume workflow: ${error.message}`
    }, { status: 500 });
  }
}

async function handleGetWorkflowStatus(data: any) {
  const { workflowId, workflowType } = data;

  // Get workflow statistics
  const stats = simplifiedAIWorkflowSystem.getWorkflowStats();
  const pendingHooks = simplifiedAIWorkflowSystem.getPendingHooks();

  return NextResponse.json({
    success: true,
    data: {
      workflowId,
      workflowType,
      stats,
      pendingHooks,
      message: 'Workflow status retrieved successfully'
    }
  });
}
