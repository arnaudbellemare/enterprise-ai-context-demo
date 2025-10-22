/**
 * Production Initialization Script
 * 
 * Initializes API key manager, logger, and other production systems
 * Call this at application startup
 */

import { initializeAPIKeys } from './api-key-manager';
import { initializeLogger } from './logger';

/**
 * Initialize all production systems
 */
export const initializeProduction = () => {
  console.log('🚀 Initializing production systems...');
  
  try {
    // Initialize API key manager
    initializeAPIKeys();
    
    // Initialize structured logger
    initializeLogger();
    
    console.log('✅ Production systems initialized successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to initialize production systems:', error);
    throw error;
  }
};

/**
 * Initialize with environment-specific settings
 */
export const initializeWithEnvironment = (env: 'development' | 'production' | 'test') => {
  console.log(`🔧 Initializing for ${env} environment...`);
  
  // Set environment-specific configurations
  if (env === 'production') {
    // Production-specific settings
    process.env.LOG_LEVEL = 'INFO';
  } else if (env === 'development') {
    // Development-specific settings
    process.env.LOG_LEVEL = 'DEBUG';
  } else if (env === 'test') {
    // Test-specific settings
    process.env.LOG_LEVEL = 'ERROR';
  }
  
  // Initialize systems
  initializeProduction();
};
