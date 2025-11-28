/**
 * PALIMPZEST "Convert" Operator
 * Extracts structured schema from raw email text
 * Uses cheap pre-filtering before expensive LLM calls
 */

import { TenantEmailSchema } from './palimpzest-schemas';
import { EmailOptimizer } from './palimpzest-optimizer';

/**
 * Pre-classification with keywords (PALIMPZEST reordering optimization)
 * Run cheap filters before expensive LLM
 */
function preClassifyWithKeywords(emailText: string): {
  class: TenantEmailSchema['class'];
  slots: TenantEmailSchema['extracted_slots'];
  confidence: number;
} {
  const text = emailText.toLowerCase();
  
  // Water damage keywords (high priority)
  if (text.match(/\b(water|leak|flood|dégât.*eau|sinistre|plumber|plombier)\b/)) {
    return {
      class: 'water-damage',
      slots: { issue_type: 'water damage', urgency: 'critical' },
      confidence: 0.90
    };
  }
  
  // Maintenance keywords
  if (text.match(/\b(leak|broken|repair|maintenance|fix|hvac|broken|malfunction)\b/)) {
    return {
      class: 'maintenance',
      slots: { issue_type: 'maintenance', urgency: 'medium' },
      confidence: 0.85
    };
  }
  
  // Billing keywords
  if (text.match(/\b(payment|bill|invoice|late|fee|rent|condo fees|frais|paiement)\b/)) {
    return {
      class: 'billing',
      slots: { urgency: 'high' },
      confidence: 0.80
    };
  }
  
  // Violation keywords
  if (text.match(/\b(violation|noise|smoking|fine|warning|infraction)\b/)) {
    return {
      class: 'violation',
      slots: { urgency: 'high' },
      confidence: 0.75
    };
  }
  
  // Move-in/out keywords
  if (text.match(/\b(move|moving|déménagement|emménagement|elevator|ascenseur)\b/)) {
    return {
      class: 'move-in-out',
      slots: { urgency: 'medium' },
      confidence: 0.80
    };
  }
  
  // Eviction keywords
  if (text.match(/\b(eviction|expulsion|TAL|tribunal|tenant.*remove)\b/)) {
    return {
      class: 'eviction',
      slots: { urgency: 'critical' },
      confidence: 0.85
    };
  }
  
  return {
    class: 'general',
    slots: {},
    confidence: 0.5
  };
}

/**
 * Extract unit number from email text
 */
function extractUnitNumber(text: string): string | undefined {
  const unitMatch = text.match(/unit[ée]\s*#?\s*(\d{4})/i) || 
                    text.match(/unité\s*#?\s*(\d{4})/i) ||
                    text.match(/#(\d{4})/);
  return unitMatch?.[1];
}

/**
 * Extract urgency from email text
 */
function extractUrgency(text: string): 'low' | 'medium' | 'high' | 'critical' {
  const lowerText = text.toLowerCase();
  
  if (lowerText.match(/\b(urgent|emergency|critical|asap|immediately|immédiatement)\b/)) {
    return 'critical';
  }
  
  if (lowerText.match(/\b(important|soon|quickly|rapidement)\b/)) {
    return 'high';
  }
  
  if (lowerText.match(/\b(whenever|convenient|pas pressé)\b/)) {
    return 'low';
  }
  
  return 'medium';
}

/**
 * Convert raw email to structured schema
 * PALIMPZEST optimization: Pre-filter with keywords, use cheap model when possible
 */
export async function convertEmailToSchema(
  emailText: string,
  sender: string = 'unknown',
  options: {
    useCheapPreFilter?: boolean;
    tokenBudget?: number;
    useLLM?: boolean;
  } = {}
): Promise<TenantEmailSchema> {
  const {
    useCheapPreFilter = true,
    tokenBudget = 500,
    useLLM = false
  } = options;
  
  const optimizer = new EmailOptimizer();
  
  // Step 1: Pre-classify with keywords (PALIMPZEST reordering)
  const preClassification = useCheapPreFilter 
    ? preClassifyWithKeywords(emailText)
    : { class: 'general' as const, slots: {}, confidence: 0.5 };
  
  // Step 2: Extract basic slots
  const unitNumber = extractUnitNumber(emailText);
  const urgency = extractUrgency(emailText);
  
  // Step 3: If high confidence from keywords, skip LLM (cost savings)
  if (preClassification.confidence > 0.9 && !useLLM) {
    return {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender,
      content: emailText,
      class: preClassification.class,
      extracted_slots: {
        ...preClassification.slots,
        unit: unitNumber,
        urgency
      },
      confidence: preClassification.confidence,
      requires_human_review: preClassification.class === 'eviction' || urgency === 'critical',
      processing_cost: 0.0001, // Minimal cost for keyword matching
      processing_time: 10 // ~10ms for keyword matching
    };
  }
  
  // Step 4: Token trimming if needed (PALIMPZEST optimization)
  const trimmedEmail = optimizer.trimTokens(emailText, {
    max_tokens: tokenBudget,
    preserve_context: true,
    remove_boilerplate: true,
    preserve_entities: true
  });
  
  // Step 5: Calculate complexity for model selection
  const complexity = optimizer.calculateComplexity({
    content: trimmedEmail,
    class: preClassification.class,
    confidence: preClassification.confidence,
    extracted_slots: preClassification.slots
  });
  
  // Step 6: Select optimal model (PALIMPZEST optimization)
  const modelSelection = optimizer.selectModel({
    class: preClassification.class,
    confidence: preClassification.confidence,
    extracted_slots: preClassification.slots
  }, complexity);
  
  // Step 7: If LLM is requested, use it (otherwise return pre-classification)
  if (useLLM) {
    // TODO: Integrate with actual LLM call
    // For now, return enhanced pre-classification
    return {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender,
      content: trimmedEmail,
      class: preClassification.class,
      extracted_slots: {
        ...preClassification.slots,
        unit: unitNumber,
        urgency
      },
      confidence: Math.min(preClassification.confidence + 0.1, 0.95),
      requires_human_review: preClassification.class === 'eviction' || urgency === 'critical',
      processing_cost: modelSelection.cost_estimate,
      processing_time: modelSelection.latency_estimate
    };
  }
  
  // Return pre-classification result
  return {
    id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sender,
    content: trimmedEmail,
    class: preClassification.class,
    extracted_slots: {
      ...preClassification.slots,
      unit: unitNumber,
      urgency
    },
    confidence: preClassification.confidence,
    requires_human_review: preClassification.class === 'eviction' || urgency === 'critical',
    processing_cost: 0.0001,
    processing_time: 10
  };
}

