#!/usr/bin/env node

/**
 * Test PERMUTATION Lite Streaming API
 * 
 * Tests the streaming endpoint that returns initial answers immediately
 * then streams RVS refinement updates
 */

const query = process.argv[2] || "What should be the insurance premium on a painting of Alec Monopoly?";
const domain = process.argv[3] || "art";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testStreaming() {
  console.log('🚀 Testing PERMUTATION Lite Streaming API');
  console.log(`Query: "${query}"`);
  console.log(`Domain: ${domain}`);
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${baseUrl}/api/permutation-lite/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        domain,
        config: {
          enableOptimization: true,
          enableLearning: true,
          enableVerification: true,
          enableTeacherStudent: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Read SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
          continue;
        }
        if (line.startsWith('data: ') && eventType) {
          try {
            const data = JSON.parse(line.slice(6));
            handleEvent(eventType, data);
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('fetch failed')) {
      console.error('\n⚠️  Server not running. Start it with:');
      console.error('   cd frontend && npm run dev');
    }
    process.exit(1);
  }
}

let eventType = '';
let initialAnswer = '';

function handleEvent(event, data) {
  switch (event) {
    case 'initial_answer':
      initialAnswer = data.answer; // Store for comparison
      console.log('\n✅ INITIAL ANSWER (Returned Immediately - From Teacher-Student):');
      console.log('─'.repeat(60));
      console.log(data.answer);
      console.log(`\n📊 Initial Answer Metadata:`, {
        domain: data.metadata.domain,
        confidence: `${(data.metadata.confidence * 100).toFixed(0)}%`,
        status: data.metadata.status,
        length: `${data.answer.length} characters`,
        source: 'Teacher-Student System (Perplexity + Local Gemma)',
      });
      console.log('─'.repeat(60));
      console.log('⏳ RVS refinement in progress...\n');
      break;

    case 'refinement_progress':
      process.stdout.write(`\r🔄 RVS Progress: ${data.iteration}/${data.totalIterations} (${data.status}) - Confidence: ${(data.confidence * 100).toFixed(0)}%     `);
      break;

    case 'refined_answer':
      console.log('\n\n✅ REFINED ANSWER (RVS Complete - Final Answer):');
      console.log('─'.repeat(60));
      console.log(data.answer);
      console.log('\n📊 Refinement & Verification Details:');
      console.log(`   ✓ Verified: ${data.metadata.verified ? 'YES ✅ - RVS verified answer as correct' : 'NO ⚠️ - RVS confidence below threshold (may still be correct)'}`);
      console.log(`   ✓ Confidence: ${(data.metadata.confidence * 100).toFixed(0)}% ${data.metadata.confidence >= 0.75 ? '✅ (Good)' : data.metadata.confidence >= 0.60 ? '⚠️ (Moderate)' : '❌ (Low)'}`);
      console.log(`   ✓ Iterations: ${data.metadata.iterations} (${data.metadata.iterations >= 12 ? 'Full verification' : 'Reduced verification'})`);
      console.log(`   ✓ Improvement: ${data.metadata.refinement_improvement ? 'YES - Answer was improved by RVS' : 'NO - Answer was already optimal'}`);
      console.log(`   ✓ Answer Length: ${data.answer.length} characters ${initialAnswer ? `(${data.answer.length > initialAnswer.length ? '+' : data.answer.length < initialAnswer.length ? '-' : '='}${Math.abs(data.answer.length - initialAnswer.length)} vs initial)` : ''}`);
      
      // Compare initial vs refined
      if (initialAnswer && data.answer !== initialAnswer) {
        const similarity = calculateSimilarity(initialAnswer, data.answer);
        console.log(`   ✓ Similarity: ${(similarity * 100).toFixed(0)}% between initial and refined answers`);
      }
      
      // Answer quality assessment
      const hasCitations = (data.answer.match(/\[\d+\]/g) || []).length > 0;
      const hasTables = data.answer.includes('|');
      const hasStructure = (data.answer.match(/^#{1,3}\s/mg) || []).length > 0;
      console.log(`\n📝 Answer Quality Indicators:`);
      console.log(`   ${hasCitations ? '✅' : '❌'} Citations: ${hasCitations ? 'Present' : 'Missing'}`);
      console.log(`   ${hasTables ? '✅' : '❌'} Tables: ${hasTables ? 'Present' : 'Missing'}`);
      console.log(`   ${hasStructure ? '✅' : '❌'} Structure: ${hasStructure ? 'Present (headers)' : 'Missing'}`);
      console.log(`   ${data.answer.length > 1000 ? '✅' : '⚠️'} Length: ${data.answer.length > 2000 ? 'Comprehensive' : data.answer.length > 1000 ? 'Moderate' : 'Short'}`);
      
      console.log(`\n💡 Verification Status: ${data.metadata.verified ? '✅ VERIFIED - RVS confirms answer meets quality threshold' : '⚠️ CHECKED - RVS reviewed answer but verification may require domain expert validation'}`);
      break;

    case 'complete':
      console.log('\n\n✅ STREAMING COMPLETE');
      console.log('─'.repeat(60));
      console.log(`Total Time: ${data.result.metadata.performance.total_time_ms}ms`);
      console.log(`Quality Score: ${data.result.metadata.quality_score.toFixed(3)}`);
      console.log(`Layers: ${data.result.metadata.layers_executed.join(' → ')}`);
      break;

    case 'error':
      console.error('\n❌ Error:', data.error);
      break;
  }
}

// Check server health first
async function checkServer() {
  try {
    const response = await fetch(`${baseUrl}/api/permutation-lite`, { method: 'GET' });
    if (!response.ok) throw new Error('Server not ready');
    return true;
  } catch (error) {
    console.error('⚠️  Server health check failed. Is the server running?');
    console.error('   Start with: cd frontend && npm run dev');
    process.exit(1);
  }
}

// Simple similarity calculation (for comparison display)
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

checkServer().then(() => testStreaming());

