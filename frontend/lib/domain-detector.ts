/**
 * Domain Detector
 * Standalone module for detecting query domain
 * Extracted from PermutationEngine for independent benchmarking
 */

export type Domain = 'crypto' | 'financial' | 'legal' | 'healthcare' | 'real_estate' | 'manufacturing' | 'education' | 'technology' | 'marketing' | 'logistics' | 'energy' | 'agriculture' | 'general';

export async function detectDomain(query: string): Promise<Domain> {
  const lower = query.toLowerCase();
  
  // Crypto domain
  if (lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('ethereum') ||
      lower.includes('blockchain') || lower.includes('btc') || lower.includes('eth') ||
      lower.includes('defi') || lower.includes('nft') || lower.includes('web3')) {
    return 'crypto';
  }
  
  // Financial domain
  if (lower.includes('investment') || lower.includes('stock') || lower.includes('portfolio') ||
      lower.includes('roi') || lower.includes('dividend') || lower.includes('asset') ||
      lower.includes('bond') || lower.includes('mutual fund') || lower.includes('etf') ||
      lower.includes('profit') || lower.includes('loss') || lower.includes('revenue')) {
    return 'financial';
  }
  
  // Legal domain
  if (lower.includes('legal') || lower.includes('law') || lower.includes('court') ||
      lower.includes('contract') || lower.includes('compliance') || lower.includes('regulation') ||
      lower.includes('lawsuit') || lower.includes('patent') || lower.includes('trademark') ||
      lower.includes('liability') || lower.includes('attorney') || lower.includes('statute')) {
    return 'legal';
  }
  
  // Healthcare domain
  if (lower.includes('health') || lower.includes('medical') || lower.includes('disease') ||
      lower.includes('treatment') || lower.includes('diagnosis') || lower.includes('patient') ||
      lower.includes('drug') || lower.includes('medication') || lower.includes('clinical') ||
      lower.includes('therapy') || lower.includes('symptom') || lower.includes('hospital')) {
    return 'healthcare';
  }
  
  // Real Estate domain
  if (lower.includes('real estate') || lower.includes('property') || lower.includes('mortgage') ||
      lower.includes('house') || lower.includes('apartment') || lower.includes('rental') ||
      lower.includes('landlord') || lower.includes('tenant') || lower.includes('lease') ||
      lower.includes('housing') || lower.includes('commercial property')) {
    return 'real_estate';
  }
  
  // ✅ NEW DOMAINS - Now 10+ domains!
  
  // Manufacturing domain
  if (lower.includes('manufacturing') || lower.includes('factory') || lower.includes('production') ||
      lower.includes('assembly') || lower.includes('robotics') || lower.includes('automation') ||
      lower.includes('supply chain') || lower.includes('logistics') || lower.includes('inventory') ||
      lower.includes('quality control') || lower.includes('industrial')) {
    return 'manufacturing';
  }
  
  // Education domain
  if (lower.includes('education') || lower.includes('school') || lower.includes('university') ||
      lower.includes('learning') || lower.includes('teaching') || lower.includes('student') ||
      lower.includes('course') || lower.includes('curriculum') || lower.includes('pedagogy') ||
      lower.includes('academic') || lower.includes('research') || lower.includes('study')) {
    return 'education';
  }
  
  // Technology domain
  if (lower.includes('technology') || lower.includes('software') || lower.includes('programming') ||
      lower.includes('ai') || lower.includes('machine learning') || lower.includes('data science') ||
      lower.includes('cloud') || lower.includes('cybersecurity') || lower.includes('algorithm') ||
      lower.includes('database') || lower.includes('api') || lower.includes('development')) {
    return 'technology';
  }
  
  // Marketing domain
  if (lower.includes('marketing') || lower.includes('advertising') || lower.includes('brand') ||
      lower.includes('campaign') || lower.includes('social media') || lower.includes('seo') ||
      lower.includes('content') || lower.includes('analytics') || lower.includes('conversion') ||
      lower.includes('promotion') || lower.includes('audience') || lower.includes('engagement')) {
    return 'marketing';
  }
  
  // Logistics domain
  if (lower.includes('logistics') || lower.includes('shipping') || lower.includes('transportation') ||
      lower.includes('warehouse') || lower.includes('inventory') || lower.includes('delivery') ||
      lower.includes('freight') || lower.includes('distribution') || lower.includes('fulfillment') ||
      lower.includes('cargo') || lower.includes('supply chain')) {
    return 'logistics';
  }
  
  // Energy domain
  if (lower.includes('energy') || lower.includes('renewable') || lower.includes('solar') ||
      lower.includes('wind') || lower.includes('electricity') || lower.includes('power') ||
      lower.includes('grid') || lower.includes('sustainability') || lower.includes('carbon') ||
      lower.includes('battery') || lower.includes('nuclear') || lower.includes('fossil fuel')) {
    return 'energy';
  }
  
  // Agriculture domain
  if (lower.includes('agriculture') || lower.includes('farming') || lower.includes('crop') ||
      lower.includes('livestock') || lower.includes('soil') || lower.includes('irrigation') ||
      lower.includes('harvest') || lower.includes('sustainable farming') || lower.includes('organic') ||
      lower.includes('fertilizer') || lower.includes('pesticide') || lower.includes('greenhouse')) {
    return 'agriculture';
  }
  
  // Default to general
  return 'general';
}

export interface DomainDetails {
  domain: Domain;
  confidence: number;
  keywords: string[];
  difficulty_modifier: number;
}

export async function detectDomainWithDetails(query: string): Promise<DomainDetails> {
  const domain = await detectDomain(query);
  const lower = query.toLowerCase();
  
  const domainKeywords: Record<Domain, string[]> = {
    crypto: ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'btc', 'eth', 'defi', 'nft', 'web3'],
    financial: ['investment', 'stock', 'portfolio', 'roi', 'dividend', 'asset', 'bond'],
    legal: ['legal', 'law', 'court', 'contract', 'compliance', 'regulation'],
    healthcare: ['health', 'medical', 'disease', 'treatment', 'diagnosis', 'patient'],
    real_estate: ['real estate', 'property', 'mortgage', 'house', 'rental'],
    manufacturing: ['manufacturing', 'factory', 'production', 'assembly', 'robotics', 'automation'],
    education: ['education', 'school', 'university', 'learning', 'teaching', 'student'],
    technology: ['technology', 'software', 'programming', 'ai', 'machine learning', 'cloud'],
    marketing: ['marketing', 'advertising', 'brand', 'campaign', 'social media', 'seo'],
    logistics: ['logistics', 'shipping', 'transportation', 'warehouse', 'inventory', 'delivery'],
    energy: ['energy', 'renewable', 'solar', 'wind', 'electricity', 'power'],
    agriculture: ['agriculture', 'farming', 'crop', 'livestock', 'soil', 'irrigation'],
    general: []
  };
  
  const keywords = domainKeywords[domain].filter(kw => lower.includes(kw));
  
  const difficultyModifiers: Record<Domain, number> = {
    crypto: 0.8,
    financial: 0.7,
    legal: 0.9,
    healthcare: 0.85,
    real_estate: 0.6,
    manufacturing: 0.75,
    education: 0.6,
    technology: 0.8,
    marketing: 0.65,
    logistics: 0.7,
    energy: 0.8,
    agriculture: 0.65,
    general: 0.5
  };
  
  return {
    domain,
    confidence: keywords.length > 0 ? Math.min(0.95, 0.6 + (keywords.length * 0.1)) : 0.5,
    keywords,
    difficulty_modifier: difficultyModifiers[domain]
  };
}

