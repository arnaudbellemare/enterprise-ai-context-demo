const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

async function testSpecializedAgents() {
  console.log('\n🤖 SPECIALIZED AGENTS BENCHMARK TEST\n');
  console.log('='  .repeat(70));
  
  const tests = [
    {
      name: 'Trend Researcher',
      agent: 'trend_researcher',
      inputs: {
        industry: 'AI/Machine Learning',
        timeframe: 'Q1 2025',
        sources: ['tech blogs', 'research papers']
      }
    },
    {
      name: 'TikTok Strategist',
      agent: 'tiktok_strategist',
      inputs: {
        brand_context: 'B2B SaaS productivity tool',
        target_audience: 'Gen Z professionals',
        campaign_goals: 'brand awareness'
      }
    },
    {
      name: 'Growth Hacker',
      agent: 'growth_hacker',
      inputs: {
        product_stage: 'early growth',
        current_metrics: '1000 MAU, 5% activation',
        growth_goal: '10x users in 6 months',
        constraints: 'limited budget'
      }
    },
    {
      name: 'Support Responder',
      agent: 'support_responder',
      inputs: {
        support_ticket: "Can't sync my data across devices",
        customer_context: 'Premium user, iOS + Windows',
        knowledge_base: ['Sync troubleshooting guide']
      }
    },
    {
      name: 'Analytics Reporter',
      agent: 'analytics_reporter',
      inputs: {
        metrics_data: 'January 2025 product metrics',
        reporting_period: 'monthly',
        stakeholder_audience: 'executive team'
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  let totalTime = 0;
  
  for (const test of tests) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE}/api/ax-dspy/specialized-agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: test.agent,
          inputs: test.inputs,
          provider: 'ollama'
        })
      });
      
      const duration = Date.now() - startTime;
      totalTime += duration;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`\n✅ ${test.name}`);
        console.log(`   Agent: ${test.agent}`);
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Domain: ${data.domain}`);
        console.log(`   Output keys: ${Object.keys(data.outputs || {}).length}`);
        passed++;
      } else {
        console.log(`\n❌ ${test.name}`);
        console.log(`   Status: ${response.status}`);
        const error = await response.text();
        console.log(`   Error: ${error.substring(0, 100)}`);
        failed++;
      }
    } catch (error) {
      console.log(`\n❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 SPECIALIZED AGENTS BENCHMARK RESULTS\n');
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  console.log(`⏱️  Total Time: ${totalTime}ms`);
  console.log(`📈 Avg Time: ${Math.round(totalTime / tests.length)}ms per agent`);
  console.log(`🎯 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log('\n' + '='.repeat(70) + '\n');
}

testSpecializedAgents().catch(console.error);
