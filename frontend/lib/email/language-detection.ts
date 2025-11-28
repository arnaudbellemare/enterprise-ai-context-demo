/**
 * Language Detection with Caching
 * 
 * Extracted to separate module for maintainability
 * State (cache) belongs in this module, not in route handlers
 */

const languageCache = new Map<string, 'fr' | 'en'>();
const MAX_CACHE_SIZE = 100;

/**
 * Detect email language with caching for performance
 */
export function detectLanguage(text: string): 'fr' | 'en' {
  if (!text || typeof text !== 'string') {
    return 'en'; // Default to English for invalid input
  }

  // Check cache first (use first 100 chars as key)
  const cacheKey = text.substring(0, 100).toLowerCase();
  if (languageCache.has(cacheKey)) {
    return languageCache.get(cacheKey)!;
  }

  const frenchWords = [
    'bonjour', 'merci', 'déménagement', 'copropriétaire', 'syndicat', 
    'réunion', 'demande', 'ascenseur', 'unité', 'frais', 'dépôt', 'garantie'
  ];
  const englishWords = [
    'hello', 'thank', 'moving', 'condo', 'board', 'meeting', 
    'request', 'elevator', 'unit', 'fee', 'deposit', 'guarantee'
  ];

  const lowerText = text.toLowerCase();
  const frenchCount = frenchWords.filter(word => lowerText.includes(word)).length;
  const englishCount = englishWords.filter(word => lowerText.includes(word)).length;

  const result = frenchCount > englishCount ? 'fr' : 'en';
  
  // Cache result with LRU eviction
  if (languageCache.size >= MAX_CACHE_SIZE) {
    const firstKey = languageCache.keys().next().value;
    if (firstKey) {
      languageCache.delete(firstKey);
    }
  }
  languageCache.set(cacheKey, result);
  
  return result;
}

/**
 * Clear language cache (useful for testing)
 */
export function clearLanguageCache(): void {
  languageCache.clear();
}

/**
 * Get cache statistics (useful for monitoring)
 */
export function getLanguageCacheStats(): { size: number; maxSize: number } {
  return {
    size: languageCache.size,
    maxSize: MAX_CACHE_SIZE
  };
}

