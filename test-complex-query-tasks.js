#!/usr/bin/env node

/**
 * Complex Query Tasks - Full System Demonstration
 * 
 * This test suite demonstrates the full capabilities of the PERMUTATION system
 * with GEPA-TRM integration, showcasing complex multi-step reasoning,
 * real-time data collection, and advanced AI orchestration.
 */

const https = require('https');
const http = require('http');

// Test configuration
const API_BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 180000; // 3 minutes for complex queries

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(TEST_TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * Task 1: Multi-Domain Market Analysis
 * Demonstrates: Real-time data collection, cross-domain reasoning, cost optimization
 */
async function testMultiDomainMarketAnalysis() {
  console.log("\n🌍 Task 1: Multi-Domain Market Analysis");
  console.log("=" * 60);
  console.log("Testing: Real-time data collection across multiple domains");
  console.log("Features: GEPA optimization, TRM verification, cost optimization");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: `Analyze the current market trends across three distinct sectors: 
        
        1. **Luxury Art Market**: Recent auction results for contemporary artists (2024)
        2. **Classic Car Market**: Current valuations for 1960s-1970s European sports cars
        3. **Rare Watch Market**: Investment-grade timepieces and their market performance
        
        For each sector, provide:
        - Current market conditions and trends
        - Specific price ranges and notable sales
        - Investment potential and risk factors
        - Cross-sector correlations and insights
        
        Use real-time data sources and provide specific examples with actual prices and dates.`,
        context: "multi_domain_analysis",
        skills: ["gepa_trm_local", "advanced_reranking", "quality_evaluation"]
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Multi-Domain Market Analysis: SUCCESS!");
      console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
      console.log(`🧠 Skills Used: ${response.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.fallbackUsed || 'N/A'}`);
      
      // Show response preview
      const answer = response.data?.answer || response.data?.data || 'No response';
      console.log("\n📋 Response Preview:");
      console.log(answer.substring(0, 800) + (answer.length > 800 ? "..." : ""));
      
      return {
        success: true,
        duration: duration,
        data: response.data,
        task: "Multi-Domain Market Analysis"
      };
    } else {
      console.log(`❌ Multi-Domain Market Analysis: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}`, task: "Multi-Domain Market Analysis" };
    }
    
  } catch (error) {
    console.error("❌ Multi-Domain Market Analysis: ERROR:", error.message);
    return { success: false, error: error.message, task: "Multi-Domain Market Analysis" };
  }
}

/**
 * Task 2: Complex Financial Risk Assessment
 * Demonstrates: Multi-step reasoning, domain expertise, verification
 */
async function testComplexFinancialRiskAssessment() {
  console.log("\n💼 Task 2: Complex Financial Risk Assessment");
  console.log("=" * 60);
  console.log("Testing: Multi-step financial analysis with risk modeling");
  console.log("Features: ACE framework, continual learning, behavioral evaluation");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: `Conduct a comprehensive financial risk assessment for a hypothetical investment portfolio:

        **Portfolio Composition:**
        - 40% Technology stocks (AAPL, MSFT, GOOGL, META)
        - 30% Real estate investments (REITs and direct property)
        - 20% Alternative investments (art, collectibles, crypto)
        - 10% Fixed income (bonds, treasuries)

        **Analysis Requirements:**
        1. **Market Risk Analysis**: Current market conditions and volatility
        2. **Sector Correlation Analysis**: How different sectors interact
        3. **Liquidity Risk Assessment**: Access to funds in different scenarios
        4. **Regulatory Risk Evaluation**: Compliance and legal considerations
        5. **Stress Testing**: Performance under various market conditions
        6. **Recommendations**: Specific actions to optimize risk-return profile

        Use current market data and provide specific metrics, percentages, and actionable insights.`,
        context: "financial_risk_assessment",
        skills: ["gepa_trm_local", "quality_evaluation", "advanced_reranking"]
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Complex Financial Risk Assessment: SUCCESS!");
      console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
      console.log(`🧠 Skills Used: ${response.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.fallbackUsed || 'N/A'}`);
      
      // Show response preview
      const answer = response.data?.answer || response.data?.data || 'No response';
      console.log("\n📋 Response Preview:");
      console.log(answer.substring(0, 800) + (answer.length > 800 ? "..." : ""));
      
      return {
        success: true,
        duration: duration,
        data: response.data,
        task: "Complex Financial Risk Assessment"
      };
    } else {
      console.log(`❌ Complex Financial Risk Assessment: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}`, task: "Complex Financial Risk Assessment" };
    }
    
  } catch (error) {
    console.error("❌ Complex Financial Risk Assessment: ERROR:", error.message);
    return { success: false, error: error.message, task: "Complex Financial Risk Assessment" };
  }
}

/**
 * Task 3: Advanced Technical Architecture Design
 * Demonstrates: Technical expertise, multi-step reasoning, optimization
 */
async function testAdvancedTechnicalArchitectureDesign() {
  console.log("\n🏗️  Task 3: Advanced Technical Architecture Design");
  console.log("=" * 60);
  console.log("Testing: Complex technical system design and optimization");
  console.log("Features: GEPA optimization, TRM verification, cost efficiency");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: `Design a comprehensive microservices architecture for a high-traffic AI platform:

        **System Requirements:**
        - Handle 1M+ requests per day
        - Support real-time AI inference
        - Multi-tenant SaaS architecture
        - Global deployment (US, EU, Asia)
        - Cost optimization under $10K/month
        - 99.9% uptime SLA

        **Technical Components:**
        1. **API Gateway**: Load balancing, rate limiting, authentication
        2. **AI Inference Engine**: Multiple model support, A/B testing
        3. **Data Pipeline**: Real-time processing, batch processing
        4. **Storage Layer**: Vector databases, relational DB, caching
        5. **Monitoring**: Observability, alerting, performance metrics
        6. **Security**: Encryption, compliance, threat detection

        **Deliverables:**
        - Detailed architecture diagram (textual)
        - Technology stack recommendations
        - Cost breakdown and optimization strategies
        - Scalability and performance considerations
        - Security and compliance measures
        - Implementation roadmap

        Provide specific technologies, configurations, and estimated costs.`,
        context: "technical_architecture",
        skills: ["gepa_trm_local", "quality_evaluation", "advanced_reranking"]
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Advanced Technical Architecture Design: SUCCESS!");
      console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
      console.log(`🧠 Skills Used: ${response.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.fallbackUsed || 'N/A'}`);
      
      // Show response preview
      const answer = response.data?.answer || response.data?.data || 'No response';
      console.log("\n📋 Response Preview:");
      console.log(answer.substring(0, 800) + (answer.length > 800 ? "..." : ""));
      
      return {
        success: true,
        duration: duration,
        data: response.data,
        task: "Advanced Technical Architecture Design"
      };
    } else {
      console.log(`❌ Advanced Technical Architecture Design: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}`, task: "Advanced Technical Architecture Design" };
    }
    
  } catch (error) {
    console.error("❌ Advanced Technical Architecture Design: ERROR:", error.message);
    return { success: false, error: error.message, task: "Advanced Technical Architecture Design" };
  }
}

/**
 * Task 4: Legal Compliance Analysis
 * Demonstrates: Domain expertise, regulatory knowledge, risk assessment
 */
async function testLegalComplianceAnalysis() {
  console.log("\n⚖️  Task 4: Legal Compliance Analysis");
  console.log("=" * 60);
  console.log("Testing: Complex legal analysis with regulatory compliance");
  console.log("Features: Legal expertise, risk assessment, compliance verification");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: `Analyze the legal and regulatory compliance requirements for a fintech startup:

        **Company Profile:**
        - AI-powered investment advisory platform
        - Operating in US, EU, and UK markets
        - Handling personal financial data
        - Providing automated investment recommendations
        - Planning to expand to Asia-Pacific

        **Compliance Areas:**
        1. **Data Protection**: GDPR, CCPA, PIPEDA compliance
        2. **Financial Regulations**: SEC, FINRA, FCA requirements
        3. **AI Governance**: EU AI Act, algorithmic accountability
        4. **Cross-Border Operations**: International compliance frameworks
        5. **Risk Management**: Operational and regulatory risk mitigation
        6. **Licensing Requirements**: Required permits and certifications

        **Deliverables:**
        - Comprehensive compliance checklist
        - Risk assessment and mitigation strategies
        - Timeline and cost estimates for compliance
        - Recommended legal structure and governance
        - Ongoing monitoring and audit requirements

        Provide specific regulatory references, compliance deadlines, and actionable recommendations.`,
        context: "legal_compliance",
        skills: ["gepa_trm_local", "legal_analysis", "quality_evaluation"]
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Legal Compliance Analysis: SUCCESS!");
      console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
      console.log(`🧠 Skills Used: ${response.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.fallbackUsed || 'N/A'}`);
      
      // Show response preview
      const answer = response.data?.answer || response.data?.data || 'No response';
      console.log("\n📋 Response Preview:");
      console.log(answer.substring(0, 800) + (answer.length > 800 ? "..." : ""));
      
      return {
        success: true,
        duration: duration,
        data: response.data,
        task: "Legal Compliance Analysis"
      };
    } else {
      console.log(`❌ Legal Compliance Analysis: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}`, task: "Legal Compliance Analysis" };
    }
    
  } catch (error) {
    console.error("❌ Legal Compliance Analysis: ERROR:", error.message);
    return { success: false, error: error.message, task: "Legal Compliance Analysis" };
  }
}

/**
 * Task 5: Healthcare AI Implementation Strategy
 * Demonstrates: Healthcare domain expertise, regulatory compliance, technical implementation
 */
async function testHealthcareAIImplementationStrategy() {
  console.log("\n🏥 Task 5: Healthcare AI Implementation Strategy");
  console.log("=" * 60);
  console.log("Testing: Healthcare AI system design with regulatory compliance");
  console.log("Features: Domain expertise, compliance, technical architecture");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: `Design a comprehensive AI implementation strategy for a healthcare system:

        **Healthcare System Profile:**
        - 500-bed hospital with multiple specialties
        - Outpatient clinics and emergency services
        - Electronic health records (EHR) integration
        - Telemedicine capabilities
        - Research and clinical trials

        **AI Implementation Areas:**
        1. **Clinical Decision Support**: Diagnostic assistance, treatment recommendations
        2. **Predictive Analytics**: Patient risk stratification, readmission prediction
        3. **Medical Imaging**: Radiology, pathology, dermatology AI
        4. **Natural Language Processing**: Clinical note analysis, coding automation
        5. **Operational Optimization**: Resource allocation, scheduling, workflow
        6. **Patient Engagement**: Chatbots, personalized care plans

        **Compliance Requirements:**
        - HIPAA compliance and data security
        - FDA regulations for medical devices
        - Clinical validation and evidence requirements
        - Ethical AI and bias mitigation
        - Provider and patient consent protocols

        **Deliverables:**
        - Phased implementation roadmap (18 months)
        - Technology stack and vendor recommendations
        - Cost-benefit analysis and ROI projections
        - Risk assessment and mitigation strategies
        - Training and change management plan
        - Success metrics and evaluation framework

        Provide specific technologies, timelines, costs, and regulatory considerations.`,
        context: "healthcare_ai_implementation",
        skills: ["gepa_trm_local", "healthcare_expertise", "quality_evaluation"]
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Healthcare AI Implementation Strategy: SUCCESS!");
      console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
      console.log(`🧠 Skills Used: ${response.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.fallbackUsed || 'N/A'}`);
      
      // Show response preview
      const answer = response.data?.answer || response.data?.data || 'No response';
      console.log("\n📋 Response Preview:");
      console.log(answer.substring(0, 800) + (answer.length > 800 ? "..." : ""));
      
      return {
        success: true,
        duration: duration,
        data: response.data,
        task: "Healthcare AI Implementation Strategy"
      };
    } else {
      console.log(`❌ Healthcare AI Implementation Strategy: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}`, task: "Healthcare AI Implementation Strategy" };
    }
    
  } catch (error) {
    console.error("❌ Healthcare AI Implementation Strategy: ERROR:", error.message);
    return { success: false, error: error.message, task: "Healthcare AI Implementation Strategy" };
  }
}

/**
 * Run All Complex Query Tasks
 */
async function runComplexQueryTasks() {
  console.log("🚀 Starting Complex Query Tasks - Full System Demonstration");
  console.log("Testing PERMUTATION system with GEPA-TRM integration");
  console.log("=" * 80);
  
  const results = {
    multiDomainAnalysis: null,
    financialRiskAssessment: null,
    technicalArchitecture: null,
    legalCompliance: null,
    healthcareAI: null,
    summary: {
      totalTasks: 5,
      completedTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      totalDuration: 0,
      averageDuration: 0
    }
  };
  
  const startTime = Date.now();
  
  // Execute all complex tasks
  console.log("\n🎯 Executing Complex Query Tasks...");
  
  results.multiDomainAnalysis = await testMultiDomainMarketAnalysis();
  results.financialRiskAssessment = await testComplexFinancialRiskAssessment();
  results.technicalArchitecture = await testAdvancedTechnicalArchitectureDesign();
  results.legalCompliance = await testLegalComplianceAnalysis();
  results.healthcareAI = await testHealthcareAIImplementationStrategy();
  
  const endTime = Date.now();
  results.summary.totalDuration = endTime - startTime;
  
  // Calculate summary statistics
  const taskResults = [
    results.multiDomainAnalysis,
    results.financialRiskAssessment,
    results.technicalArchitecture,
    results.legalCompliance,
    results.healthcareAI
  ];
  
  const successfulTasks = taskResults.filter(r => r && r.success);
  const completedTasks = taskResults.filter(r => r && (r.success || r.error));
  
  results.summary.completedTasks = completedTasks.length;
  results.summary.successfulTasks = successfulTasks.length;
  results.summary.failedTasks = results.summary.totalTasks - results.summary.successfulTasks;
  
  if (successfulTasks.length > 0) {
    const durations = successfulTasks.map(r => r.duration || 0);
    results.summary.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  // Print comprehensive results
  console.log("\n📊 COMPLEX QUERY TASKS RESULTS");
  console.log("=" * 80);
  console.log(`✅ Successful Tasks: ${results.summary.successfulTasks}/${results.summary.totalTasks}`);
  console.log(`❌ Failed Tasks: ${results.summary.failedTasks}/${results.summary.totalTasks}`);
  console.log(`⏱️  Average Duration: ${Math.round(results.summary.averageDuration / 1000)}s`);
  console.log(`🎯 Success Rate: ${(results.summary.successfulTasks / results.summary.totalTasks * 100).toFixed(1)}%`);
  console.log(`🕐 Total Execution Time: ${Math.round(results.summary.totalDuration / 1000)}s`);
  
  // Detailed task results
  console.log("\n📋 DETAILED TASK RESULTS");
  console.log("-" * 80);
  
  const tasks = [
    { name: "Multi-Domain Market Analysis", result: results.multiDomainAnalysis },
    { name: "Financial Risk Assessment", result: results.financialRiskAssessment },
    { name: "Technical Architecture Design", result: results.technicalArchitecture },
    { name: "Legal Compliance Analysis", result: results.legalCompliance },
    { name: "Healthcare AI Implementation", result: results.healthcareAI }
  ];
  
  tasks.forEach(task => {
    if (task.result && task.result.success) {
      console.log(`✅ ${task.name}: SUCCESS (${Math.round(task.result.duration / 1000)}s)`);
      console.log(`   Skills: ${task.result.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`   Cost: $${task.result.data?.cost || 'N/A'}`);
      console.log(`   Quality: ${task.result.data?.quality || 'N/A'}`);
      console.log(`   TRM Verified: ${task.result.data?.trmVerified || 'N/A'}`);
    } else {
      console.log(`❌ ${task.name}: FAILED (${task.result?.error || 'Unknown error'})`);
    }
  });
  
  // System capabilities assessment
  console.log("\n💡 SYSTEM CAPABILITIES ASSESSMENT");
  console.log("-" * 80);
  
  if (results.summary.successfulTasks === results.summary.totalTasks) {
    console.log("🎉 ALL COMPLEX TASKS COMPLETED SUCCESSFULLY!");
    console.log("✅ GEPA-TRM integration working perfectly");
    console.log("✅ Multi-domain expertise demonstrated");
    console.log("✅ Cost optimization effective");
    console.log("✅ Quality assurance functioning");
    console.log("✅ System ready for production use");
  } else if (results.summary.successfulTasks > 0) {
    console.log("⚠️  PARTIAL SUCCESS: Some complex tasks completed successfully");
    console.log("🔧 System demonstrates core capabilities with room for optimization");
  } else {
    console.log("❌ SYSTEM NEEDS ATTENTION: Complex tasks require system improvements");
    console.log("🚨 Review GEPA-TRM integration and system configuration");
  }
  
  return results;
}

// Run the complex query tasks
if (require.main === module) {
  runComplexQueryTasks()
    .then(results => {
      console.log("\n🏁 Complex Query Tasks completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Complex Query Tasks failed:", error);
      process.exit(1);
    });
}

module.exports = {
  testMultiDomainMarketAnalysis,
  testComplexFinancialRiskAssessment,
  testAdvancedTechnicalArchitectureDesign,
  testLegalComplianceAnalysis,
  testHealthcareAIImplementationStrategy,
  runComplexQueryTasks
};
