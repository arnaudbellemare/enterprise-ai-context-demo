/**
 * Semiotic Awareness Layer
 * 
 * Based on "Not Minds, but Signs: Reframing LLMs through Semiotics" (Picca, 2025)
 * https://arxiv.org/pdf/2505.17080
 * 
 * Key principles:
 * 1. LLMs manipulate signs (words, phrases) within cultural/linguistic frameworks
 * 2. Meaning is situated, contingent, and socially embedded
 * 3. Avoid anthropomorphism - LLMs don't "think", they recombine signs
 * 4. Signs are cultural constructs, not universal symbols
 * 5. Generate texts that invite interpretation (not direct understanding)
 * 
 * Integration with our system:
 * - Joint embeddings capture cultural/linguistic context (situated meaning)
 * - Energy-based models align with sign manipulation (not probabilistic understanding)
 * - MPC planning uses semiotic frameworks, not anthropomorphic assumptions
 */

export interface SemioticContext {
  domain: string;                      // Cultural domain (e.g., "tax", "legal", "financial")
  linguisticFramework: string;         // Linguistic framework (e.g., "formal", "technical", "casual")
  culturalEmbedding: number[];         // Cultural context embedding
  signSystem: 'written' | 'technical' | 'formal' | 'informal';
  situatedness: number;                // How situated the meaning is (0-1)
  socialEmbedding: number;             // Social context strength (0-1)
}

export interface SemioticAnalysis {
  signs: Array<{
    sign: string;                      // The sign (word/phrase)
    culturalContext: string;           // Cultural framework it belongs to
    situatedness: number;              // How context-dependent (0-1)
    interpretationInvitation: number; // How much it invites interpretation (0-1)
  }>;
  overallFramework: SemioticContext;
  meaningStability: number;            // How stable meaning is across contexts (0-1)
  avoidsAnthropomorphism: boolean;     // Whether interpretation avoids anthropomorphic assumptions
}

/**
 * Semiotic Awareness System
 * 
 * Analyzes queries and prompts through semiotic lens:
 * - Identifies signs and their cultural frameworks
 * - Assesses situatedness of meaning
 * - Avoids anthropomorphic interpretations
 * - Generates texts that invite interpretation
 */
export class SemioticAwarenessSystem {
  /**
   * Analyze query through semiotic framework
   * Treats words/phrases as signs, not direct meaning carriers
   */
  async analyzeQuery(query: string, domain: string): Promise<SemioticAnalysis> {
    // Extract signs (words/phrases) from query
    const signs = this.extractSigns(query);
    
    // Determine cultural/linguistic framework
    const framework = await this.determineFramework(query, domain);
    
    // Assess situatedness (how context-dependent)
    const situatedness = this.assessSituatedness(query, domain);
    
    // Analyze each sign
    const signAnalyses = signs.map(sign => ({
      sign,
      culturalContext: this.identifyCulturalContext(sign, domain),
      situatedness: this.assessSignSituatedness(sign, domain),
      interpretationInvitation: this.assessInterpretationInvitation(sign, domain)
    }));

    // Calculate overall meaning stability
    const meaningStability = this.calculateMeaningStability(signAnalyses);
    
    // Check if analysis avoids anthropomorphism
    const avoidsAnthropomorphism = this.checkAnthropomorphismAvoidance(signAnalyses);

    return {
      signs: signAnalyses,
      overallFramework: framework,
      meaningStability,
      avoidsAnthropomorphism
    };
  }

  /**
   * Enhance prompt with semiotic awareness
   * Reframes prompt to avoid anthropomorphism and emphasize sign manipulation
   */
  enhancePromptWithSemiotics(
    originalPrompt: string,
    analysis: SemioticAnalysis
  ): string {
    // Reframe prompt to emphasize sign manipulation, not understanding
    let enhancedPrompt = originalPrompt;

    // Add semiotic context awareness
    enhancedPrompt += `\n\n[Semiotic Context: ${analysis.overallFramework.domain}, ${analysis.overallFramework.linguisticFramework}]`;
    
    // Emphasize interpretation invitation (not direct understanding)
    if (analysis.meaningStability < 0.7) {
      enhancedPrompt += `\n[Note: Meaning is highly situated - generate text that invites interpretation within cultural framework]`;
    }

    // Avoid anthropomorphic language
    enhancedPrompt = this.removeAnthropomorphicLanguage(enhancedPrompt);

    return enhancedPrompt;
  }

  /**
   * Predict outcome using semiotic framework
   * Considers signs, cultural context, and situatedness
   */
  async predictWithSemiotics(
    query: string,
    prompt: string,
    domain: string
  ): Promise<{
    quality: number;
    culturalAlignment: number;
    interpretationClarity: number;
    avoidsAnthropomorphism: boolean;
  }> {
    const queryAnalysis = await this.analyzeQuery(query, domain);
    const promptAnalysis = await this.analyzeQuery(prompt, domain);

    // Quality = how well signs are manipulated within framework
    const quality = this.calculateSignManipulationQuality(queryAnalysis, promptAnalysis);

    // Cultural alignment = how well prompt fits cultural framework
    const culturalAlignment = this.calculateCulturalAlignment(queryAnalysis, promptAnalysis);

    // Interpretation clarity = how well text invites interpretation
    const interpretationClarity = queryAnalysis.signs.reduce(
      (sum, sign) => sum + sign.interpretationInvitation,
      0
    ) / Math.max(1, queryAnalysis.signs.length);

    // Avoid anthropomorphism
    const avoidsAnthropomorphism = 
      queryAnalysis.avoidsAnthropomorphism && 
      promptAnalysis.avoidsAnthropomorphism;

    return {
      quality,
      culturalAlignment,
      interpretationClarity,
      avoidsAnthropomorphism
    };
  }

  /**
   * Extract signs from text
   * Signs = words/phrases that carry cultural/linguistic meaning
   */
  private extractSigns(text: string): string[] {
    // Extract meaningful phrases (signs)
    const words = text.toLowerCase().split(/\s+/);
    const phrases: string[] = [];
    
    // Extract single words as signs
    words.forEach(word => {
      if (word.length > 3) { // Filter short words
        phrases.push(word);
      }
    });

    // Extract 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (phrase.length > 5) {
        phrases.push(phrase);
      }
    }

    return [...new Set(phrases)]; // Remove duplicates
  }

  /**
   * Determine cultural/linguistic framework
   */
  private async determineFramework(query: string, domain: string): Promise<SemioticContext> {
    // Detect linguistic framework
    const hasTechnicalTerms = /tax|legal|regulation|compliance|financial/.test(query.toLowerCase());
    const hasFormalLanguage = /shall|must|pursuant|herein|whereas/.test(query.toLowerCase());
    
    const linguisticFramework = hasTechnicalTerms 
      ? (hasFormalLanguage ? 'formal-technical' : 'technical')
      : 'general';

    // Determine sign system
    const signSystem: 'written' | 'technical' | 'formal' | 'informal' = 
      hasFormalLanguage ? 'formal' :
      hasTechnicalTerms ? 'technical' :
      'written';

    // Assess situatedness (domain-specific queries are more situated)
    const situatedness = ['tax', 'legal', 'financial', 'medical'].includes(domain) ? 0.8 : 0.5;

    // Social embedding (how socially embedded)
    const socialEmbedding = query.includes('client') || query.includes('customer') ? 0.9 : 0.6;

    // Generate cultural embedding (simplified - real implementation would use actual embeddings)
    const culturalEmbedding = this.generateCulturalEmbedding(domain, linguisticFramework);

    return {
      domain,
      linguisticFramework,
      culturalEmbedding,
      signSystem,
      situatedness,
      socialEmbedding
    };
  }

  /**
   * Assess how situated the meaning is
   * Higher = more context-dependent, less universal
   */
  private assessSituatedness(query: string, domain: string): number {
    const contextDependentTerms = ['client', 'customer', 'local', 'regional', 'jurisdiction'];
    const hasContextTerms = contextDependentTerms.some(term => 
      query.toLowerCase().includes(term)
    );

    const domainSituatedness = {
      'tax': 0.9,
      'legal': 0.85,
      'financial': 0.8,
      'medical': 0.85,
      'general': 0.5
    }[domain] || 0.6;

    return hasContextTerms ? Math.min(1.0, domainSituatedness + 0.1) : domainSituatedness;
  }

  /**
   * Identify cultural context for a sign
   */
  private identifyCulturalContext(sign: string, domain: string): string {
    // Map signs to cultural contexts
    const culturalMappings: Record<string, Record<string, string>> = {
      'tax': {
        'tax': 'fiscal-policy',
        'deduction': 'tax-code',
        'asset': 'financial-culture',
        'portfolio': 'investment-culture'
      },
      'legal': {
        'contract': 'contract-law',
        'liability': 'tort-law',
        'jurisdiction': 'legal-system'
      },
      'financial': {
        'investment': 'financial-markets',
        'portfolio': 'investment-culture',
        'risk': 'risk-management-culture'
      }
    };

    const domainMappings = culturalMappings[domain] || {};
    return domainMappings[sign.toLowerCase()] || `${domain}-general`;
  }

  /**
   * Assess sign situatedness
   */
  private assessSignSituatedness(sign: string, domain: string): number {
    const universalSigns = ['the', 'is', 'and', 'or', 'not'];
    const highlySituatedSigns = ['tax', 'legal', 'jurisdiction', 'compliance'];

    if (universalSigns.includes(sign.toLowerCase())) {
      return 0.2; // Low situatedness
    }
    if (highlySituatedSigns.some(s => sign.toLowerCase().includes(s))) {
      return 0.9; // High situatedness
    }
    return 0.6; // Medium situatedness
  }

  /**
   * Assess how much sign invites interpretation
   */
  private assessInterpretationInvitation(sign: string, domain: string): number {
    // Abstract/conceptual signs invite more interpretation
    const abstractSigns = ['fairness', 'justice', 'equity', 'reasonable', 'appropriate'];
    const concreteSigns = ['tax', 'deduction', 'percentage', 'dollar'];

    if (abstractSigns.some(s => sign.toLowerCase().includes(s))) {
      return 0.9; // High interpretation invitation
    }
    if (concreteSigns.some(s => sign.toLowerCase().includes(s))) {
      return 0.4; // Low interpretation invitation
    }
    return 0.6; // Medium
  }

  /**
   * Calculate meaning stability across contexts
   */
  private calculateMeaningStability(
    signAnalyses: Array<{ situatedness: number }>
  ): number {
    if (signAnalyses.length === 0) return 0.5;
    const avgSituatedness = signAnalyses.reduce((sum, s) => sum + s.situatedness, 0) / signAnalyses.length;
    return 1.0 - avgSituatedness; // Inverse: lower situatedness = higher stability
  }

  /**
   * Check if analysis avoids anthropomorphism
   */
  private checkAnthropomorphismAvoidance(
    signAnalyses: Array<{ sign: string }>
  ): boolean {
    // Anthropomorphic language indicators
    const anthropomorphicTerms = [
      'understand', 'think', 'believe', 'know', 'realize',
      'decide', 'choose', 'want', 'feel', 'see', 'remember'
    ];

    // Check if any signs suggest anthropomorphic interpretation
    const hasAnthropomorphic = signAnalyses.some(analysis =>
      anthropomorphicTerms.some(term => 
        analysis.sign.toLowerCase().includes(term)
      )
    );

    return !hasAnthropomorphic;
  }

  /**
   * Remove anthropomorphic language from prompt
   */
  private removeAnthropomorphicLanguage(prompt: string): string {
    const replacements: Record<string, string> = {
      'the model understands': 'the model processes signs',
      'the model thinks': 'the model manipulates signs',
      'the model knows': 'the model has access to signs',
      'the model decides': 'the model generates based on sign associations'
    };

    let cleaned = prompt;
    for (const [anthropomorphic, semiotic] of Object.entries(replacements)) {
      cleaned = cleaned.replace(new RegExp(anthropomorphic, 'gi'), semiotic);
    }

    return cleaned;
  }

  /**
   * Calculate sign manipulation quality
   */
  private calculateSignManipulationQuality(
    queryAnalysis: SemioticAnalysis,
    promptAnalysis: SemioticAnalysis
  ): number {
    // Quality = how well signs are recombined within cultural framework
    const culturalAlignment = queryAnalysis.overallFramework.domain === promptAnalysis.overallFramework.domain ? 0.8 : 0.5;
    const frameworkMatch = queryAnalysis.overallFramework.linguisticFramework === promptAnalysis.overallFramework.linguisticFramework ? 0.9 : 0.6;
    
    return (culturalAlignment * 0.6 + frameworkMatch * 0.4);
  }

  /**
   * Calculate cultural alignment
   */
  private calculateCulturalAlignment(
    queryAnalysis: SemioticAnalysis,
    promptAnalysis: SemioticAnalysis
  ): number {
    const domainMatch = queryAnalysis.overallFramework.domain === promptAnalysis.overallFramework.domain ? 1.0 : 0.5;
    const situatednessMatch = 1.0 - Math.abs(queryAnalysis.overallFramework.situatedness - promptAnalysis.overallFramework.situatedness);
    
    return (domainMatch * 0.7 + situatednessMatch * 0.3);
  }

  /**
   * Generate cultural embedding (simplified)
   */
  private generateCulturalEmbedding(domain: string, framework: string): number[] {
    // Real implementation would use actual embedding model
    // For now, generate based on domain and framework hash
    const combined = `${domain}-${framework}`;
    return Array.from({ length: 128 }, (_, i) => {
      const hash = this.simpleHash(combined + i.toString());
      return (hash % 2000) / 2000 - 0.5;
    });
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

/**
 * Factory function
 */
export function createSemioticAwarenessSystem(): SemioticAwarenessSystem {
  return new SemioticAwarenessSystem();
}

