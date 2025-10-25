const { perplexityTeacher } = require('./lib/perplexity-teacher');

async function testPerplexityTeacher() {
  console.log('🧪 Testing Perplexity Teacher directly...');
  
  try {
    const result = await perplexityTeacher.lookupMarketData(
      'Vincent van Gogh',
      ['Oil on Canvas'],
      '1889'
    );
    
    console.log('✅ Perplexity Teacher Result:');
    console.log('Data points:', result.length);
    console.log('First data point:', result[0]);
    console.log('Source:', result[0]?.source);
    
  } catch (error) {
    console.error('❌ Perplexity Teacher failed:', error);
  }
}

testPerplexityTeacher();
