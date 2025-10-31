/**
 * Baseline Results Analyzer
 * 
 * Analyzes baseline test results to identify:
 * - Which query types perform best
 * - Performance patterns
 * - Bottlenecks
 * - Optimal configuration recommendations
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface BaselineResult {
  queryId: string;
  query: string;
  category: string;
  complexity: string;
  success: boolean;
  latency: number;
  accuracy: number;
  faithfulness: number;
  completeness: number;
  error?: string;
}

class BaselineAnalyzer {
  private results: BaselineResult[] = [];

  async loadResults(): Promise<void> {
    const logPath = join(process.cwd(), 'test-baseline-results.log');
    
    if (!existsSync(logPath)) {
      console.log('⚠️  No baseline results file found. Waiting for test to complete...');
      return;
    }

    try {
      const content = readFileSync(logPath, 'utf-8');
      // Parse log file (simplified - adjust based on actual format)
      console.log(`📊 Loaded baseline results (${content.length} chars)`);
      // TODO: Parse actual results format
    } catch (error: any) {
      console.error(`Error loading results: ${error.message}`);
    }
  }

  analyzeResults(): void {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 BASELINE RESULTS ANALYSIS');
    console.log('═'.repeat(80));

    // Group by category
    const byCategory = this.groupByCategory();
    this.analyzeByCategory(byCategory);

    // Group by complexity
    const byComplexity = this.groupByComplexity();
    this.analyzeByComplexity(byComplexity);

    // Performance patterns
    this.analyzePerformancePatterns();

    // Recommendations
    this.generateRecommendations();
  }

  private groupByCategory(): Map<string, BaselineResult[]> {
    const grouped = new Map<string, BaselineResult[]>();
    
    for (const result of this.results) {
      const category = result.category || 'unknown';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(result);
    }
    
    return grouped;
  }

  private groupByComplexity(): Map<string, BaselineResult[]> {
    const grouped = new Map<string, BaselineResult[]>();
    
    for (const result of this.results) {
      const complexity = result.complexity || 'unknown';
      if (!grouped.has(complexity)) {
        grouped.set(complexity, []);
      }
      grouped.get(complexity)!.push(result);
    }
    
    return grouped;
  }

  private analyzeByCategory(grouped: Map<string, BaselineResult[]>): void {
    console.log('\n📋 Performance by Query Category:');
    console.log('─'.repeat(80));

    for (const [category, results] of grouped.entries()) {
      const successful = results.filter(r => r.success).length;
      const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
      const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
      const avgFaithfulness = results.reduce((sum, r) => sum + r.faithfulness, 0) / results.length;
      const avgCompleteness = results.reduce((sum, r) => sum + r.completeness, 0) / results.length;

      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  ✅ Success Rate: ${successful}/${results.length} (${(successful/results.length*100).toFixed(1)}%)`);
      console.log(`  ⏱️  Avg Latency: ${avgLatency.toFixed(0)}ms`);
      console.log(`  🎯 Avg Accuracy: ${(avgAccuracy*100).toFixed(1)}%`);
      console.log(`  📝 Avg Faithfulness: ${(avgFaithfulness*100).toFixed(1)}%`);
      console.log(`  ✅ Avg Completeness: ${(avgCompleteness*100).toFixed(1)}%`);
    }
  }

  private analyzeByComplexity(grouped: Map<string, BaselineResult[]>): void {
    console.log('\n📊 Performance by Complexity:');
    console.log('─'.repeat(80));

    const complexities = ['low', 'medium', 'high', 'very_high'];
    
    for (const complexity of complexities) {
      const results = grouped.get(complexity) || [];
      if (results.length === 0) continue;

      const successful = results.filter(r => r.success).length;
      const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
      const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;

      console.log(`\n${complexity.toUpperCase()}:`);
      console.log(`  ✅ Success Rate: ${successful}/${results.length}`);
      console.log(`  ⏱️  Avg Latency: ${avgLatency.toFixed(0)}ms`);
      console.log(`  🎯 Avg Accuracy: ${(avgAccuracy*100).toFixed(1)}%`);
    }
  }

  private analyzePerformancePatterns(): void {
    console.log('\n🔍 Performance Patterns:');
    console.log('─'.repeat(80));

    // Identify best performing queries
    const successful = this.results.filter(r => r.success);
    if (successful.length === 0) {
      console.log('  ⚠️  No successful results to analyze');
      return;
    }

    // Best accuracy
    const bestAccuracy = successful.reduce((best, r) => 
      r.accuracy > best.accuracy ? r : best
    );
    console.log(`\n  🏆 Best Accuracy: ${(bestAccuracy.accuracy*100).toFixed(1)}%`);
    console.log(`     Query: ${bestAccuracy.query.substring(0, 80)}...`);
    console.log(`     Category: ${bestAccuracy.category}, Complexity: ${bestAccuracy.complexity}`);

    // Fastest
    const fastest = successful.reduce((fastest, r) => 
      r.latency < fastest.latency ? r : fastest
    );
    console.log(`\n  ⚡ Fastest: ${fastest.latency}ms`);
    console.log(`     Query: ${fastest.query.substring(0, 80)}...`);
    console.log(`     Category: ${fastest.category}, Complexity: ${fastest.complexity}`);

    // Failed queries
    const failed = this.results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log(`\n  ❌ Failed Queries: ${failed.length}`);
      for (const result of failed) {
        console.log(`     - ${result.queryId}: ${result.error || 'Unknown error'}`);
      }
    }
  }

  private generateRecommendations(): void {
    console.log('\n💡 Recommendations:');
    console.log('─'.repeat(80));

    const byCategory = this.groupByCategory();
    
    // SRL recommendations
    const multiStep = byCategory.get('multi_step') || [];
    if (multiStep.length > 0) {
      const avgAccuracy = multiStep.reduce((sum, r) => sum + r.accuracy, 0) / multiStep.length;
      if (avgAccuracy < 0.75) {
        console.log('\n  ✅ RECOMMEND: SRL Enhancement for Multi-Step Queries');
        console.log(`     Current avg accuracy: ${(avgAccuracy*100).toFixed(1)}%`);
        console.log(`     Expected improvement: +10-25% with SRL supervision`);
      }
    }

    // EBM recommendations
    const refinement = byCategory.get('refinement') || [];
    const verification = byCategory.get('verification') || [];
    const allRefinement = [...refinement, ...verification];
    
    if (allRefinement.length > 0) {
      const avgCompleteness = allRefinement.reduce((sum, r) => sum + r.completeness, 0) / allRefinement.length;
      if (avgCompleteness < 0.80) {
        console.log('\n  ✅ RECOMMEND: EBM Refinement for Verification/Refinement Queries');
        console.log(`     Current avg completeness: ${(avgCompleteness*100).toFixed(1)}%`);
        console.log(`     Expected improvement: +15-30% with EBM refinement`);
      }
    }

    // Combined approach
    const multiStepSuccess = multiStep.filter(r => r.success).length;
    const refinementSuccess = allRefinement.filter(r => r.success).length;
    
    if (multiStepSuccess > 0 && refinementSuccess > 0) {
      console.log('\n  ✅ RECOMMEND: Combined SRL + EBM for Complex Multi-Step Queries');
      console.log(`     Best quality approach for publication-grade outputs`);
    }
  }

  async run(): Promise<void> {
    await this.loadResults();
    
    if (this.results.length === 0) {
      console.log('\n⚠️  No results loaded. Baseline test may still be running.');
      console.log('   Run this analyzer after baseline test completes.\n');
      return;
    }

    this.analyzeResults();
  }
}

// Run analyzer
async function main() {
  const analyzer = new BaselineAnalyzer();
  await analyzer.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export { BaselineAnalyzer };

