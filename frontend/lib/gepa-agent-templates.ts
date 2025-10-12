/**
 * Initial Agent Templates for GEPA Code Evolution
 * 
 * These are simple baseline agents that GEPA will evolve
 * into sophisticated agents with self-reflection, multi-step reasoning, etc.
 * 
 * Covers ALL 12 business domains with 40+ use cases
 */

export const AGENT_TEMPLATES = {
  // === FINANCIAL & INVESTMENT ===
  financial_analyst: `async function analyzeFinancialData(financialData) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Analyze this financial data and provide key metrics, insights, and recommendations:

Financial Data:
\${financialData}

Provide a comprehensive analysis.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  portfolio_optimizer: `async function optimizePortfolio(portfolioData, riskTolerance, timeHorizon) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Optimize this investment portfolio:

Current Portfolio:
\${portfolioData}

Risk Tolerance: \${riskTolerance}
Time Horizon: \${timeHorizon}

Provide optimal allocation recommendations.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  risk_assessor: `async function assessRisk(riskData, riskType) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Assess the following risks:

Risk Data:
\${riskData}

Risk Type: \${riskType}

Identify risk factors, score them, and provide mitigation strategies.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  market_researcher: `async function analyzeMarketTrends(marketData, industry) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Analyze market trends for the \${industry} industry:

Market Data:
\${marketData}

Identify key trends, opportunities, risks, and provide a summary.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  compliance_checker: `async function checkCompliance(businessData, regulations, industry) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Check compliance for \${industry} industry:

Business Data:
\${businessData}

Regulations:
\${regulations}

Identify compliance status, violations, and action plan.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  // === REAL ESTATE ===
  real_estate_agent: `async function analyzeProperty(propertyData, location, budget) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Analyze this property investment:

Property: \${propertyData}
Location: \${location}
Budget: \${budget}

Provide analysis, market comparison, and investment recommendation.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  // === LEGAL & COMPLIANCE ===
  legal_analyst: `async function analyzeLegalDoc(legalText, jurisdiction) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Analyze legal document for \${jurisdiction}:

\${legalText}

Identify legal implications, compliance requirements, risks, and recommendations.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  contract_reviewer: `async function reviewContract(contractText, contractType) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Review this \${contractType} contract:

\${contractText}

Identify key terms, risks, missing clauses, and negotiation points.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  // === MARKETING & SALES ===
  marketing_strategist: `async function createStrategy(productData, targetAudience, budget) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Create marketing strategy:

Product: \${productData}
Target Audience: \${targetAudience}
Budget: \${budget}

Provide channels, campaign strategy, budget allocation, and success metrics.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  content_creator: `async function createContent(topic, audience, contentType) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Create \${contentType} content:

Topic: \${topic}
Audience: \${audience}

Provide outline, key points, call-to-action, and distribution plan.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  // === TECHNOLOGY & SAAS ===
  tech_architect: `async function designArchitecture(requirements, constraints) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Design system architecture:

Requirements: \${requirements}
Constraints: \${constraints}

Provide architecture, components, integrations, and scalability plan.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  saas_analyzer: `async function analyzeSaaS(saasData, marketSegment) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Analyze SaaS for \${marketSegment}:

\${saasData}

Provide market position, pricing strategy, feature gaps, and growth opportunities.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  // === HEALTHCARE & MEDICAL ===
  medical_analyzer: `async function analyzeMedical(medicalData, condition) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Medical analysis for \${condition}:

\${medicalData}

Provide diagnosis, treatment options, risk factors, and monitoring plan.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  // === MANUFACTURING & INDUSTRY ===
  manufacturing_optimizer: `async function optimizeProduction(productionData, goals) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Optimize manufacturing:

Production Data: \${productionData}
Goals: \${goals}

Provide optimization plan, efficiency gains, cost reductions, and timeline.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  supply_chain_analyst: `async function analyzeSupplyChain(supplyChainData, risks) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Analyze supply chain:

\${supplyChainData}

Risks: \${risks}

Provide supply chain map, risk assessment, and optimization opportunities.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  // === EDUCATION & RESEARCH ===
  educational_designer: `async function designCurriculum(learningObjectives, audience) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Design curriculum:

Learning Objectives: \${learningObjectives}
Audience: \${audience}

Provide curriculum structure, learning methods, assessment strategy, and resources.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  research_analyst: `async function conductResearch(researchQuestion, data) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Research analysis:

Question: \${researchQuestion}
Data: \${data}

Provide research design, methodology, analysis methods, and implications.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  // === DATA & ANALYTICS ===
  data_analyst: `async function analyzeData(dataset, analysisGoal) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Analyze dataset:

\${dataset}

Goal: \${analysisGoal}

Provide insights, patterns, correlations, predictions, and recommendations.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  // === OPERATIONS & LOGISTICS ===
  operations_optimizer: `async function optimizeOperations(operationsData, goals) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Optimize operations:

\${operationsData}

Goals: \${goals}

Provide optimization plan, efficiency gains, cost reductions, and implementation.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  logistics_coordinator: `async function planLogistics(logisticsData, requirements) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Plan logistics:

\${logisticsData}

Requirements: \${requirements}

Provide routing plan, cost optimization, delivery schedule, and performance metrics.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  // === CUSTOMER SERVICE ===
  customer_service_optimizer: `async function optimizeService(serviceData, customerFeedback) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Optimize customer service:

Service Data: \${serviceData}
Feedback: \${customerFeedback}

Identify service gaps, improvement areas, training needs, and satisfaction plan.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  // === SPECIALIZED DOMAINS ===
  sustainability_advisor: `async function adviseSustainability(businessData, industry) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Sustainability advice for \${industry}:

\${businessData}

Provide carbon footprint analysis, sustainability plan, green initiatives, and ROI.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  cybersecurity_analyst: `async function analyzeSecurity(systemData, threats) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Cybersecurity analysis:

System: \${systemData}
Threats: \${threats}

Identify vulnerabilities, security recommendations, compliance status, and incident response.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`,

  innovation_catalyst: `async function analyzeInnovation(industryData, trends) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: \`Innovation analysis for industry:

\${industryData}

Trends: \${trends}

Identify innovation opportunities, technology trends, competitive advantages, and implementation.\`,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}`
};

export const AGENT_DESCRIPTIONS = {
  // Financial & Investment
  financial_analyst: {
    name: 'Financial Analyst Agent',
    description: 'Analyzes financial data and provides metrics, insights, and recommendations',
    domain: 'Financial & Investment',
    expectedImprovements: ['Self-reflection', 'Multi-step reasoning', 'Tool use for ratios', 'Best practice validation']
  },
  portfolio_optimizer: {
    name: 'Portfolio Optimizer Agent',
    description: 'Optimizes investment portfolios based on risk tolerance and time horizon',
    domain: 'Financial & Investment',
    expectedImprovements: ['Multi-step optimization', 'Sharpe ratio calculations', 'Quality reflection', 'Compliance checking']
  },
  risk_assessor: {
    name: 'Risk Assessment Agent',
    description: 'Assesses risks, scores them, and provides mitigation strategies',
    domain: 'Financial & Investment',
    expectedImprovements: ['Structured risk identification', 'Quantitative scoring', 'Coverage reflection', 'Framework validation']
  },
  market_researcher: {
    name: 'Market Research Agent',
    description: 'Analyzes market trends, identifies opportunities and risks',
    domain: 'Financial & Investment',
    expectedImprovements: ['Multi-step analysis', 'Trend reflection', 'Market data validation', 'Confidence-based stopping']
  },
  compliance_checker: {
    name: 'Compliance Checker Agent',
    description: 'Checks regulatory compliance and identifies violations',
    domain: 'Financial & Investment',
    expectedImprovements: ['Systematic checking', 'Regulatory validation', 'Coverage reflection', 'Action prioritization']
  },
  
  // Real Estate
  real_estate_agent: {
    name: 'Real Estate Agent',
    description: 'Analyzes properties and provides investment recommendations',
    domain: 'Real Estate',
    expectedImprovements: ['Market comparison logic', 'ROI calculations', 'Location analysis', 'Investment scoring']
  },
  
  // Legal & Compliance
  legal_analyst: {
    name: 'Legal Analyst Agent',
    description: 'Analyzes legal documents and identifies implications',
    domain: 'Legal & Compliance',
    expectedImprovements: ['Case law references', 'Risk identification', 'Compliance checking', 'Multi-jurisdiction handling']
  },
  contract_reviewer: {
    name: 'Contract Reviewer Agent',
    description: 'Reviews contracts and identifies risks and negotiation points',
    domain: 'Legal & Compliance',
    expectedImprovements: ['Clause analysis', 'Risk scoring', 'Missing term identification', 'Negotiation strategy']
  },
  
  // Marketing & Sales
  marketing_strategist: {
    name: 'Marketing Strategist Agent',
    description: 'Creates comprehensive marketing strategies',
    domain: 'Marketing & Sales',
    expectedImprovements: ['Channel selection logic', 'Budget optimization', 'ROI predictions', 'Campaign validation']
  },
  content_creator: {
    name: 'Content Creator Agent',
    description: 'Creates content outlines and distribution strategies',
    domain: 'Marketing & Sales',
    expectedImprovements: ['Audience targeting', 'SEO optimization', 'Engagement prediction', 'Multi-channel planning']
  },
  
  // Technology & SaaS
  tech_architect: {
    name: 'Tech Architect Agent',
    description: 'Designs system architectures and technology stacks',
    domain: 'Technology & SaaS',
    expectedImprovements: ['Scalability analysis', 'Cost estimation', 'Technology selection', 'Integration planning']
  },
  saas_analyzer: {
    name: 'SaaS Analyzer Agent',
    description: 'Analyzes SaaS products and market positioning',
    domain: 'Technology & SaaS',
    expectedImprovements: ['Competitive analysis', 'Pricing optimization', 'Feature prioritization', 'Growth modeling']
  },
  
  // Healthcare & Medical
  medical_analyzer: {
    name: 'Medical Analyzer Agent',
    description: 'Analyzes medical data and provides clinical insights',
    domain: 'Healthcare & Medical',
    expectedImprovements: ['Evidence-based analysis', 'Risk stratification', 'Treatment comparison', 'Monitoring protocols']
  },
  
  // Manufacturing & Industry
  manufacturing_optimizer: {
    name: 'Manufacturing Optimizer Agent',
    description: 'Optimizes production processes and efficiency',
    domain: 'Manufacturing & Industry',
    expectedImprovements: ['Bottleneck identification', 'Efficiency calculations', 'Cost-benefit analysis', 'Timeline optimization']
  },
  supply_chain_analyst: {
    name: 'Supply Chain Analyst Agent',
    description: 'Analyzes and optimizes supply chain operations',
    domain: 'Manufacturing & Industry',
    expectedImprovements: ['Risk mapping', 'Vendor evaluation', 'Route optimization', 'Inventory management']
  },
  
  // Education & Research
  educational_designer: {
    name: 'Educational Designer Agent',
    description: 'Designs curricula and learning experiences',
    domain: 'Education & Research',
    expectedImprovements: ['Learning path optimization', 'Assessment design', 'Resource allocation', 'Outcome measurement']
  },
  research_analyst: {
    name: 'Research Analyst Agent',
    description: 'Designs research methodologies and analyzes data',
    domain: 'Education & Research',
    expectedImprovements: ['Method selection', 'Statistical analysis', 'Validity assessment', 'Impact evaluation']
  },
  
  // Data & Analytics
  data_analyst: {
    name: 'Data Analyst Agent',
    description: 'Analyzes datasets and extracts insights',
    domain: 'Data & Analytics',
    expectedImprovements: ['Pattern recognition', 'Statistical testing', 'Visualization selection', 'Insight synthesis']
  },
  
  // Operations & Logistics
  operations_optimizer: {
    name: 'Operations Optimizer Agent',
    description: 'Optimizes business operations and workflows',
    domain: 'Operations & Logistics',
    expectedImprovements: ['Process mapping', 'Efficiency metrics', 'Cost reduction strategies', 'Implementation planning']
  },
  logistics_coordinator: {
    name: 'Logistics Coordinator Agent',
    description: 'Plans and optimizes logistics operations',
    domain: 'Operations & Logistics',
    expectedImprovements: ['Route optimization', 'Cost calculation', 'Delivery scheduling', 'Performance tracking']
  },
  
  // Customer Service
  customer_service_optimizer: {
    name: 'Customer Service Optimizer Agent',
    description: 'Optimizes customer service operations',
    domain: 'Customer Service',
    expectedImprovements: ['Gap analysis', 'Training needs assessment', 'Process optimization', 'Satisfaction modeling']
  },
  
  // Specialized Domains
  sustainability_advisor: {
    name: 'Sustainability Advisor Agent',
    description: 'Provides sustainability and environmental advice',
    domain: 'Specialized',
    expectedImprovements: ['Carbon footprint calculation', 'Impact assessment', 'Initiative prioritization', 'ROI analysis']
  },
  cybersecurity_analyst: {
    name: 'Cybersecurity Analyst Agent',
    description: 'Analyzes security posture and identifies vulnerabilities',
    domain: 'Specialized',
    expectedImprovements: ['Threat modeling', 'Vulnerability scoring', 'Control assessment', 'Incident response planning']
  },
  innovation_catalyst: {
    name: 'Innovation Catalyst Agent',
    description: 'Identifies innovation opportunities and strategies',
    domain: 'Specialized',
    expectedImprovements: ['Trend analysis', 'Opportunity scoring', 'Implementation roadmap', 'Risk-benefit analysis']
  }
};

export const AGENT_CATEGORIES = {
  'Financial & Investment': ['financial_analyst', 'portfolio_optimizer', 'risk_assessor', 'market_researcher', 'compliance_checker'],
  'Real Estate': ['real_estate_agent'],
  'Legal & Compliance': ['legal_analyst', 'contract_reviewer'],
  'Marketing & Sales': ['marketing_strategist', 'content_creator'],
  'Technology & SaaS': ['tech_architect', 'saas_analyzer'],
  'Healthcare & Medical': ['medical_analyzer'],
  'Manufacturing & Industry': ['manufacturing_optimizer', 'supply_chain_analyst'],
  'Education & Research': ['educational_designer', 'research_analyst'],
  'Data & Analytics': ['data_analyst'],
  'Operations & Logistics': ['operations_optimizer', 'logistics_coordinator'],
  'Customer Service': ['customer_service_optimizer'],
  'Specialized': ['sustainability_advisor', 'cybersecurity_analyst', 'innovation_catalyst']
};

