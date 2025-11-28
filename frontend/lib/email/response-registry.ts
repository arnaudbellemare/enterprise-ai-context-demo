/**
 * Email Response Generator Registry
 * 
 * Registry pattern for response generators - replaces large switch statement
 * State belongs in files, not in code structure
 */

import { EmailClassification, EmailTemplate } from '@/lib/email-template-classifier';

export interface EmailRequest {
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export interface ResponseContext {
  classification: EmailClassification;
  originalEmail: EmailRequest;
  unitNumber: string | null;
  language: 'fr' | 'en';
  entities: EmailClassification['extractedEntities'];
}

export interface ResponseResult {
  subject: string;
  body: string;
  html?: string;
  requiresHumanReview: boolean;
}

export type ResponseGenerator = (context: ResponseContext) => string;

export interface ResponseConfig {
  generator: ResponseGenerator;
  subjectGenerator?: (context: ResponseContext) => string;
  requiresHumanReview?: (context: ResponseContext) => boolean;
}

/**
 * Response Generator Registry
 * Structured data survives context boundaries better than switch statements
 */
class ResponseRegistry {
  private generators = new Map<string, ResponseConfig>();

  /**
   * Register a response generator for a template ID
   */
  register(templateId: string, config: ResponseConfig): void {
    this.generators.set(templateId, config);
  }

  /**
   * Get response generator for a template
   */
  get(templateId: string): ResponseConfig | undefined {
    return this.generators.get(templateId);
  }

  /**
   * Check if a template has a registered generator
   */
  has(templateId: string): boolean {
    return this.generators.has(templateId);
  }

  /**
   * Get all registered template IDs
   */
  getAllTemplateIds(): string[] {
    return Array.from(this.generators.keys());
  }
}

// Singleton instance
export const responseRegistry = new ResponseRegistry();

/**
 * Generate response using registry
 */
export function generateResponse(context: ResponseContext): ResponseResult {
  const templateId = context.classification.template.id;
  const config = responseRegistry.get(templateId);

  if (!config) {
    // Fallback to generic response
    return {
      subject: `Re: ${context.originalEmail.subject}`,
      body: generateGenericResponse(context),
      requiresHumanReview: true
    };
  }

  const body = config.generator(context);
  const subject = config.subjectGenerator
    ? config.subjectGenerator(context)
    : `Re: ${context.originalEmail.subject}`;
  const requiresHumanReview = config.requiresHumanReview
    ? config.requiresHumanReview(context)
    : context.classification.confidence < 0.7;

  return {
    subject,
    body,
    requiresHumanReview
  };
}

/**
 * Default generic response generator
 */
function generateGenericResponse(context: ResponseContext): string {
  const { language, originalEmail } = context;
  
  if (language === 'en') {
    return `Hello,

We have received your email and are processing your request.

Our team will review your message and respond as soon as possible.

Best regards,
Management Team
Gestion Velora`;
  }

  return `Bonjour,

Nous avons bien reçu votre courriel et traitons votre demande.

Notre équipe examinera votre message et vous répondra dans les plus brefs délais.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

