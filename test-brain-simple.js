/**
 * Simple Brain Diagnostic Test
 * Tests brain route with a very simple query to verify basic functionality
 */

const API_BASE = 'http://localhost:3000';

async function testSimpleQuery() {
  console.log('Testing brain route with simple query...\n');

  const simpleQuery = {
    query: 'What is 2 + 2?',
    domain: 'general'
  };

  console.log(`Query: "${simpleQuery.query}"`);
  console.log(`Domain: ${simpleQuery.domain}\n`);

  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE}/api/brain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simpleQuery)
    });

    const duration = Date.now() - startTime;
    console.log(`Response time: ${duration}ms`);
    console.log(`HTTP Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const text = await response.text();
      console.log('ERROR Response body:');
      console.log(text.substring(0, 500));
      return;
    }

    const data = await response.json();

    console.log('✅ SUCCESS!');
    console.log(`\nSuccess: ${data.success}`);
    console.log(`Query: ${data.query}`);
    console.log(`Domain: ${data.domain}`);
    console.log(`Skills activated: ${data.brain_processing?.activated_skills?.length || 0}`);
    console.log(`Skills list: ${data.brain_processing?.activated_skills?.join(', ') || 'none'}`);
    console.log(`Synthesis method: ${data.brain_processing?.synthesis_method}`);
    console.log(`System type: ${data.metadata?.system || 'original'}`);
    console.log(`Response length: ${data.response?.length || 0} chars`);

    if (data.response) {
      console.log(`\nFirst 200 chars of response:`);
      console.log(data.response.substring(0, 200) + '...');
    }

  } catch (error) {
    console.log('❌ EXCEPTION:', error.message);
    console.log(error);
  }
}

testSimpleQuery();
