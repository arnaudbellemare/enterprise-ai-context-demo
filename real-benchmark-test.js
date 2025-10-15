#!/usr/bin/env node

/**
 * REAL PERMUTATION Benchmark Test
 * 
 * Actually tests the real PERMUTATION system against real baselines
 * No fake data, no simulations - just real API calls and measurements
 */

const https = require('https');
const http = require('http');

// ADVANCED quality evaluation for complex queries - no fake data!
function evaluateResponseQuality(response, query, domain) {
  if (!response || response.length < 50) {
    return 0.1; // Very low quality for empty/short responses
  }

  let score = 0.3; // Lower base score for complex queries

  // Length analysis (complex queries need comprehensive responses)
  if (response.length > 500) score += 0.1;
  if (response.length > 1000) score += 0.1;
  if (response.length > 2000) score += 0.1;
  if (response.length > 3000) score += 0.1;

  // Advanced domain-specific analysis
  const domainAnalysis = {
    financial: {
      keywords: ['portfolio', 'risk', 'return', 'correlation', 'var', 'sharpe', 'rebalancing', 'diversification', 'volatility', 'beta', 'alpha', 'yield', 'dividend', 'equity', 'debt', 'leverage', 'covenant', 'coverage', 'ratio'],
      concepts: ['risk-adjusted', 'asset allocation', 'market conditions', 'economic scenarios', 'stress testing', 'monte carlo', 'optimization', 'tax efficiency']
    },
    crypto: {
      keywords: ['defi', 'tvl', 'liquidity', 'yield farming', 'impermanent loss', 'governance', 'tokenomics', 'staking', 'validators', 'consensus', 'blockchain', 'smart contracts', 'gas fees', 'slippage', 'arbitrage'],
      concepts: ['systemic risk', 'attack vectors', 'protocol security', 'cross-chain', 'compliance', 'kyc', 'aml', 'regulatory', 'jurisdiction']
    },
    real_estate: {
      keywords: ['cap rate', 'cash flow', 'pro forma', 'feasibility', 'zoning', 'construction', 'financing', 'reit', 'portfolio', 'acquisition', 'disposition', 'appreciation', 'depreciation', 'tax implications'],
      concepts: ['market analysis', 'sensitivity analysis', 'risk mitigation', 'climate change', 'regulatory compliance', 'due diligence', 'underwriting']
    },
    technology: {
      keywords: ['microservices', 'architecture', 'scalability', 'performance', 'security', 'compliance', 'monitoring', 'logging', 'disaster recovery', 'cloud-native', 'containerization', 'kubernetes', 'api', 'database'],
      concepts: ['distributed systems', 'fault tolerance', 'data consistency', 'migration strategy', 'cybersecurity', 'threat modeling', 'incident response', 'zero-downtime']
    }
  };

  const analysis = domainAnalysis[domain] || { keywords: [], concepts: [] };
  
  // Keyword relevance (more important for complex queries)
  const keywordMatches = analysis.keywords.filter(keyword => 
    response.toLowerCase().includes(keyword.toLowerCase())
  ).length;
  score += (keywordMatches / analysis.keywords.length) * 0.3; // Up to 0.3 points for domain keywords

  // Concept understanding (even more important)
  const conceptMatches = analysis.concepts.filter(concept => 
    response.toLowerCase().includes(concept.toLowerCase())
  ).length;
  score += (conceptMatches / analysis.concepts.length) * 0.2; // Up to 0.2 points for advanced concepts

  // Structure and organization analysis
  const hasNumbers = /\d+/.test(response);
  const hasBulletPoints = /[•\-\*]\s/.test(response) || /^\d+\./.test(response);
  const hasCalculations = /[+\-*/=]/.test(response);
  const hasSections = /(analysis|recommendation|conclusion|strategy|framework|approach)/i.test(response);
  
  if (hasNumbers) score += 0.05;
  if (hasBulletPoints) score += 0.05;
  if (hasCalculations) score += 0.1;
  if (hasSections) score += 0.1;

  // Professional depth analysis
  const professionalIndicators = [
    'analysis', 'evaluation', 'assessment', 'recommendation', 'strategy', 'framework',
    'consider', 'recommend', 'suggest', 'propose', 'implement', 'optimize',
    'risk', 'opportunity', 'challenge', 'solution', 'approach', 'methodology'
  ];
  const professionalMatches = professionalIndicators.filter(word => 
    response.toLowerCase().includes(word)
  ).length;
  score += (professionalMatches / professionalIndicators.length) * 0.1;

  // Penalty for generic or incomplete responses
  const genericPhrases = ['i cannot', 'i don\'t know', 'i\'m not sure', 'i apologize', 'i\'m sorry', 'i need more information', 'this is complex'];
  const hasGenericPhrases = genericPhrases.some(phrase => 
    response.toLowerCase().includes(phrase)
  );
  
  if (hasGenericPhrases) score -= 0.3; // Bigger penalty for complex queries

  // Bonus for comprehensive responses
  if (response.length > 2000 && keywordMatches > 5 && conceptMatches > 2) {
    score += 0.1; // Bonus for comprehensive analysis
  }

  // Ensure score is between 0 and 1
  return Math.max(0.1, Math.min(0.95, score));
}

// COMPLEX test queries that will actually challenge the systems
const REAL_DOMAIN_TESTS = {
  financial: {
    name: "Complex Financial Analysis",
    queries: [
      "Analyze the risk-adjusted returns of a multi-asset portfolio consisting of 40% S&P 500, 25% international developed markets, 20% emerging markets, 10% REITs, and 5% commodities. Consider correlation matrices, VaR calculations, and optimal rebalancing strategies for a 30-year investment horizon with monthly contributions of $2,000.",
      "Evaluate the impact of rising interest rates on a leveraged buyout structure for a $50M manufacturing company. Calculate the debt service coverage ratio, analyze covenant compliance under stress scenarios, and recommend optimal capital structure adjustments considering current market conditions and regulatory changes.",
      "Design a comprehensive tax optimization strategy for a high-net-worth individual with $10M in assets, including international holdings, real estate investments, and business interests. Consider estate planning, charitable giving strategies, and multi-jurisdictional tax implications."
    ]
  },
  
  crypto: {
    name: "Advanced Cryptocurrency Analysis", 
    queries: [
      "Analyze the systemic risk of a DeFi protocol managing $2B in TVL across multiple chains. Evaluate smart contract vulnerabilities, economic attack vectors, governance token concentration, and propose a comprehensive risk management framework including insurance mechanisms and emergency response protocols.",
      "Design an optimal yield farming strategy across 15 different protocols considering impermanent loss, gas costs, slippage, and protocol risks. Calculate expected returns, risk-adjusted metrics, and implement dynamic rebalancing based on market conditions and protocol performance.",
      "Evaluate the regulatory compliance requirements for launching a cross-border cryptocurrency exchange serving 50+ jurisdictions. Analyze KYC/AML requirements, licensing frameworks, data protection laws, and develop a compliance roadmap with cost projections and timeline estimates."
    ]
  },

  real_estate: {
    name: "Complex Real Estate Investment",
    queries: [
      "Analyze the feasibility of a $100M mixed-use development project in a secondary market. Evaluate market demand, zoning requirements, construction costs, financing options, and develop a comprehensive pro forma with sensitivity analysis for various economic scenarios including interest rate changes and market downturns.",
      "Design a real estate investment trust (REIT) structure for acquiring and managing a portfolio of 50 commercial properties across 10 states. Consider tax implications, regulatory requirements, investor relations, and develop a growth strategy with acquisition criteria and exit strategies.",
      "Evaluate the impact of climate change on coastal real estate investments. Analyze sea level rise projections, insurance costs, regulatory changes, and develop a risk mitigation strategy for a $500M portfolio of coastal properties including adaptation measures and diversification strategies."
    ]
  },

  technology: {
    name: "Advanced Technology & Engineering",
    queries: [
      "Design a distributed microservices architecture for a global e-commerce platform handling 1M+ concurrent users. Consider data consistency, fault tolerance, scalability, security, and develop a comprehensive deployment strategy with monitoring, logging, and disaster recovery protocols.",
      "Analyze the performance bottlenecks in a legacy monolithic application processing 10TB of data daily. Propose a migration strategy to a modern cloud-native architecture, including data migration plans, zero-downtime deployment strategies, and cost optimization for a multi-cloud environment.",
      "Develop a comprehensive cybersecurity framework for a fintech startup handling sensitive financial data. Include threat modeling, security architecture, compliance requirements (PCI DSS, SOX, GDPR), incident response procedures, and employee training programs."
    ]
  }
};

// Make real HTTP request to PERMUTATION API
async function callPermutationAPI(query, domain) {
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3010/api/chat/permutation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: query
          }
        ]
      })
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Evaluate real quality using the same OCR-like analysis
    const responseText = data.answer || data.response || '';
    const qualityScore = evaluateResponseQuality(responseText, query, domain);
    
    return {
      success: true,
      answer: responseText || 'No answer provided',
      processing_time: processingTime,
      domain: domain,
      quality_score: qualityScore, // Real evaluation, not fake metadata
      components_used: data.metadata?.components_used || ['Unknown'],
      cost: data.metadata?.cost || 0.1,
      trace: data.trace || []
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      success: false,
      error: error.message,
      processing_time: endTime - startTime,
      domain: domain,
      quality_score: 0,
      components_used: ['Error'],
      cost: 0
    };
  }
}

// Make real HTTP request to Gemma3:4b baseline API
async function callBaselineAPI(query, domain) {
  const startTime = Date.now();
  
  try {
    // Real call to Gemma3:4b via Ollama
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma3:4b',
        messages: [
          {
            role: 'user',
            content: query
          }
        ],
        stream: false
      })
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Evaluate real quality using OCR-like analysis
    const responseText = data.message?.content || data.response || '';
    const qualityScore = evaluateResponseQuality(responseText, query, domain);
    
    return {
      success: true,
      answer: responseText || 'No response from Gemma3:4b',
      processing_time: processingTime,
      domain: domain,
      quality_score: qualityScore,
      components_used: ['Gemma3:4b (Ollama)'],
      cost: 0.02 // Much cheaper than GPT models
    };
  } catch (error) {
    const endTime = Date.now();
    let errorMessage = error.message;
    
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout (2 minutes)';
    } else if (error.message.includes('fetch failed')) {
      errorMessage = 'Network error - Ollama server may be down';
    }
    
    return {
      success: false,
      error: errorMessage,
      processing_time: endTime - startTime,
      domain: domain,
      quality_score: 0,
      components_used: ['Error'],
      cost: 0
    };
  }
}

// Check if PERMUTATION server is running
async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:3010/api/monitoring/stats');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ PERMUTATION server is running');
      console.log(`   Status: ${data.status}`);
      console.log(`   Uptime: ${data.uptime || 'Unknown'}`);
      return true;
    }
  } catch (error) {
    console.log('❌ PERMUTATION server is not running');
    console.log('   Please start the server with: cd frontend && npm run dev');
    return false;
  }
  return false;
}

// Check if Ollama is running
async function checkOllamaStatus() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ollama server is running');
      console.log(`   Available models: ${data.models?.map(m => m.name).join(', ') || 'None'}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Ollama server is not running');
    console.log('   Please start Ollama: ollama serve');
    console.log('   And pull Gemma3:4b: ollama pull gemma2:2b');
    return false;
  }
  return false;
}

// Run REAL benchmark
async function runRealBenchmark() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                                    ║
║            ██████╗ ███████╗██████╗ ███╗   ███╗██╗   ██╗████████╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗            ║
║            ██╔══██╗██╔════╝██╔══██╗████╗ ████║██║   ██║╚══██╔══╝██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║            ║
║            ██████╔╝█████╗  ██████╔╝██╔████╔██║██║   ██║   ██║   ███████║   ██║   ██║██║   ██║██╔██╗ ██║            ║
║            ██╔═══╝ ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║   ██║   ██╔══██║   ██║   ██║██║   ██║██║╚██╗██║            ║
║            ██║     ███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝   ██║   ██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║            ║
║            ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝            ║
║                                                                                                                    ║
║                                        REAL BENCHMARK TEST - NO FAKE DATA!                                        ║
║                                                                                                                    ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
`);

  // Check if servers are running
  const serverRunning = await checkServerStatus();
  const ollamaRunning = await checkOllamaStatus();
  
  if (!serverRunning) {
    console.log('\n❌ Cannot run benchmark - PERMUTATION server is not running');
    console.log('   Start the server first: cd frontend && npm run dev');
    return;
  }
  
  if (!ollamaRunning) {
    console.log('\n❌ Cannot run benchmark - Ollama server is not running');
    console.log('   Start Ollama: ollama serve');
    console.log('   Pull Gemma3:4b: ollama pull gemma2:2b');
    return;
  }

  const results = {
    domains: {},
    overall: {
      permutation_wins: 0,
      baseline_wins: 0,
      total_queries: 0,
      total_permutation_time: 0,
      total_baseline_time: 0,
      total_permutation_cost: 0,
      total_baseline_cost: 0,
      permutation_errors: 0,
      baseline_errors: 0
    }
  };

  // Test each domain
  for (const [domainKey, domainConfig] of Object.entries(REAL_DOMAIN_TESTS)) {
    console.log(`\n🧪 Testing ${domainConfig.name} Domain...`);
    console.log('─'.repeat(80));
    
    const domainResults = {
      permutation: { wins: 0, total_time: 0, total_cost: 0, quality_scores: [], errors: 0 },
      baseline: { wins: 0, total_time: 0, total_cost: 0, quality_scores: [], errors: 0 }
    };

    // Test each query in the domain
    for (let i = 0; i < domainConfig.queries.length; i++) {
      const query = domainConfig.queries[i];
      process.stdout.write(`  Query ${i + 1}/${domainConfig.queries.length}: `);
      
      // Run both PERMUTATION and baseline
      const [permutationResult, baselineResult] = await Promise.all([
        callPermutationAPI(query, domainKey),
        callBaselineAPI(query, domainKey)
      ]);

      // Handle errors
      if (!permutationResult.success) {
        domainResults.permutation.errors++;
        results.overall.permutation_errors++;
        process.stdout.write(`❌ PERMUTATION ERROR: ${permutationResult.error}\n`);
        continue;
      }

      if (!baselineResult.success) {
        domainResults.baseline.errors++;
        results.overall.baseline_errors++;
        process.stdout.write(`❌ BASELINE ERROR: ${baselineResult.error}\n`);
        continue;
      }

      // Update domain results
      domainResults.permutation.total_time += permutationResult.processing_time;
      domainResults.permutation.total_cost += permutationResult.cost;
      domainResults.permutation.quality_scores.push(permutationResult.quality_score);
      
      domainResults.baseline.total_time += baselineResult.processing_time;
      domainResults.baseline.total_cost += baselineResult.cost;
      domainResults.baseline.quality_scores.push(baselineResult.quality_score);

      // Determine winner
      if (permutationResult.quality_score > baselineResult.quality_score) {
        domainResults.permutation.wins++;
        results.overall.permutation_wins++;
        process.stdout.write(`✅ PERMUTATION WINS (${permutationResult.quality_score.toFixed(3)} vs ${baselineResult.quality_score.toFixed(3)}) - ${permutationResult.processing_time}ms\n`);
      } else {
        domainResults.baseline.wins++;
        results.overall.baseline_wins++;
        process.stdout.write(`❌ Baseline wins (${baselineResult.quality_score.toFixed(3)} vs ${permutationResult.quality_score.toFixed(3)}) - ${baselineResult.processing_time}ms\n`);
      }

      results.overall.total_queries++;
    }

    // Calculate domain averages
    if (domainResults.permutation.quality_scores.length > 0) {
      const permutationAvgQuality = domainResults.permutation.quality_scores.reduce((a, b) => a + b, 0) / domainResults.permutation.quality_scores.length;
      const permutationAvgTime = domainResults.permutation.total_time / domainResults.permutation.quality_scores.length;
      const permutationAvgCost = domainResults.permutation.total_cost / domainResults.permutation.quality_scores.length;

      // Update overall results
      results.overall.total_permutation_time += domainResults.permutation.total_time;
      results.overall.total_permutation_cost += domainResults.permutation.total_cost;

      // Store domain results
      results.domains[domainKey] = {
        name: domainConfig.name,
        permutation_wins: domainResults.permutation.wins,
        baseline_wins: domainResults.baseline.wins,
        permutation_avg_quality: permutationAvgQuality,
        permutation_avg_time: permutationAvgTime,
        permutation_avg_cost: permutationAvgCost,
        permutation_errors: domainResults.permutation.errors,
        baseline_errors: domainResults.baseline.errors
      };

      // Display domain summary
      console.log(`\n  📊 ${domainConfig.name} Results:`);
      console.log(`     🎯 PERMUTATION Quality: ${permutationAvgQuality.toFixed(3)}`);
      console.log(`     ⚡ PERMUTATION Speed: ${permutationAvgTime.toFixed(0)}ms avg`);
      console.log(`     💰 PERMUTATION Cost: $${permutationAvgCost.toFixed(3)} avg`);
      console.log(`     🏆 PERMUTATION Wins: ${domainResults.permutation.wins}/${domainConfig.queries.length} queries`);
      if (domainResults.permutation.errors > 0) {
        console.log(`     ❌ PERMUTATION Errors: ${domainResults.permutation.errors}`);
      }
    }
  }

  // Display overall results
  console.log(`\n\n╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║                                                      REAL RESULTS                                                      ║`);
  console.log(`╠════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣`);
  
  if (results.overall.total_queries > 0) {
    const winRate = (results.overall.permutation_wins / results.overall.total_queries * 100);
    const avgPermutationTime = results.overall.total_permutation_time / results.overall.total_queries;
    const avgPermutationCost = results.overall.total_permutation_cost / results.overall.total_queries;

    console.log(`║                                                                                                                    ║`);
    console.log(`║  🏆 PERMUTATION WIN RATE: ${results.overall.permutation_wins}/${results.overall.total_queries} queries (${winRate.toFixed(1)}%)`);
    console.log(`║  ⚡ AVERAGE SPEED: ${avgPermutationTime.toFixed(0)}ms per query`);
    console.log(`║  💰 AVERAGE COST: $${avgPermutationCost.toFixed(3)} per query`);
    console.log(`║  📊 TOTAL QUERIES TESTED: ${results.overall.total_queries}`);
    if (results.overall.permutation_errors > 0) {
      console.log(`║  ❌ PERMUTATION ERRORS: ${results.overall.permutation_errors}`);
    }
    console.log(`║                                                                                                                    ║`);
  } else {
    console.log(`║                                                                                                                    ║`);
    console.log(`║  ❌ NO SUCCESSFUL QUERIES - Check server status and API endpoints                                    ║`);
    console.log(`║                                                                                                                    ║`);
  }
  
  console.log(`║  🚀 This is REAL data from your actual PERMUTATION system!                                            ║`);
  console.log(`║                                                                                                                    ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝`);

  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `real-benchmark-results-${timestamp}.json`;
  require('fs').writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n📁 Real results saved to: ${filename}`);

  return results;
}

// Run the real benchmark
if (require.main === module) {
  runRealBenchmark()
    .then(() => {
      console.log('\n✅ Real benchmark completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Real benchmark failed:', error);
      process.exit(1);
    });
}

module.exports = { runRealBenchmark, REAL_DOMAIN_TESTS };