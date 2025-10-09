/**
 * COMPREHENSIVE TEST: LangStruct vs Knowledge Graph
 * Tests accuracy, speed, and usability
 */

const testCases = [
  {
    name: "Team Collaboration",
    text: "Sarah is working on the AI optimization project with John. They're implementing machine learning algorithms to improve efficiency by 40%.",
    expectedEntities: {
      people: ["Sarah", "John"],
      projects: ["AI optimization project"],
      concepts: ["machine learning", "algorithms", "efficiency"]
    },
    expectedRelationships: [
      { source: "Sarah", target: "AI optimization project", type: "works_on" },
      { source: "John", target: "AI optimization project", type: "works_on" },
      { source: "Sarah", target: "John", type: "collaborates_with" }
    ]
  },
  {
    name: "Project Status",
    text: "The Sales Dashboard project is 80% complete. Dr. Smith is leading the analytics module while the frontend team handles the UI components.",
    expectedEntities: {
      people: ["Dr. Smith"],
      projects: ["Sales Dashboard project"],
      concepts: ["analytics", "UI components"]
    },
    expectedRelationships: [
      { source: "Dr. Smith", target: "analytics module", type: "leads" }
    ]
  },
  {
    name: "Technical Discussion",
    text: "We need to implement RAG with vector embeddings. The knowledge graph will use pgvector for similarity search.",
    expectedEntities: {
      concepts: ["RAG", "vector embeddings", "knowledge graph", "pgvector", "similarity search"]
    },
    expectedRelationships: [
      { source: "RAG", target: "vector embeddings", type: "uses" },
      { source: "knowledge graph", target: "pgvector", type: "uses" }
    ]
  }
];

async function testLangStruct(testCase) {
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/langstruct/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: testCase.text,
        schema: {
          entities: { type: 'array' },
          relationships: { type: 'array' },
          metrics: { type: 'object' }
        },
        refine: true
      })
    });
    
    const processingTime = Date.now() - startTime;
    const data = await response.json();
    
    return {
      success: response.ok,
      processingTime,
      data,
      entities: data.data?.entities || [],
      relationships: data.data?.relationships || [],
      confidence: data.confidence || 0,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      processingTime: Date.now() - startTime,
      error: error.message,
      entities: [],
      relationships: [],
      confidence: 0
    };
  }
}

async function testKnowledgeGraph(testCase) {
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/entities/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: testCase.text,
        userId: 'test-user',
        options: { minConfidence: 0.6 }
      })
    });
    
    const processingTime = Date.now() - startTime;
    const data = await response.json();
    
    return {
      success: response.ok,
      processingTime,
      data,
      entities: data.entities || [],
      relationships: data.relationships || [],
      confidence: data.metrics?.avg_entity_confidence || 0,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      processingTime: Date.now() - startTime,
      error: error.message,
      entities: [],
      relationships: [],
      confidence: 0
    };
  }
}

function calculateAccuracy(result, expected) {
  const scores = {
    people: 0,
    projects: 0,
    concepts: 0,
    relationships: 0
  };
  
  // Score people extraction
  if (expected.people) {
    const foundPeople = result.entities.filter(e => 
      e.type === 'person' || e.type === 'Person'
    ).map(e => e.name?.toLowerCase() || e);
    
    expected.people.forEach(person => {
      if (foundPeople.some(fp => 
        typeof fp === 'string' ? fp.includes(person.toLowerCase()) : false
      )) {
        scores.people += 1;
      }
    });
    scores.people = scores.people / expected.people.length;
  }
  
  // Score projects
  if (expected.projects) {
    const foundProjects = result.entities.filter(e => 
      e.type === 'project' || e.type === 'Project'
    ).map(e => e.name?.toLowerCase() || e);
    
    expected.projects.forEach(project => {
      if (foundProjects.some(fp => 
        typeof fp === 'string' ? fp.includes(project.toLowerCase()) : false
      )) {
        scores.projects += 1;
      }
    });
    scores.projects = expected.projects.length > 0 ? scores.projects / expected.projects.length : 1;
  }
  
  // Score concepts
  if (expected.concepts) {
    const foundConcepts = result.entities.filter(e => 
      e.type === 'concept' || e.type === 'Concept'
    ).map(e => e.name?.toLowerCase() || e);
    
    expected.concepts.forEach(concept => {
      if (foundConcepts.some(fc => 
        typeof fc === 'string' ? fc.includes(concept.toLowerCase()) : false
      )) {
        scores.concepts += 1;
      }
    });
    scores.concepts = expected.concepts.length > 0 ? scores.concepts / expected.concepts.length : 1;
  }
  
  // Score relationships (simplified - just count)
  if (expected.relationships) {
    scores.relationships = result.relationships.length > 0 ? 
      Math.min(result.relationships.length / expected.relationships.length, 1) : 0;
  }
  
  // Overall accuracy
  const overallAccuracy = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
  
  return {
    scores,
    overallAccuracy
  };
}

async function runComparison() {
  console.log('\n🔬 LANGSTRUCT vs KNOWLEDGE GRAPH - COMPREHENSIVE TEST\n');
  console.log('=' .repeat(80));
  
  const results = {
    langstruct: {
      totalTime: 0,
      totalAccuracy: 0,
      successCount: 0,
      failCount: 0,
      details: []
    },
    knowledgeGraph: {
      totalTime: 0,
      totalAccuracy: 0,
      successCount: 0,
      failCount: 0,
      details: []
    }
  };
  
  for (const testCase of testCases) {
    console.log(`\n📝 Test Case: ${testCase.name}`);
    console.log('-'.repeat(80));
    console.log(`Text: "${testCase.text.substring(0, 100)}..."`);
    
    // Test LangStruct
    console.log('\n🧠 Testing LangStruct...');
    const langstructResult = await testLangStruct(testCase);
    
    if (langstructResult.success) {
      const accuracy = calculateAccuracy(langstructResult, testCase.expectedEntities);
      results.langstruct.totalTime += langstructResult.processingTime;
      results.langstruct.totalAccuracy += accuracy.overallAccuracy;
      results.langstruct.successCount++;
      
      console.log(`✅ Success`);
      console.log(`   Time: ${langstructResult.processingTime}ms`);
      console.log(`   Entities: ${langstructResult.entities.length}`);
      console.log(`   Relationships: ${langstructResult.relationships.length}`);
      console.log(`   Confidence: ${(langstructResult.confidence * 100).toFixed(1)}%`);
      console.log(`   Accuracy: ${(accuracy.overallAccuracy * 100).toFixed(1)}%`);
      console.log(`   Breakdown:`, accuracy.scores);
      
      results.langstruct.details.push({
        testCase: testCase.name,
        time: langstructResult.processingTime,
        accuracy: accuracy.overallAccuracy,
        entities: langstructResult.entities.length,
        relationships: langstructResult.relationships.length
      });
    } else {
      results.langstruct.failCount++;
      console.log(`❌ Failed: ${langstructResult.error}`);
    }
    
    // Test Knowledge Graph
    console.log('\n📊 Testing Knowledge Graph...');
    const kgResult = await testKnowledgeGraph(testCase);
    
    if (kgResult.success) {
      const accuracy = calculateAccuracy(kgResult, testCase.expectedEntities);
      results.knowledgeGraph.totalTime += kgResult.processingTime;
      results.knowledgeGraph.totalAccuracy += accuracy.overallAccuracy;
      results.knowledgeGraph.successCount++;
      
      console.log(`✅ Success`);
      console.log(`   Time: ${kgResult.processingTime}ms`);
      console.log(`   Entities: ${kgResult.entities.length}`);
      console.log(`   Relationships: ${kgResult.relationships.length}`);
      console.log(`   Confidence: ${(kgResult.confidence * 100).toFixed(1)}%`);
      console.log(`   Accuracy: ${(accuracy.overallAccuracy * 100).toFixed(1)}%`);
      console.log(`   Breakdown:`, accuracy.scores);
      
      results.knowledgeGraph.details.push({
        testCase: testCase.name,
        time: kgResult.processingTime,
        accuracy: accuracy.overallAccuracy,
        entities: kgResult.entities.length,
        relationships: kgResult.relationships.length
      });
    } else {
      results.knowledgeGraph.failCount++;
      console.log(`❌ Failed: ${kgResult.error}`);
    }
    
    console.log('\n' + '='.repeat(80));
  }
  
  // Final Comparison
  console.log('\n\n📊 FINAL RESULTS\n');
  console.log('=' .repeat(80));
  
  console.log('\n🧠 LANGSTRUCT:');
  console.log(`   Success Rate: ${results.langstruct.successCount}/${testCases.length} (${(results.langstruct.successCount/testCases.length*100).toFixed(1)}%)`);
  console.log(`   Avg Time: ${(results.langstruct.totalTime / results.langstruct.successCount).toFixed(0)}ms`);
  console.log(`   Avg Accuracy: ${(results.langstruct.totalAccuracy / results.langstruct.successCount * 100).toFixed(1)}%`);
  
  console.log('\n📊 KNOWLEDGE GRAPH:');
  console.log(`   Success Rate: ${results.knowledgeGraph.successCount}/${testCases.length} (${(results.knowledgeGraph.successCount/testCases.length*100).toFixed(1)}%)`);
  console.log(`   Avg Time: ${(results.knowledgeGraph.totalTime / results.knowledgeGraph.successCount).toFixed(0)}ms`);
  console.log(`   Avg Accuracy: ${(results.knowledgeGraph.totalAccuracy / results.knowledgeGraph.successCount * 100).toFixed(1)}%`);
  
  // Comparison
  console.log('\n🏆 WINNER ANALYSIS:\n');
  
  const speedWinner = results.langstruct.totalTime < results.knowledgeGraph.totalTime ? 'LangStruct' : 'Knowledge Graph';
  const accuracyWinner = results.langstruct.totalAccuracy > results.knowledgeGraph.totalAccuracy ? 'LangStruct' : 'Knowledge Graph';
  const reliabilityWinner = results.langstruct.successCount > results.knowledgeGraph.successCount ? 'LangStruct' : 'Knowledge Graph';
  
  const speedDiff = Math.abs(results.langstruct.totalTime - results.knowledgeGraph.totalTime);
  const accuracyDiff = Math.abs(results.langstruct.totalAccuracy - results.knowledgeGraph.totalAccuracy);
  
  console.log(`⚡ Speed: ${speedWinner} is ${speedDiff.toFixed(0)}ms faster`);
  console.log(`🎯 Accuracy: ${accuracyWinner} is ${(accuracyDiff * 100).toFixed(1)}% more accurate`);
  console.log(`✅ Reliability: ${reliabilityWinner} succeeded more often`);
  
  // Calculate overall winner
  let langstructScore = 0;
  let kgScore = 0;
  
  if (speedWinner === 'LangStruct') langstructScore++;
  else kgScore++;
  
  if (accuracyWinner === 'LangStruct') langstructScore++;
  else kgScore++;
  
  if (reliabilityWinner === 'LangStruct') langstructScore++;
  else kgScore++;
  
  console.log('\n' + '='.repeat(80));
  console.log('\n🏆 OVERALL WINNER:');
  
  if (langstructScore > kgScore) {
    console.log(`\n   🥇 LANGSTRUCT (Score: ${langstructScore}/3)`);
    console.log(`   \n   Recommendation: Keep LangStruct, remove Knowledge Graph`);
  } else if (kgScore > langstructScore) {
    console.log(`\n   🥇 KNOWLEDGE GRAPH (Score: ${kgScore}/3)`);
    console.log(`   \n   Recommendation: Keep Knowledge Graph, remove LangStruct`);
  } else {
    console.log(`\n   🤝 TIE (Score: ${langstructScore}/3 each)`);
    console.log(`   \n   Recommendation: Keep both, they serve different purposes`);
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Detailed breakdown
  console.log('\n📈 DETAILED BREAKDOWN:\n');
  
  console.log('LangStruct Results:');
  results.langstruct.details.forEach(d => {
    console.log(`   ${d.testCase}: ${d.time}ms, ${(d.accuracy * 100).toFixed(1)}% accuracy, ${d.entities} entities, ${d.relationships} relationships`);
  });
  
  console.log('\nKnowledge Graph Results:');
  results.knowledgeGraph.details.forEach(d => {
    console.log(`   ${d.testCase}: ${d.time}ms, ${(d.accuracy * 100).toFixed(1)}% accuracy, ${d.entities} entities, ${d.relationships} relationships`);
  });
  
  console.log('\n');
  
  return {
    winner: langstructScore > kgScore ? 'langstruct' : (kgScore > langstructScore ? 'knowledge_graph' : 'tie'),
    langstructScore,
    kgScore,
    results
  };
}

// Run the test
runComparison().then(result => {
  console.log('\n✅ Test complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});

