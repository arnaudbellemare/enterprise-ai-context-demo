/**
 * Enhanced Unified Pipeline Integration Test
 * 
 * Tests the complete system with a complex query to verify:
 * - All 12 layers execute
 * - Components integrate properly
 * - Performance is acceptable
 * - Quality is maintained
 */

async function testEnhancedPipeline() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                  ║');
  console.log('║  ENHANCED UNIFIED PIPELINE - INTEGRATION TEST                    ║');
  console.log('║  Testing complete system with complex art valuation query        ║');
  console.log('║                                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();
  
  try {
    // Import the enhanced pipeline
    const { enhancedPipeline } = await import('./frontend/lib/enhanced-unified-pipeline.js');
    
    console.log('✓ Enhanced pipeline imported successfully\n');
    
    // ============================================================
    // TEST 1: COMPLEX ART VALUATION QUERY
    // ============================================================
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('TEST 1: Complex Art Valuation Query');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    const complexQuery = `
      I need a comprehensive valuation for an Art Deco platinum bracelet by Cartier, 
      circa 1925. The piece features geometric design with high-quality diamonds 
      (approximately 8.5 carats total weight, G-H color, VS clarity) and calibré-cut 
      sapphires (approximately 4.2 carats). The bracelet measures 7 inches in length, 
      0.75 inches in width, and weighs 45.2 grams.
      
      Provenance: Acquired from Christie's New York, Important Jewels Sale, 
      May 15, 1985, Lot 245. Private European collection 1985-2023. 
      Complete documentation and original sales receipt included.
      
      Condition: Excellent original condition. Minimal wear consistent with age. 
      All stones original and secure. Platinum shows light surface wear only. 
      Original fitted box in very good condition. All hallmarks clear: 
      'Cartier Paris' with French platinum marks.
      
      Please provide: estimated fair market value, confidence level, comparable sales 
      analysis, market trends, authentication assessment, and recommendations for 
      buyer/seller.
    `.trim();
    
    const context = {
      type: 'art_valuation',
      provenance: {
        acquisition_date: '1985-05-15',
        source: 'Christies New York',
        lot_number: 245,
        documentation: 'complete'
      },
      item_details: {
        maker: 'Cartier',
        period: 'Art Deco',
        year: 1925,
        materials: ['platinum', 'diamonds', 'sapphires'],
        weight_grams: 45.2,
        dimensions: {
          length_inches: 7,
          width_inches: 0.75
        }
      },
      stones: {
        diamonds: {
          weight_carats: 8.5,
          color: 'G-H',
          clarity: 'VS'
        },
        sapphires: {
          weight_carats: 4.2,
          cut: 'calibré'
        }
      },
      condition: 'excellent',
      original_box: true
    };
    
    console.log('Query:', complexQuery.substring(0, 100) + '...');
    console.log('Domain: art');
    console.log('Context size:', JSON.stringify(context).length, 'bytes\n');
    
    console.log('Executing enhanced pipeline...\n');
    
    // Execute the pipeline
    const result = await enhancedPipeline.execute(
      complexQuery,
      'art',
      context
    );
    
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('TEST 1: RESULTS');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    // Analyze results
    console.log('✓ Execution completed successfully\n');
    
    console.log('METADATA:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`Domain: ${result.metadata.domain}`);
    console.log(`Difficulty: ${result.metadata.difficulty.toFixed(3)}`);
    console.log(`Quality Score: ${result.metadata.quality_score.toFixed(3)}`);
    console.log(`Confidence: ${result.metadata.confidence.toFixed(3)}`);
    console.log(`Skill Used: ${result.metadata.skill_used || 'dynamic pipeline'}\n`);
    
    console.log('PERFORMANCE:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`Total Time: ${result.metadata.performance.total_time_ms}ms`);
    console.log(`Layers Executed: ${result.metadata.performance.component_count}/12`);
    console.log(`Token Savings: ${result.metadata.performance.token_savings_percent.toFixed(1)}%`);
    console.log(`Cost Estimate: $${result.metadata.performance.cost_estimate.toFixed(4)}`);
    console.log(`Teacher Calls: ${result.metadata.performance.teacher_calls}`);
    console.log(`Student Calls: ${result.metadata.performance.student_calls}`);
    console.log(`RLM Calls: ${result.metadata.performance.rlm_calls}\n`);
    
    console.log('SEMIOTIC ANALYSIS:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`Zone: ${result.metadata.semiotic.zone}`);
    console.log(`Transitions: ${result.metadata.semiotic.transitions}`);
    console.log(`Coherence: ${result.metadata.semiotic.coherence.toFixed(3)}`);
    console.log(`Fidelity: ${result.metadata.semiotic.fidelity.toFixed(3)}\n`);
    
    console.log('KV CACHE:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`Continual Learning: ${result.metadata.kv_cache.continual_enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`Inference Compression: ${result.metadata.kv_cache.inference_enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`Compression Ratio: ${result.metadata.kv_cache.compression_ratio}x`);
    console.log(`Memory Saved: ${result.metadata.kv_cache.memory_saved_mb.toFixed(1)}MB\n`);
    
    console.log('LAYERS EXECUTED:');
    console.log('─────────────────────────────────────────────────────────────────');
    result.trace.layers.forEach(layer => {
      const statusIcon = layer.status === 'success' ? '✓' : 
                        layer.status === 'skipped' ? '○' : '✗';
      console.log(`${statusIcon} Layer ${layer.layer}: ${layer.name} (${layer.duration_ms}ms)`);
      console.log(`  Status: ${layer.status}`);
      console.log(`  Components: ${layer.components_used.join(', ')}`);
      console.log(`  Output: ${layer.output_summary}`);
      if (layer.status === 'success') {
        console.log(`  ✓ Success`);
      } else if (layer.status === 'skipped') {
        console.log(`  ○ Skipped (not needed for this query)`);
      }
      console.log('');
    });
    
    console.log('ANSWER:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(result.answer.substring(0, 500) + '...\n');
    
    // ============================================================
    // TEST 2: PERFORMANCE METRICS
    // ============================================================
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('TEST 2: Performance Metrics');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    const metrics = enhancedPipeline.getPerformanceMetrics();
    
    console.log('PIPELINE STATISTICS:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`Total Executions: ${metrics.executions}`);
    console.log(`Average Time: ${metrics.avg_time_ms.toFixed(0)}ms`);
    console.log(`Average Quality: ${metrics.avg_quality.toFixed(3)}`);
    console.log(`Enabled Components: ${metrics.enabled_components.length}`);
    console.log(`Optimization Mode: ${metrics.config.optimizationMode}\n`);
    
    console.log('COMPONENTS:');
    console.log('─────────────────────────────────────────────────────────────────');
    metrics.enabled_components.forEach((component, idx) => {
      console.log(`${idx + 1}. ${component}`);
    });
    console.log('');
    
    // ============================================================
    // TEST 3: QUALITY CHECKS
    // ============================================================
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('TEST 3: Quality Checks');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    const checks = {
      'Quality Score > 0.5': result.metadata.quality_score > 0.5,
      'Confidence > 0.5': result.metadata.confidence > 0.5,
      'Answer generated': result.answer && result.answer.length > 0,
      'All layers tracked': result.trace.layers.length === 12,
      'At least 6 layers executed': result.trace.layers.filter(l => l.status === 'success').length >= 6,
      'Execution time < 10s': result.metadata.performance.total_time_ms < 10000,
      'Semiotic zone identified': result.metadata.semiotic.zone !== 'unknown',
      'KV cache configured': result.metadata.kv_cache.continual_enabled || result.metadata.kv_cache.inference_enabled
    };
    
    let passedChecks = 0;
    let totalChecks = Object.keys(checks).length;
    
    console.log('QUALITY CHECKS:');
    console.log('─────────────────────────────────────────────────────────────────');
    Object.entries(checks).forEach(([check, passed]) => {
      const icon = passed ? '✓' : '✗';
      const status = passed ? 'PASS' : 'FAIL';
      console.log(`${icon} ${check}: ${status}`);
      if (passed) passedChecks++;
    });
    console.log('');
    console.log(`Quality Score: ${passedChecks}/${totalChecks} checks passed (${((passedChecks/totalChecks)*100).toFixed(0)}%)\n`);
    
    // ============================================================
    // FINAL SUMMARY
    // ============================================================
    const totalTime = Date.now() - startTime;
    
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                  ║');
    console.log('║  TEST SUMMARY                                                    ║');
    console.log('║                                                                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');
    
    console.log(`✓ Enhanced Pipeline Integration Test: ${passedChecks === totalChecks ? 'PASSED' : 'PARTIAL'}`);
    console.log(`✓ Quality Checks: ${passedChecks}/${totalChecks} passed`);
    console.log(`✓ Total Test Time: ${totalTime}ms`);
    console.log(`✓ Pipeline Execution Time: ${result.metadata.performance.total_time_ms}ms`);
    console.log(`✓ Layers Executed: ${result.metadata.performance.component_count}/12`);
    console.log(`✓ Quality Score: ${result.metadata.quality_score.toFixed(3)}`);
    console.log(`✓ Token Savings: ${result.metadata.performance.token_savings_percent.toFixed(1)}%`);
    console.log('');
    
    if (passedChecks === totalChecks) {
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log('🎉 ALL TESTS PASSED! Enhanced pipeline working correctly! 🎉');
      console.log('═══════════════════════════════════════════════════════════════════\n');
      
      return {
        success: true,
        result,
        metrics,
        checksPassedCount: passedChecks,
        totalChecks,
        testDurationMs: totalTime
      };
    } else {
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log('⚠️  SOME TESTS FAILED - Review results above');
      console.log('═══════════════════════════════════════════════════════════════════\n');
      
      return {
        success: false,
        result,
        metrics,
        checksPassedCount: passedChecks,
        totalChecks,
        testDurationMs: totalTime,
        failedChecks: Object.entries(checks).filter(([_, passed]) => !passed).map(([check]) => check)
      };
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:\n');
    console.error(error);
    console.error('\nStack trace:');
    console.error(error.stack);
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// Run the test
testEnhancedPipeline()
  .then(testResult => {
    if (testResult.success) {
      console.log('✅ Integration test completed successfully\n');
      process.exit(0);
    } else {
      console.log('⚠️  Integration test completed with issues\n');
      if (testResult.failedChecks) {
        console.log('Failed checks:', testResult.failedChecks);
      }
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });

