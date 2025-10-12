/**
 * Initial Agent Templates for GEPA Code Evolution
 * 
 * These are simple baseline agents that GEPA will evolve
 * into sophisticated agents with self-reflection, multi-step reasoning, etc.
 */

export const AGENT_TEMPLATES = {
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
}`
};

export const AGENT_DESCRIPTIONS = {
  financial_analyst: {
    name: 'Financial Analyst Agent',
    description: 'Analyzes financial data and provides metrics, insights, and recommendations',
    expectedImprovements: [
      'Self-reflection on analysis quality',
      'Multi-step reasoning (extract data → analyze → recommend)',
      'Tool use for calculating financial ratios',
      'Validation of recommendations against best practices'
    ]
  },
  portfolio_optimizer: {
    name: 'Portfolio Optimizer Agent',
    description: 'Optimizes investment portfolios based on risk tolerance and time horizon',
    expectedImprovements: [
      'Multi-step optimization (assess current → calculate optimal → validate)',
      'Tool integration for Sharpe ratio and other calculations',
      'Self-reflection on allocation quality',
      'Compliance checking against investment constraints'
    ]
  },
  risk_assessor: {
    name: 'Risk Assessment Agent',
    description: 'Assesses risks, scores them, and provides mitigation strategies',
    expectedImprovements: [
      'Structured risk identification process',
      'Quantitative scoring with tool use',
      'Self-reflection on risk coverage',
      'Validation against risk management frameworks'
    ]
  },
  market_researcher: {
    name: 'Market Research Agent',
    description: 'Analyzes market trends, identifies opportunities and risks',
    expectedImprovements: [
      'Multi-step analysis (trends → opportunities → risks → synthesis)',
      'Self-reflection on trend identification',
      'Validation against market data',
      'Early stopping when confidence is high'
    ]
  },
  compliance_checker: {
    name: 'Compliance Checker Agent',
    description: 'Checks regulatory compliance and identifies violations',
    expectedImprovements: [
      'Systematic compliance checking process',
      'Validation against regulatory frameworks',
      'Self-reflection on coverage',
      'Action plan prioritization'
    ]
  }
};

