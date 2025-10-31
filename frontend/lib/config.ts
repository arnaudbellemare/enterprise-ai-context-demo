/**
 * Configuration for real testing APIs
 */

export const config = {
  browserbase: {
    apiKey: process.env.BROWSERBASE_API_KEY || 'bb_live_T6sBxkEWzTTT-bG7I15sgFk1MmA',
    projectId: process.env.BROWSERBASE_PROJECT_ID || '4a7f24c2-3889-495a-811b-c68e3837eb08',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  testing: {
    useRealAPIs: true, // Set to false to use mock data
    enableCostTracking: true,
    enablePerformanceMetrics: true,
  }
};

// Validate configuration
export function validateConfig() {
  const warnings: string[] = [];
  
  if (!config.openai.apiKey) {
    warnings.push('⚠️ OPENAI_API_KEY not set - will use mock LLM responses');
  }
  
  if (!config.browserbase.apiKey || !config.browserbase.projectId) {
    warnings.push('⚠️ Browserbase credentials not set - will use mock browser automation');
  }
  
  if (warnings.length > 0) {
    logger.info('Configuration warnings:');
    warnings.forEach(warning => logger.info(warning));
  } else {
    logger.info('✅ All API credentials configured for real testing');
  }
  
  return warnings.length === 0;
}
