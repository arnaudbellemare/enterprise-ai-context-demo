/**
 * Context Builder for Email Response Generation
 * 
 * Extracts and structures context from email classification
 * State belongs in structured objects, not scattered variables
 */

import { EmailClassification } from '@/lib/email-template-classifier';
import { EmailRequest, ResponseContext } from './response-registry';
import { detectLanguage } from './language-detection';

/**
 * Extract unit number from email body or entities
 */
export function extractUnitNumber(
  body: string,
  entities: EmailClassification['extractedEntities']
): string | null {
  // Try regex patterns first
  const unitMatch = body.match(/unit[ée]\s*#?\s*(\d{4})/i) || 
                    body.match(/unité\s*#?\s*(\d{4})/i);
  
  if (unitMatch) {
    return unitMatch[1] || unitMatch[0].match(/\d{4}/)?.[0] || null;
  }

  // Try entities
  const unitFromEntities = entities.locations?.find(loc => /\d{4}/.test(loc));
  if (unitFromEntities) {
    const match = unitFromEntities.match(/\d{4}/);
    return match ? match[0] : null;
  }

  return null;
}

/**
 * Build response context from classification and email
 */
export function buildResponseContext(
  classification: EmailClassification,
  originalEmail: EmailRequest
): ResponseContext {
  const language = detectLanguage(originalEmail.body);
  const unitNumber = extractUnitNumber(originalEmail.body, classification.extractedEntities);

  return {
    classification,
    originalEmail,
    unitNumber,
    language,
    entities: classification.extractedEntities
  };
}

