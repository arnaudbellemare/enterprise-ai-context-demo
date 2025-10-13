/**
 * Configuration Encoding for Performance Learning
 * 
 * Converts configuration data into numeric vectors for machine learning.
 * Implements research-backed encoding techniques:
 * - One-hot encoding for categorical variables (most common in literature)
 * - Ordinal encoding for ranked variables
 * - Binary encoding for boolean variables
 * - Min-max normalization for continuous variables
 * - Log-scale for very small continuous values
 * 
 * Research shows 81% of studies don't use explicit encoding - this gives us
 * a competitive advantage for configuration performance prediction.
 * 
 * Based on: Configuration Learning Research, One-hot encoding (18% of studies)
 */

export type EncodingType = 'one-hot' | 'ordinal' | 'binary' | 'min-max' | 'log-scale';

export interface EncodingConfig {
  type: EncodingType;
  domain?: any[];  // For one-hot and ordinal
  min?: number;    // For min-max and log-scale
  max?: number;    // For min-max and log-scale
}

export interface FeatureInfo {
  originalName: string;
  encodedNames: string[];
  encoding: EncodingConfig;
  startIndex: number;
  endIndex: number;
}

export class ConfigurationEncoder {
  private encodings: Map<string, EncodingConfig> = new Map();
  private featureInfo: Map<string, FeatureInfo> = new Map();
  private fitted: boolean = false;
  private featureNames: string[] = [];
  private featureCount: number = 0;
  
  /**
   * Fit encoder on training data (learn encoding parameters)
   */
  fit(configurations: Record<string, any>[]) {
    if (configurations.length === 0) {
      throw new Error('Cannot fit on empty configuration set');
    }
    
    console.log(`\n🔧 Fitting Configuration Encoder on ${configurations.length} samples...`);
    
    let currentIndex = 0;
    
    // Process each feature
    const firstConfig = configurations[0];
    Object.keys(firstConfig).forEach(key => {
      // Detect encoding type
      const encoding = this.detectEncodingType(key, configurations);
      this.encodings.set(key, encoding);
      
      // Determine feature names
      const encodedNames = this.getEncodedFeatureNames(key, encoding);
      const startIndex = currentIndex;
      const endIndex = currentIndex + encodedNames.length;
      
      this.featureInfo.set(key, {
        originalName: key,
        encodedNames,
        encoding,
        startIndex,
        endIndex
      });
      
      this.featureNames.push(...encodedNames);
      currentIndex = endIndex;
      
      console.log(`  • ${key}: ${encoding.type} → ${encodedNames.length} feature(s)`);
    });
    
    this.featureCount = currentIndex;
    this.fitted = true;
    
    console.log(`✅ Encoder fitted: ${this.featureCount} total features`);
    console.log(`   Original features: ${this.encodings.size}`);
    console.log(`   Encoded features: ${this.featureCount}\n`);
  }
  
  /**
   * Encode a single configuration
   */
  encode(configuration: Record<string, any>): number[] {
    if (!this.fitted) {
      throw new Error('Encoder not fitted! Call fit() first.');
    }
    
    const encoded = new Array(this.featureCount).fill(0);
    
    Object.entries(configuration).forEach(([key, value]) => {
      const info = this.featureInfo.get(key);
      if (!info) {
        console.warn(`Feature ${key} not found in fitted encoder, skipping`);
        return;
      }
      
      const encodedValue = this.encodeValue(value, info.encoding);
      
      // Place encoded values in correct positions
      for (let i = 0; i < encodedValue.length; i++) {
        encoded[info.startIndex + i] = encodedValue[i];
      }
    });
    
    return encoded;
  }
  
  /**
   * Encode batch of configurations
   */
  encodeBatch(configurations: Record<string, any>[]): number[][] {
    return configurations.map(c => this.encode(c));
  }
  
  /**
   * Auto-detect encoding type for a feature
   */
  private detectEncodingType(
    key: string,
    allConfigs: Record<string, any>[]
  ): EncodingConfig {
    // Collect all values for this key
    const values = allConfigs
      .map(c => c[key])
      .filter(v => v !== undefined && v !== null);
    
    if (values.length === 0) {
      throw new Error(`No values found for feature: ${key}`);
    }
    
    const uniqueValues = [...new Set(values)];
    const sampleValue = values[0];
    
    // Boolean → binary
    if (typeof sampleValue === 'boolean') {
      return { type: 'binary' };
    }
    
    // String → one-hot (if few categories) or ordinal
    if (typeof sampleValue === 'string') {
      if (uniqueValues.length <= 20) {
        // Reasonable number of categories → one-hot
        return { type: 'one-hot', domain: uniqueValues.sort() };
      } else {
        // Too many categories → ordinal (alphabetical order)
        console.warn(`${key} has ${uniqueValues.length} categories, using ordinal encoding`);
        return { type: 'ordinal', domain: uniqueValues.sort() };
      }
    }
    
    // Number → check pattern
    if (typeof sampleValue === 'number') {
      // If few unique values (≤ 10) and looks discrete → ordinal
      if (uniqueValues.length <= 10) {
        const sorted = uniqueValues.sort((a: any, b: any) => a - b);
        
        // Check if exponential growth (e.g., 4, 8, 16, 32, 64)
        if (this.isExponentialSequence(sorted)) {
          return { type: 'ordinal', domain: sorted };
        }
        
        // Regular discrete values
        return { type: 'ordinal', domain: sorted };
      }
      
      // Check if very small values (< 0.01) → log-scale
      const allSmall = values.every((v: any) => Math.abs(v) < 0.01 && v !== 0);
      if (allSmall) {
        const min = Math.min(...(values as number[]));
        const max = Math.max(...(values as number[]));
        return { type: 'log-scale', min, max };
      }
      
      // Otherwise → min-max normalization
      const min = Math.min(...(values as number[]));
      const max = Math.max(...(values as number[]));
      return { type: 'min-max', min, max };
    }
    
    throw new Error(`Cannot detect encoding type for ${key}: ${typeof sampleValue}`);
  }
  
  /**
   * Check if sequence is exponential (e.g., powers of 2)
   */
  private isExponentialSequence(values: number[]): boolean {
    if (values.length < 3) return false;
    
    // Check if each value is approximately double the previous
    for (let i = 1; i < values.length; i++) {
      const ratio = values[i] / values[i - 1];
      if (ratio < 1.5 || ratio > 2.5) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Encode a single value according to its encoding config
   */
  private encodeValue(value: any, encoding: EncodingConfig): number[] {
    switch (encoding.type) {
      case 'binary':
        return [value ? 1 : 0];
      
      case 'one-hot': {
        const domain = encoding.domain!;
        const oneHot = new Array(domain.length).fill(0);
        const index = domain.indexOf(value);
        if (index >= 0) {
          oneHot[index] = 1;
        }
        return oneHot;
      }
      
      case 'ordinal': {
        const domain = encoding.domain!;
        const index = domain.indexOf(value);
        if (index < 0) {
          console.warn(`Value ${value} not in domain, using 0`);
          return [0];
        }
        // Normalize to [0, 1]
        const normalized = domain.length > 1 
          ? index / (domain.length - 1) 
          : 0;
        return [normalized];
      }
      
      case 'min-max': {
        const { min, max } = encoding;
        if (min === max) return [0];
        const normalized = (value - min!) / (max! - min!);
        return [Math.max(0, Math.min(1, normalized))];
      }
      
      case 'log-scale': {
        const { min, max } = encoding;
        const logValue = Math.log10(Math.abs(value) + 1e-10);
        const logMin = Math.log10(Math.abs(min!) + 1e-10);
        const logMax = Math.log10(Math.abs(max!) + 1e-10);
        
        if (logMin === logMax) return [0];
        const normalized = (logValue - logMin) / (logMax - logMin);
        return [Math.max(0, Math.min(1, normalized))];
      }
      
      default:
        throw new Error(`Unknown encoding type: ${encoding.type}`);
    }
  }
  
  /**
   * Get feature names for an encoded feature
   */
  private getEncodedFeatureNames(
    originalName: string,
    encoding: EncodingConfig
  ): string[] {
    if (encoding.type === 'one-hot') {
      return encoding.domain!.map(val => `${originalName}_${val}`);
    } else {
      return [originalName];
    }
  }
  
  /**
   * Get all feature names (after encoding)
   */
  getFeatureNames(): string[] {
    return [...this.featureNames];
  }
  
  /**
   * Get feature info for a specific original feature
   */
  getFeatureInfo(featureName: string): FeatureInfo | undefined {
    return this.featureInfo.get(featureName);
  }
  
  /**
   * Get encoder statistics
   */
  getStats() {
    if (!this.fitted) {
      return null;
    }
    
    const encodingCounts: Record<EncodingType, number> = {
      'one-hot': 0,
      'ordinal': 0,
      'binary': 0,
      'min-max': 0,
      'log-scale': 0
    };
    
    this.encodings.forEach(enc => {
      encodingCounts[enc.type]++;
    });
    
    return {
      fitted: this.fitted,
      originalFeatures: this.encodings.size,
      encodedFeatures: this.featureCount,
      expansionRatio: this.featureCount / this.encodings.size,
      encodingTypes: encodingCounts
    };
  }
  
  /**
   * Export encoder configuration (for saving/loading)
   */
  export(): {
    encodings: Array<[string, EncodingConfig]>;
    featureNames: string[];
  } {
    return {
      encodings: Array.from(this.encodings.entries()),
      featureNames: this.featureNames
    };
  }
  
  /**
   * Import encoder configuration
   */
  import(config: {
    encodings: Array<[string, EncodingConfig]>;
    featureNames: string[];
  }) {
    this.encodings = new Map(config.encodings);
    this.featureNames = config.featureNames;
    this.fitted = true;
    
    // Rebuild feature info
    let currentIndex = 0;
    config.encodings.forEach(([key, encoding]) => {
      const encodedNames = this.getEncodedFeatureNames(key, encoding);
      this.featureInfo.set(key, {
        originalName: key,
        encodedNames,
        encoding,
        startIndex: currentIndex,
        endIndex: currentIndex + encodedNames.length
      });
      currentIndex += encodedNames.length;
    });
    
    this.featureCount = currentIndex;
  }
}

/**
 * Example usage: Encode LoRA configurations
 */
export async function demonstrateEncoding() {
  console.log('🔬 Configuration Encoding Demonstration');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const encoder = new ConfigurationEncoder();
  
  // Sample configurations (LoRA hyperparameters)
  const configs = [
    { 
      model: 'ollama', 
      rank: 4, 
      alpha: 8,
      weight_decay: 1e-6, 
      use_gepa: true, 
      temperature: 0.0 
    },
    { 
      model: 'ollama', 
      rank: 8, 
      alpha: 16,
      weight_decay: 1e-5, 
      use_gepa: true, 
      temperature: 0.3 
    },
    { 
      model: 'gpt-4o-mini', 
      rank: 16, 
      alpha: 32,
      weight_decay: 5e-5, 
      use_gepa: false, 
      temperature: 0.7 
    },
    { 
      model: 'claude', 
      rank: 32, 
      alpha: 64,
      weight_decay: 1e-4, 
      use_gepa: true, 
      temperature: 1.0 
    },
    { 
      model: 'gemini', 
      rank: 64, 
      alpha: 128,
      weight_decay: 1e-3, 
      use_gepa: false, 
      temperature: 0.5 
    }
  ];
  
  // Fit encoder
  encoder.fit(configs);
  
  // Show stats
  const stats = encoder.getStats();
  console.log('Encoder Statistics:');
  console.log(`  Original features: ${stats?.originalFeatures}`);
  console.log(`  Encoded features: ${stats?.encodedFeatures}`);
  console.log(`  Expansion ratio: ${stats?.expansionRatio.toFixed(2)}×`);
  console.log('  Encoding types:');
  Object.entries(stats?.encodingTypes || {}).forEach(([type, count]) => {
    if (count > 0) {
      console.log(`    ${type}: ${count}`);
    }
  });
  console.log('');
  
  // Encode a new configuration
  const newConfig = { 
    model: 'ollama', 
    rank: 8, 
    alpha: 16,
    weight_decay: 1e-5, 
    use_gepa: true, 
    temperature: 0.7 
  };
  
  const encoded = encoder.encode(newConfig);
  
  console.log('Encoded Configuration:');
  console.log(`  Input:`, newConfig);
  console.log(`  Output: [${encoded.map(v => v.toFixed(2)).join(', ')}]`);
  console.log(`  Vector dimension: ${encoded.length}`);
  console.log('');
  
  // Show feature mapping
  console.log('Feature Mapping:');
  const featureNames = encoder.getFeatureNames();
  featureNames.forEach((name, idx) => {
    if (encoded[idx] !== 0) {
      console.log(`  ${name}: ${encoded[idx].toFixed(4)}`);
    }
  });
  console.log('');
  
  return encoder;
}

