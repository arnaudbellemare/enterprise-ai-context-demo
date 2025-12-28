/**
 * Supabase Storage Layer for Email Classification
 *
 * Handles persistent storage of labeled examples with embeddings
 */

import { supabase } from '../supabase';
import { FewShotExample } from '../email-template-classifier';
import { generateEmbedding, generateEmbeddingCached } from './embedding-selector';
import * as crypto from 'crypto';

export interface StoredExample {
  id: string;
  email_text: string;
  template_id: string;
  template_name: string;
  confidence: number;
  embedding?: number[];
  entities: Record<string, any>;
  user_id?: string;
  source: 'manual' | 'auto-labeled' | 'corrected';
  created_at: string;
  updated_at: string;
}

export interface LabelingCandidate {
  id: string;
  email_text: string;
  email_hash: string;
  predicted_template_id?: string;
  predicted_template_name?: string;
  confidence?: number;
  uncertainty?: number;
  diversity?: number;
  priority?: number;
  status: 'pending' | 'labeled' | 'skipped' | 'archived';
  labeled_by?: string;
  labeled_template_id?: string;
  labeled_template_name?: string;
  labeled_at?: string;
  created_at: string;
}

/**
 * Store a labeled example with embedding
 */
export async function storeLabeledExample(
  example: FewShotExample & {
    templateId: string;
    userId?: string;
    source?: 'manual' | 'auto-labeled' | 'corrected';
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Generate embedding
    const embedding = await generateEmbedding(example.email);

    // Insert into Supabase
    const { data, error } = await supabase
      .from('email_labeled_examples')
      .insert({
        email_text: example.email,
        template_id: example.templateId,
        template_name: example.template,
        confidence: example.confidence || 1.0,
        embedding,
        entities: example.entities || {},
        user_id: example.userId,
        source: example.source || 'manual'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error storing labeled example:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error('Error in storeLabeledExample:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Store multiple labeled examples in batch
 */
export async function storeLabeledExamplesBatch(
  examples: Array<FewShotExample & {
    templateId: string;
    userId?: string;
    source?: 'manual' | 'auto-labeled' | 'corrected';
  }>
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const errors: string[] = [];
  let successCount = 0;

  // Process in parallel with rate limiting
  const batchSize = 5;
  for (let i = 0; i < examples.length; i += batchSize) {
    const batch = examples.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(ex => storeLabeledExample(ex))
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        successCount++;
      } else if (result.status === 'rejected') {
        errors.push(result.reason.message || 'Unknown error');
      } else if (result.status === 'fulfilled' && result.value.error) {
        errors.push(result.value.error);
      }
    }
  }

  return {
    success: errors.length === 0,
    count: successCount,
    errors
  };
}

/**
 * Get labeled examples by template
 */
export async function getLabeledExamplesByTemplate(
  templateId: string,
  limit: number = 50
): Promise<FewShotExample[]> {
  try {
    const { data, error } = await supabase
      .from('email_labeled_examples')
      .select('email_text, template_name, entities, confidence')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching examples:', error);
      return [];
    }

    return (data || []).map(row => ({
      email: row.email_text,
      template: row.template_name,
      entities: row.entities || {},
      confidence: row.confidence || 1.0
    }));
  } catch (error) {
    console.error('Error in getLabeledExamplesByTemplate:', error);
    return [];
  }
}

/**
 * Get all labeled examples
 */
export async function getAllLabeledExamples(
  limit: number = 1000
): Promise<FewShotExample[]> {
  try {
    const { data, error } = await supabase
      .from('email_labeled_examples')
      .select('email_text, template_name, entities, confidence')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching all examples:', error);
      return [];
    }

    return (data || []).map(row => ({
      email: row.email_text,
      template: row.template_name,
      entities: row.entities || {},
      confidence: row.confidence || 1.0
    }));
  } catch (error) {
    console.error('Error in getAllLabeledExamples:', error);
    return [];
  }
}

/**
 * Add email to labeling queue (active learning)
 */
export async function addToLabelingQueue(
  email: string,
  predictedTemplateId?: string,
  predictedTemplateName?: string,
  confidence?: number,
  uncertainty?: number,
  diversity?: number
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Generate hash to prevent duplicates
    const emailHash = crypto
      .createHash('sha256')
      .update(email)
      .digest('hex');

    // Check if already in queue
    const { data: existing } = await supabase
      .from('email_labeling_queue')
      .select('id')
      .eq('email_hash', emailHash)
      .single();

    if (existing) {
      return { success: true, id: existing.id };
    }

    // Calculate priority score (0.6 * uncertainty + 0.4 * diversity)
    const priority = uncertainty !== undefined && diversity !== undefined
      ? (0.6 * uncertainty) + (0.4 * diversity)
      : uncertainty || 0.5;

    // Insert into queue
    const { data, error } = await supabase
      .from('email_labeling_queue')
      .insert({
        email_text: email,
        email_hash: emailHash,
        predicted_template_id: predictedTemplateId,
        predicted_template_name: predictedTemplateName,
        confidence,
        uncertainty,
        diversity,
        priority,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error adding to labeling queue:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error('Error in addToLabelingQueue:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Get next labeling candidates (active learning)
 */
export async function getNextLabelingCandidates(
  limit: number = 10
): Promise<LabelingCandidate[]> {
  try {
    const { data, error } = await supabase.rpc('get_next_labeling_candidates', {
      limit_count: limit
    });

    if (error) {
      console.error('Error fetching labeling candidates:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getNextLabelingCandidates:', error);
    return [];
  }
}

/**
 * Mark labeling candidate as labeled
 */
export async function markCandidateLabeled(
  candidateId: string,
  labeledTemplateId: string,
  labeledTemplateName: string,
  labeledBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('email_labeling_queue')
      .update({
        status: 'labeled',
        labeled_template_id: labeledTemplateId,
        labeled_template_name: labeledTemplateName,
        labeled_by: labeledBy,
        labeled_at: new Date().toISOString()
      })
      .eq('id', candidateId);

    if (error) {
      console.error('Error marking candidate as labeled:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in markCandidateLabeled:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Track classification metrics
 */
export async function trackClassificationMetric(
  emailHash: string,
  predictedTemplateId: string,
  predictedTemplateName: string,
  predictedConfidence: number,
  classificationMethod: 'rule-based' | 'llm' | 'hybrid',
  processingTimeMs?: number,
  actualTemplateId?: string,
  actualTemplateName?: string,
  correct?: boolean,
  userFeedback?: string,
  feedbackType?: 'correct' | 'incorrect' | 'unsure'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('email_classification_metrics')
      .insert({
        email_hash: emailHash,
        predicted_template_id: predictedTemplateId,
        predicted_template_name: predictedTemplateName,
        predicted_confidence: predictedConfidence,
        actual_template_id: actualTemplateId,
        actual_template_name: actualTemplateName,
        correct,
        user_feedback: userFeedback,
        feedback_type: feedbackType,
        classification_method: classificationMethod,
        processing_time_ms: processingTimeMs
      });

    if (error) {
      console.error('Error tracking classification metric:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in trackClassificationMetric:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Get classification accuracy by template
 */
export async function getClassificationAccuracy(
  templateId?: string,
  daysBack: number = 30
): Promise<Array<{
  template_id: string;
  template_name: string;
  total_count: number;
  correct_count: number;
  accuracy: number;
}>> {
  try {
    const { data, error } = await supabase.rpc('get_classification_accuracy', {
      template_filter: templateId || null,
      days_back: daysBack
    });

    if (error) {
      console.error('Error fetching classification accuracy:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getClassificationAccuracy:', error);
    return [];
  }
}

/**
 * Store confidence calibration data
 */
export async function storeCalibrationData(
  predictedConfidence: number,
  actualCorrect: boolean,
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('email_confidence_calibration')
      .insert({
        predicted_confidence: predictedConfidence,
        actual_correct: actualCorrect,
        template_id: templateId
      });

    if (error) {
      console.error('Error storing calibration data:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in storeCalibrationData:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Get calibration data for temperature scaling
 */
export async function getCalibrationData(
  templateId?: string,
  limit: number = 500
): Promise<Array<{ predicted_confidence: number; actual_correct: boolean }>> {
  try {
    let query = supabase
      .from('email_confidence_calibration')
      .select('predicted_confidence, actual_correct')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (templateId) {
      query = query.eq('template_id', templateId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching calibration data:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCalibrationData:', error);
    return [];
  }
}

/**
 * Delete old examples (for cleanup)
 */
export async function cleanupOldExamples(
  daysOld: number = 90
): Promise<{ success: boolean; deleted: number; error?: string }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('email_labeled_examples')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up old examples:', error);
      return { success: false, deleted: 0, error: error.message };
    }

    return { success: true, deleted: data?.length || 0 };
  } catch (error: any) {
    console.error('Error in cleanupOldExamples:', error);
    return { success: false, deleted: 0, error: error.message || 'Unknown error' };
  }
}
