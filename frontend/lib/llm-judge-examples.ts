/**
 * 🎯 LLM-as-a-Judge Examples: No Labels Needed!
 * 
 * Demonstrates how DSPy apps since 2023 use reward signals
 * instead of supervised labels for optimization.
 */

interface RewardSignal {
  dimension: string;
  score: number; // 0-1 scale
  reasoning: string;
}

interface LLMJudgeResult {
  overall_reward: number;
  dimension_scores: RewardSignal[];
  suggestions: string[];
  confidence: number;
}

/**
 * Example 1: Creative Writing Optimization
 * No labeled examples needed - just reward signals!
 */
export class CreativeWritingJudge {
  async evaluateStory(story: string, prompt: string): Promise<LLMJudgeResult> {
    console.log('🎨 LLM-as-a-Judge: Evaluating creative story');
    
    // NO LABELS NEEDED - Just reward heuristics!
    const dimensions = [
      {
        dimension: 'creativity',
        score: this.assessCreativity(story),
        reasoning: this.getCreativityReasoning(story)
      },
      {
        dimension: 'engagement',
        score: this.assessEngagement(story),
        reasoning: this.getEngagementReasoning(story)
      },
      {
        dimension: 'originality',
        score: this.assessOriginality(story),
        reasoning: this.getOriginalityReasoning(story)
      },
      {
        dimension: 'emotional_impact',
        score: this.assessEmotionalImpact(story),
        reasoning: this.getEmotionalImpactReasoning(story)
      }
    ];

    const overall_reward = dimensions.reduce((sum, dim) => sum + dim.score, 0) / dimensions.length;
    
    return {
      overall_reward,
      dimension_scores: dimensions,
      suggestions: this.generateSuggestions(dimensions),
      confidence: 0.85 // LLM confidence in its own judgment
    };
  }

  private assessCreativity(story: string): number {
    // Reward heuristics: unique metaphors, unexpected plot twists, novel concepts
    const hasUniqueMetaphors = /\b(like|as|metaphor|simile)\b/i.test(story);
    const hasPlotTwists = /\b(suddenly|unexpected|surprise|reveal)\b/i.test(story);
    const hasNovelConcepts = story.split(' ').length > 200; // Longer stories often more creative
    
    let creativity = 0.5;
    if (hasUniqueMetaphors) creativity += 0.2;
    if (hasPlotTwists) creativity += 0.2;
    if (hasNovelConcepts) creativity += 0.1;
    
    return Math.min(1.0, creativity);
  }

  private assessEngagement(story: string): number {
    // Reward heuristics: dialogue, action verbs, sensory details
    const hasDialogue = /"[^"]*"/.test(story);
    const hasActionVerbs = /\b(run|jump|shout|grab|throw|chase)\b/i.test(story);
    const hasSensoryDetails = /\b(see|hear|smell|taste|feel|bright|loud|soft)\b/i.test(story);
    
    let engagement = 0.4;
    if (hasDialogue) engagement += 0.3;
    if (hasActionVerbs) engagement += 0.2;
    if (hasSensoryDetails) engagement += 0.1;
    
    return Math.min(1.0, engagement);
  }

  private assessOriginality(story: string): number {
    // Reward heuristics: unique word choices, uncommon scenarios
    const uniqueWords = this.countUniqueWords(story);
    const uncommonScenarios = /\b(alien|robot|magic|future|dimension)\b/i.test(story);
    
    let originality = 0.3;
    if (uniqueWords > 0.7) originality += 0.4; // High vocabulary diversity
    if (uncommonScenarios) originality += 0.3;
    
    return Math.min(1.0, originality);
  }

  private assessEmotionalImpact(story: string): number {
    // Reward heuristics: emotional words, character development, conflict
    const emotionalWords = /\b(love|hate|fear|joy|sadness|anger|hope)\b/i.test(story);
    const hasCharacterDevelopment = /\b(grew|learned|changed|realized)\b/i.test(story);
    const hasConflict = /\b(struggle|battle|fight|challenge|problem)\b/i.test(story);
    
    let emotionalImpact = 0.3;
    if (emotionalWords) emotionalImpact += 0.3;
    if (hasCharacterDevelopment) emotionalImpact += 0.2;
    if (hasConflict) emotionalImpact += 0.2;
    
    return Math.min(1.0, emotionalImpact);
  }

  private countUniqueWords(text: string): number {
    const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 3);
    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length;
  }

  private getCreativityReasoning(story: string): string {
    return `Story demonstrates ${this.assessCreativity(story) > 0.7 ? 'high' : 'moderate'} creativity through unique elements and novel approaches.`;
  }

  private getEngagementReasoning(story: string): string {
    return `Story shows ${this.assessEngagement(story) > 0.7 ? 'strong' : 'adequate'} engagement through dialogue and action.`;
  }

  private getOriginalityReasoning(story: string): string {
    return `Story exhibits ${this.assessOriginality(story) > 0.7 ? 'high' : 'moderate'} originality with unique concepts.`;
  }

  private getEmotionalImpactReasoning(story: string): string {
    return `Story has ${this.assessEmotionalImpact(story) > 0.7 ? 'strong' : 'moderate'} emotional resonance.`;
  }

  private generateSuggestions(dimensions: RewardSignal[]): string[] {
    const suggestions: string[] = [];
    
    dimensions.forEach(dim => {
      if (dim.score < 0.6) {
        switch (dim.dimension) {
          case 'creativity':
            suggestions.push('Add more unique metaphors and unexpected elements');
            break;
          case 'engagement':
            suggestions.push('Include more dialogue and sensory details');
            break;
          case 'originality':
            suggestions.push('Explore more unique scenarios and word choices');
            break;
          case 'emotional_impact':
            suggestions.push('Develop characters and add emotional depth');
            break;
        }
      }
    });
    
    return suggestions.length > 0 ? suggestions : ['Story quality is good across all dimensions'];
  }
}

/**
 * Example 2: Code Generation Optimization
 * No labeled code examples needed - just quality heuristics!
 */
export class CodeQualityJudge {
  async evaluateCode(code: string, requirements: string): Promise<LLMJudgeResult> {
    console.log('💻 LLM-as-a-Judge: Evaluating code quality');
    
    const dimensions = [
      {
        dimension: 'readability',
        score: this.assessReadability(code),
        reasoning: this.getReadabilityReasoning(code)
      },
      {
        dimension: 'efficiency',
        score: this.assessEfficiency(code),
        reasoning: this.getEfficiencyReasoning(code)
      },
      {
        dimension: 'maintainability',
        score: this.assessMaintainability(code),
        reasoning: this.getMaintainabilityReasoning(code)
      },
      {
        dimension: 'correctness',
        score: this.assessCorrectness(code, requirements),
        reasoning: this.getCorrectnessReasoning(code)
      }
    ];

    const overall_reward = dimensions.reduce((sum, dim) => sum + dim.score, 0) / dimensions.length;
    
    return {
      overall_reward,
      dimension_scores: dimensions,
      suggestions: this.generateCodeSuggestions(dimensions),
      confidence: 0.9 // High confidence for code evaluation
    };
  }

  private assessReadability(code: string): number {
    // Reward heuristics: clear variable names, comments, proper formatting
    const hasComments = /\/\/|\/\*|\*\/|\#/.test(code);
    const hasClearNames = /\b(function|def|class|var|let|const)\s+[a-zA-Z_][a-zA-Z0-9_]*/.test(code);
    const properFormatting = code.includes('\n') && !code.includes('  ');
    
    let readability = 0.4;
    if (hasComments) readability += 0.3;
    if (hasClearNames) readability += 0.2;
    if (properFormatting) readability += 0.1;
    
    return Math.min(1.0, readability);
  }

  private assessEfficiency(code: string): number {
    // Reward heuristics: appropriate algorithms, no obvious inefficiencies
    const hasLoops = /for|while|forEach|map|filter/.test(code);
    const hasConditionals = /if|else|switch|case/.test(code);
    const reasonableLength = code.length > 50 && code.length < 1000;
    
    let efficiency = 0.5;
    if (hasLoops) efficiency += 0.2;
    if (hasConditionals) efficiency += 0.2;
    if (reasonableLength) efficiency += 0.1;
    
    return Math.min(1.0, efficiency);
  }

  private assessMaintainability(code: string): number {
    // Reward heuristics: modular structure, clear separation of concerns
    const hasFunctions = /function|def|=>/.test(code);
    const hasClasses = /class|interface|struct/.test(code);
    const reasonableComplexity = code.split('\n').length < 50;
    
    let maintainability = 0.4;
    if (hasFunctions) maintainability += 0.3;
    if (hasClasses) maintainability += 0.2;
    if (reasonableComplexity) maintainability += 0.1;
    
    return Math.min(1.0, maintainability);
  }

  private assessCorrectness(code: string, requirements: string): number {
    // Reward heuristics: addresses requirements, has error handling
    const addressesRequirements = requirements.split(' ').some(word => 
      code.toLowerCase().includes(word.toLowerCase())
    );
    const hasErrorHandling = /try|catch|error|exception|if.*null|if.*undefined/.test(code);
    
    let correctness = 0.3;
    if (addressesRequirements) correctness += 0.5;
    if (hasErrorHandling) correctness += 0.2;
    
    return Math.min(1.0, correctness);
  }

  private getReadabilityReasoning(code: string): string {
    return `Code shows ${this.assessReadability(code) > 0.7 ? 'good' : 'moderate'} readability.`;
  }

  private getEfficiencyReasoning(code: string): string {
    return `Code demonstrates ${this.assessEfficiency(code) > 0.7 ? 'efficient' : 'adequate'} implementation.`;
  }

  private getMaintainabilityReasoning(code: string): string {
    return `Code has ${this.assessMaintainability(code) > 0.7 ? 'good' : 'moderate'} maintainability.`;
  }

  private getCorrectnessReasoning(code: string): string {
    return `Code appears ${this.assessCorrectness(code, '') > 0.7 ? 'correct' : 'potentially correct'}.`;
  }

  private generateCodeSuggestions(dimensions: RewardSignal[]): string[] {
    const suggestions: string[] = [];
    
    dimensions.forEach(dim => {
      if (dim.score < 0.6) {
        switch (dim.dimension) {
          case 'readability':
            suggestions.push('Add comments and use clearer variable names');
            break;
          case 'efficiency':
            suggestions.push('Optimize algorithms and reduce complexity');
            break;
          case 'maintainability':
            suggestions.push('Break into smaller functions and improve structure');
            break;
          case 'correctness':
            suggestions.push('Add error handling and validate inputs');
            break;
        }
      }
    });
    
    return suggestions.length > 0 ? suggestions : ['Code quality is good across all dimensions'];
  }
}

/**
 * Example 3: Business Communication Optimization
 * No labeled examples needed - just effectiveness heuristics!
 */
export class BusinessCommunicationJudge {
  async evaluateCommunication(text: string, purpose: string): Promise<LLMJudgeResult> {
    console.log('📧 LLM-as-a-Judge: Evaluating business communication');
    
    const dimensions = [
      {
        dimension: 'clarity',
        score: this.assessClarity(text),
        reasoning: this.getClarityReasoning(text)
      },
      {
        dimension: 'persuasiveness',
        score: this.assessPersuasiveness(text),
        reasoning: this.getPersuasivenessReasoning(text)
      },
      {
        dimension: 'professionalism',
        score: this.assessProfessionalism(text),
        reasoning: this.getProfessionalismReasoning(text)
      },
      {
        dimension: 'actionability',
        score: this.assessActionability(text),
        reasoning: this.getActionabilityReasoning(text)
      }
    ];

    const overall_reward = dimensions.reduce((sum, dim) => sum + dim.score, 0) / dimensions.length;
    
    return {
      overall_reward,
      dimension_scores: dimensions,
      suggestions: this.generateCommunicationSuggestions(dimensions),
      confidence: 0.8
    };
  }

  private assessClarity(text: string): number {
    // Reward heuristics: clear structure, simple language, logical flow
    const hasStructure = /^[A-Z]|^\d+\.|^•|^\-/.test(text);
    const simpleLanguage = text.split(' ').filter(word => word.length > 8).length / text.split(' ').length < 0.2;
    const logicalFlow = /therefore|however|moreover|furthermore|additionally/.test(text);
    
    let clarity = 0.4;
    if (hasStructure) clarity += 0.3;
    if (simpleLanguage) clarity += 0.2;
    if (logicalFlow) clarity += 0.1;
    
    return Math.min(1.0, clarity);
  }

  private assessPersuasiveness(text: string): number {
    // Reward heuristics: benefits, urgency, social proof
    const hasBenefits = /\b(benefit|advantage|value|improve|increase|save)\b/i.test(text);
    const hasUrgency = /\b(urgent|important|deadline|limited|now|today)\b/i.test(text);
    const hasSocialProof = /\b(customers|users|clients|proven|tested|recommended)\b/i.test(text);
    
    let persuasiveness = 0.3;
    if (hasBenefits) persuasiveness += 0.3;
    if (hasUrgency) persuasiveness += 0.2;
    if (hasSocialProof) persuasiveness += 0.2;
    
    return Math.min(1.0, persuasiveness);
  }

  private assessProfessionalism(text: string): number {
    // Reward heuristics: formal tone, proper grammar, business terminology
    const formalTone = !/\b(hey|hi|yeah|ok|cool|awesome)\b/i.test(text);
    const properGrammar = /^[A-Z].*[.!?]$/.test(text.trim());
    const businessTerms = /\b(please|thank you|sincerely|regards|appreciate)\b/i.test(text);
    
    let professionalism = 0.4;
    if (formalTone) professionalism += 0.3;
    if (properGrammar) professionalism += 0.2;
    if (businessTerms) professionalism += 0.1;
    
    return Math.min(1.0, professionalism);
  }

  private assessActionability(text: string): number {
    // Reward heuristics: clear next steps, contact info, deadlines
    const hasNextSteps = /\b(next|step|action|do|please|contact)\b/i.test(text);
    const hasContactInfo = /\b(email|phone|call|meet|schedule)\b/i.test(text);
    const hasDeadlines = /\b(by|before|until|deadline|date)\b/i.test(text);
    
    let actionability = 0.3;
    if (hasNextSteps) actionability += 0.3;
    if (hasContactInfo) actionability += 0.2;
    if (hasDeadlines) actionability += 0.2;
    
    return Math.min(1.0, actionability);
  }

  private getClarityReasoning(text: string): string {
    return `Communication shows ${this.assessClarity(text) > 0.7 ? 'excellent' : 'good'} clarity.`;
  }

  private getPersuasivenessReasoning(text: string): string {
    return `Message has ${this.assessPersuasiveness(text) > 0.7 ? 'strong' : 'moderate'} persuasive elements.`;
  }

  private getProfessionalismReasoning(text: string): string {
    return `Tone is ${this.assessProfessionalism(text) > 0.7 ? 'highly' : 'adequately'} professional.`;
  }

  private getActionabilityReasoning(text: string): string {
    return `Message provides ${this.assessActionability(text) > 0.7 ? 'clear' : 'some'} next steps.`;
  }

  private generateCommunicationSuggestions(dimensions: RewardSignal[]): string[] {
    const suggestions: string[] = [];
    
    dimensions.forEach(dim => {
      if (dim.score < 0.6) {
        switch (dim.dimension) {
          case 'clarity':
            suggestions.push('Improve structure and use simpler language');
            break;
          case 'persuasiveness':
            suggestions.push('Add benefits and urgency to strengthen the message');
            break;
          case 'professionalism':
            suggestions.push('Use more formal tone and proper business language');
            break;
          case 'actionability':
            suggestions.push('Include clear next steps and contact information');
            break;
        }
      }
    });
    
    return suggestions.length > 0 ? suggestions : ['Communication quality is good across all dimensions'];
  }
}

/**
 * Demo: Show how LLM-as-a-Judge works without any labels!
 */
export async function demonstrateLLMJudge() {
  console.log('🎯 LLM-as-a-Judge Demo: No Labels Needed!');
  console.log('==========================================\n');

  // Example 1: Creative Writing
  console.log('📝 CREATIVE WRITING EVALUATION:');
  const storyJudge = new CreativeWritingJudge();
  const storyResult = await storyJudge.evaluateStory(
    "Sarah walked through the enchanted forest, where trees whispered secrets and shadows danced with moonlight.",
    "Write a creative story"
  );
  
  console.log(`Overall Reward: ${(storyResult.overall_reward * 100).toFixed(1)}%`);
  console.log('Dimension Scores:');
  storyResult.dimension_scores.forEach(dim => {
    console.log(`  ${dim.dimension}: ${(dim.score * 100).toFixed(1)}% - ${dim.reasoning}`);
  });
  console.log('Suggestions:', storyResult.suggestions.join(', '));

  // Example 2: Code Quality
  console.log('\n💻 CODE QUALITY EVALUATION:');
  const codeJudge = new CodeQualityJudge();
  const codeResult = await codeJudge.evaluateCode(
    `function calculateTotal(items) {
  // Calculate total price with tax
  let total = 0;
  for (let item of items) {
    total += item.price * 1.1; // Add 10% tax
  }
  return total;
}`,
    "Create a function to calculate total with tax"
  );
  
  console.log(`Overall Reward: ${(codeResult.overall_reward * 100).toFixed(1)}%`);
  console.log('Dimension Scores:');
  codeResult.dimension_scores.forEach(dim => {
    console.log(`  ${dim.dimension}: ${(dim.score * 100).toFixed(1)}% - ${dim.reasoning}`);
  });
  console.log('Suggestions:', codeResult.suggestions.join(', '));

  // Example 3: Business Communication
  console.log('\n📧 BUSINESS COMMUNICATION EVALUATION:');
  const commJudge = new BusinessCommunicationJudge();
  const commResult = await commJudge.evaluateCommunication(
    "Dear Team, I hope this email finds you well. I wanted to share some exciting news about our upcoming product launch. The new features will significantly improve user experience and increase customer satisfaction. Please review the attached materials and let me know your thoughts by Friday. Thank you for your continued dedication.",
    "Update team about product launch"
  );
  
  console.log(`Overall Reward: ${(commResult.overall_reward * 100).toFixed(1)}%`);
  console.log('Dimension Scores:');
  commResult.dimension_scores.forEach(dim => {
    console.log(`  ${dim.dimension}: ${(dim.score * 100).toFixed(1)}% - ${dim.reasoning}`);
  });
  console.log('Suggestions:', commResult.suggestions.join(', '));

  console.log('\n🎯 KEY INSIGHTS:');
  console.log('================');
  console.log('✅ NO LABELED DATA REQUIRED - Just reward heuristics!');
  console.log('✅ LLM can judge quality across multiple dimensions');
  console.log('✅ Optimize prompts based on reward signals');
  console.log('✅ Works for any subjective quality task');
  console.log('✅ Fast iteration without data collection');
}
