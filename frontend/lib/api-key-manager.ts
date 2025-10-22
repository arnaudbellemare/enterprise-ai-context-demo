/**
 * Centralized API Key Manager
 * 
 * Prevents direct access to process.env and provides secure key management
 * Addresses security issue: 29 files accessing API keys directly
 */

interface APIKeyConfig {
  openai?: string;
  openrouter?: string;
  perplexity?: string;
  anthropic?: string;
  supabase?: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
}

class APIKeyManager {
  private static instance: APIKeyManager;
  private keys: APIKeyConfig;
  private initialized: boolean = false;

  private constructor() {
    this.keys = {};
  }

  public static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }

  /**
   * Initialize API keys from environment variables
   * Should be called once at application startup
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }

    this.keys = {
      openai: process.env.OPENAI_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
      perplexity: process.env.PERPLEXITY_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      }
    };

    this.initialized = true;
    console.log('🔐 API Key Manager: Initialized with secure key management');
  }

  /**
   * Get OpenAI API key
   */
  public getOpenAIKey(): string {
    this.ensureInitialized();
    if (!this.keys.openai) {
      throw new Error('OpenAI API key not configured');
    }
    return this.keys.openai;
  }

  /**
   * Get OpenRouter API key
   */
  public getOpenRouterKey(): string {
    this.ensureInitialized();
    if (!this.keys.openrouter) {
      throw new Error('OpenRouter API key not configured');
    }
    return this.keys.openrouter;
  }

  /**
   * Get Perplexity API key
   */
  public getPerplexityKey(): string {
    this.ensureInitialized();
    if (!this.keys.perplexity) {
      throw new Error('Perplexity API key not configured');
    }
    return this.keys.perplexity;
  }

  /**
   * Get Anthropic API key
   */
  public getAnthropicKey(): string {
    this.ensureInitialized();
    if (!this.keys.anthropic) {
      throw new Error('Anthropic API key not configured');
    }
    return this.keys.anthropic;
  }

  /**
   * Get Supabase configuration
   */
  public getSupabaseConfig(): { url: string; anonKey: string; serviceRoleKey: string } {
    this.ensureInitialized();
    if (!this.keys.supabase?.url || !this.keys.supabase?.anonKey) {
      throw new Error('Supabase configuration not complete');
    }
    return this.keys.supabase;
  }

  /**
   * Check if a specific API key is available
   */
  public hasKey(service: keyof APIKeyConfig): boolean {
    this.ensureInitialized();
    if (service === 'supabase') {
      return !!(this.keys.supabase?.url && this.keys.supabase?.anonKey);
    }
    return !!this.keys[service];
  }

  /**
   * Get all available services
   */
  public getAvailableServices(): string[] {
    this.ensureInitialized();
    const services: string[] = [];
    
    if (this.hasKey('openai')) services.push('openai');
    if (this.hasKey('openrouter')) services.push('openrouter');
    if (this.hasKey('perplexity')) services.push('perplexity');
    if (this.hasKey('anthropic')) services.push('anthropic');
    if (this.hasKey('supabase')) services.push('supabase');
    
    return services;
  }

  /**
   * Validate all required keys are present
   */
  public validateConfiguration(): { valid: boolean; missing: string[] } {
    this.ensureInitialized();
    const missing: string[] = [];
    
    if (!this.hasKey('openai')) missing.push('OPENAI_API_KEY');
    if (!this.hasKey('openrouter')) missing.push('OPENROUTER_API_KEY');
    if (!this.hasKey('perplexity')) missing.push('PERPLEXITY_API_KEY');
    if (!this.hasKey('supabase')) missing.push('SUPABASE_* keys');
    
    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Get masked key for logging (shows only first 4 and last 4 characters)
   */
  public getMaskedKey(service: keyof APIKeyConfig): string {
    this.ensureInitialized();
    let key: string | undefined;
    
    if (service === 'supabase') {
      key = this.keys.supabase?.anonKey;
    } else {
      key = this.keys[service] as string;
    }
    
    if (!key) {
      return 'NOT_CONFIGURED';
    }
    
    if (key.length <= 8) {
      return '***';
    }
    
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  /**
   * Ensure the manager is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('API Key Manager not initialized. Call initialize() first.');
    }
  }

  /**
   * Reset for testing (development only)
   */
  public reset(): void {
    this.keys = {};
    this.initialized = false;
  }
}

// Export singleton instance
export const apiKeyManager = APIKeyManager.getInstance();

// Export types for use in other files
export type { APIKeyConfig };

// Convenience functions for common use cases
export const getOpenAIKey = () => apiKeyManager.getOpenAIKey();
export const getOpenRouterKey = () => apiKeyManager.getOpenRouterKey();
export const getPerplexityKey = () => apiKeyManager.getPerplexityKey();
export const getAnthropicKey = () => apiKeyManager.getAnthropicKey();
export const getSupabaseConfig = () => apiKeyManager.getSupabaseConfig();

/**
 * Initialize API Key Manager at application startup
 * Call this in your main application file
 */
export const initializeAPIKeys = () => {
  apiKeyManager.initialize();
  
  const validation = apiKeyManager.validateConfiguration();
  if (!validation.valid) {
    console.warn('⚠️ API Key Manager: Missing keys:', validation.missing);
    console.warn('   Some features may not work correctly');
  } else {
    console.log('✅ API Key Manager: All required keys configured');
  }
  
  const services = apiKeyManager.getAvailableServices();
  console.log(`🔐 API Key Manager: Available services: ${services.join(', ')}`);
};
