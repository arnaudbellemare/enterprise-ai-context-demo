/**
 * Real-world workflow examples showing extended intelligence metrics
 * for actual business use cases: art insurance, LATAM legal, manufacturing
 */

import { workflowMetricsTracker } from './frontend/lib/workflow-metrics-integration';
import { extendedIntelligenceMetrics } from './frontend/lib/extended-intelligence-metrics';

async function testArtInsurancePremiumWorkflow() {
  console.log('\n🎨 ========================================');
  console.log('ART INSURANCE PREMIUM CALCULATION');
  console.log('========================================\n');
  
  const workflowId = `art-insurance-${Date.now()}`;
  const query = 'Calculate insurance premium for an Alec Monopoly painting valued at $450,000, shipping from London to New York for gallery exhibition';
  
  workflowMetricsTracker.startWorkflow(workflowId, 'Art Insurance Premium Calculation');
  
  // Node 1: Art Valuation
  const agentOnlyValuation = 'The painting is worth approximately $450,000 based on recent sales data.';
  const contextEnhancedValuation = `Based on comprehensive market analysis:
- Recent comparable sales: $420K-$480K (2024 auction results)
- Artist market trend: +15% YoY growth
- Condition assessment: Excellent (no restoration needed)
- Provenance: Verified gallery exhibition history
- Estimated value: $450,000 ± 5% confidence interval
- Market indicators: Strong demand in contemporary urban art sector`;
  
  await workflowMetricsTracker.trackNodeMetrics(
    workflowId,
    'node-1',
    'Art Valuation',
    'valuation',
    {
      query,
      domain: 'art',
      agent: 'gemma3:4b',
      agentAnswer: agentOnlyValuation,
      contextAnswer: contextEnhancedValuation,
      contextQuality: {
        relevance: 0.95,
        coherence: 0.90,
        completeness: 0.92,
        efficiency: 0.85,
        freshness: 0.95,
        diversity: 0.80,
      },
      agentQuality: {
        quality: 0.45,
        relevance: 0.50,
        coherence: 0.40,
        completeness: 0.35,
      },
      contextTokens: 1800,
      agentTokens: 450,
      sessionId: workflowId,
    }
  );
  console.log('✅ Tracked node 1: Art Valuation');
  
  // Node 2: Risk Assessment
  const agentOnlyRisk = 'Shipping art internationally involves risks like damage, theft, and loss.';
  const contextEnhancedRisk = `Risk Assessment for London to NYC Gallery Exhibition:
TRANSPORT RISKS:
- Transit damage: Low (0.2% probability) - climate-controlled transport
- Theft: Very Low (0.05% probability) - armed security escort
- Loss: Minimal (0.01% probability) - GPS tracking + insurance

COVERAGE REQUIREMENTS:
- All-risk transit: $450,000 declared value
- Exhibition coverage: $450,000 + public liability ($1M)
- Duration: 90 days (exhibition + transit)
- Deductible: $5,000 per claim

PREMIUM FACTORS:
- Art type: Contemporary painting (Medium risk category)
- Value: $450,000 (High-value category)
- Transit route: London-NYC (Established route, low risk)
- Exhibition venue: Established gallery (Low risk)
- Combined premium factor: 0.35% of declared value`;
  
  await workflowMetricsTracker.trackNodeMetrics(
    workflowId,
    'node-2',
    'Risk Assessment',
    'risk',
    {
      query,
      domain: 'art',
      agent: 'gemma3:4b',
      agentAnswer: agentOnlyRisk,
      contextAnswer: contextEnhancedRisk,
      contextQuality: {
        relevance: 0.98,
        coherence: 0.92,
        completeness: 0.95,
        efficiency: 0.88,
        freshness: 0.90,
        diversity: 0.85,
      },
      agentQuality: {
        quality: 0.30,
        relevance: 0.35,
        coherence: 0.25,
        completeness: 0.20,
      },
      contextTokens: 2200,
      agentTokens: 380,
      sessionId: workflowId,
    }
  );
  console.log('✅ Tracked node 2: Risk Assessment');
  
  // Node 3: Premium Calculation
  const agentOnlyPremium = 'The premium would be around $1,500-$2,000 based on the value.';
  const contextEnhancedPremium = `INSURANCE PREMIUM CALCULATION:

Base Premium Calculation:
- Declared Value: $450,000
- Base Rate: 0.35% (High-value contemporary art, established route)
- Base Premium: $450,000 × 0.0035 = $1,575

Adjustments:
- Exhibition Duration: +15% ($236) - 90-day exhibition period
- Security: -10% ($158) - Armed escort + GPS tracking
- Gallery Reputation: -5% ($79) - Established venue
- Transit Route: -5% ($79) - London-NYC established route

Final Premium Breakdown:
- Base Premium: $1,575
- Adjustments: -$79 (net)
- Final Annual Premium: $1,496
- Monthly Premium: $124.67

COVERAGE INCLUDES:
- All-risk transit: $450,000
- Exhibition coverage: $450,000
- Public liability: $1,000,000
- Duration: 90 days
- Deductible: $5,000 per claim

RECOMMENDATIONS:
- Consider annual policy for multiple exhibitions (potential 20% discount)
- Review deductible options (higher deductible = lower premium)
- Verify gallery security standards meet insurer requirements`;
  
  await workflowMetricsTracker.trackNodeMetrics(
    workflowId,
    'node-3',
    'Premium Calculation',
    'calculation',
    {
      query,
      domain: 'art',
      agent: 'gemma3:4b',
      agentAnswer: agentOnlyPremium,
      contextAnswer: contextEnhancedPremium,
      contextQuality: {
        relevance: 0.97,
        coherence: 0.94,
        completeness: 0.98,
        efficiency: 0.90,
        freshness: 0.92,
        diversity: 0.88,
      },
      agentQuality: {
        quality: 0.40,
        relevance: 0.45,
        coherence: 0.35,
        completeness: 0.30,
      },
      contextTokens: 2500,
      agentTokens: 520,
      sessionId: workflowId,
    }
  );
  console.log('✅ Tracked node 3: Premium Calculation');
  
  // End workflow
  const metrics = workflowMetricsTracker.endWorkflow(workflowId);
  
  console.log('\n📊 ART INSURANCE WORKFLOW METRICS:');
  console.log(`   Workflow Quality: ${(metrics.overallMetrics.workflowQuality * 100).toFixed(1)}%`);
  console.log(`   Avg Agent Contribution: ${(metrics.overallMetrics.avgAgentContribution * 100).toFixed(1)}%`);
  console.log(`   Avg Context Contribution: ${(metrics.overallMetrics.avgContextContribution * 100).toFixed(1)}%`);
  console.log(`   Intelligence Extension: ${(metrics.overallMetrics.avgIntelligenceExtension * 100).toFixed(1)}%`);
  console.log(`\n   Nodes with Agent Comparison: ${metrics.nodeMetrics.filter(m => m.extendedIntelligence > 0).length}`);
  console.log(`   Total Nodes: ${metrics.totalNodes}`);
}

async function testLATAMLegalTransferWorkflow() {
  console.log('\n⚖️  ========================================');
  console.log('LATAM LEGAL BUSINESS TRANSFER');
  console.log('========================================\n');
  
  const workflowId = `latam-legal-${Date.now()}`;
  const query = 'What are the legal requirements for transferring a manufacturing business from Brazil to Mexico under USMCA?';
  
  workflowMetricsTracker.startWorkflow(workflowId, 'LATAM Legal Business Transfer');
  
  // Node 1: Legal Framework Analysis
  const agentOnlyLegal = 'Brazil and Mexico have different legal systems. You need to comply with both jurisdictions.';
  const contextEnhancedLegal = `LEGAL FRAMEWORK ANALYSIS:

BRAZIL EXIT REQUIREMENTS:
- Corporate Dissolution: Board resolution + shareholder approval (30-60 days)
- Tax Clearance: Federal (Receita Federal) + State tax clearance certificates
- Labor Obligations: 
  * Severance payments: 40% FGTS (Employee Severance Fund) + 1/3 bonus
  * 30-90 days notice period for termination
  * Union consultation required for collective dismissals
- Environmental Compliance: IBAMA clearance for manufacturing operations
- Export Licenses: ANVISA (health products) + other regulatory bodies

MEXICO ENTRY REQUIREMENTS (USMCA):
- Entity Formation: Mexican corporation (Sociedad Anónima) - 15-30 days
- IMMEX Program: Manufacturing export program registration
- Tax Registration: SAT (Tax Administration Service) - 10-15 days
- USMCA Compliance:
  * Rules of Origin: 75% North American content requirement
  * Labor Standards: Minimum wage compliance + worker rights
  * Environmental Standards: SEMARNAT permits
- Investment Authorization: IED (Foreign Direct Investment) registration

CROSS-BORDER TRANSFER:
- Asset Transfer: Customs valuation + import duties (if applicable)
- Intellectual Property: Patent/trademark registration in Mexico
- Data Transfer: Mexico Data Protection Law compliance
- Contract Assignment: Novation agreements for existing contracts`;
  
  await workflowMetricsTracker.trackNodeMetrics(
    workflowId,
    'node-1',
    'Legal Framework Analysis',
    'legal',
    {
      query,
      domain: 'legal',
      agent: 'gemma3:4b',
      agentAnswer: agentOnlyLegal,
      contextAnswer: contextEnhancedLegal,
      contextQuality: {
        relevance: 0.96,
        coherence: 0.91,
        completeness: 0.94,
        efficiency: 0.87,
        freshness: 0.93,
        diversity: 0.89,
      },
      agentQuality: {
        quality: 0.35,
        relevance: 0.40,
        coherence: 0.30,
        completeness: 0.25,
      },
      contextTokens: 3200,
      agentTokens: 580,
      sessionId: workflowId,
    }
  );
  console.log('✅ Tracked node 1: Legal Framework Analysis');
  
  // Node 2: USMCA Compliance
  const agentOnlyUSMCA = 'USMCA has rules about trade and investment between the US, Mexico, and Canada.';
  const contextEnhancedUSMCA = `USMCA COMPLIANCE REQUIREMENTS:

RULES OF ORIGIN:
- Regional Value Content: 75% of finished goods must originate in North America
- Tariff Classification: Must meet HS code requirements
- Manufacturing Process: Specific transformation requirements
- Documentation: Certificate of Origin required for each shipment

LABOR STANDARDS:
- Minimum Wage: Must comply with Mexico's minimum wage ($11.50 USD/day, 2024)
- Worker Rights: Freedom of association, collective bargaining
- Labor Violations: Rapid response mechanism for violations
- Enforcement: Labor inspections and dispute resolution

ENVIRONMENTAL STANDARDS:
- Environmental Impact Assessment: SEMARNAT approval required
- Pollution Control: NOM standards compliance
- Waste Management: Proper disposal protocols
- Carbon Emissions: Reporting and reduction targets

INTELLECTUAL PROPERTY:
- Patent Protection: Enhanced IP enforcement
- Trade Secrets: Stronger protection for proprietary information
- Technology Transfer: Licensing and cross-licensing frameworks
- Data Protection: Cross-border data transfer compliance

CUSTOMS AND TRADE:
- Duty-Free Trade: Qualifying goods enter duty-free
- Simplified Procedures: Reduced documentation requirements
- Customs Valuation: Transfer pricing compliance
- Border Efficiency: Faster clearance for qualifying goods

COMPLIANCE TIMELINE:
- Entity Formation: 15-30 days
- USMCA Registration: 30-45 days
- Permits and Licenses: 60-90 days
- Full Compliance: 90-120 days`;
  
  await workflowMetricsTracker.trackNodeMetrics(
    workflowId,
    'node-2',
    'USMCA Compliance',
    'compliance',
    {
      query,
      domain: 'legal',
      agent: 'gemma3:4b',
      agentAnswer: agentOnlyUSMCA,
      contextAnswer: contextEnhancedUSMCA,
      contextQuality: {
        relevance: 0.98,
        coherence: 0.93,
        completeness: 0.96,
        efficiency: 0.89,
        freshness: 0.95,
        diversity: 0.91,
      },
      agentQuality: {
        quality: 0.38,
        relevance: 0.42,
        coherence: 0.32,
        completeness: 0.28,
      },
      contextTokens: 2800,
      agentTokens: 620,
      sessionId: workflowId,
    }
  );
  console.log('✅ Tracked node 2: USMCA Compliance');
  
  // Node 3: Implementation Strategy
  const agentOnlyStrategy = 'You should create a plan and get legal advice before transferring the business.';
  const contextEnhancedStrategy = `IMPLEMENTATION STRATEGY:

PHASE 1: PREPARATION (Months 1-3)
- Legal Audit: Comprehensive review of Brazil operations
- Tax Planning: Minimize tax exposure during transfer
- Labor Planning: Employee transition strategy
- Contract Review: Identify contracts requiring assignment/novation
- IP Inventory: Patent, trademark, and trade secret catalog

PHASE 2: BRAZIL EXIT (Months 4-6)
- Tax Clearance: Obtain all required certificates
- Labor Compliance: Complete severance obligations
- Environmental Clearance: IBAMA approval
- Asset Valuation: Professional appraisal for customs
- Export Licenses: Obtain all required permits

PHASE 3: MEXICO ENTRY (Months 7-9)
- Entity Formation: Incorporate Mexican corporation
- IMMEX Registration: Apply for manufacturing export program
- USMCA Registration: Complete compliance documentation
- Tax Registration: SAT registration and tax ID
- Permits: Obtain all operational permits

PHASE 4: TRANSFER EXECUTION (Months 10-12)
- Asset Transfer: Physical and intellectual property transfer
- Contract Novation: Assign/novate existing contracts
- Employee Relocation: Visa and work permit processing
- Operations Setup: Facility preparation and equipment installation
- Compliance Verification: Final compliance audit

COST ESTIMATE:
- Legal Fees: $150K-$250K
- Tax Compliance: $50K-$100K
- Permits and Licenses: $30K-$60K
- Employee Relocation: $100K-$200K
- Total Estimated Cost: $330K-$610K

RISK MITIGATION:
- Political Risk Insurance: Cover policy changes
- Currency Hedging: Protect against FX fluctuations
- Contingency Planning: Backup plans for delays
- Legal Dispute Resolution: Arbitration clauses

TIMELINE: 12-18 months for complete transfer`;
  
  await workflowMetricsTracker.trackNodeMetrics(
    workflowId,
    'node-3',
    'Implementation Strategy',
    'strategy',
    {
      query,
      domain: 'legal',
      agent: 'gemma3:4b',
      agentAnswer: agentOnlyStrategy,
      contextAnswer: contextEnhancedStrategy,
      contextQuality: {
        relevance: 0.97,
        coherence: 0.95,
        completeness: 0.97,
        efficiency: 0.91,
        freshness: 0.94,
        diversity: 0.92,
      },
      agentQuality: {
        quality: 0.32,
        relevance: 0.36,
        coherence: 0.28,
        completeness: 0.24,
      },
      contextTokens: 3400,
      agentTokens: 680,
      sessionId: workflowId,
    }
  );
  console.log('✅ Tracked node 3: Implementation Strategy');
  
  // End workflow
  const metrics = workflowMetricsTracker.endWorkflow(workflowId);
  
  console.log('\n📊 LATAM LEGAL TRANSFER METRICS:');
  console.log(`   Workflow Quality: ${(metrics.overallMetrics.workflowQuality * 100).toFixed(1)}%`);
  console.log(`   Avg Agent Contribution: ${(metrics.overallMetrics.avgAgentContribution * 100).toFixed(1)}%`);
  console.log(`   Avg Context Contribution: ${(metrics.overallMetrics.avgContextContribution * 100).toFixed(1)}%`);
  console.log(`   Intelligence Extension: ${(metrics.overallMetrics.avgIntelligenceExtension * 100).toFixed(1)}%`);
}

async function testManufacturingQueryWorkflow() {
  console.log('\n🏭 ========================================');
  console.log('MANUFACTURING SUPPLY CHAIN OPTIMIZATION');
  console.log('========================================\n');
  
  const workflowId = `manufacturing-${Date.now()}`;
  const query = 'How to optimize supply chain for manufacturing relocation from China to Mexico?';
  
  workflowMetricsTracker.startWorkflow(workflowId, 'Manufacturing Supply Chain Optimization');
  
  // Node 1: Supply Chain Analysis
  const agentOnlySC = 'Moving manufacturing from China to Mexico can reduce costs and improve delivery times.';
  const contextEnhancedSC = `SUPPLY CHAIN OPTIMIZATION ANALYSIS:

COST COMPARISON (China vs Mexico):
- Shipping Costs: 
  * China: $3,500-5,000 per 40ft container (15-25 days transit)
  * Mexico: $1,200-1,800 per 40ft container (2-3 days transit)
  * Savings: 60-70% reduction in shipping costs
  
- Labor Costs:
  * China: $3-6/hour (manufacturing wages)
  * Mexico: $4-8/hour (manufacturing wages)
  * Difference: 15-25% higher in Mexico, offset by automation
  
- Inventory Costs:
  * China: 60-90 days inventory (long transit times)
  * Mexico: 15-30 days inventory (short transit times)
  * Reduction: 50-70% lower inventory carrying costs

SUPPLIER NETWORK:
- Nearshoring Benefits:
  * Reduced lead times: 2-3 days vs 15-25 days
  * Lower inventory: 15-30 days vs 60-90 days
  * Better responsiveness: Faster reaction to demand changes
  * Quality control: Easier to monitor and visit suppliers
  
- Supplier Qualification:
  * Identify Mexican suppliers: 3-6 months
  * Quality audits: ISO 9001, IATF 16949 standards
  * Dual sourcing: Reduce single-source risk
  * Supplier development: Technical assistance programs

LOGISTICS OPTIMIZATION:
- Transportation Networks:
  * Highway: 85% of US-Mexico trade via trucks
  * Railway: 15% via rail (cost-effective for bulk)
  * Ports: Pacific and Gulf coast access
  * Border Crossings: Laredo, El Paso (highest volume)
  
- Warehouse Strategy:
  * Cross-docking: Reduce inventory holding
  * Distribution centers: Strategic locations near border
  * Just-in-time: Synchronized delivery
  * 3PL Partnerships: Leverage logistics expertise`;
  
  await workflowMetricsTracker.trackNodeMetrics(
    workflowId,
    'node-1',
    'Supply Chain Analysis',
    'analysis',
    {
      query,
      domain: 'manufacturing',
      agent: 'gemma3:4b',
      agentAnswer: agentOnlySC,
      contextAnswer: contextEnhancedSC,
      contextQuality: {
        relevance: 0.95,
        coherence: 0.92,
        completeness: 0.93,
        efficiency: 0.88,
        freshness: 0.96,
        diversity: 0.87,
      },
      agentQuality: {
        quality: 0.42,
        relevance: 0.48,
        coherence: 0.38,
        completeness: 0.32,
      },
      contextTokens: 2900,
      agentTokens: 640,
      sessionId: workflowId,
    }
  );
  console.log('✅ Tracked node 1: Supply Chain Analysis');
  
  // Node 2: Manufacturing Process Optimization
  const agentOnlyProcess = 'You should optimize your manufacturing processes for efficiency.';
  const contextEnhancedProcess = `MANUFACTURING PROCESS OPTIMIZATION:

LEAN MANUFACTURING PRINCIPLES:
- Waste Elimination: Identify and remove 7 types of waste
  * Overproduction: Reduce batch sizes
  * Waiting: Minimize downtime
  * Transportation: Optimize material flow
  * Over-processing: Eliminate unnecessary steps
  * Inventory: Reduce work-in-progress
  * Motion: Optimize worker movements
  * Defects: Improve quality at source
  
- Value Stream Mapping:
  * Current state analysis: Map existing processes
  * Future state design: Ideal process flow
  * Implementation plan: Phased improvements
  * Expected gains: 20-30% efficiency improvement

AUTOMATION STRATEGY:
- Robotics: 20-30% cost reduction potential
- AI/ML: Predictive maintenance, quality control
- IoT Sensors: Real-time monitoring and optimization
- ROI Timeline: 2-4 years payback period

QUALITY MANAGEMENT:
- ISO 9001: Quality management systems
- IATF 16949: Automotive quality standards
- Six Sigma: Defect reduction (target: <3.4 defects per million)
- Statistical Process Control: Real-time quality monitoring
- Expected improvement: 15-25% defect reduction

SUPPLY CHAIN INTEGRATION:
- Vendor-Managed Inventory (VMI): Suppliers manage inventory
- Just-in-Time (JIT): Synchronized production and delivery
- Kanban Systems: Visual workflow management
- Electronic Data Interchange (EDI): Automated ordering
- Benefits: 30-40% inventory reduction`;
  
  await workflowMetricsTracker.trackNodeMetrics(
    workflowId,
    'node-2',
    'Process Optimization',
    'optimization',
    {
      query,
      domain: 'manufacturing',
      agent: 'gemma3:4b',
      agentAnswer: agentOnlyProcess,
      contextAnswer: contextEnhancedProcess,
      contextQuality: {
        relevance: 0.96,
        coherence: 0.94,
        completeness: 0.95,
        efficiency: 0.90,
        freshness: 0.94,
        diversity: 0.90,
      },
      agentQuality: {
        quality: 0.38,
        relevance: 0.43,
        coherence: 0.33,
        completeness: 0.28,
      },
      contextTokens: 2700,
      agentTokens: 580,
      sessionId: workflowId,
    }
  );
  console.log('✅ Tracked node 2: Process Optimization');
  
  // End workflow
  const metrics = workflowMetricsTracker.endWorkflow(workflowId);
  
  console.log('\n📊 MANUFACTURING WORKFLOW METRICS:');
  console.log(`   Workflow Quality: ${(metrics.overallMetrics.workflowQuality * 100).toFixed(1)}%`);
  console.log(`   Avg Agent Contribution: ${(metrics.overallMetrics.avgAgentContribution * 100).toFixed(1)}%`);
  console.log(`   Avg Context Contribution: ${(metrics.overallMetrics.avgContextContribution * 100).toFixed(1)}%`);
  console.log(`   Intelligence Extension: ${(metrics.overallMetrics.avgIntelligenceExtension * 100).toFixed(1)}%`);
}

async function runAllTests() {
  try {
    await testArtInsurancePremiumWorkflow();
    await testLATAMLegalTransferWorkflow();
    await testManufacturingQueryWorkflow();
    
    console.log('\n✅ All real-world workflow examples completed!');
    console.log('\n📈 Summary:');
    console.log('   - Art Insurance: Premium calculation with detailed risk assessment');
    console.log('   - LATAM Legal: Business transfer with USMCA compliance');
    console.log('   - Manufacturing: Supply chain optimization for relocation');
    console.log('\n   These examples show how extended intelligence metrics work');
    console.log('   with real agent comparison (agent-only vs context-enhanced answers).');
  } catch (error) {
    console.error('❌ Error running tests:', error);
    process.exit(1);
  }
}

runAllTests();

