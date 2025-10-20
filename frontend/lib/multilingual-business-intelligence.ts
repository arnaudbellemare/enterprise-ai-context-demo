import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

// Enhanced multilingual business intelligence system
// Supports 100+ languages with industry-leading performance in global business languages

// Language Detection Schema
const LanguageDetectionSchema = z.object({
  detectedLanguage: z.string().describe('Primary language detected (ISO 639-1 code)'),
  confidence: z.number().min(0).max(1).describe('Confidence score for language detection'),
  businessLanguage: z.boolean().describe('Whether this is a global business language'),
  regionalVariants: z.array(z.string()).describe('Regional language variants detected'),
  scriptType: z.enum(['latin', 'arabic', 'cyrillic', 'chinese', 'japanese', 'korean', 'devanagari', 'other']).describe('Writing system used')
});

// Business Domain Detection Schema
const BusinessDomainSchema = z.object({
  primaryDomain: z.enum(['legal', 'sales', 'finance', 'operations', 'marketing', 'hr', 'it', 'general']).describe('Primary business domain'),
  subDomain: z.string().describe('Specific sub-domain or specialization'),
  industryContext: z.string().describe('Industry context and vertical'),
  complexity: z.enum(['simple', 'moderate', 'complex', 'expert']).describe('Query complexity level'),
  requiresSpecializedKnowledge: z.boolean().describe('Whether query requires specialized business knowledge'),
  multilingualContext: z.boolean().describe('Whether query involves multiple languages or regions')
});

// Constraint Analysis Schema
const ConstraintAnalysisSchema = z.object({
  temporalConstraints: z.array(z.string()).describe('Time-related constraints identified'),
  regulatoryConstraints: z.array(z.string()).describe('Regulatory and compliance constraints'),
  technicalConstraints: z.array(z.string()).describe('Technical and system constraints'),
  businessConstraints: z.array(z.string()).describe('Business process and operational constraints'),
  culturalConstraints: z.array(z.string()).describe('Cultural and regional constraints'),
  constraintComplexity: z.enum(['low', 'medium', 'high', 'expert']).describe('Overall constraint complexity')
});

// Data Type Compatibility Schema
const DataCompatibilitySchema = z.object({
  supportedDataTypes: z.array(z.enum(['email', 'report', 'table', 'json', 'code', 'document', 'presentation', 'spreadsheet'])).describe('Supported data types'),
  metadataRichness: z.enum(['basic', 'moderate', 'rich', 'enterprise']).describe('Metadata richness level'),
  structureType: z.enum(['unstructured', 'semi_structured', 'structured', 'mixed']).describe('Data structure type'),
  processingRequirements: z.array(z.string()).describe('Specific processing requirements')
});

export class MultilingualBusinessIntelligence {
  private model: any;

  constructor() {
    this.model = openai('gpt-4o-mini');
  }

  /**
   * Detect language and business context
   */
  async detectLanguageAndBusiness(query: string): Promise<{
    language: z.infer<typeof LanguageDetectionSchema>;
    business: z.infer<typeof BusinessDomainSchema>;
    constraints: z.infer<typeof ConstraintAnalysisSchema>;
    dataCompatibility: z.infer<typeof DataCompatibilitySchema>;
  }> {
    try {
      const result = await generateObject({
        model: this.model,
        schema: z.object({
          language: LanguageDetectionSchema,
          business: BusinessDomainSchema,
          constraints: ConstraintAnalysisSchema,
          dataCompatibility: DataCompatibilitySchema
        }),
        prompt: `Analyze this business query for multilingual intelligence and domain expertise:

Query: "${query}"

Provide comprehensive analysis covering:

1. LANGUAGE DETECTION:
- Detect primary language (ISO 639-1 code)
- Identify if it's a global business language (Arabic, French, Japanese, Korean, Portuguese, Spanish, English, Chinese)
- Detect regional variants and writing systems
- Assess confidence in language detection

2. BUSINESS DOMAIN ANALYSIS:
- Identify primary business domain (legal, sales, finance, operations, marketing, hr, it)
- Determine sub-domain and industry context
- Assess query complexity and specialized knowledge requirements
- Check for multilingual business context

3. CONSTRAINT ANALYSIS:
- Identify temporal constraints (deadlines, time-sensitive)
- Detect regulatory constraints (compliance, legal requirements)
- Find technical constraints (system limitations, integrations)
- Identify business constraints (process limitations, approvals)
- Detect cultural constraints (regional differences, customs)
- Assess overall constraint complexity

4. DATA COMPATIBILITY:
- Determine supported data types (emails, reports, tables, JSON, code)
- Assess metadata richness requirements
- Identify structure type (unstructured, semi-structured, structured)
- Determine specific processing requirements

Focus on business intelligence, multilingual capabilities, and constraint understanding.`
      });

      return result.object;
    } catch (error) {
      console.error('Multilingual business intelligence error:', error);
      
      // Fallback analysis
      return {
        language: {
          detectedLanguage: 'en',
          confidence: 0.5,
          businessLanguage: true,
          regionalVariants: [],
          scriptType: 'latin'
        },
        business: {
          primaryDomain: 'general',
          subDomain: 'general',
          industryContext: 'general',
          complexity: 'moderate',
          requiresSpecializedKnowledge: false,
          multilingualContext: false
        },
        constraints: {
          temporalConstraints: [],
          regulatoryConstraints: [],
          technicalConstraints: [],
          businessConstraints: [],
          culturalConstraints: [],
          constraintComplexity: 'low'
        },
        dataCompatibility: {
          supportedDataTypes: ['document'],
          metadataRichness: 'basic',
          structureType: 'unstructured',
          processingRequirements: ['text_analysis']
        }
      };
    }
  }

  /**
   * Enhanced reasoning for complex business constraints
   */
  async analyzeComplexConstraints(query: string, context: any): Promise<{
    constraintTypes: string[];
    reasoningApproach: string;
    specializedKnowledge: string[];
    multilingualConsiderations: string[];
    businessProcessImpact: string[];
  }> {
    try {
      const analysis = await this.detectLanguageAndBusiness(query);
      
      const constraintTypes = [
        ...analysis.constraints.temporalConstraints,
        ...analysis.constraints.regulatoryConstraints,
        ...analysis.constraints.technicalConstraints,
        ...analysis.constraints.businessConstraints,
        ...analysis.constraints.culturalConstraints
      ];

      const reasoningApproach = this.determineReasoningApproach(analysis);
      const specializedKnowledge = this.identifySpecializedKnowledge(analysis);
      const multilingualConsiderations = this.identifyMultilingualConsiderations(analysis);
      const businessProcessImpact = this.assessBusinessProcessImpact(analysis);

      return {
        constraintTypes,
        reasoningApproach,
        specializedKnowledge,
        multilingualConsiderations,
        businessProcessImpact
      };
    } catch (error) {
      return {
        constraintTypes: ['general'],
        reasoningApproach: 'standard',
        specializedKnowledge: ['general_business'],
        multilingualConsiderations: [],
        businessProcessImpact: ['general_processing']
      };
    }
  }

  /**
   * RAG application integration for knowledge consolidation
   */
  async integrateRAGCapabilities(query: string, knowledgeStores: string[]): Promise<{
    relevantStores: string[];
    consolidationStrategy: string;
    retrievalOptimization: string[];
    knowledgeSynthesis: string;
  }> {
    try {
      const analysis = await this.detectLanguageAndBusiness(query);
      
      const relevantStores = this.selectRelevantKnowledgeStores(knowledgeStores, analysis);
      const consolidationStrategy = this.determineConsolidationStrategy(analysis);
      const retrievalOptimization = this.optimizeRetrievalStrategy(analysis);
      const knowledgeSynthesis = this.determineSynthesisApproach(analysis);

      return {
        relevantStores,
        consolidationStrategy,
        retrievalOptimization,
        knowledgeSynthesis
      };
    } catch (error) {
      return {
        relevantStores: knowledgeStores.slice(0, 3),
        consolidationStrategy: 'basic_merge',
        retrievalOptimization: ['semantic_search'],
        knowledgeSynthesis: 'standard_synthesis'
      };
    }
  }

  // Helper methods
  private determineReasoningApproach(analysis: any): string {
    if (analysis.business.complexity === 'expert') return 'expert_reasoning';
    if (analysis.constraints.constraintComplexity === 'expert') return 'constraint_reasoning';
    if (analysis.business.requiresSpecializedKnowledge) return 'specialized_reasoning';
    return 'standard_reasoning';
  }

  private identifySpecializedKnowledge(analysis: any): string[] {
    const knowledge = [];
    
    if (analysis.business.primaryDomain === 'legal') knowledge.push('legal_expertise');
    if (analysis.business.primaryDomain === 'finance') knowledge.push('financial_analysis');
    if (analysis.business.primaryDomain === 'sales') knowledge.push('sales_strategy');
    if (analysis.business.primaryDomain === 'operations') knowledge.push('operational_excellence');
    
    if (analysis.constraints.regulatoryConstraints.length > 0) knowledge.push('regulatory_compliance');
    if (analysis.constraints.culturalConstraints.length > 0) knowledge.push('cultural_intelligence');
    
    return knowledge.length > 0 ? knowledge : ['general_business'];
  }

  private identifyMultilingualConsiderations(analysis: any): string[] {
    const considerations = [];
    
    if (analysis.language.businessLanguage) considerations.push('business_language_optimization');
    if (analysis.language.regionalVariants.length > 0) considerations.push('regional_variant_handling');
    if (analysis.business.multilingualContext) considerations.push('cross_language_synthesis');
    
    return considerations;
  }

  private assessBusinessProcessImpact(analysis: any): string[] {
    const impacts = [];
    
    if (analysis.constraints.temporalConstraints.length > 0) impacts.push('time_sensitive_processing');
    if (analysis.constraints.regulatoryConstraints.length > 0) impacts.push('compliance_workflow');
    if (analysis.constraints.technicalConstraints.length > 0) impacts.push('system_integration');
    
    return impacts.length > 0 ? impacts : ['standard_processing'];
  }

  private selectRelevantKnowledgeStores(stores: string[], analysis: any): string[] {
    const relevant = [];
    
    // Domain-specific store selection
    if (analysis.business.primaryDomain === 'legal') {
      relevant.push(...stores.filter(s => s.includes('legal') || s.includes('compliance')));
    }
    if (analysis.business.primaryDomain === 'finance') {
      relevant.push(...stores.filter(s => s.includes('financial') || s.includes('accounting')));
    }
    
    // Language-specific store selection
    if (analysis.language.detectedLanguage !== 'en') {
      relevant.push(...stores.filter(s => s.includes(analysis.language.detectedLanguage)));
    }
    
    return relevant.length > 0 ? relevant : stores.slice(0, 3);
  }

  private determineConsolidationStrategy(analysis: any): string {
    if (analysis.business.complexity === 'expert') return 'expert_consolidation';
    if (analysis.constraints.constraintComplexity === 'high') return 'constraint_aware_consolidation';
    if (analysis.business.multilingualContext) return 'multilingual_consolidation';
    return 'standard_consolidation';
  }

  private optimizeRetrievalStrategy(analysis: any): string[] {
    const strategies = ['semantic_search'];
    
    if (analysis.dataCompatibility.structureType === 'structured') strategies.push('structured_retrieval');
    if (analysis.dataCompatibility.metadataRichness === 'enterprise') strategies.push('metadata_enhanced_retrieval');
    if (analysis.business.requiresSpecializedKnowledge) strategies.push('domain_specific_retrieval');
    
    return strategies;
  }

  private determineSynthesisApproach(analysis: any): string {
    if (analysis.business.complexity === 'expert') return 'expert_synthesis';
    if (analysis.constraints.constraintComplexity === 'high') return 'constraint_aware_synthesis';
    if (analysis.business.multilingualContext) return 'multilingual_synthesis';
    return 'standard_synthesis';
  }
}

// Export singleton instance
export const multilingualBusinessIntelligence = new MultilingualBusinessIntelligence();
