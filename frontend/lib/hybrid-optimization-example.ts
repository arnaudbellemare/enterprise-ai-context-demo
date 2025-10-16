/**
 * 🎯 Hybrid Optimization Example: Customer Service Chatbot
 * 
 * Demonstrates when to use supervised vs unsupervised optimization
 * for different aspects of the same system.
 */

interface CustomerQuery {
  id: string;
  text: string;
  intent?: string;
  entities?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  urgency?: 'low' | 'medium' | 'high';
}

interface ChatbotResponse {
  text: string;
  confidence: number;
  response_type: 'answer' | 'clarification' | 'escalation' | 'greeting';
  helpfulness_score?: number;
  politeness_score?: number;
  completeness_score?: number;
}

/**
 * SUPERVISED OPTIMIZATION: Intent Classification
 * 
 * Use when you have clear, objective answers
 */
class IntentClassifier {
  private trainingData: Array<{query: string, intent: string}> = [
    { query: "I want to cancel my subscription", intent: "cancellation" },
    { query: "How do I reset my password?", intent: "password_reset" },
    { query: "What are your business hours?", intent: "hours_inquiry" },
    { query: "I have a billing question", intent: "billing" },
    { query: "Can I speak to a manager?", intent: "escalation" }
  ];

  async classifyIntent(query: string): Promise<string> {
    // SUPERVISED: Clear right/wrong answers
    // Optimize using exact labels for classification accuracy
    
    console.log(`🎯 SUPERVISED: Classifying intent for "${query}"`);
    
    // Simulate supervised classification
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Find best match from training data
    const bestMatch = this.trainingData.reduce((best, example) => {
      const similarity = this.calculateSimilarity(query, example.query);
      return similarity > (best as any).similarity ? { ...example, similarity } : best;
    }, { query: '', intent: 'unknown', similarity: 0 } as any);
    
    console.log(`   ✅ Intent: ${bestMatch.intent} (confidence: ${(bestMatch.similarity * 100).toFixed(1)}%)`);
    
    return bestMatch.intent;
  }

  private calculateSimilarity(query1: string, query2: string): number {
    // Simple similarity calculation
    const words1 = query1.toLowerCase().split(' ');
    const words2 = query2.toLowerCase().split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }
}

/**
 * UNSUPERVISED OPTIMIZATION: Response Quality
 * 
 * Use when you have subjective quality criteria
 */
class ResponseQualityOptimizer {
  async evaluateResponseQuality(
    query: string, 
    response: string, 
    context: string
  ): Promise<{
    helpfulness: number;
    politeness: number;
    completeness: number;
    overall_score: number;
    reasoning: string;
    suggestions: string[];
  }> {
    // UNSUPERVISED: Subjective quality evaluation
    // Optimize using reward signals, not exact labels
    
    console.log(`🎨 UNSUPERVISED: Evaluating response quality`);
    
    // Simulate LLM-as-a-Judge evaluation
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Analyze response characteristics
    const helpfulness = this.evaluateHelpfulness(query, response);
    const politeness = this.evaluatePoliteness(response);
    const completeness = this.evaluateCompleteness(query, response);
    
    const overall_score = (helpfulness + politeness + completeness) / 3;
    
    const reasoning = this.generateReasoning(helpfulness, politeness, completeness);
    const suggestions = this.generateSuggestions(helpfulness, politeness, completeness);
    
    console.log(`   📊 Overall Quality: ${(overall_score * 100).toFixed(1)}%`);
    console.log(`      Helpfulness: ${(helpfulness * 100).toFixed(1)}%`);
    console.log(`      Politeness: ${(politeness * 100).toFixed(1)}%`);
    console.log(`      Completeness: ${(completeness * 100).toFixed(1)}%`);
    
    return {
      helpfulness,
      politeness,
      completeness,
      overall_score,
      reasoning,
      suggestions
    };
  }

  private evaluateHelpfulness(query: string, response: string): number {
    // Check if response addresses the query
    const queryWords = query.toLowerCase().split(' ');
    const responseWords = response.toLowerCase().split(' ');
    const relevance = queryWords.filter(word => responseWords.includes(word)).length / queryWords.length;
    
    // Check for actionable information
    const hasActionWords = /\b(can|will|should|try|do|use|click|go|visit)\b/i.test(response);
    
    // Check for specific details vs generic responses
    const isSpecific = response.length > 50 && !response.includes('I understand') && !response.includes('I apologize');
    
    return Math.min(1.0, 0.3 + (relevance * 0.4) + (hasActionWords ? 0.2 : 0) + (isSpecific ? 0.1 : 0));
  }

  private evaluatePoliteness(response: string): number {
    // Check for polite language
    const politeWords = /\b(please|thank you|appreciate|sorry|apologize|helpful|glad)\b/i.test(response);
    const hasGreeting = /\b(hello|hi|good|welcome)\b/i.test(response);
    const isCourteous = !/\b(no|can't|won't|impossible|wrong)\b/i.test(response) || 
                       response.includes('but') || response.includes('however');
    
    return Math.min(1.0, 0.4 + (politeWords ? 0.3 : 0) + (hasGreeting ? 0.2 : 0) + (isCourteous ? 0.1 : 0));
  }

  private evaluateCompleteness(query: string, response: string): number {
    // Check if response fully addresses the query
    const responseLength = response.split(' ').length;
    const hasMultiplePoints = response.includes('also') || response.includes('additionally') || response.includes('furthermore');
    const hasExamples = response.includes('for example') || response.includes('such as') || /\d+/.test(response);
    
    return Math.min(1.0, 0.3 + (responseLength > 20 ? 0.3 : 0) + (hasMultiplePoints ? 0.2 : 0) + (hasExamples ? 0.2 : 0));
  }

  private generateReasoning(helpfulness: number, politeness: number, completeness: number): string {
    const strengths = [];
    const weaknesses = [];
    
    if (helpfulness > 0.7) strengths.push('helpful and relevant');
    else if (helpfulness < 0.5) weaknesses.push('not very helpful');
    
    if (politeness > 0.7) strengths.push('polite and courteous');
    else if (politeness < 0.5) weaknesses.push('could be more polite');
    
    if (completeness > 0.7) strengths.push('comprehensive');
    else if (completeness < 0.5) weaknesses.push('incomplete');
    
    let reasoning = 'Response evaluation: ';
    if (strengths.length > 0) reasoning += `Strong in ${strengths.join(', ')}. `;
    if (weaknesses.length > 0) reasoning += `Areas for improvement: ${weaknesses.join(', ')}.`;
    
    return reasoning;
  }

  private generateSuggestions(helpfulness: number, politeness: number, completeness: number): string[] {
    const suggestions = [];
    
    if (helpfulness < 0.6) suggestions.push('Provide more specific and actionable information');
    if (politeness < 0.6) suggestions.push('Use more courteous and professional language');
    if (completeness < 0.6) suggestions.push('Include additional relevant details and examples');
    
    if (suggestions.length === 0) suggestions.push('Response quality is good, minor improvements possible');
    
    return suggestions;
  }
}

/**
 * HYBRID SYSTEM: Combines Both Approaches
 */
export class HybridChatbotOptimizer {
  private intentClassifier = new IntentClassifier();
  private qualityOptimizer = new ResponseQualityOptimizer();

  async optimizeChatbotResponse(query: string): Promise<{
    supervised_result: { intent: string; confidence: number };
    unsupervised_result: { quality_scores: any; suggestions: string[] };
    hybrid_recommendation: string;
  }> {
    console.log(`🤖 HYBRID OPTIMIZATION: Processing customer query`);
    console.log(`   Query: "${query}"`);
    
    // STEP 1: SUPERVISED - Intent Classification (Exact Answer)
    const intent = await this.intentClassifier.classifyIntent(query);
    
    // STEP 2: Generate Response (simulated)
    const response = this.generateResponse(query, intent);
    
    // STEP 3: UNSUPERVISED - Quality Evaluation (Subjective)
    const qualityEvaluation = await this.qualityOptimizer.evaluateResponseQuality(
      query, response, `Intent: ${intent}`
    );
    
    // STEP 4: HYBRID - Combine Both Approaches
    const recommendation = this.generateHybridRecommendation(intent, qualityEvaluation);
    
    return {
      supervised_result: { intent, confidence: 0.85 },
      unsupervised_result: { 
        quality_scores: qualityEvaluation, 
        suggestions: qualityEvaluation.suggestions 
      },
      hybrid_recommendation: recommendation
    };
  }

  private generateResponse(query: string, intent: string): string {
    const responses = {
      'cancellation': 'I understand you want to cancel your subscription. I can help you with that. Would you like me to walk you through the cancellation process, or would you prefer to speak with our retention team about any concerns?',
      'password_reset': 'I can help you reset your password. Please visit our password reset page at [link] or I can send you a reset email. Which method would you prefer?',
      'hours_inquiry': 'Our business hours are Monday-Friday 9AM-6PM EST and Saturday 10AM-4PM EST. We\'re closed on Sundays. Is there anything specific I can help you with today?',
      'billing': 'I\'d be happy to help with your billing question. Could you please provide your account number or email address so I can look up your account details?',
      'escalation': 'I understand you\'d like to speak with a manager. Let me connect you with our supervisor team. They\'ll be able to assist you further.'
    };
    
    return responses[intent as keyof typeof responses] || 'I understand your inquiry. Let me help you with that. Could you provide a bit more detail so I can assist you better?';
  }

  private generateHybridRecommendation(intent: string, qualityEvaluation: any): string {
    let recommendation = `For ${intent} queries: `;
    
    if (qualityEvaluation.overall_score > 0.8) {
      recommendation += 'Response quality is excellent. ';
    } else if (qualityEvaluation.overall_score > 0.6) {
      recommendation += 'Response quality is good with room for improvement. ';
    } else {
      recommendation += 'Response quality needs significant improvement. ';
    }
    
    if (qualityEvaluation.suggestions.length > 0) {
      recommendation += `Key improvements: ${qualityEvaluation.suggestions[0]}.`;
    }
    
    return recommendation;
  }
}

/**
 * Example Usage
 */
export async function demonstrateHybridOptimization() {
  console.log('🎯 HYBRID OPTIMIZATION DEMO');
  console.log('===========================');
  
  const optimizer = new HybridChatbotOptimizer();
  
  const testQueries = [
    "I want to cancel my subscription because it's too expensive",
    "How do I reset my password? I forgot it",
    "What are your business hours? I need to call support"
  ];
  
  for (const query of testQueries) {
    console.log(`\n${'='.repeat(50)}`);
    const result = await optimizer.optimizeChatbotResponse(query);
    
    console.log(`\n📊 HYBRID RESULTS:`);
    console.log(`   🎯 Intent: ${result.supervised_result.intent}`);
    console.log(`   🎨 Quality: ${(result.unsupervised_result.quality_scores.overall_score * 100).toFixed(1)}%`);
    console.log(`   💡 Recommendation: ${result.hybrid_recommendation}`);
  }
}
