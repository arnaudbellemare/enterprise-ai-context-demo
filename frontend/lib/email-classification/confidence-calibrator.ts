/**
 * Confidence Calibrator for Email Classification
 * 
 * Implements temperature scaling to calibrate confidence scores
 * Based on research: "On Calibration of Modern Neural Networks" (Guo et al., 2017)
 */

import { supabase } from '../supabase';

export interface CalibrationData {
  predicted_confidence: number;
  actual_correct: boolean;
  template_id: string;
}

export class ConfidenceCalibrator {
  private perTemplateTemperatures: Map<string, number> = new Map();
  private globalTemperature: number = 1.0;
  private minCalibrationSamples = 50;

  /**
   * Add feedback for calibration
   */
  async addFeedback(
    predictedConfidence: number,
    actualCorrect: boolean,
    templateId: string
  ): Promise<void> {
    try {
      // Store in Supabase
      await supabase.from('email_confidence_calibration').insert({
        predicted_confidence: predictedConfidence,
        actual_correct: actualCorrect,
        template_id: templateId
      });

      // Check if we have enough samples for recalibration
      const count = await this.getCalibrationDataCount(templateId);
      if (count >= this.minCalibrationSamples && count % 50 === 0) {
        await this.calibrate(templateId);
      }
    } catch (error) {
      console.error('Error adding calibration feedback:', error);
    }
  }

  /**
   * Calibrate temperature for a specific template
   */
  async calibrate(templateId: string): Promise<void> {
    try {
      const data = await this.getCalibrationData(templateId, 500);
      
      if (data.length < this.minCalibrationSamples) {
        // Not enough data, use global temperature
        this.perTemplateTemperatures.set(templateId, this.globalTemperature);
        return;
      }

      // Find optimal temperature T
      let bestT = 1.0;
      let bestLoss = Infinity;

      for (let T = 0.1; T <= 5.0; T += 0.1) {
        const loss = this.calculateLoss(data, T);
        if (loss < bestLoss) {
          bestLoss = loss;
          bestT = T;
        }
      }

      this.perTemplateTemperatures.set(templateId, bestT);
      
      console.log(`Calibrated template ${templateId}: T=${bestT.toFixed(2)}, loss=${bestLoss.toFixed(4)}`);
    } catch (error) {
      console.error(`Error calibrating template ${templateId}:`, error);
    }
  }

  /**
   * Calibrate global temperature from all templates
   */
  async calibrateGlobal(): Promise<void> {
    try {
      const { data } = await supabase
        .from('email_confidence_calibration')
        .select('predicted_confidence, actual_correct, template_id')
        .limit(1000);

      if (!data || data.length < this.minCalibrationSamples) {
        return;
      }

      // Convert to CalibrationData format
      const calibrationData: CalibrationData[] = data.map(item => ({
        predicted_confidence: item.predicted_confidence,
        actual_correct: item.actual_correct,
        template_id: item.template_id || 'unknown'
      }));

      let bestT = 1.0;
      let bestLoss = Infinity;

      for (let T = 0.1; T <= 5.0; T += 0.1) {
        const loss = this.calculateLoss(calibrationData, T);
        if (loss < bestLoss) {
          bestLoss = loss;
          bestT = T;
        }
      }

      this.globalTemperature = bestT;
      console.log(`Calibrated global temperature: T=${bestT.toFixed(2)}, loss=${bestLoss.toFixed(4)}`);
    } catch (error) {
      console.error('Error calibrating global temperature:', error);
    }
  }

  /**
   * Calibrate a confidence score
   */
  calibrateConfidence(rawConfidence: number, templateId?: string): number {
    const T = templateId 
      ? (this.perTemplateTemperatures.get(templateId) || this.globalTemperature)
      : this.globalTemperature;
    
    return this.applyTemperature(rawConfidence, T);
  }

  /**
   * Apply temperature scaling to confidence
   */
  private applyTemperature(confidence: number, T: number): number {
    // Clamp confidence to avoid log(0) or log(infinity)
    const clamped = Math.max(0.001, Math.min(0.999, confidence));
    const logit = Math.log(clamped / (1 - clamped));
    const scaledLogit = logit / T;
    return 1 / (1 + Math.exp(-scaledLogit));
  }

  /**
   * Calculate cross-entropy loss for a given temperature
   */
  private calculateLoss(data: CalibrationData[], T: number): number {
    let loss = 0;
    let count = 0;

    for (const item of data) {
      const calibrated = this.applyTemperature(item.predicted_confidence, T);
      const target = item.actual_correct ? 1 : 0;
      
      // Cross-entropy loss
      loss += -target * Math.log(Math.max(0.001, calibrated)) - 
              (1 - target) * Math.log(Math.max(0.001, 1 - calibrated));
      count++;
    }

    return count > 0 ? loss / count : Infinity;
  }

  /**
   * Get calibration data for a template
   */
  private async getCalibrationData(
    templateId: string,
    limit: number = 500
  ): Promise<CalibrationData[]> {
    try {
      const { data, error } = await supabase
        .from('email_confidence_calibration')
        .select('predicted_confidence, actual_correct, template_id')
        .eq('template_id', templateId)
        .order('created_at', { ascending: false })
        .limit(limit);

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
   * Get count of calibration samples for a template
   */
  private async getCalibrationDataCount(templateId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('email_confidence_calibration')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', templateId);

      if (error) {
        return 0;
      }

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get Expected Calibration Error (ECE) for a template
   */
  async getECE(templateId: string, numBins: number = 10): Promise<number> {
    const data = await this.getCalibrationData(templateId, 1000);
    
    if (data.length === 0) {
      return 0;
    }

    const binSize = 1.0 / numBins;
    let ece = 0;

    for (let i = 0; i < numBins; i++) {
      const minConf = i * binSize;
      const maxConf = (i + 1) * binSize;
      
      const binData = data.filter(
        item => item.predicted_confidence >= minConf && 
                item.predicted_confidence < maxConf
      );

      if (binData.length > 0) {
        const avgConf = binData.reduce((sum, item) => sum + item.predicted_confidence, 0) / binData.length;
        const accuracy = binData.filter(item => item.actual_correct).length / binData.length;
        const weight = binData.length / data.length;
        
        ece += weight * Math.abs(avgConf - accuracy);
      }
    }

    return ece;
  }

  /**
   * Initialize calibrator (load existing temperatures if available)
   */
  async initialize(): Promise<void> {
    // Calibrate global temperature
    await this.calibrateGlobal();
    
    // Calibrate per-template temperatures for templates with enough data
    const { data: templates } = await supabase
      .from('email_confidence_calibration')
      .select('template_id')
      .limit(1000);

    if (templates) {
      const uniqueTemplates = Array.from(new Set(templates.map(t => t.template_id)));
      
      for (const templateId of uniqueTemplates) {
        const count = await this.getCalibrationDataCount(templateId);
        if (count >= this.minCalibrationSamples) {
          await this.calibrate(templateId);
        }
      }
    }
  }
}

// Singleton instance
let calibratorInstance: ConfidenceCalibrator | null = null;

export function getConfidenceCalibrator(): ConfidenceCalibrator {
  if (!calibratorInstance) {
    calibratorInstance = new ConfidenceCalibrator();
    // Initialize asynchronously (don't await)
    calibratorInstance.initialize().catch(console.error);
  }
  return calibratorInstance;
}

