/**
 * Automatic Domain Detection
 * 
 * Detects the most appropriate domain for a query using semantic analysis.
 * Can optionally use teacher-student judge for ambiguous cases.
 */

export type Domain = 
  | 'general'
  | 'technology'
  | 'education'
  | 'marketing'
  | 'manufacturing'
  | 'ecommerce'
  | 'customer_service'
  | 'logistics'
  | 'human_resources'
  | 'consulting'
  | 'research'
  | 'engineering'
  | 'design'
  | 'media'
  | 'entertainment'
  | 'sports'
  | 'food'
  | 'travel'
  | 'fashion'
  | 'automotive'
  | 'energy'
  | 'agriculture'
  | 'healthcare'
  | 'finance'
  | 'legal'
  | 'real_estate'
  | 'insurance'
  | 'pharmaceuticals'
  | 'biotechnology'
  | 'environment'
  | 'sustainability'
  | 'construction'
  | 'telecommunications'
  | 'retail'
  | 'hospitality'
  | 'gaming'
  | 'music'
  | 'film'
  | 'publishing'
  | 'journalism'
  | 'advertising'
  | 'sales'
  | 'procurement'
  | 'supply_chain'
  | 'quality_control'
  | 'compliance'
  | 'risk_management'
  | 'cybersecurity'
  | 'data_science'
  | 'analytics'
  | 'ai_development'
  // Legacy domains for backwards compatibility
  | 'financial'
  | 'crypto'
  | 'art'
  | 'business'
  | 'science'
  | 'philosophy';

export interface DomainDetectionResult {
  domain: Domain;
  confidence: number;
  reasoning: string;
  keywords: string[];
}

interface DomainPattern {
  domain: Domain;
  patterns: RegExp[];
  keywords: string[];
  priority: number; // Higher priority = checked first
  excludePatterns?: RegExp[]; // Patterns that exclude this domain
}

const DOMAIN_PATTERNS: DomainPattern[] = [
  {
    domain: 'healthcare',
    patterns: [
      /\b(clinical|efficacy|diagnostic|medical|patient|treatment|healthcare|therapy|medicine|symptom|disease|condition|doctor|physician|hospital|clinical trial|health|wellness|diabetic|retinopathy|pathology|medical diagnosis|clinical assessment|therapeutic|pharmaceutical|epidemiology|surgery|medication|prescription|diagnosis|prognosis)\b/i
    ],
    keywords: ['medical', 'patient', 'treatment', 'diagnosis', 'healthcare', 'clinical', 'pharmaceutical'],
    priority: 100,
  },
  {
    domain: 'legal',
    patterns: [
      /\b(legal|law|jurisdiction|compliance|regulation|court|judge|attorney|lawyer|contract|agreement|liability|legal implications|multinational|corporation|employment law|litigation|tort|intellectual property|patent|copyright|trademark|governance|legislative|statute|ordinance)\b/i
    ],
    keywords: ['legal', 'law', 'contract', 'compliance', 'regulation', 'jurisdiction', 'attorney'],
    priority: 95,
  },
  {
    domain: 'financial',
    patterns: [
      /\b(portfolio|investment|risk|return|financial|market|stock|bond|asset|revenue|profit|loss|trading|analyst|valuation|diversified|sp&p|index|funds|equity|corporate|inflation|interest rate|banking|loan|credit|debt|capital|roe|roi|ebitda|dividend|derivative|hedge|arbitrage)\b/i
    ],
    keywords: ['financial', 'investment', 'portfolio', 'trading', 'banking', 'revenue', 'profit'],
    priority: 90,
    excludePatterns: [/\b(capital of|capital city|capital is)\b/i]
  },
  {
    domain: 'crypto',
    patterns: [
      /\b(crypto|bitcoin|ethereum|blockchain|cryptocurrency|mining|wallet|exchange|trading|defi|nft|token|btc|eth|smart contract|dapp|dao|yield farming|staking)\b/i
    ],
    keywords: ['crypto', 'bitcoin', 'blockchain', 'ethereum', 'nft', 'defi'],
    priority: 85,
  },
  {
    domain: 'real_estate',
    patterns: [
      /\b(property|real estate|realty|realtor|listing|mls|mortgage|appraisal|zoning|commercial property|residential|condo|apartment|rental|lease|landlord|tenant|property management|broker|agent)\b/i
    ],
    keywords: ['property', 'real estate', 'mortgage', 'listing', 'zoning'],
    priority: 80,
  },
  {
    domain: 'technology',
    patterns: [
      /\b(architecture|microservices|concurrent|users|system|technical|api|database|server|cloud|infrastructure|scalability|performance|optimization|machine learning|ai|algorithm|software|development|programming|devops|kubernetes|docker|aws|azure|gcp|backend|frontend|fullstack|react|python|javascript|typescript|node|code|repository|git)\b/i
    ],
    keywords: ['software', 'development', 'programming', 'api', 'system', 'cloud', 'ai'],
    priority: 75,
    excludePatterns: [/\b(healthcare system|medical system)\b/i]
  },
  {
    domain: 'business',
    patterns: [
      /\b(business|strategy|enterprise|corporate|startup|venture|revenue|profit|loss|market share|competitive|industry|sector|consulting|management|leadership|organizational|stakeholder|shareholder|board)\b/i
    ],
    keywords: ['business', 'strategy', 'corporate', 'enterprise', 'management', 'revenue'],
    priority: 70,
  },
  {
    domain: 'marketing',
    patterns: [
      /\b(marketing|campaign|advertising|brand|branding|seo|sem|ppc|social media|content marketing|influencer|engagement|conversion|ctr|cpa|cpm|roas|audience|targeting|ad campaign|brand awareness)\b/i
    ],
    keywords: ['marketing', 'campaign', 'advertising', 'brand', 'seo', 'social media'],
    priority: 65,
  },
  {
    domain: 'education',
    patterns: [
      /\b(learning|education|student|teacher|curriculum|pedagogy|teaching|academic|school|university|course|lesson|instruction|personalized|learning pathway|abilities|learning styles|syllabus|degree|diploma|certification|training|workshop)\b/i
    ],
    keywords: ['education', 'learning', 'student', 'teacher', 'curriculum', 'academic'],
    priority: 60,
  },
  {
    domain: 'manufacturing',
    patterns: [
      /\b(manufacturing|production|factory|assembly|supply chain|logistics|quality control|inventory|warehouse|distribution|procurement|lean|six sigma|kaizen|production line|automation|industrial|machinery|equipment)\b/i
    ],
    keywords: ['manufacturing', 'production', 'factory', 'supply chain', 'quality control'],
    priority: 55,
  },
  {
    domain: 'ecommerce',
    patterns: [
      /\b(ecommerce|online store|shopping cart|checkout|product catalog|sku|inventory management|customer order|fulfillment|dropshipping|marketplace|payment gateway|shipping|delivery)\b/i
    ],
    keywords: ['ecommerce', 'online store', 'shopping cart', 'product catalog', 'checkout'],
    priority: 50,
  },
  {
    domain: 'customer_service',
    patterns: [
      /\b(customer service|customer support|help desk|ticket|support agent|csr|customer satisfaction|customer experience|cx|complaint|resolution|service level|sla|live chat|chatbot)\b/i
    ],
    keywords: ['customer service', 'support', 'help desk', 'ticket', 'customer satisfaction'],
    priority: 45,
  },
  {
    domain: 'human_resources',
    patterns: [
      /\b(hr|human resources|recruitment|hiring|employee|staff|workforce|talent|onboarding|performance review|compensation|benefits|payroll|hris|employee engagement|retention|training|development)\b/i
    ],
    keywords: ['hr', 'human resources', 'recruitment', 'hiring', 'employee', 'talent'],
    priority: 40,
  },
  {
    domain: 'logistics',
    patterns: [
      /\b(logistics|shipping|delivery|freight|transportation|warehouse|distribution|fulfillment|supply chain|inventory|carrier|trucking|shipping route|logistics management)\b/i
    ],
    keywords: ['logistics', 'shipping', 'delivery', 'freight', 'warehouse', 'transportation'],
    priority: 35,
  },
  {
    domain: 'engineering',
    patterns: [
      /\b(engineering|engineer|design|cad|mechanical|electrical|civil|structural|aerospace|chemical|biomedical|engineering design|blueprint|specification|prototype|r&d|research and development)\b/i
    ],
    keywords: ['engineering', 'engineer', 'design', 'cad', 'mechanical', 'prototype'],
    priority: 30,
  },
  {
    domain: 'research',
    patterns: [
      /\b(research|study|experiment|hypothesis|methodology|data analysis|survey|publication|peer review|academic research|scientific method|research paper|thesis|dissertation)\b/i
    ],
    keywords: ['research', 'study', 'experiment', 'methodology', 'data analysis', 'survey'],
    priority: 25,
  },
  {
    domain: 'art',
    patterns: [
      /\b(art|artwork|artist|painting|sculpture|gallery|exhibition|aesthetic|creative|visual arts|fine arts|artistic|art history|art collector|auction|art valuation|appraisal)\b/i
    ],
    keywords: ['art', 'artwork', 'artist', 'painting', 'gallery', 'creative'],
    priority: 20,
  },
  {
    domain: 'science',
    patterns: [
      /\b(science|scientific|physics|chemistry|biology|astronomy|geology|mathematics|math|quantum|molecular|atomic|laboratory|experiment|hypothesis|theory|observation)\b/i
    ],
    keywords: ['science', 'scientific', 'physics', 'chemistry', 'biology', 'experiment'],
    priority: 15,
  },
  {
    domain: 'design',
    patterns: [
      /\b(design|graphic design|ui|ux|user experience|user interface|branding|visual design|layout|typography|color|prototype|wireframe|mockup|design system)\b/i
    ],
    keywords: ['design', 'ui', 'ux', 'graphic design', 'user experience', 'branding'],
    priority: 12,
  },
  {
    domain: 'philosophy',
    patterns: [
      /\b(philosophy|philosophical|ethics|morality|metaphysics|epistemology|ontology|logic|reasoning|argumentation|philosopher|theoretical|abstract thinking)\b/i
    ],
    keywords: ['philosophy', 'philosophical', 'ethics', 'metaphysics', 'reasoning'],
    priority: 10,
  },
  {
    domain: 'finance',
    patterns: [
      /\b(finance|financial|banking|investment|portfolio|trading|market|stocks|bonds|assets|capital|revenue|profit|loss|analyst|valuation|funds|equity|loan|credit|debt|roe|roi|ebitda|dividend)\b/i
    ],
    keywords: ['finance', 'financial', 'banking', 'investment', 'trading', 'capital'],
    priority: 88,
    excludePatterns: [/\b(capital of|capital city|capital is)\b/i]
  },
  {
    domain: 'insurance',
    patterns: [
      /\b(insurance|policy|premium|coverage|claim|underwriting|actuary|actuarial|risk assessment|liability|property insurance|life insurance|health insurance|auto insurance|pension|annuity)\b/i
    ],
    keywords: ['insurance', 'policy', 'premium', 'coverage', 'claim', 'actuary'],
    priority: 82,
  },
  {
    domain: 'pharmaceuticals',
    patterns: [
      /\b(pharmaceutical|pharma|drug|medication|prescription|fda|clinical trial|drug development|pharmacology|dosage|therapy|treatment|medication|drug interaction)\b/i
    ],
    keywords: ['pharmaceutical', 'pharma', 'drug', 'medication', 'prescription', 'clinical trial'],
    priority: 98,
  },
  {
    domain: 'biotechnology',
    patterns: [
      /\b(biotechnology|biotech|genetic|genome|dna|rna|protein|enzyme|molecular biology|cell biology|bioprocess|fermentation|bioreactor|bioprocessing)\b/i
    ],
    keywords: ['biotechnology', 'biotech', 'genetic', 'genome', 'dna', 'protein'],
    priority: 85,
  },
  {
    domain: 'environment',
    patterns: [
      /\b(environment|environmental|climate|ecosystem|pollution|conservation|wildlife|biodiversity|carbon|emission|renewable|sustainability|green|eco-friendly|conservation)\b/i
    ],
    keywords: ['environment', 'environmental', 'climate', 'ecosystem', 'pollution', 'conservation'],
    priority: 72,
  },
  {
    domain: 'sustainability',
    patterns: [
      /\b(sustainability|sustainable|green energy|renewable|carbon neutral|carbon footprint|esg|environmental impact|circular economy|sustainable development|eco-friendly)\b/i
    ],
    keywords: ['sustainability', 'sustainable', 'green energy', 'renewable', 'carbon', 'esg'],
    priority: 70,
  },
  {
    domain: 'construction',
    patterns: [
      /\b(construction|building|contractor|architecture|infrastructure|project management|civil engineering|blueprint|permits|zoning|construction site|materials|contractor)\b/i
    ],
    keywords: ['construction', 'building', 'contractor', 'architecture', 'infrastructure', 'civil'],
    priority: 68,
  },
  {
    domain: 'telecommunications',
    patterns: [
      /\b(telecommunications|telecom|5g|network|broadband|fiber|wireless|cellular|mobile network|telephony|voip|isp|telecommunication infrastructure)\b/i
    ],
    keywords: ['telecommunications', 'telecom', 'network', 'broadband', 'wireless', '5g'],
    priority: 66,
  },
  {
    domain: 'retail',
    patterns: [
      /\b(retail|retailer|store|merchandise|inventory|point of sale|pos|retail store|brick and mortar|retail chain|shopping|customer service)\b/i
    ],
    keywords: ['retail', 'retailer', 'store', 'merchandise', 'inventory', 'pos'],
    priority: 64,
  },
  {
    domain: 'hospitality',
    patterns: [
      /\b(hospitality|hotel|restaurant|tourism|travel|accommodation|resort|concierge|guest service|hospitality management|front desk|housekeeping)\b/i
    ],
    keywords: ['hospitality', 'hotel', 'restaurant', 'tourism', 'travel', 'resort'],
    priority: 62,
  },
  {
    domain: 'gaming',
    patterns: [
      /\b(gaming|video game|game development|gamer|esports|gameplay|console|pc gaming|mobile game|game design|game engine|gameplay|twitch|streaming)\b/i
    ],
    keywords: ['gaming', 'video game', 'game development', 'gamer', 'esports', 'gameplay'],
    priority: 58,
  },
  {
    domain: 'music',
    patterns: [
      /\b(music|song|album|artist|musician|composer|lyrics|record|music production|sound|audio|recording|studio|music industry|streaming|spotify|apple music)\b/i
    ],
    keywords: ['music', 'song', 'album', 'artist', 'musician', 'recording'],
    priority: 56,
  },
  {
    domain: 'film',
    patterns: [
      /\b(film|movie|cinema|director|producer|screenplay|script|production|filming|cinematography|post-production|editing|film industry|hollywood|movie theater)\b/i
    ],
    keywords: ['film', 'movie', 'cinema', 'director', 'producer', 'screenplay'],
    priority: 54,
  },
  {
    domain: 'publishing',
    patterns: [
      /\b(publishing|publisher|book|author|editor|manuscript|publication|literary|publishing house|editorial|print|digital publishing|ebook|self-publishing)\b/i
    ],
    keywords: ['publishing', 'publisher', 'book', 'author', 'editor', 'manuscript'],
    priority: 52,
  },
  {
    domain: 'journalism',
    patterns: [
      /\b(journalism|journalist|news|reporting|article|news story|press|media|investigative|breaking news|reporter|newsroom|editorial|press release)\b/i
    ],
    keywords: ['journalism', 'journalist', 'news', 'reporting', 'article', 'media'],
    priority: 48,
  },
  {
    domain: 'advertising',
    patterns: [
      /\b(advertising|ad|advertisement|ad campaign|ad agency|creative|copywriting|brand awareness|media buying|advertising strategy|marketing communication)\b/i
    ],
    keywords: ['advertising', 'ad', 'advertisement', 'ad campaign', 'ad agency', 'creative'],
    priority: 63,
  },
  {
    domain: 'sales',
    patterns: [
      /\b(sales|selling|salesperson|sales team|revenue|quota|sales pipeline|lead generation|crm|customer acquisition|sales process|closing|deal|prospect)\b/i
    ],
    keywords: ['sales', 'selling', 'salesperson', 'sales team', 'revenue', 'quota'],
    priority: 61,
  },
  {
    domain: 'procurement',
    patterns: [
      /\b(procurement|purchasing|vendor|supplier|sourcing|rfp|request for proposal|contract negotiation|purchase order|supply management|procurement process)\b/i
    ],
    keywords: ['procurement', 'purchasing', 'vendor', 'supplier', 'sourcing', 'rfp'],
    priority: 59,
  },
  {
    domain: 'supply_chain',
    patterns: [
      /\b(supply chain|supply chain management|logistics|distribution|inventory|warehouse|fulfillment|procurement|vendor|supplier|sourcing|distribution network)\b/i
    ],
    keywords: ['supply chain', 'supply chain management', 'logistics', 'distribution', 'inventory'],
    priority: 57,
  },
  {
    domain: 'quality_control',
    patterns: [
      /\b(quality control|qc|qa|quality assurance|inspection|testing|quality standards|defect|quality management|iso|six sigma|quality metrics|qc process)\b/i
    ],
    keywords: ['quality control', 'qc', 'qa', 'quality assurance', 'inspection', 'testing'],
    priority: 53,
  },
  {
    domain: 'compliance',
    patterns: [
      /\b(compliance|regulatory|regulation|audit|compliance officer|regulatory compliance|gdpr|hipaa|sox|compliance program|compliance risk|legal compliance)\b/i
    ],
    keywords: ['compliance', 'regulatory', 'regulation', 'audit', 'compliance officer', 'gdpr'],
    priority: 92,
  },
  {
    domain: 'risk_management',
    patterns: [
      /\b(risk management|risk assessment|risk analysis|enterprise risk|operational risk|financial risk|risk mitigation|risk strategy|risk framework|enterprise risk management)\b/i
    ],
    keywords: ['risk management', 'risk assessment', 'risk analysis', 'enterprise risk', 'risk mitigation'],
    priority: 87,
  },
  {
    domain: 'cybersecurity',
    patterns: [
      /\b(cybersecurity|cyber security|information security|infosec|network security|data breach|vulnerability|penetration testing|threat|security audit|firewall|encryption|malware)\b/i
    ],
    keywords: ['cybersecurity', 'cyber security', 'information security', 'infosec', 'network security', 'data breach'],
    priority: 89,
  },
  {
    domain: 'data_science',
    patterns: [
      /\b(data science|data scientist|machine learning|ml|predictive analytics|data analysis|data modeling|statistical analysis|data mining|data visualization|big data)\b/i
    ],
    keywords: ['data science', 'data scientist', 'machine learning', 'predictive analytics', 'data analysis'],
    priority: 77,
  },
  {
    domain: 'analytics',
    patterns: [
      /\b(analytics|data analytics|business analytics|web analytics|performance analytics|kpi|metrics|dashboard|reporting|data insights|analytical|business intelligence|bi)\b/i
    ],
    keywords: ['analytics', 'data analytics', 'business analytics', 'web analytics', 'kpi', 'metrics'],
    priority: 74,
  },
  {
    domain: 'ai_development',
    patterns: [
      /\b(ai development|artificial intelligence|ai|machine learning|ml|neural network|deep learning|nlp|natural language processing|ai model|model training|ai system)\b/i
    ],
    keywords: ['ai development', 'artificial intelligence', 'ai', 'machine learning', 'neural network', 'deep learning'],
    priority: 76,
    excludePatterns: [/\b(ai assistant|ai chat|chat ai)\b/i]
  },
  {
    domain: 'consulting',
    patterns: [
      /\b(consulting|consultant|advisory|strategy consulting|management consulting|consulting firm|business advisory|consulting services|strategic advisory)\b/i
    ],
    keywords: ['consulting', 'consultant', 'advisory', 'strategy consulting', 'management consulting'],
    priority: 69,
  },
  {
    domain: 'media',
    patterns: [
      /\b(media|broadcasting|content creation|media production|digital media|social media|media industry|journalism|media company|broadcast|streaming)\b/i
    ],
    keywords: ['media', 'broadcasting', 'content creation', 'digital media', 'social media'],
    priority: 67,
  },
  {
    domain: 'entertainment',
    patterns: [
      /\b(entertainment|entertainment industry|show business|performing arts|theater|concerts|events|entertainment production|live events|entertainment venue)\b/i
    ],
    keywords: ['entertainment', 'entertainment industry', 'show business', 'performing arts', 'theater'],
    priority: 55,
  },
  {
    domain: 'sports',
    patterns: [
      /\b(sports|athlete|athletic|sports team|coaching|sports management|fitness|sports performance|sports science|sports marketing|stadium|sports event)\b/i
    ],
    keywords: ['sports', 'athlete', 'athletic', 'sports team', 'coaching', 'fitness'],
    priority: 51,
  },
  {
    domain: 'food',
    patterns: [
      /\b(food|restaurant|cuisine|cooking|culinary|chef|food service|food industry|catering|food safety|nutrition|food production|recipe|menu)\b/i
    ],
    keywords: ['food', 'restaurant', 'cuisine', 'cooking', 'culinary', 'chef'],
    priority: 49,
  },
  {
    domain: 'travel',
    patterns: [
      /\b(travel|tourism|vacation|booking|travel agency|airline|hotel|trip|itinerary|travel planning|travel destination|tourist|travel industry)\b/i
    ],
    keywords: ['travel', 'tourism', 'vacation', 'booking', 'travel agency', 'airline'],
    priority: 47,
  },
  {
    domain: 'fashion',
    patterns: [
      /\b(fashion|clothing|apparel|fashion design|fashion industry|wardrobe|style|fashion brand|fashion retail|textile|garment|fashion show)\b/i
    ],
    keywords: ['fashion', 'clothing', 'apparel', 'fashion design', 'fashion industry', 'style'],
    priority: 45,
  },
  {
    domain: 'automotive',
    patterns: [
      /\b(automotive|car|vehicle|automobile|auto|automotive industry|car manufacturer|dealership|vehicle sales|automotive engineering|car repair|auto parts)\b/i
    ],
    keywords: ['automotive', 'car', 'vehicle', 'automobile', 'auto', 'automotive industry'],
    priority: 43,
  },
  {
    domain: 'energy',
    patterns: [
      /\b(energy|power|electricity|renewable energy|solar|wind|energy production|energy sector|power generation|energy management|energy efficiency|oil|gas|petroleum)\b/i
    ],
    keywords: ['energy', 'power', 'electricity', 'renewable energy', 'solar', 'wind'],
    priority: 41,
  },
  {
    domain: 'agriculture',
    patterns: [
      /\b(agriculture|farming|agricultural|crop|livestock|harvest|farming|agricultural production|farm|agricultural technology|agtech|farming practices|soil)\b/i
    ],
    keywords: ['agriculture', 'farming', 'agricultural', 'crop', 'livestock', 'harvest'],
    priority: 39,
  },
];

/**
 * Detect domain from query using semantic analysis
 */
export function detectDomain(query: string, context?: string): DomainDetectionResult {
  const queryLower = query.toLowerCase();
  const contextLower = (context || '').toLowerCase();
  const combinedText = `${queryLower} ${contextLower}`;

  // Sort by priority (highest first)
  const sortedPatterns = [...DOMAIN_PATTERNS].sort((a, b) => b.priority - a.priority);

  for (const patternConfig of sortedPatterns) {
    // Check exclude patterns first
    if (patternConfig.excludePatterns) {
      const isExcluded = patternConfig.excludePatterns.some(excludePattern => 
        excludePattern.test(combinedText)
      );
      if (isExcluded) {
        continue;
      }
    }

    // Check if any pattern matches
    const matches = patternConfig.patterns.filter(pattern => pattern.test(combinedText));
    
    if (matches.length > 0) {
      // Extract matched keywords
      const matchedKeywords: string[] = [];
      for (const keyword of patternConfig.keywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
        }
      }

      // Calculate confidence based on number of matches and keywords
      const matchCount = matches.length;
      const keywordCount = matchedKeywords.length;
      const confidence = Math.min(0.95, 0.6 + (matchCount * 0.1) + (keywordCount * 0.05));

      return {
        domain: patternConfig.domain,
        confidence,
        reasoning: `Detected ${patternConfig.domain} domain based on ${matchCount} pattern match(es) and ${keywordCount} keyword(s): ${matchedKeywords.join(', ')}`,
        keywords: matchedKeywords,
      };
    }
  }

  // No domain detected - return general with low confidence
  return {
    domain: 'general',
    confidence: 0.3,
    reasoning: 'No specific domain detected. Using general domain.',
    keywords: [],
  };
}

/**
 * Use teacher-student judge for ambiguous domain detection
 * This is called when confidence is low or multiple domains are possible
 */
export async function detectDomainWithJudge(
  query: string,
  context?: string,
  teacherStudentSystem?: any
): Promise<DomainDetectionResult> {
  // First, try basic detection
  const basicResult = detectDomain(query, context);

  // If confidence is high enough, return it
  if (basicResult.confidence >= 0.7) {
    return basicResult;
  }

  // If teacher-student system is available, use it for better detection
  if (teacherStudentSystem) {
    try {
      const judgePrompt = `Analyze this query and determine the most appropriate domain:
      
Query: "${query}"
${context ? `Context: "${context}"` : ''}

Available domains: general, technology, education, marketing, manufacturing, ecommerce, customer_service, logistics, human_resources, consulting, research, engineering, design, media, entertainment, sports, food, travel, fashion, automotive, energy, agriculture, healthcare, finance, legal, real_estate, insurance, pharmaceuticals, biotechnology, environment, sustainability, construction, telecommunications, retail, hospitality, gaming, music, film, publishing, journalism, advertising, sales, procurement, supply_chain, quality_control, compliance, risk_management, cybersecurity, data_science, analytics, ai_development

Respond with JSON:
{
  "domain": "domain_name",
  "confidence": 0.0-1.0,
  "reasoning": "why this domain"
}`;

      const response = await teacherStudentSystem.teacherProcess(judgePrompt, 'general');
      
      // Try to parse JSON from response
      const jsonMatch = response.answer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const detectedDomain = parsed.domain as Domain;
          
          // Validate the detected domain is valid
          const validDomains = getAvailableDomains();
          if (validDomains.includes(detectedDomain)) {
  return {
              domain: detectedDomain,
              confidence: Math.min(1.0, Math.max(0.0, parsed.confidence || 0.5)),
              reasoning: `Judge-detected: ${parsed.reasoning || 'No reasoning provided'}`,
              keywords: [],
            };
          }
        } catch (parseError) {
          console.warn('Failed to parse judge response JSON:', parseError);
        }
      }
    } catch (error) {
      console.warn('Domain detection with judge failed, falling back to basic detection:', error);
    }
  }

  // Fallback to basic detection
  return basicResult;
}

/**
 * Get all available domains
 */
export function getAvailableDomains(): Domain[] {
  return DOMAIN_PATTERNS.map(p => p.domain).concat('general');
}
