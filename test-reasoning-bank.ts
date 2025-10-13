/**
 * Test ReasoningBank Integration
 * Demonstrates memory cycle and MaTTS
 */

import ArcMemoReasoningBank, { Experience } from './frontend/lib/arcmemo-reasoning-bank';

async function testReasoningBank() {
  console.log("\n" + "=".repeat(80));
  console.log("🧠 TESTING REASONING BANK INTEGRATION");
  console.log("=".repeat(80) + "\n");
  
  const reasoningBank = new ArcMemoReasoningBank();
  
  // =========================================================================
  // 1. CREATE MOCK EXPERIENCES (SUCCESS & FAILURE)
  // =========================================================================
  
  console.log("📝 Creating mock experiences...\n");
  
  const successExperience: Experience = {
    taskId: "task_001",
    query: "Find the total amount on invoice",
    domain: "financial",
    steps: [
      {
        thought: "I need to find the invoice total. Let me look for 'Total' or 'Grand Total' label.",
        action: "search('Grand Total')",
        observation: "Found: Grand Total: $1,245.50",
        timestamp: new Date()
      },
      {
        thought: "Perfect! I found the grand total. Let me extract the amount.",
        action: "extract('$1,245.50')",
        observation: "Extracted: 1245.50",
        timestamp: new Date()
      }
    ],
    success: true,
    finalResult: { amount: 1245.50, currency: "USD" }
  };
  
  const failureExperience: Experience = {
    taskId: "task_002",
    query: "Find the total amount on invoice",
    domain: "financial",
    steps: [
      {
        thought: "Looking for the total amount...",
        action: "search('Total')",
        observation: "Found: Subtotal: $1,100.00",
        timestamp: new Date()
      },
      {
        thought: "Found a total, extracting it.",
        action: "extract('$1,100.00')",
        observation: "Extracted: 1100.00",
        timestamp: new Date()
      }
    ],
    success: false,
    finalResult: { amount: 1100.00, currency: "USD" },
    selfJudgment: {
      success: false,
      reasoning: "Extracted subtotal instead of grand total",
      confidence: 0.8
    }
  };
  
  // =========================================================================
  // 2. EXTRACT MEMORIES FROM EXPERIENCES
  // =========================================================================
  
  console.log("🔄 Extracting memories from SUCCESS experience...\n");
  const successMemories = await reasoningBank.extractMemoryFromExperience(successExperience);
  console.log(`✅ Extracted ${successMemories.length} memory items from success`);
  successMemories.forEach(m => {
    console.log(`   - ${m.title} (${m.abstractionLevel})`);
  });
  
  console.log("\n🔄 Extracting memories from FAILURE experience...\n");
  const failureMemories = await reasoningBank.extractMemoryFromExperience(failureExperience);
  console.log(`⚠️  Extracted ${failureMemories.length} memory items from failure`);
  failureMemories.forEach(m => {
    console.log(`   - ${m.title} (${m.abstractionLevel})`);
  });
  
  // =========================================================================
  // 3. CONSOLIDATE MEMORIES
  // =========================================================================
  
  console.log("\n💾 Consolidating memories into ReasoningBank...\n");
  await reasoningBank.consolidateMemories([...successMemories, ...failureMemories]);
  console.log("✅ Memories consolidated");
  
  // =========================================================================
  // 4. RETRIEVE RELEVANT MEMORIES
  // =========================================================================
  
  console.log("\n🔍 Retrieving relevant memories for new task...\n");
  const newQuery = "Extract invoice grand total";
  const retrieved = await reasoningBank.retrieveRelevantMemories(newQuery, "financial", 3);
  
  console.log(`Found ${retrieved.length} relevant memories:`);
  retrieved.forEach((m, i) => {
    console.log(`\n${i + 1}. ${m.title}`);
    console.log(`   Source: ${m.createdFrom === "success" ? "✅ Success" : "⚠️ Failure"}`);
    console.log(`   Level: ${m.abstractionLevel}`);
    console.log(`   Description: ${m.description}`);
  });
  
  // =========================================================================
  // 5. MATTS PARALLEL SCALING
  // =========================================================================
  
  console.log("\n" + "=".repeat(80));
  console.log("🔬 TESTING MATTS PARALLEL SCALING (k=3)");
  console.log("=".repeat(80) + "\n");
  
  const parallelResult = await reasoningBank.mattsParallelScaling(
    "Find customer's first order date",
    "ecommerce",
    3
  );
  
  console.log("📊 Parallel Scaling Results:");
  console.log(`   Trajectories generated: ${parallelResult.allExperiences.length}`);
  console.log(`   Memories extracted: ${parallelResult.newMemories.length}`);
  console.log(`   Best result: ${JSON.stringify(parallelResult.bestResult)}`);
  
  // =========================================================================
  // 6. MATTS SEQUENTIAL SCALING
  // =========================================================================
  
  console.log("\n" + "=".repeat(80));
  console.log("🔬 TESTING MATTS SEQUENTIAL SCALING (k=3)");
  console.log("=".repeat(80) + "\n");
  
  const sequentialResult = await reasoningBank.mattsSequentialScaling(
    "Extract all line items from invoice",
    "financial",
    3
  );
  
  console.log("📊 Sequential Scaling Results:");
  console.log(`   Refinement steps: ${sequentialResult.allExperiences.length}`);
  console.log(`   Memories extracted: ${sequentialResult.newMemories.length}`);
  console.log(`   Final result: ${JSON.stringify(sequentialResult.finalResult)}`);
  
  // =========================================================================
  // 7. MEMORY BANK STATISTICS
  // =========================================================================
  
  console.log("\n" + "=".repeat(80));
  console.log("📊 MEMORY BANK STATISTICS");
  console.log("=".repeat(80) + "\n");
  
  const stats = reasoningBank.getMemoryStats();
  console.log("Memory Bank Stats:");
  console.log(`   Total memories: ${stats.total}`);
  console.log(`   By domain:`, stats.byDomain);
  console.log(`   By source:`, stats.bySource);
  console.log(`   By level:`, stats.byLevel);
  console.log(`   Avg success rate: ${(stats.avgSuccessRate * 100).toFixed(1)}%`);
  
  // =========================================================================
  // 8. EMERGENT EVOLUTION TRACKING
  // =========================================================================
  
  console.log("\n" + "=".repeat(80));
  console.log("🔄 EMERGENT EVOLUTION TRACKING");
  console.log("=".repeat(80) + "\n");
  
  const evolutions = await reasoningBank.trackEmergentEvolution();
  
  if (evolutions.length > 0) {
    console.log("Detected strategy evolutions:");
    evolutions.forEach((evo, i) => {
      console.log(`\n${i + 1}. ${evo.from}`);
      console.log(`   → ${evo.to}`);
      console.log(`   Type: ${evo.evolutionType}`);
    });
  } else {
    console.log("No evolutions detected yet (need more experiences)");
    console.log("\nNote: Evolution emerges naturally over time as strategies mature:");
    console.log("  procedural → adaptive → compositional");
  }
  
  // =========================================================================
  // SUMMARY
  // =========================================================================
  
  console.log("\n" + "=".repeat(80));
  console.log("✅ REASONING BANK TEST COMPLETE");
  console.log("=".repeat(80) + "\n");
  
  console.log("Key Features Demonstrated:");
  console.log("  ✅ Structured memory extraction (Title + Description + Content)");
  console.log("  ✅ Learning from failures (not just successes)");
  console.log("  ✅ Memory retrieval with relevance ranking");
  console.log("  ✅ MaTTS Parallel scaling (self-contrast)");
  console.log("  ✅ MaTTS Sequential scaling (self-refinement)");
  console.log("  ✅ Emergent evolution tracking");
  console.log("  ✅ Memory consolidation with merging");
  
  console.log("\n📈 Expected Performance Gains (from paper):");
  console.log("  - Structured memory: +4.0%");
  console.log("  - Learning from failures: +3.2%");
  console.log("  - MaTTS (k=5): +5.4%");
  console.log("  - Total improvement: +8.3% ✅");
  
  console.log("\n🎯 Next Steps:");
  console.log("  1. Integrate with /api/arcmemo/reasoning-bank");
  console.log("  2. Connect to Ax DSPy for real execution");
  console.log("  3. Use GEPA for memory extraction");
  console.log("  4. Combine with IRT for evaluation");
  console.log("  5. Track emergent evolution over time");
  
  console.log("\n" + "=".repeat(80) + "\n");
}

// Run test
testReasoningBank().catch(console.error);

