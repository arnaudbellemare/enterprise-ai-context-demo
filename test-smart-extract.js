/**
 * Test Smart Extract - Compare Knowledge Graph vs LangStruct routing
 */

const testCases = [
  {
    name: "Simple Team Chat",
    text: "Sarah is working on the AI project.",
    complexity: "LOW",
    expectedMethod: "Knowledge Graph",
    reasoning: "Simple sentence, basic entities"
  },
  {
    name: "Medium Project Update",
    text: "The Q3 2024 Sales Dashboard project is 80% complete. Dr. Smith is leading the analytics module while Sarah handles the frontend with React and TypeScript.",
    complexity: "MEDIUM",
    expectedMethod: "Knowledge Graph",
    reasoning: "Multiple entities but straightforward structure"
  },
  {
    name: "Complex Document",
    text: "Invoice #INV-2024-0045 dated January 15, 2024, from Acme Corporation (123 Business St, San Francisco, CA 94105) to TechStart Inc. for professional services rendered during Q4 2023. Total amount: $12,450.75 (including $2,245.75 in taxes). Payment terms: Net 30 days. Items: (1) Consulting Services - 80 hours @ $125/hr = $10,000; (2) Travel Expenses = $2,450.75. Authorized by: John Smith, CFO.",
    complexity: "HIGH",
    expectedMethod: "LangStruct",
    reasoning: "Complex nested data, multiple field types, requires structured extraction"
  },
  {
    name: "Very Complex Medical Record",
    text: "Patient: Jane Doe (DOB: 03/15/1985, MRN: 12345678). Chief Complaint: Progressive dyspnea on exertion for 3 months. History: 38-year-old female presents with worsening shortness of breath, initially with moderate exertion, now with minimal activity. Associated symptoms include orthopnea (3 pillows), paroxysmal nocturnal dyspnea, bilateral lower extremity edema. Past Medical History: Type 2 Diabetes Mellitus (2015), Hypertension (2018). Medications: Metformin 1000mg BID, Lisinopril 20mg daily. Vitals: BP 145/92, HR 98, RR 22, SpO2 94% on room air. Physical Exam: JVP elevated at 12 cm, bilateral basilar crackles, 2+ pitting edema to mid-shin. Assessment: Acute decompensated heart failure, likely systolic dysfunction. Plan: Admit to telemetry, IV furosemide 40mg, echocardiogram, BNP, troponin, CXR.",
    complexity: "VERY HIGH",
    expectedMethod: "LangStruct",
    reasoning: "Medical terminology, complex nested fields, requires high accuracy"
  }
];

async function testSmartExtract() {
  console.log('\n🧪 SMART EXTRACT TEST - Intelligent Routing Demo\n');
  console.log('=' .repeat(80));
  
  console.log('\n📊 Test Configuration:');
  console.log('   • Knowledge Graph: Fast (10-50ms), Free, 70-90% accuracy');
  console.log('   • LangStruct: Slower (200-1000ms), $0.002/call, 95%+ accuracy');
  console.log('   • Smart Router: Auto-detects complexity and chooses best method\n');
  console.log('=' .repeat(80));

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log('-'.repeat(80));
    console.log(`Text: "${testCase.text.substring(0, 100)}${testCase.text.length > 100 ? '...' : ''}"`);
    console.log(`\nExpected Complexity: ${testCase.complexity}`);
    console.log(`Expected Method: ${testCase.expectedMethod}`);
    console.log(`Reasoning: ${testCase.reasoning}\n`);

    try {
      // Call Smart Extract API
      const response = await fetch('http://localhost:3000/api/smart-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testCase.text,
          userId: 'test-user',
          options: { autoDetect: true }
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        console.log('✅ EXTRACTION SUCCESSFUL');
        console.log(`\n   Method Used: ${result.method}`);
        console.log(`   Complexity Score: ${(result.complexity.score * 100).toFixed(1)}%`);
        console.log(`   Routing Decision: ${result.complexity.reasoning}`);
        console.log(`\n   Performance:`);
        console.log(`      • Time: ${result.performance.processing_time_ms}ms`);
        console.log(`      • Cost: $${result.performance.estimated_cost.toFixed(4)}`);
        console.log(`      • Speed: ${result.performance.speed}`);
        console.log(`\n   Extraction Results:`);
        console.log(`      • Entities: ${result.entities.length}`);
        console.log(`      • Relationships: ${result.relationships.length}`);
        console.log(`      • Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        
        // Show complexity factors
        console.log(`\n   Complexity Factors:`);
        console.log(`      • Text Length: ${(result.complexity.factors.textLength * 100).toFixed(1)}%`);
        console.log(`      • Sentence Complexity: ${(result.complexity.factors.sentenceComplexity * 100).toFixed(1)}%`);
        console.log(`      • Entity Variety: ${(result.complexity.factors.entityVariety * 100).toFixed(1)}%`);
        console.log(`      • Schema Complexity: ${(result.complexity.factors.schemaComplexity * 100).toFixed(1)}%`);

        // Show first few entities
        if (result.entities.length > 0) {
          console.log(`\n   Sample Entities:`);
          result.entities.slice(0, 3).forEach((entity, idx) => {
            console.log(`      ${idx + 1}. ${entity.type || entity.name}: ${entity.name || entity.type}`);
          });
          if (result.entities.length > 3) {
            console.log(`      ... and ${result.entities.length - 3} more`);
          }
        }

        // Verify routing decision
        const methodMatches = result.method.includes('Knowledge Graph') 
          ? 'Knowledge Graph' 
          : 'LangStruct';
        
        if (methodMatches === testCase.expectedMethod) {
          console.log(`\n   ✅ ROUTING CORRECT: Used ${methodMatches} as expected`);
        } else {
          console.log(`\n   ⚠️  ROUTING DIFFERS: Used ${methodMatches}, expected ${testCase.expectedMethod}`);
        }

      } else {
        console.log(`❌ EXTRACTION FAILED: ${response.status} ${response.statusText}`);
        const error = await response.text();
        console.log(`   Error: ${error}`);
      }

    } catch (error) {
      console.log(`❌ REQUEST FAILED: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
  }

  // Summary
  console.log('\n\n📊 TEST SUMMARY\n');
  console.log('=' .repeat(80));
  console.log('\nSmart Extract intelligently routes between:');
  console.log('\n1. 🚀 Knowledge Graph (Simple extractions)');
  console.log('   • Speed: 10-50ms');
  console.log('   • Cost: FREE');
  console.log('   • Accuracy: 70-90%');
  console.log('   • Best for: Team chats, project updates, simple documents');
  
  console.log('\n2. 🎯 LangStruct (Complex extractions)');
  console.log('   • Speed: 200-1000ms');
  console.log('   • Cost: $0.002/extraction');
  console.log('   • Accuracy: 95%+');
  console.log('   • Best for: Invoices, medical records, legal documents');
  
  console.log('\n3. 🧠 Smart Routing (Auto-detect)');
  console.log('   • Analyzes text complexity');
  console.log('   • Chooses optimal method');
  console.log('   • Falls back gracefully');
  console.log('   • Saves cost while maintaining accuracy');
  
  console.log('\n💡 Complexity Scoring:');
  console.log('   • 0-0.3: Simple → Knowledge Graph');
  console.log('   • 0.3-0.5: Medium → Knowledge Graph');
  console.log('   • 0.5-0.7: Complex → LangStruct');
  console.log('   • 0.7-1.0: Very Complex → LangStruct');
  
  console.log('\n✅ Test complete!\n');
  console.log('=' .repeat(80) + '\n');
}

// Run test
testSmartExtract().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});

