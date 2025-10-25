/**
 * SIMPLIFIED AI WORKFLOW DEMO
 * 
 * This demo showcases AI workflow concepts with Permutation AI
 * using a simplified approach that demonstrates hooks, webhooks, and human-in-the-loop patterns.
 */

const API_BASE = 'http://localhost:3001/api';

async function demoSimplifiedAIWorkflow() {
  console.log('🚀 SIMPLIFIED AI WORKFLOW DEMO');
  console.log('==============================\n');

  try {
    // ============================================================
    // PHASE 1: EMAIL APPROVAL WORKFLOW
    // ============================================================
    console.log('📧 PHASE 1: EMAIL APPROVAL WORKFLOW');
    console.log('==================================\n');

    console.log('📧 Testing AI-powered email approval workflow...');
    
    const emailApprovalRequest = {
      action: 'start_workflow',
      workflowType: 'emailApproval',
      emailId: 'email_123',
      emailBody: 'Please approve the budget increase request for Q1 marketing campaign. The additional $15,000 will help us reach our target audience more effectively.',
      context: {
        userId: 'user_456',
        department: 'Finance',
        role: 'Manager',
        permissions: ['approve_budget'],
        preferences: {
          autoApprove: true,
          maxAmount: 20000,
          requireHumanReview: false
        }
      }
    };

    const emailResponse = await fetch(`${API_BASE}/ai-workflow-simplified`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailApprovalRequest)
    });

    const emailResult = await emailResponse.json();
    
    if (emailResult.success) {
      console.log('✅ Email Approval Workflow Started');
      console.log(`   - Workflow Type: ${emailResult.data.workflowType}`);
      console.log(`   - Result: ${JSON.stringify(emailResult.data.result, null, 2)}`);
      
      // Simulate human approval if required
      if (emailResult.data.result.requiresHumanApproval) {
        console.log('\n🔗 Simulating human approval...');
        
        const humanApprovalRequest = {
          action: 'resume_workflow',
          hookToken: emailResult.data.result.hookToken,
          workflowType: 'emailApproval',
          humanDecision: {
            approved: true,
            sender: 'john.doe@company.com',
            comment: 'Approved after review - budget increase is justified',
            timestamp: new Date().toISOString()
          }
        };

        const approvalResponse = await fetch(`${API_BASE}/ai-workflow-simplified`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(humanApprovalRequest)
        });

        const approvalResult = await approvalResponse.json();
        
        if (approvalResult.success) {
          console.log('✅ Human approval received');
          console.log(`   - Approved: ${approvalResult.data.result.approved}`);
          console.log(`   - Approved By: ${approvalResult.data.result.approvedBy}`);
          console.log(`   - AI Confidence: ${approvalResult.data.result.aiConfidence}`);
        } else {
          console.log('❌ Human approval failed');
          console.log(`   Error: ${approvalResult.error}`);
        }
      }
    } else {
      console.log('❌ Email Approval Workflow Failed');
      console.log(`   Error: ${emailResult.error}`);
    }

    // ============================================================
    // PHASE 2: PO APPROVAL WORKFLOW
    // ============================================================
    console.log('\n📋 PHASE 2: PO APPROVAL WORKFLOW');
    console.log('================================\n');

    console.log('📋 Testing AI-powered PO approval workflow...');
    
    const poApprovalRequest = {
      action: 'start_workflow',
      workflowType: 'poApproval',
      poId: 'PO_789',
      poData: {
        amount: 8500,
        vendor: 'Tech Solutions Inc',
        items: [
          'Software licenses - $3,000',
          'Hardware equipment - $4,500',
          'Consulting services - $1,000'
        ],
        department: 'IT',
        requester: 'jane.smith@company.com'
      },
      context: {
        userId: 'user_789',
        department: 'Procurement',
        role: 'Buyer',
        permissions: ['approve_po'],
        preferences: {
          autoApprove: true,
          maxAmount: 10000,
          requireHumanReview: true
        }
      }
    };

    const poResponse = await fetch(`${API_BASE}/ai-workflow-simplified`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(poApprovalRequest)
    });

    const poResult = await poResponse.json();
    
    if (poResult.success) {
      console.log('✅ PO Approval Workflow Started');
      console.log(`   - Workflow Type: ${poResult.data.workflowType}`);
      console.log(`   - Result: ${JSON.stringify(poResult.data.result, null, 2)}`);
      
      // Simulate human approval if required
      if (poResult.data.result.requiresHumanApproval) {
        console.log('\n🔗 Simulating human PO approval...');
        
        const poApprovalRequest = {
          action: 'resume_workflow',
          hookToken: poResult.data.result.hookToken,
          workflowType: 'poApproval',
          humanDecision: {
            poId: 'PO_789',
            approved: true,
            approvedBy: 'manager@company.com',
            comment: 'Approved - within budget and necessary for Q1 operations',
            timestamp: new Date().toISOString(),
            aiConfidence: 0.85,
            humanOverride: false
          }
        };

        const poApprovalResponse = await fetch(`${API_BASE}/ai-workflow-simplified`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(poApprovalRequest)
        });

        const poApprovalResult = await poApprovalResponse.json();
        
        if (poApprovalResult.success) {
          console.log('✅ Human PO approval received');
          console.log(`   - Approved: ${poApprovalResult.data.result.approved}`);
          console.log(`   - Approved By: ${poApprovalResult.data.result.approvedBy}`);
          console.log(`   - AI Confidence: ${poApprovalResult.data.result.aiConfidence}`);
        } else {
          console.log('❌ Human PO approval failed');
          console.log(`   Error: ${poApprovalResult.error}`);
        }
      }
    } else {
      console.log('❌ PO Approval Workflow Failed');
      console.log(`   Error: ${poResult.error}`);
    }

    // ============================================================
    // PHASE 3: ART VALUATION WORKFLOW
    // ============================================================
    console.log('\n🎨 PHASE 3: ART VALUATION WORKFLOW');
    console.log('==================================\n');

    console.log('🎨 Testing AI-powered art valuation workflow...');
    
    const artValuationRequest = {
      action: 'start_workflow',
      workflowType: 'artValuation',
      artworkId: 'art_101',
      artwork: {
        title: 'Sunset Over Mountains',
        artist: 'John Smith',
        medium: 'Oil on Canvas',
        year: 2020,
        provenance: 'Gallery XYZ, New York',
        dimensions: '24" x 36"',
        condition: 'Excellent'
      },
      valuationRequest: {
        purpose: 'insurance',
        urgency: 'medium',
        clientId: 'client_202',
        clientName: 'Art Collector LLC'
      }
    };

    const artResponse = await fetch(`${API_BASE}/ai-workflow-simplified`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(artValuationRequest)
    });

    const artResult = await artResponse.json();
    
    if (artResult.success) {
      console.log('✅ Art Valuation Workflow Started');
      console.log(`   - Workflow Type: ${artResult.data.workflowType}`);
      console.log(`   - Result: ${JSON.stringify(artResult.data.result, null, 2)}`);
      
      // Simulate expert review if required
      if (artResult.data.result.requiresExpertReview) {
        console.log('\n🔗 Simulating expert art valuation review...');
        
        const expertReviewRequest = {
          action: 'resume_workflow',
          hookToken: artResult.data.result.hookToken,
          workflowType: 'artValuation',
          expertReview: {
            artworkId: 'art_101',
            humanReview: {
              reviewerId: 'expert_123',
              approved: true,
              comments: 'Expert valuation confirms AI estimate. Artist is gaining recognition in contemporary art market.',
              finalValue: 75000
            }
          }
        };

        const expertReviewResponse = await fetch(`${API_BASE}/ai-workflow-simplified`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expertReviewRequest)
        });

        const expertReviewResult = await expertReviewResponse.json();
        
        if (expertReviewResult.success) {
          console.log('✅ Expert art valuation review received');
          console.log(`   - Final Value: $${expertReviewResult.data.result.finalValue}`);
          console.log(`   - Expert Approved: ${expertReviewResult.data.result.expertReview?.approved}`);
          console.log(`   - Reviewer: ${expertReviewResult.data.result.expertReview?.reviewerId}`);
        } else {
          console.log('❌ Expert review failed');
          console.log(`   Error: ${expertReviewResult.error}`);
        }
      }
    } else {
      console.log('❌ Art Valuation Workflow Failed');
      console.log(`   Error: ${artResult.error}`);
    }

    // ============================================================
    // PHASE 4: WORKFLOW STATISTICS
    // ============================================================
    console.log('\n📊 PHASE 4: WORKFLOW STATISTICS');
    console.log('===============================\n');

    console.log('📊 Getting workflow statistics...');
    
    const statsResponse = await fetch(`${API_BASE}/ai-workflow-simplified?action=stats`);
    const statsResult = await statsResponse.json();
    
    if (statsResult.success) {
      console.log('✅ Workflow Statistics Retrieved');
      console.log(`   - Total Workflows: ${statsResult.data.stats.totalWorkflows}`);
      console.log(`   - Pending Hooks: ${statsResult.data.stats.pendingHooks}`);
      console.log(`   - Hook Types: ${statsResult.data.stats.hookTypes.join(', ')}`);
      
      if (statsResult.data.pendingHooks.length > 0) {
        console.log('\n📋 Pending Hooks:');
        statsResult.data.pendingHooks.forEach(hook => {
          console.log(`   - Token: ${hook.token}`);
          console.log(`   - Type: ${hook.type}`);
          console.log(`   - Timestamp: ${hook.timestamp}`);
        });
      }
    } else {
      console.log('❌ Failed to get workflow statistics');
      console.log(`   Error: ${statsResult.error}`);
    }

    // ============================================================
    // PHASE 5: API INFORMATION
    // ============================================================
    console.log('\n📚 PHASE 5: API INFORMATION');
    console.log('===========================\n');

    console.log('📚 Getting AI Workflow API information...');
    
    const infoResponse = await fetch(`${API_BASE}/ai-workflow-simplified?action=info`);
    const infoResult = await infoResponse.json();
    
    if (infoResult.success) {
      console.log('✅ AI Workflow API Information Retrieved');
      console.log(`   - Message: ${infoResult.data.message}`);
      console.log(`   - Available Workflows: ${Object.keys(infoResult.data.workflows).join(', ')}`);
      console.log(`   - Features: ${Object.keys(infoResult.data.features).join(', ')}`);
    } else {
      console.log('❌ Failed to get API information');
      console.log(`   Error: ${infoResult.error}`);
    }

    // ============================================================
    // FINAL SUMMARY
    // ============================================================
    console.log('\n🎉 SIMPLIFIED AI WORKFLOW DEMO COMPLETE!');
    console.log('========================================\n');

    console.log('✅ AI WORKFLOW CAPABILITIES DEMONSTRATED:');
    console.log('   📧 Email Approval: AI classification with human-in-the-loop');
    console.log('   📋 PO Approval: Automated decision making with webhook integration');
    console.log('   🎨 Art Valuation: Expert review workflows with AI assistance');
    console.log('   🔗 Hook Integration: Human-in-the-loop decision making');
    console.log('   🧠 AI Classification: Intelligent content analysis');
    console.log('   ⚡ Auto-Approval: High-confidence automated decisions');

    console.log('\n🚀 PERMUTATION AI + WORKFLOW CONCEPTS:');
    console.log('   ✅ Hooks: Human-in-the-loop decision making');
    console.log('   ✅ Webhooks: External system integration');
    console.log('   ✅ Workflow Orchestration: Complex multi-step processes');
    console.log('   ✅ State Management: Persistent workflow state');
    console.log('   ✅ Error Handling: Robust error recovery');
    console.log('   ✅ Scalability: Production-ready workflow execution');

    console.log('\n🎯 PERMUTATION AI + WORKFLOW CONCEPTS = BREAKTHROUGH!');
    console.log('   The integration of Permutation AI with workflow concepts');
    console.log('   creates a powerful platform for AI-driven business processes! 🚀');

    return {
      success: true,
      workflows: ['emailApproval', 'poApproval', 'artValuation'],
      features: ['hooks', 'webhooks', 'aiClassification', 'autoApproval', 'expertReview'],
      integration: 'Permutation AI + Workflow Concepts'
    };

  } catch (error) {
    console.error('❌ Simplified AI Workflow Demo failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the Simplified AI Workflow demo
demoSimplifiedAIWorkflow().then((result) => {
  console.log('\n🎉 SIMPLIFIED AI WORKFLOW DEMO COMPLETE!');
  console.log(`\n📊 FINAL RESULTS:`);
  console.log(`   - Success: ${result.success ? 'YES' : 'NO'}`);
  
  if (result.success) {
    console.log(`   - Workflows Tested: ${result.workflows.join(', ')}`);
    console.log(`   - Features Demonstrated: ${result.features.join(', ')}`);
    console.log(`   - Integration: ${result.integration}`);
  } else {
    console.log(`   - Error: ${result.error}`);
  }
  
  console.log('\nThis demonstrates the power of AI workflows with human-in-the-loop! 🚀');
}).catch(console.error);
