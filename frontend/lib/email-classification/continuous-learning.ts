/**
 * Continuous Learning Pipeline for Email Classification
 * 
 * Automatically improves classification accuracy by:
 * 1. Auto-labeling high-confidence examples (>0.9)
 * 2. Adding medium-confidence examples to active learning queue
 * 3. Prioritizing low-confidence examples for human review
 */

import { EmailClassification, EmailTemplate } from '../email-template-classifier';
import { storeLabeledExample } from './supabase-storage';
import { addToLabelingQueue } from './supabase-storage';
import { trackClassificationMetric } from './supabase-storage';
import { generateEmbeddingCached } from './embedding-selector';
import * as crypto from 'crypto';

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

/**
 * Hash email for deduplication
 */
function hashEmail(emailText: string): string {
  return crypto.createHash('sha256').update(emailText).digest('hex');
}

/**
 * Calculate diversity score (distance to existing examples)
 */
async function calculateDiversity(emailText: string): Promise<number> {
  try {
    const { supabase } = await import('../supabase');
    const embedding = await generateEmbeddingCached(emailText);
    
    // Find most similar example
    const { data } = await supabase.rpc('match_email_examples', {
      query_embedding: embedding,
      match_threshold: 0.0,
      match_count: 1
    });

    if (!data || data.length === 0) {
      return 1.0; // No similar examples = high diversity
    }

    // Diversity = 1 - similarity
    return 1 - (data[0].similarity || 0);
  } catch (error) {
    console.warn('Failed to calculate diversity:', error);
    return 0.5; // Default medium diversity
  }
}

/**
 * Calculate priority score for active learning
 * Note: Priority is now calculated in addToLabelingQueue function
 * This function is kept for potential future use
 */
async function calculatePriority(
  classification: EmailClassification,
  emailText: string
): Promise<number> {
  const uncertainty = 1 - classification.confidence;
  const diversity = await calculateDiversity(emailText);
  
  // Priority = weighted combination
  // Higher uncertainty + higher diversity = higher priority
  return 0.6 * uncertainty + 0.4 * diversity;
}

/**
 * Handle production email with continuous learning
 */
export async function handleProductionEmail(
  email: EmailRequest,
  classification: EmailClassification
): Promise<void> {
  const emailHash = hashEmail(email.body);
  const templateId = classification.template.id;
  const confidence = classification.confidence;

  try {
    // High confidence (>0.9) → Auto-label and store
    if (confidence > 0.9) {
      await storeLabeledExample({
        email: email.body,
        template: classification.template.name,
        templateId: templateId,
        confidence: confidence,
        entities: classification.extractedEntities,
        source: 'auto-labeled',
        userId: 'system'
      });

      console.log(`Auto-labeled email (confidence: ${confidence.toFixed(2)}, template: ${templateId})`);
    }

    // Medium confidence (0.5-0.9) → Active learning queue
    else if (confidence >= 0.5) {
      const diversity = await calculateDiversity(email.body);
      const uncertainty = 1 - confidence;

      await addToLabelingQueue(
        email.body,
        templateId,
        classification.template.name,
        confidence,
        uncertainty,
        diversity
      );

      console.log(`Added to active learning queue (confidence: ${confidence.toFixed(2)}, uncertainty: ${uncertainty.toFixed(2)})`);
    }

    // Low confidence (<0.5) → Priority queue
    else {
      const diversity = await calculateDiversity(email.body);
      const uncertainty = 1 - confidence;

      await addToLabelingQueue(
        email.body,
        templateId,
        classification.template.name,
        confidence,
        uncertainty,
        diversity
      );

      console.log(`Added to priority queue (confidence: ${confidence.toFixed(2)})`);
    }

    // Track metrics
    await trackClassificationMetric(
      emailHash,
      templateId,
      classification.template.name,
      confidence,
      'hybrid',
      0 // processing_time_ms - will be filled by caller
    );
  } catch (error) {
    console.error('Error in continuous learning pipeline:', error);
    // Don't throw - we don't want to break classification if learning fails
  }
}

/**
 * Process user feedback for calibration
 */
export async function processUserFeedback(
  emailHash: string,
  predictedTemplateId: string,
  predictedConfidence: number,
  actualTemplateId: string,
  correct: boolean
): Promise<void> {
  try {
    const { getConfidenceCalibrator } = await import('./confidence-calibrator');
    const calibrator = getConfidenceCalibrator();

    // Add feedback for calibration
    await calibrator.addFeedback(
      predictedConfidence,
      correct,
      predictedTemplateId
    );

    // Update metrics
    const { supabase } = await import('../supabase');
    await supabase
      .from('email_classification_metrics')
      .update({
        actual_template_id: actualTemplateId,
        correct: correct,
        updated_at: new Date().toISOString()
      })
      .eq('email_hash', emailHash);

    console.log(`Processed user feedback: ${correct ? 'correct' : 'incorrect'}`);
  } catch (error) {
    console.error('Error processing user feedback:', error);
  }
}

