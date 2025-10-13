/**
 * 🎯 SMART ROUTING
 * 
 * Domain detection, structured query detection, and web search detection
 */

export function detectDomain(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Financial domain
  if (lowerQuery.match(/\b(stock|finance|investment|trading|market|portfolio|roi|revenue|profit|loss|equity|bond|dividend)\b/)) {
    return 'financial';
  }
  
  // Crypto domain
  if (lowerQuery.match(/\b(crypto|bitcoin|ethereum|blockchain|nft|defi|token|wallet|liquidation|btc|eth|solana)\b/)) {
    return 'crypto';
  }
  
  // Legal domain
  if (lowerQuery.match(/\b(legal|law|contract|compliance|regulation|statute|litigation|attorney|lawyer|lawsuit)\b/)) {
    return 'legal';
  }
  
  // Medical domain
  if (lowerQuery.match(/\b(medical|health|patient|diagnosis|treatment|doctor|hospital|medicine|disease|symptom)\b/)) {
    return 'medical';
  }
  
  // Default: general
  return 'general';
}

export function detectStructuredQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Check for SQL-like patterns
  const structuredPatterns = [
    /\b(select|from|where|group by|order by|join)\b/,
    /\b(database|table|column|row|record)\b/,
    /\b(count|sum|average|max|min|total)\b/,
    /\b(list all|show all|get all|find all)\b/,
    /\b(filter by|sort by|aggregate|calculate)\b/,
    /\b(spreadsheet|csv|excel|data table)\b/,
  ];
  
  return structuredPatterns.some(pattern => pattern.test(lowerQuery));
}

export function detectWebSearchNeeded(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Check for web search indicators
  const webSearchPatterns = [
    /\b(latest|recent|current|today|now|real-time|live)\b/,
    /\b(news|updates|developments|trends|happening)\b/,
    /\b(what are|what is|how to|where|when|who)\b/,
    /\b(search|find|look up|get information)\b/,
    /\b(price|market|exchange|volume|data)\b/,
    /\b(last 24 hours|past week|this month|this year)\b/,
  ];
  
  return webSearchPatterns.some(pattern => pattern.test(lowerQuery));
}
