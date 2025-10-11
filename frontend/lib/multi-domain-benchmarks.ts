/**
 * Multi-Domain Benchmark System
 * Applying AndroidLab's systematic approach to all major industries
 * 
 * Domains: Financial, Medical, Legal, Manufacturing, SaaS, Marketing, Education, Research
 */

export type Domain = 
  | 'financial' 
  | 'medical' 
  | 'legal' 
  | 'manufacturing' 
  | 'saas' 
  | 'marketing' 
  | 'education' 
  | 'research'
  | 'retail'
  | 'logistics';

export interface DomainTask {
  id: string;
  domain: Domain;
  category: string;
  subcategory: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  expectedSteps: number;
  successCriteria: string[];
  testData: any;
  expectedOutput: any;
  evaluationMetrics: string[];
  industryStandards?: string[];
  regulatoryRequirements?: string[];
}

export interface DomainBenchmarkSuite {
  domain: Domain;
  name: string;
  version: string;
  totalTasks: number;
  tasks: DomainTask[];
  categories: string[];
  industrySpecificMetrics: Record<string, any>;
}

export class MultiDomainBenchmarkSystem {
  private domainSuites: Map<Domain, DomainBenchmarkSuite> = new Map();

  constructor() {
    this.initializeAllDomains();
  }

  /**
   * Initialize benchmark suites for all major industries
   */
  private initializeAllDomains(): void {
    this.initializeFinancialDomain();
    this.initializeMedicalDomain();
    this.initializeLegalDomain();
    this.initializeManufacturingDomain();
    this.initializeSaaSDomain();
    this.initializeMarketingDomain();
    this.initializeEducationDomain();
    this.initializeResearchDomain();
    this.initializeRetailDomain();
    this.initializeLogisticsDomain();
    
    console.log(`🌐 Initialized ${this.domainSuites.size} domain benchmark suites`);
  }

  /**
   * FINANCIAL DOMAIN (138 tasks)
   */
  private initializeFinancialDomain(): void {
    const tasks: DomainTask[] = [
      // XBRL Analysis (25 tasks)
      ...this.generateTaskSet({
        domain: 'financial',
        category: 'XBRL Analysis',
        count: 25,
        subcategories: ['Entity Extraction', 'Data Validation', 'Comparative Analysis', 'Report Generation', 'Compliance Checking'],
        difficulties: ['medium', 'hard', 'expert']
      }),
      // Market Analysis (30 tasks)
      ...this.generateTaskSet({
        domain: 'financial',
        category: 'Market Analysis',
        count: 30,
        subcategories: ['Trend Identification', 'Sector Analysis', 'Volatility Analysis', 'Sentiment Analysis', 'Price Prediction'],
        difficulties: ['easy', 'medium', 'hard']
      }),
      // Risk Assessment (25 tasks)
      ...this.generateTaskSet({
        domain: 'financial',
        category: 'Risk Assessment',
        count: 25,
        subcategories: ['Credit Risk', 'Market Risk', 'Operational Risk', 'Liquidity Risk', 'VaR Calculation'],
        difficulties: ['hard', 'expert']
      }),
      // Portfolio Management (20 tasks)
      ...this.generateTaskSet({
        domain: 'financial',
        category: 'Portfolio Management',
        count: 20,
        subcategories: ['Asset Allocation', 'Rebalancing', 'Performance Attribution', 'Optimization', 'Risk Parity'],
        difficulties: ['medium', 'hard', 'expert']
      }),
      // Regulatory Compliance (20 tasks)
      ...this.generateTaskSet({
        domain: 'financial',
        category: 'Regulatory Compliance',
        count: 20,
        subcategories: ['SOX Compliance', 'Basel III', 'MiFID II', 'IFRS', 'AML/KYC'],
        difficulties: ['hard', 'expert']
      }),
      // Trading & Execution (18 tasks)
      ...this.generateTaskSet({
        domain: 'financial',
        category: 'Trading & Execution',
        count: 18,
        subcategories: ['Order Routing', 'Execution Quality', 'Market Making', 'Algorithmic Trading', 'Smart Order Routing'],
        difficulties: ['hard', 'expert']
      })
    ];

    this.domainSuites.set('financial', {
      domain: 'financial',
      name: 'Financial AI Benchmark Suite',
      version: '1.0.0',
      totalTasks: tasks.length,
      tasks,
      categories: [...new Set(tasks.map(t => t.category))],
      industrySpecificMetrics: {
        sharpeRatio: true,
        maxDrawdown: true,
        informationRatio: true,
        trackingError: true,
        alpha: true,
        beta: true
      }
    });
  }

  /**
   * MEDICAL DOMAIN (150 tasks)
   */
  private initializeMedicalDomain(): void {
    const tasks: DomainTask[] = [
      // Diagnosis Support (35 tasks)
      ...this.generateTaskSet({
        domain: 'medical',
        category: 'Diagnosis Support',
        count: 35,
        subcategories: ['Symptom Analysis', 'Differential Diagnosis', 'Lab Result Interpretation', 'Imaging Analysis', 'Clinical Decision Support'],
        difficulties: ['hard', 'expert'],
        regulatoryRequirements: ['HIPAA', 'FDA Class II', 'ISO 13485']
      }),
      // Medical Imaging (30 tasks)
      ...this.generateTaskSet({
        domain: 'medical',
        category: 'Medical Imaging',
        count: 30,
        subcategories: ['X-Ray Analysis', 'CT Scan Interpretation', 'MRI Analysis', 'Ultrasound', 'Pathology Slides'],
        difficulties: ['expert'],
        regulatoryRequirements: ['FDA 510(k)', 'CE Mark', 'DICOM Standards']
      }),
      // Treatment Planning (25 tasks)
      ...this.generateTaskSet({
        domain: 'medical',
        category: 'Treatment Planning',
        count: 25,
        subcategories: ['Drug Selection', 'Dosage Optimization', 'Radiation Therapy Planning', 'Surgical Planning', 'Personalized Medicine'],
        difficulties: ['hard', 'expert'],
        regulatoryRequirements: ['FDA Approval', 'Clinical Validation']
      }),
      // Patient Monitoring (20 tasks)
      ...this.generateTaskSet({
        domain: 'medical',
        category: 'Patient Monitoring',
        count: 20,
        subcategories: ['Vital Signs Analysis', 'ICU Monitoring', 'Remote Patient Monitoring', 'Early Warning Systems', 'Discharge Readiness'],
        difficulties: ['medium', 'hard']
      }),
      // Medical Records (20 tasks)
      ...this.generateTaskSet({
        domain: 'medical',
        category: 'Medical Records',
        count: 20,
        subcategories: ['EHR Data Extraction', 'Clinical Note Analysis', 'ICD Coding', 'CPT Coding', 'Documentation Quality'],
        difficulties: ['medium', 'hard']
      }),
      // Drug Discovery (20 tasks)
      ...this.generateTaskSet({
        domain: 'medical',
        category: 'Drug Discovery',
        count: 20,
        subcategories: ['Molecular Analysis', 'Protein Folding', 'Drug-Target Interaction', 'Toxicity Prediction', 'Clinical Trial Design'],
        difficulties: ['expert']
      })
    ];

    this.domainSuites.set('medical', {
      domain: 'medical',
      name: 'Medical AI Benchmark Suite',
      version: '1.0.0',
      totalTasks: tasks.length,
      tasks,
      categories: [...new Set(tasks.map(t => t.category))],
      industrySpecificMetrics: {
        sensitivity: true,
        specificity: true,
        ppv: true,
        npv: true,
        auc_roc: true,
        f1_clinical: true,
        fda_compliance: true,
        hipaa_compliance: true
      }
    });
  }

  /**
   * LEGAL DOMAIN (120 tasks)
   */
  private initializeLegalDomain(): void {
    const tasks: DomainTask[] = [
      // Contract Analysis (30 tasks)
      ...this.generateTaskSet({
        domain: 'legal',
        category: 'Contract Analysis',
        count: 30,
        subcategories: ['Clause Extraction', 'Risk Identification', 'Obligation Analysis', 'Term Negotiation', 'Contract Comparison'],
        difficulties: ['hard', 'expert']
      }),
      // Legal Research (25 tasks)
      ...this.generateTaskSet({
        domain: 'legal',
        category: 'Legal Research',
        count: 25,
        subcategories: ['Case Law Analysis', 'Statute Interpretation', 'Precedent Identification', 'Regulatory Research', 'Citation Analysis'],
        difficulties: ['medium', 'hard', 'expert']
      }),
      // Due Diligence (20 tasks)
      ...this.generateTaskSet({
        domain: 'legal',
        category: 'Due Diligence',
        count: 20,
        subcategories: ['Document Review', 'Risk Assessment', 'Corporate Structure Analysis', 'IP Analysis', 'Financial Review'],
        difficulties: ['hard', 'expert']
      }),
      // Compliance (25 tasks)
      ...this.generateTaskSet({
        domain: 'legal',
        category: 'Compliance',
        count: 25,
        subcategories: ['GDPR Compliance', 'CCPA Compliance', 'SOX Compliance', 'Anti-Corruption', 'Export Control'],
        difficulties: ['hard', 'expert']
      }),
      // Litigation Support (20 tasks)
      ...this.generateTaskSet({
        domain: 'legal',
        category: 'Litigation Support',
        count: 20,
        subcategories: ['eDiscovery', 'Privilege Review', 'Document Coding', 'Timeline Analysis', 'Witness Analysis'],
        difficulties: ['hard', 'expert']
      })
    ];

    this.domainSuites.set('legal', {
      domain: 'legal',
      name: 'Legal AI Benchmark Suite',
      version: '1.0.0',
      totalTasks: tasks.length,
      tasks,
      categories: [...new Set(tasks.map(t => t.category))],
      industrySpecificMetrics: {
        recall_legal: true,
        precision_legal: true,
        consistency: true,
        jurisdiction_coverage: true,
        regulatory_compliance: true
      }
    });
  }

  /**
   * MANUFACTURING DOMAIN (130 tasks)
   */
  private initializeManufacturingDomain(): void {
    const tasks: DomainTask[] = [
      // Quality Control (30 tasks)
      ...this.generateTaskSet({
        domain: 'manufacturing',
        category: 'Quality Control',
        count: 30,
        subcategories: ['Defect Detection', 'Visual Inspection', 'Statistical Process Control', 'Root Cause Analysis', 'Quality Prediction'],
        difficulties: ['medium', 'hard']
      }),
      // Predictive Maintenance (25 tasks)
      ...this.generateTaskSet({
        domain: 'manufacturing',
        category: 'Predictive Maintenance',
        count: 25,
        subcategories: ['Equipment Failure Prediction', 'Anomaly Detection', 'Maintenance Scheduling', 'Spare Parts Optimization', 'Downtime Minimization'],
        difficulties: ['hard', 'expert']
      }),
      // Production Optimization (25 tasks)
      ...this.generateTaskSet({
        domain: 'manufacturing',
        category: 'Production Optimization',
        count: 25,
        subcategories: ['Throughput Optimization', 'Yield Improvement', 'Energy Efficiency', 'Resource Allocation', 'Bottleneck Identification'],
        difficulties: ['hard', 'expert']
      }),
      // Supply Chain (25 tasks)
      ...this.generateTaskSet({
        domain: 'manufacturing',
        category: 'Supply Chain',
        count: 25,
        subcategories: ['Demand Forecasting', 'Inventory Optimization', 'Supplier Selection', 'Logistics Optimization', 'Risk Management'],
        difficulties: ['medium', 'hard']
      }),
      // Process Control (25 tasks)
      ...this.generateTaskSet({
        domain: 'manufacturing',
        category: 'Process Control',
        count: 25,
        subcategories: ['Parameter Optimization', 'Recipe Management', 'Batch Optimization', 'Real-time Monitoring', 'Adaptive Control'],
        difficulties: ['hard', 'expert']
      })
    ];

    this.domainSuites.set('manufacturing', {
      domain: 'manufacturing',
      name: 'Manufacturing AI Benchmark Suite',
      version: '1.0.0',
      totalTasks: tasks.length,
      tasks,
      categories: [...new Set(tasks.map(t => t.category))],
      industrySpecificMetrics: {
        oee: true, // Overall Equipment Effectiveness
        mtbf: true, // Mean Time Between Failures
        mttr: true, // Mean Time To Repair
        first_pass_yield: true,
        defect_rate: true,
        cost_per_unit: true
      }
    });
  }

  /**
   * SAAS DOMAIN (110 tasks)
   */
  private initializeSaaSDomain(): void {
    const tasks: DomainTask[] = [
      // Customer Success (25 tasks)
      ...this.generateTaskSet({
        domain: 'saas',
        category: 'Customer Success',
        count: 25,
        subcategories: ['Churn Prediction', 'Health Score Calculation', 'Expansion Opportunity', 'Onboarding Optimization', 'Usage Analysis'],
        difficulties: ['medium', 'hard']
      }),
      // Product Analytics (25 tasks)
      ...this.generateTaskSet({
        domain: 'saas',
        category: 'Product Analytics',
        count: 25,
        subcategories: ['Feature Adoption', 'User Journey Analysis', 'Funnel Optimization', 'A/B Testing', 'Cohort Analysis'],
        difficulties: ['medium', 'hard']
      }),
      // Revenue Operations (20 tasks)
      ...this.generateTaskSet({
        domain: 'saas',
        category: 'Revenue Operations',
        count: 20,
        subcategories: ['MRR Forecasting', 'LTV Calculation', 'CAC Optimization', 'Pipeline Management', 'Pricing Optimization'],
        difficulties: ['hard', 'expert']
      }),
      // Technical Operations (20 tasks)
      ...this.generateTaskSet({
        domain: 'saas',
        category: 'Technical Operations',
        count: 20,
        subcategories: ['Performance Monitoring', 'Incident Response', 'Capacity Planning', 'Cost Optimization', 'Security Analysis'],
        difficulties: ['hard', 'expert']
      }),
      // Growth & Marketing (20 tasks)
      ...this.generateTaskSet({
        domain: 'saas',
        category: 'Growth & Marketing',
        count: 20,
        subcategories: ['Lead Scoring', 'Attribution Modeling', 'Campaign Optimization', 'Virality Analysis', 'Channel Mix Optimization'],
        difficulties: ['medium', 'hard']
      })
    ];

    this.domainSuites.set('saas', {
      domain: 'saas',
      name: 'SaaS AI Benchmark Suite',
      version: '1.0.0',
      totalTasks: tasks.length,
      tasks,
      categories: [...new Set(tasks.map(t => t.category))],
      industrySpecificMetrics: {
        arr_accuracy: true,
        churn_prediction_accuracy: true,
        expansion_rate: true,
        nrr: true, // Net Revenue Retention
        magic_number: true,
        rule_of_40: true
      }
    });
  }

  /**
   * MARKETING DOMAIN (120 tasks)
   */
  private initializeMarketingDomain(): void {
    const tasks: DomainTask[] = [
      // Campaign Optimization (30 tasks)
      ...this.generateTaskSet({
        domain: 'marketing',
        category: 'Campaign Optimization',
        count: 30,
        subcategories: ['Ad Copy Generation', 'Audience Targeting', 'Budget Allocation', 'Creative Optimization', 'Channel Selection'],
        difficulties: ['medium', 'hard']
      }),
      // Content Marketing (25 tasks)
      ...this.generateTaskSet({
        domain: 'marketing',
        category: 'Content Marketing',
        count: 25,
        subcategories: ['Content Strategy', 'SEO Optimization', 'Topic Research', 'Content Performance', 'Distribution Strategy'],
        difficulties: ['medium', 'hard']
      }),
      // Customer Segmentation (20 tasks)
      ...this.generateTaskSet({
        domain: 'marketing',
        category: 'Customer Segmentation',
        count: 20,
        subcategories: ['Behavioral Segmentation', 'RFM Analysis', 'Persona Development', 'Lookalike Modeling', 'Micro-Segmentation'],
        difficulties: ['hard', 'expert']
      }),
      // Attribution & Analytics (25 tasks)
      ...this.generateTaskSet({
        domain: 'marketing',
        category: 'Attribution & Analytics',
        count: 25,
        subcategories: ['Multi-Touch Attribution', 'Marketing Mix Modeling', 'Customer Journey Analysis', 'ROI Measurement', 'Incrementality Testing'],
        difficulties: ['hard', 'expert']
      }),
      // Social Media & Influencer (20 tasks)
      ...this.generateTaskSet({
        domain: 'marketing',
        category: 'Social Media & Influencer',
        count: 20,
        subcategories: ['Sentiment Analysis', 'Influencer Identification', 'Engagement Prediction', 'Crisis Detection', 'Trend Analysis'],
        difficulties: ['medium', 'hard']
      })
    ];

    this.domainSuites.set('marketing', {
      domain: 'marketing',
      name: 'Marketing AI Benchmark Suite',
      version: '1.0.0',
      totalTasks: tasks.length,
      tasks,
      categories: [...new Set(tasks.map(t => t.category))],
      industrySpecificMetrics: {
        roas: true, // Return on Ad Spend
        cpa: true, // Cost Per Acquisition
        ctr: true, // Click-Through Rate
        conversion_rate: true,
        engagement_rate: true,
        brand_lift: true
      }
    });
  }

  /**
   * EDUCATION DOMAIN (100 tasks)
   */
  private initializeEducationDomain(): void {
    const tasks: DomainTask[] = [
      // Personalized Learning (25 tasks)
      ...this.generateTaskSet({
        domain: 'education',
        category: 'Personalized Learning',
        count: 25,
        subcategories: ['Learning Path Optimization', 'Knowledge Gap Analysis', 'Adaptive Content', 'Skill Assessment', 'Progress Prediction'],
        difficulties: ['medium', 'hard']
      }),
      // Content Development (20 tasks)
      ...this.generateTaskSet({
        domain: 'education',
        category: 'Content Development',
        count: 20,
        subcategories: ['Curriculum Design', 'Question Generation', 'Content Recommendation', 'Difficulty Calibration', 'Learning Objective Alignment'],
        difficulties: ['medium', 'hard']
      }),
      // Student Analytics (20 tasks)
      ...this.generateTaskSet({
        domain: 'education',
        category: 'Student Analytics',
        count: 20,
        subcategories: ['Dropout Prediction', 'Performance Prediction', 'Engagement Analysis', 'At-Risk Identification', 'Success Factors'],
        difficulties: ['hard', 'expert']
      }),
      // Assessment & Grading (20 tasks)
      ...this.generateTaskSet({
        domain: 'education',
        category: 'Assessment & Grading',
        count: 20,
        subcategories: ['Automated Grading', 'Essay Evaluation', 'Plagiarism Detection', 'Rubric Application', 'Feedback Generation'],
        difficulties: ['hard', 'expert']
      }),
      // Institutional Analytics (15 tasks)
      ...this.generateTaskSet({
        domain: 'education',
        category: 'Institutional Analytics',
        count: 15,
        subcategories: ['Enrollment Forecasting', 'Resource Allocation', 'Program Effectiveness', 'ROI Analysis', 'Accreditation Support'],
        difficulties: ['hard', 'expert']
      })
    ];

    this.domainSuites.set('education', {
      domain: 'education',
      name: 'Education AI Benchmark Suite',
      version: '1.0.0',
      totalTasks: tasks.length,
      tasks,
      categories: [...new Set(tasks.map(t => t.category))],
      industrySpecificMetrics: {
        learning_outcomes: true,
        completion_rate: true,
        engagement_score: true,
        knowledge_retention: true,
        skill_mastery: true
      }
    });
  }

  /**
   * RESEARCH DOMAIN (100 tasks)
   */
  private initializeResearchDomain(): void {
    const tasks: DomainTask[] = [
      // Literature Review (25 tasks)
      ...this.generateTaskSet({
        domain: 'research',
        category: 'Literature Review',
        count: 25,
        subcategories: ['Paper Summarization', 'Citation Analysis', 'Topic Modeling', 'Trend Identification', 'Gap Analysis'],
        difficulties: ['medium', 'hard', 'expert']
      }),
      // Hypothesis Generation (20 tasks)
      ...this.generateTaskSet({
        domain: 'research',
        category: 'Hypothesis Generation',
        count: 20,
        subcategories: ['Pattern Discovery', 'Causal Inference', 'Experimental Design', 'Variable Selection', 'Theory Development'],
        difficulties: ['hard', 'expert']
      }),
      // Data Analysis (25 tasks)
      ...this.generateTaskSet({
        domain: 'research',
        category: 'Data Analysis',
        count: 25,
        subcategories: ['Statistical Analysis', 'Machine Learning', 'Data Visualization', 'Result Interpretation', 'Reproducibility'],
        difficulties: ['hard', 'expert']
      }),
      // Collaboration & Review (15 tasks)
      ...this.generateTaskSet({
        domain: 'research',
        category: 'Collaboration & Review',
        count: 15,
        subcategories: ['Peer Review', 'Author Matching', 'Conflict Detection', 'Quality Assessment', 'Impact Prediction'],
        difficulties: ['medium', 'hard']
      }),
      // Grant & Funding (15 tasks)
      ...this.generateTaskSet({
        domain: 'research',
        category: 'Grant & Funding',
        count: 15,
        subcategories: ['Proposal Writing', 'Funding Opportunity Matching', 'Budget Optimization', 'Impact Prediction', 'Reviewer Matching'],
        difficulties: ['hard', 'expert']
      })
    ];

    this.domainSuites.set('research', {
      domain: 'research',
      name: 'Research AI Benchmark Suite',
      version: '1.0.0',
      totalTasks: tasks.length,
      tasks,
      categories: [...new Set(tasks.map(t => t.category))],
      industrySpecificMetrics: {
        citation_accuracy: true,
        reproducibility_score: true,
        novelty_score: true,
        impact_factor_prediction: true,
        peer_review_quality: true
      }
    });
  }

  /**
   * RETAIL DOMAIN (110 tasks)
   */
  private initializeRetailDomain(): void {
    const tasks: DomainTask[] = [
      // Demand Forecasting (25 tasks)
      ...this.generateTaskSet({
        domain: 'retail',
        category: 'Demand Forecasting',
        count: 25,
        subcategories: ['Sales Prediction', 'Seasonal Analysis', 'Promotion Impact', 'Cannibalization', 'New Product Forecast'],
        difficulties: ['medium', 'hard', 'expert']
      }),
      // Pricing Optimization (20 tasks)
      ...this.generateTaskSet({
        domain: 'retail',
        category: 'Pricing Optimization',
        count: 20,
        subcategories: ['Dynamic Pricing', 'Markdown Optimization', 'Price Elasticity', 'Competitive Pricing', 'Bundle Optimization'],
        difficulties: ['hard', 'expert']
      }),
      // Customer Analytics (25 tasks)
      ...this.generateTaskSet({
        domain: 'retail',
        category: 'Customer Analytics',
        count: 25,
        subcategories: ['Churn Prediction', 'CLV Calculation', 'Next-Best-Action', 'Basket Analysis', 'Personalization'],
        difficulties: ['medium', 'hard']
      }),
      // Inventory Management (20 tasks)
      ...this.generateTaskSet({
        domain: 'retail',
        category: 'Inventory Management',
        count: 20,
        subcategories: ['Stock Optimization', 'Allocation', 'Replenishment', 'Dead Stock Prediction', 'Multi-Channel Inventory'],
        difficulties: ['hard', 'expert']
      }),
      // Store Operations (20 tasks)
      ...this.generateTaskSet({
        domain: 'retail',
        category: 'Store Operations',
        count: 20,
        subcategories: ['Staff Scheduling', 'Layout Optimization', 'Shrinkage Detection', 'Queue Management', 'Energy Optimization'],
        difficulties: ['medium', 'hard']
      })
    ];

    this.domainSuites.set('retail', {
      domain: 'retail',
      name: 'Retail AI Benchmark Suite',
      version: '1.0.0',
      totalTasks: tasks.length,
      tasks,
      categories: [...new Set(tasks.map(t => t.category))],
      industrySpecificMetrics: {
        forecast_accuracy: true,
        inventory_turnover: true,
        gross_margin: true,
        sell_through_rate: true,
        same_store_sales: true
      }
    });
  }

  /**
   * LOGISTICS DOMAIN (100 tasks)
   */
  private initializeLogisticsDomain(): void {
    const tasks: DomainTask[] = [
      // Route Optimization (25 tasks)
      ...this.generateTaskSet({
        domain: 'logistics',
        category: 'Route Optimization',
        count: 25,
        subcategories: ['Last-Mile Delivery', 'Multi-Stop Routing', 'Dynamic Rerouting', 'Fleet Optimization', 'Carbon Footprint'],
        difficulties: ['hard', 'expert']
      }),
      // Warehouse Management (25 tasks)
      ...this.generateTaskSet({
        domain: 'logistics',
        category: 'Warehouse Management',
        count: 25,
        subcategories: ['Pick Path Optimization', 'Slotting', 'Labor Planning', 'Automation Integration', 'Space Utilization'],
        difficulties: ['hard', 'expert']
      }),
      // Demand Planning (20 tasks)
      ...this.generateTaskSet({
        domain: 'logistics',
        category: 'Demand Planning',
        count: 20,
        subcategories: ['Volume Forecasting', 'Peak Planning', 'Capacity Planning', 'Network Design', 'Contingency Planning'],
        difficulties: ['hard', 'expert']
      }),
      // Supply Chain Visibility (15 tasks)
      ...this.generateTaskSet({
        domain: 'logistics',
        category: 'Supply Chain Visibility',
        count: 15,
        subcategories: ['Shipment Tracking', 'ETA Prediction', 'Exception Management', 'Risk Detection', 'Performance Monitoring'],
        difficulties: ['medium', 'hard']
      }),
      // Reverse Logistics (15 tasks)
      ...this.generateTaskSet({
        domain: 'logistics',
        category: 'Reverse Logistics',
        count: 15,
        subcategories: ['Returns Prediction', 'Refurbishment Routing', 'Resale Optimization', 'Disposal Optimization', 'Warranty Analysis'],
        difficulties: ['medium', 'hard']
      })
    ];

    this.domainSuites.set('logistics', {
      domain: 'logistics',
      name: 'Logistics AI Benchmark Suite',
      version: '1.0.0',
      totalTasks: tasks.length,
      tasks,
      categories: [...new Set(tasks.map(t => t.category))],
      industrySpecificMetrics: {
        on_time_delivery: true,
        cost_per_mile: true,
        utilization_rate: true,
        dock_to_stock_time: true,
        perfect_order_rate: true
      }
    });
  }

  /**
   * Generate a set of tasks for a category
   */
  private generateTaskSet(config: {
    domain: Domain;
    category: string;
    count: number;
    subcategories: string[];
    difficulties: string[];
    regulatoryRequirements?: string[];
  }): DomainTask[] {
    const tasks: DomainTask[] = [];
    const tasksPerSubcategory = Math.ceil(config.count / config.subcategories.length);

    config.subcategories.forEach((subcategory, index) => {
      const taskCount = Math.min(tasksPerSubcategory, config.count - tasks.length);
      
      for (let i = 0; i < taskCount; i++) {
        const difficulty = config.difficulties[i % config.difficulties.length] as any;
        
        tasks.push({
          id: `${config.domain}_${config.category.toLowerCase().replace(/\s+/g, '_')}_${String(tasks.length + 1).padStart(3, '0')}`,
          domain: config.domain,
          category: config.category,
          subcategory,
          name: `${subcategory} Task ${i + 1}`,
          description: `Perform ${subcategory.toLowerCase()} analysis for ${config.domain} domain`,
          difficulty,
          expectedSteps: difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : difficulty === 'hard' ? 6 : 8,
          successCriteria: [
            `Analysis completed with ${difficulty === 'expert' ? 'high' : 'acceptable'} accuracy`,
            `Results validated against industry standards`,
            `Confidence score > ${difficulty === 'expert' ? 0.9 : 0.8}`
          ],
          testData: { type: subcategory, sample: 'test_data' },
          expectedOutput: { result: 'expected_result', metrics: {} },
          evaluationMetrics: ['accuracy', 'completeness', 'relevance', 'confidence'],
          regulatoryRequirements: config.regulatoryRequirements
        });
      }
    });

    return tasks;
  }

  /**
   * Get all domain suites
   */
  getAllDomains(): DomainBenchmarkSuite[] {
    return Array.from(this.domainSuites.values());
  }

  /**
   * Get a specific domain suite
   */
  getDomainSuite(domain: Domain): DomainBenchmarkSuite | undefined {
    return this.domainSuites.get(domain);
  }

  /**
   * Get total tasks across all domains
   */
  getTotalTaskCount(): number {
    return Array.from(this.domainSuites.values()).reduce(
      (sum, suite) => sum + suite.totalTasks,
      0
    );
  }

  /**
   * Get summary statistics
   */
  getSummaryStatistics(): {
    totalDomains: number;
    totalTasks: number;
    domainBreakdown: Record<Domain, number>;
    averageTasksPerDomain: number;
  } {
    const breakdown: Record<string, number> = {};
    
    this.domainSuites.forEach((suite, domain) => {
      breakdown[domain] = suite.totalTasks;
    });

    return {
      totalDomains: this.domainSuites.size,
      totalTasks: this.getTotalTaskCount(),
      domainBreakdown: breakdown as Record<Domain, number>,
      averageTasksPerDomain: this.getTotalTaskCount() / this.domainSuites.size
    };
  }
}
