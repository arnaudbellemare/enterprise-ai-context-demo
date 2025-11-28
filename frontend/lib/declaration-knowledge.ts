/**
 * Declaration of Co-ownership Knowledge Base
 * 
 * Comprehensive extraction and classification of all rules from DDC_Enticy_v2.pdf
 * Organized by category for easy reference in email classification and response generation
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ViolationRule {
  prohibited: boolean;
  location: string[]; // Where it applies: 'units', 'common areas', 'balconies', 'parking', etc.
  fineAmount: string;
  escalation?: {
    secondViolation?: string;
    thirdViolation?: string;
    continuousViolation?: string; // Per day or per occurrence
  };
  noticeRequired?: boolean;
  boardAction?: string; // What the board can do
  legalAction?: string; // TAL, court, etc.
}

export interface FinancialRule {
  condoFees: {
    paymentMethods: string[];
    dueDate: string; // e.g., "1st of each month"
    lateFees?: string;
    interestRate?: string;
  };
  PPA: {
    required: boolean;
    recommended: boolean;
    setupProcess: string;
  };
  specialAssessments: {
    approvalRequired: boolean;
    threshold?: string; // Amount requiring board approval
  };
  deposits: {
    moveInOut: string;
    renovation?: string;
    other?: Record<string, string>;
  };
}

export interface AccessControlRule {
  fob: {
    required: boolean;
    issuanceProcess: string;
    replacementFee?: string;
  };
  intercom: {
    setupProcess: string;
    displayNameFormat?: string;
    unlockCode?: string; // e.g., "9"
  };
  keys: {
    commonAreas: boolean;
    replacementProcess: string;
  };
  elevator: {
    reservationRequired: boolean;
    hours: string;
    capacityRestrictions?: string;
  };
}

export interface RenovationRule {
  approvalRequired: boolean;
  boardApprovalThreshold?: string; // Amount or type requiring CA approval
  requiredDocuments: string[];
  depositRequired: boolean;
  depositAmount?: string;
  insuranceRequired: boolean;
  permitRequired: boolean;
  contractorRequirements: {
    licenseRequired: boolean;
    insuranceRequired: boolean;
    minimumCoverage?: string;
  };
  hours: string; // Allowed work hours
  inspectionRequired: boolean;
}

export interface MoveInOutRule {
  reservationRequired: boolean;
  advanceNotice: string; // e.g., "48 hours"
  depositRequired: boolean;
  depositAmount: string;
  hours: string; // Allowed move-in hours
  elevatorReservation: boolean;
  commonAreaProtection: {
    required: boolean;
    materials?: string; // What protection materials needed
  };
  inspection: {
    before: boolean;
    after: boolean;
    depositRefundTimeline: string;
  };
}

export interface EvictionRule {
  grounds: string[]; // Valid reasons for eviction
  process: {
    noticesRequired: number;
    noticeTypes: string[]; // "Written warning", "Formal notice", etc.
    gracePeriod?: string;
    TALApplication: boolean;
    timeline: string; // Typical timeline
  };
  fines: {
    beforeEviction: boolean;
    amounts: string[];
  };
  coOwnerResponsibility: {
    liable: boolean;
    forTenants: boolean;
    forGuests: boolean;
  };
}

export interface WaterDamageRule {
  emergencyResponse: {
    immediateAction: string[];
    contactProcedures: string[];
    emergencyPhone?: string;
    guideLink?: string;
  };
  stepByStepProcess?: {
    phase1_UrgentIntervention: {
      title: string;
      steps: string[];
      description: string;
    };
    phase2_InsuranceDeclaration: {
      title: string;
      steps: string[];
      description: string;
    };
    phase3_DamageAssessment: {
      title: string;
      steps: string[];
      description: string;
    };
    phase4_QuoteApproval: {
      title: string;
      steps: string[];
      description: string;
    };
    phase5_WorkLaunch: {
      title: string;
      steps: string[];
      description: string;
    };
    phase6_WorkAcceptance: {
      title: string;
      steps: string[];
      description: string;
    };
  };
  insurance: {
    syndicateCovers: string[];
    coOwnerCovers: string[];
    coordination: string;
  };
  responsibility: {
    sourceDetermination: string;
    syndicateResponsible: string[];
    coOwnerResponsible: string[];
  };
  reconstruction: {
    standardRestoration: string[];
    improvementsCoverage: string;
  };
  tenantCommunication?: string;
}

export interface WaterDamageIncidentManagement {
  workflow: {
    stages: string[];
    statuses: {
      new: string[];
      investigation: string[];
      quotes: string[];
      repairs: string[];
      invoicing: string[];
      closed: string[];
    };
  };
  mainItemColumns: {
    itemName: {
      format: string; // e.g., "SDC xxx - Brief Description"
      example: string;
    };
    projectManager: string; // People column
    teamMembers: string; // People column
    incidentDate: string; // Date column
    source: {
      type: string; // Status/Dropdown
      options: string[];
    };
    insurance: {
      policyNumber: string; // Text column
      reportDate: string; // Date column
    };
    damageScope: string; // Long Text column
    overallStatus: {
      type: string; // Status column
      options: string[];
    };
    emergencyCompany: {
      name: string; // Text column
      contact: string; // Text column
    };
    reconstructionCompany: {
      name: string; // Text column
      contact: string; // Text column
    };
    syndicateAdjuster: {
      name: string; // Text column
      contact: string; // Text column
    };
    syndicateContact: {
      name: string; // Text column
      details: string; // Text column
    };
    appraiser: {
      name: string; // Text column (if required)
      contact: string; // Text column (if required)
      dossierNumber: string; // Text column (if required)
    };
    deductible: string; // Numbers column with $ symbol
    documents: string; // Files column
    closedDate: string; // Date column
    nextStepDueDate: string; // Date column (for reminders)
    lastUpdate: string; // Last Updated column (automatic)
  };
  subItems: {
    purpose: string;
    columns: {
      subItemName: string; // e.g., "Unité #XXX" or "Corridor 4e étage"
      unitStatus: string; // Status column
      damageDetails: string; // Long Text column
      coOwnerAdjuster: {
        name: string; // Text column (if applicable)
        dossierNumber: string; // Text column (if applicable)
      };
    };
  };
}

export interface NoiseRule {
  quietHours: string; // e.g., "10 PM - 7 AM"
  prohibited: string[]; // Types of noise
  allowed: string[]; // Exceptions
  fineAmount: string;
}

export interface PetRule {
  allowed: boolean;
  restrictions?: {
    type?: string[]; // e.g., "Dogs and cats only"
    size?: string;
    number?: number;
    breed?: string[];
  };
  registrationRequired: boolean;
  depositRequired?: boolean;
  depositAmount?: string;
  fines?: string;
}

export interface ParkingRule {
  assignedSpaces: boolean;
  visitorParking: {
    available: boolean;
    timeLimit?: string;
  };
  prohibited: string[]; // e.g., "Commercial vehicles", "RVs"
  fines: string;
  towing: {
    allowed: boolean;
    conditions: string[];
  };
}

export interface CommonAreaRule {
  usage: {
    allowed: string[];
    prohibited: string[];
    reservationRequired?: string[];
  };
  hours?: string;
  fees?: Record<string, string>;
}

export interface BoardApprovalRule {
  requiredFor: string[];
  process: string;
  timeline: string;
  quorum?: string;
  votingRules?: string;
}

export interface NotaryCertificateInfo {
  syndicateRegistration: {
    registered: boolean;
    registrationNumber?: string;
    annualDeclarationFiled: boolean;
  };
  records: {
    keptAsRequired: boolean; // Article 1070 C.c.Q.
  };
  attestation: {
    provided: boolean; // Article 1068.1 C.c.Q.
    administrativeFee: string; // Typically $225
  };
  reserveFund: {
    totalAmount: string;
  };
  selfInsuranceFund: {
    totalAmount: string;
  };
  legalProceedings: {
    exists: boolean;
    details?: string;
  };
  majorRepairs: {
    commitments: boolean;
    details?: string;
  };
  insurance: {
    broker: {
      name: string;
      address: string;
      phone: string;
      fax: string;
    };
    company: string;
    policyNumber: string;
    coverageAmount: string; // "See insurance coverage document"
    highestDeductible: string;
  };
  unitInfo: {
    unitNumber?: string; // Lot number
    condoFees?: string;
    nextPaymentDate?: string;
    amountDue?: string;
  };
  standardQuestions: {
    monthlyCharges: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    lastPayment: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    nextPaymentDue: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    arrears: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    interestRate: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    specialAssessment: {
      current: {
        question: string;
        answerFormat: string;
        defaultAnswer?: string;
      };
      votedNotYetDue: {
        question: string;
        answerFormat: string;
        defaultAnswer?: string;
      };
    };
    reserveFund: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    fiscalYear: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    operatingDeficit: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    operatingSurplus: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    legalProceedings: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    judgments: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    insurancePremiums: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    insuranceIndemnities: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    insuranceTrustee: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    registration: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    exclusiveCommonAreas: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    restrictedCommonAreaFees: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    videotronFees: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    additionalRegulations: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    pendingRegulations: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    lastAGM: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    extraordinaryDecisions: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    sellerWorks: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    sellerViolations: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    valueFactors: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
    timeShare: {
      question: string;
      answerFormat: string;
      defaultAnswer?: string;
    };
  };
}

export interface WelcomeGuideInfo {
  moveInOut: {
    advanceNotice: string; // e.g., "7 days"
    elevatorFee: string;
    damageDeposit: string;
    confirmationRequired: boolean;
  };
  accessoryPricing: {
    chipFob: string;
    garageController: string;
  };
  paymentMethods: {
    PPA: {
      formRequired: boolean;
      voidChequeRequired: boolean;
      paymentDate: string; // e.g., "1st of each month"
    };
    cheque: {
      postDatedRequired: boolean;
      numberOfCheques: number;
      payableTo: string;
      mailingAddress: string;
    };
  };
  coOwnerRegistration: {
    requiredInformation: {
      email: boolean;
      phoneNumber: boolean;
      possessionDate: boolean;
    };
    requiredDocuments: {
      voidCheque: boolean;
      homeInsurance: boolean;
      reason: string;
    };
    rentalDeclaration: {
      required: boolean;
      ifRenting: {
        minimumLeaseDuration: string; // e.g., "31 days"
        requiredDocuments: string[];
        signatories: string[];
      };
    };
    setupProcedures: {
      intercom: boolean;
      expedibox: boolean;
      moveIn: boolean;
      additionalFob: boolean;
    };
  };
  tenantRequirements: {
    requiredDocuments: string[];
    ownerResponsibility: string;
    minimumLeaseDuration: string;
  };
  unitAccess: {
    keyCopyRequired: boolean;
    reason: string;
  };
  intercom: {
    canadianNumberRequired: boolean;
    nameFormat: string; // e.g., "Initial + Last name"
    unlockCode: string; // e.g., "9"
    maxContacts?: number;
  };
  expedibox: {
    exclusiveForParcels: boolean;
    noStorage: boolean;
    monitored: boolean;
    finesForMisuse: boolean;
    timeLimit?: string;
  };
  maintenance: {
    garageCleaning: {
      schedule: string;
      vehicleMoveRequired: boolean;
    };
    windowCleaning: {
      annual: boolean;
      season: string;
      ownerPatioResponsibility: boolean;
    };
    carpetCleaning: {
      frequency: string; // e.g., "4 times per year"
      stainReporting: string; // email address
    };
  };
  pool: {
    hours: string; // e.g., "8:00 AM - 9:00 PM"
    rules: string[];
    guestLimit: number;
    ageRestriction?: string;
  };
  rooftop: {
    accessControl: boolean;
    security: boolean;
    hygiene: boolean;
    guestLimit?: number;
    qrCodeRegistration: boolean;
  };
  gym: {
    hours: string; // e.g., "5:00 AM - 11:00 PM"
    rules: string[];
    guestLimit: number;
    prohibited: string[];
  };
  emergency: {
    phoneNumber: string;
    email: string;
    afterHours: {
      phoneNumber: string;
      conditions: string[]; // e.g., "water damage", "fire", "theft"
    };
  };
  management: {
    company: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    hours: string;
  };
}

export interface FinancialStatements {
  balanceSheet: {
    asOfDate: string;
    assets: {
      accountsReceivableCoOwners: string;
      accountsReceivableOther: string;
      operatingAccount: string;
      reserveFundAccount: string;
      selfInsuranceAccount: string;
      prepaidExpenses: string;
      dueFromReserveFund: string;
      dueToSelfInsurance: string;
      totalAssets: string;
    };
    liabilities: {
      accountsPayable: string;
      accruedExpenses: string;
      dueToOperatingFund: string;
      collectionFees: string;
      totalLiabilities: string;
    };
    equity: {
      operatingFunds: string;
      reserveFund: string;
      selfInsuranceFund: string;
      excessRevenue: string;
      totalEquity: string;
    };
  };
  incomeStatement: {
    period: string;
    revenues: {
      commonCharges: string;
      parkingCharges: string;
      interestReserveFund: string;
      interestSelfInsurance: string;
      miscellaneous: string;
      totalRevenues: string;
    };
    expenses: {
      landscaping: string;
      janitorial: string;
      snowRemoval: string;
      electrical: string;
      security: string;
      alarmSystem: string;
      transactionFees: string;
      wasteManagement: string;
      officeSupplies: string;
      locksmith: string;
      garageMaintenance: string;
      carpetMaintenance: string;
      managementFees: string;
      professionalFees: string;
      hvacPrivate: string;
      pestControl: string;
      hvacCommon: string;
      windowCleaning: string;
      minorRepairs: string;
      garageDoors: string;
      elevators: string;
      drainsPumps: string;
      waterHeaters: string;
      plumbing: string;
      fireSafety: string;
      totalExpenses: string;
    };
    netIncome: string;
  };
  budgets: {
    annual: {
      revenues: string;
      expenses: string;
    };
    previousYear: {
      revenues: string;
      expenses: string;
    };
  };
}

export interface AGMInfo {
  year: string; // e.g., "2024-2025"
  convocationDate?: string;
  meetingDate?: string;
  location?: string;
  agenda?: string[];
  documents?: string[];
  quorum?: string;
  votingRules?: string;
}

export interface CoOwnershipGuideInfo {
  syndicate: {
    definition: string;
    legalStatus: string;
    purpose: string;
    decisionMakingBodies: string[];
    fiscalStatus: {
      quebec: string;
      canada: string;
      annualFiling: string;
    };
  };
  boardOfDirectors: {
    role: string;
    powers: string[];
    responsibilities: string[];
  };
  generalAssembly: {
    role: string;
    types: string[];
    powers: string[];
  };
  areas: {
    private: {
      definition: string;
      ownership: string;
    };
    common: {
      definition: string;
      ownership: string;
      maintenance: string;
    };
    restrictedCommon: {
      definition: string;
      examples: string[];
    };
  };
  contributions: {
    generalCharges: string;
    particularCharges: string;
    reserveFund: string;
    selfInsuranceFund: string;
  };
  insurance: {
    coOwnerRequirements: string;
    liabilityCoverage: string;
    whatToInsure: string[];
  };
  renovations: {
    noAuthorizationRequired: string[];
    authorizationRequired: string[];
    syndicateWorksInPrivate: {
      allowed: boolean;
      noticeRequired: boolean;
      keyCopyRequired: boolean;
      emergencyAccess: string;
    };
  };
  rental: {
    legalRequirements: {
      regulationDelivery: string; // Article 1894 C.c.Q.
      notificationToSyndicate: string; // Article 1065 C.c.Q.
      registerMaintenance: string; // Article 1070 C.c.Q.
      leaseTermination: string; // Article 1079 C.c.Q.
    };
    restrictions: {
      shortTerm: string;
      roomingHouse: string;
    };
    ownerResponsibilities: string[];
  };
  importantDocuments: {
    declaration: {
      initial: string;
      concomitant: string;
    };
    buildingRegulation: string;
  };
}

export interface BuildingRegulationInfo {
  year: string;
  sections: Record<string, {
    title: string;
    rules: string[];
    fines?: string[];
  }>;
  generalRules: string[];
  specificProhibitions: string[];
  fines: {
    structure: string;
    amounts: Record<string, string>;
  };
}

export interface AdministrativeFees {
  information: {
    commonChargesStatus: string; // $225 per event
    syndicateInformation: string; // $225 per event
    attestation: string; // $225 per event (Law 16 certificate)
    recordConsultation: string; // $50 per hour
  };
  coOwnerResponsibility: {
    managementFee: string; // $150/hour, minimum 3 hours
    conciergeIntervention: string; // $100/hour
    cleaningFee: string; // $100/hour
  };
  moveInOut: {
    supervisionFee: string; // $250 per event
  };
  replacements: {
    fob: string; // $20
    garageController: string; // $30
  };
  billing: {
    chargedTo: string[]; // Who gets charged (co-owner-cedant, buyer, notary, etc.)
    exceptions: string; // Written agreement with board
  };
}

export interface CoOwnershipProtocols {
  administrativeFees: {
    commonChargesStatus: {
      amount: string;
      billedTo: string;
      exception: string;
    };
    syndicateInformation: {
      amount: string;
      billedTo: string[];
      exception: string;
    };
    attestation: {
      amount: string;
      billedTo: string;
      exception: string;
    };
    coOwnerResponsibility: {
      managementFee: string;
      conciergeIntervention: string;
      cleaningFee: string;
    };
    damageDeposit: string;
    recordConsultation: string;
    moveSupervision: string;
    fobReplacement: string;
    garageControllerReplacement: string;
  };
  security: {
    guardHours: string;
    contact: string;
  };
  cleaning: {
    requestEmail: string;
    process: string;
  };
  tenantSetup: {
    intercomExpedibox: {
      requiredDocuments: string[];
      email: string;
    };
  };
  telecommunications: {
    videotronBell: {
      technicianAccess: string;
      codeLocation: string;
      keyReturn: string;
      responsibility: string;
    };
  };
  warranty: {
    ovenDishwasher: {
      company: string;
      phone: string;
      email: string;
    };
    washerDryer: {
      company: string;
      phone: string;
    };
    developer: {
      name: string;
      email: string;
      services: string[];
    };
  };
  maintenance: {
    hotWaterPressure: {
      process: string;
      valveLocation: string;
      contact: string;
    };
    airConditioning: {
      hydroPayment: {
        billing: 'Billing for air conditioning electricity is processed through Hydro payments, ensuring accurate tracking of usage',
        process: 'Billing for air conditioning electricity is processed through Hydro payments'
      },
      breakerRules: {
        critical: 'Never turn off your unit\'s circuit breaker',
        reason: 'Turning off the circuit breaker can cause electrical faults and maintain safe operation of air conditioning units',
        compliance: 'Users must follow breaker rules to prevent electrical faults and maintain safe operation of air conditioning units'
      },
      powerManagement: {
        guidelines: 'Effective air conditioning use requires managing power consumption to avoid overloads and ensure efficiency',
        privateUnitResponsibility: 'Each unit owner is responsible for their air conditioning unit and related electrical consumption'
      },
      errorCodeManual: string;
      privateUnitResponsibility: string;
      contact: string;
      manualAppLinks: 'Manual and app links available in Welcome Guide for A/C operation and troubleshooting'
    };
  };
  renovations: {
    section13_3_1_1: string; // Modification of private area limits
    section13_3_1_2: string; // Major works approval
    section13_3_1_3: string; // Board approval criteria
    section13_3_1_4: string; // Significant impact works
    section13_3_1_5: string; // Common area works
    section13_3_2_1: string; // Licensed contractors
    section13_3_2_2: string; // Expert supervision
    section13_3_2_3: string; // Access for verification
    section13_3_2_4: string; // Work directives
    section13_3_3_1: string; // Restricted common areas
    section13_3_3_2: string; // No obstruction to conservation works
    section13_3_3_3: string; // Notice to tenants
    section13_3_3_4: string; // Major plumbing/electrical
    section13_3_3_5: string; // Declarant exception
  };
  pool: {
    hours: string;
    access: string;
    rules: string[];
    security: string[];
    hygiene: string[];
    liability: string;
    guests: {
      limit: number;
      accompaniment: boolean;
      responsibility: string;
    };
    capacity: {
      rooftop: number;
    };
    registration: boolean;
  };
  gym: {
    hours: string;
    capacity: number;
    rules: string[];
    prohibited: string[];
    guests: {
      limit: number;
      note: string;
    };
  };
  mailKey: {
    replacement: string;
  };
  fobRequest: {
    email: string;
    paymentPlatform: string;
    process: string[];
  };
  notarySales: {
    email: string;
    fee: string;
    paymentPlatform: string;
    process: string[];
    timeline: string;
  };
}

export interface FileManagementStructure {
  administration: {
    communication: string[];
    declarationRegulations: string[];
    coOwnerTenantInfo: string[];
    notarySales: string[];
    managementContract: string[];
    airbnb: string[];
    welcomeGuide: string[];
    followUp: string[];
    parkingLocker: string[];
  };
  conciergerie: {
    concierge: string[];
    superintendence: string[];
  };
  wasteRecycling: string[];
  buildingMaintenance: {
    ventilation: string[];
    fireAlarm: string[];
    windows: string[];
    carpets: string[];
    intercom: string[];
  };
  professionalFees: {
    lawyer: string[];
    notary: string[];
    inspector: string[];
    evaluator: string[];
  };
  energy: {
    electricity: string[];
    naturalGas: string[];
  };
  banking: {
    bankReconciliation: string[];
    ppaReturn: string[];
  };
  taxes: {
    revenueCanada: string[];
    revenueQuebec: string[];
  };
  otonomSolution: string[];
  registraire: string[];
  financialInformation: {
    financialStatements: string[];
    budget: string[];
    balanceSheet: string[];
  };
  insurance: string[];
  agm: {
    convocationNotice: string[];
    proxy: string[];
    agendaAddition: string[];
    minutes: string[];
    newsletter: string[];
    presentation: string[];
    budget: string[];
    balanceSheet: string[];
    financialStatements: string[];
    insurance: string[];
    referenceUnit: string[];
    proptyReport: string[];
    videoChat: string[];
    votingResults: string[];
    elections: string[];
  };
  boardMeeting: {
    agenda: string[];
    minutes: string[];
  };
  claims: string[];
  litigation: string[];
  deficiencies: {
    commonAreasReception: string[];
    reserveFundStudy: string[];
    maintenanceLog: string[];
    selfInsurance: string[];
    reconstructionCost: string[];
    warranty: string[];
    plans: string[];
    complianceCertificate: string[];
  };
  schedule: {
    technicalFileCalendar: string[];
  };
  monday: {
    syndicateInfo: string[];
    syndicateProtocol: string[];
    complaintsRequests: string[];
    violations: string[];
    technical: string[];
    claims: string[];
    weeklyInspection: string[];
    boardAdministrativeFollowUp: string[];
  };
}

export interface DeclarationRules {
  violations: {
    smoking: ViolationRule;
    noise: NoiseRule;
    pets: PetRule;
    parking: ParkingRule;
    general: ViolationRule; // For other violations
  };
  financial: FinancialRule;
  accessControl: AccessControlRule;
  renovation: RenovationRule;
  moveInOut: MoveInOutRule;
  eviction: EvictionRule;
  waterDamage: WaterDamageRule;
  commonAreas: CommonAreaRule;
  boardApproval: BoardApprovalRule;
  insurance: {
    coOwnerMinimum: string;
    syndicateCoverage: string[];
  };
  legal: {
    declarationSections: Record<string, string>; // Section references
    applicableLaws: string[]; // e.g., "Civil Code of Quebec", "Law 16"
  };
  notaryCertificate: NotaryCertificateInfo;
  welcomeGuide: WelcomeGuideInfo;
  financialStatements: FinancialStatements;
  agm: AGMInfo;
  coOwnershipGuide: CoOwnershipGuideInfo;
  buildingRegulation: BuildingRegulationInfo;
  administrativeFees: AdministrativeFees;
  fileManagement: FileManagementStructure;
  protocols: CoOwnershipProtocols;
  waterDamageManagement: WaterDamageIncidentManagement;
}

// ============================================================================
// EXTRACTED KNOWLEDGE FROM DDC_Enticy_v2.pdf
// ============================================================================

export const ENTICY_DECLARATION_RULES: Partial<DeclarationRules> = {
  violations: {
    smoking: {
      prohibited: true,
      location: ['units', 'balconies', 'common areas'],
      fineAmount: '$100',
      escalation: {
        secondViolation: '$150',
        thirdViolation: '$50 per additional notice',
        continuousViolation: '$50 per day after first notice'
      },
      noticeRequired: true,
      boardAction: 'Issue fines, apply to TAL for eviction if violations persist',
      legalAction: 'TAL application for lease termination and eviction'
    },
    noise: {
      quietHours: '10 PM - 7 AM',
      prohibited: [
        'Excessive noise',
        'Loud music',
        'Yelling',
        'Fighting',
        'Disturbances',
        'Parties after quiet hours'
      ],
      allowed: [
        'Normal living activities during permitted hours'
      ],
      fineAmount: '$100'
    },
    pets: {
      allowed: true, // To be confirmed from PDF
      registrationRequired: true,
      depositRequired: false // To be confirmed
    },
    parking: {
      assignedSpaces: true,
      visitorParking: {
        available: true,
        timeLimit: '24 hours'
      },
      prohibited: [
        'Commercial vehicles',
        'Vehicles blocking access'
      ],
      fines: '$50-$100',
      towing: {
        allowed: true,
        conditions: ['Blocking access', 'Unauthorized parking']
      }
    },
    general: {
      prohibited: true,
      location: ['units', 'common areas'],
      fineAmount: '$100',
      escalation: {
        secondViolation: '$150',
        thirdViolation: '$50 per additional notice',
        continuousViolation: '$50 per day after first notice'
      },
      noticeRequired: true,
      boardAction: 'Issue fines, warnings, apply to TAL if necessary'
    }
  },

  financial: {
    condoFees: {
      paymentMethods: ['Pre-authorized payment (PPA)', 'Cheque', 'Bank transfer'],
      dueDate: '1st of each month',
      lateFees: 'To be specified in declaration',
      interestRate: 'To be specified in declaration'
    },
    PPA: {
      required: false,
      recommended: true,
      setupProcess: 'Submit signed PPA form with void cheque or banking information'
    },
    specialAssessments: {
      approvalRequired: true,
      threshold: 'Board approval required for all special assessments'
    },
    deposits: {
      moveInOut: '$500',
      renovation: 'Variable based on scope'
    }
  },

  accessControl: {
    fob: {
      required: true,
      issuanceProcess: 'Request from management, provide proof of ownership/tenancy',
      replacementFee: 'To be confirmed'
    },
    intercom: {
      setupProcess: 'Provide phone number and desired display name to management',
      displayNameFormat: 'Unit number or name',
      unlockCode: '9'
    },
    keys: {
      commonAreas: false, // Typically not provided
      replacementProcess: 'Contact management'
    },
    elevator: {
      reservationRequired: true,
      hours: 'Monday to Saturday, 8 AM - 6 PM',
      capacityRestrictions: 'No furniture exceeding elevator capacity'
    }
  },

  renovation: {
    approvalRequired: true,
    boardApprovalThreshold: 'Major renovations and structural modifications',
    requiredDocuments: [
      'Detailed plans',
      'Contractor license',
      'Contractor insurance proof',
      'Municipal permits (if required)'
    ],
    depositRequired: true,
    depositAmount: 'Variable based on scope',
    insuranceRequired: true,
    permitRequired: true, // For major work
    contractorRequirements: {
      licenseRequired: true,
      insuranceRequired: true,
      minimumCoverage: '2 million $ liability'
    },
    hours: 'Monday to Friday, 8 AM - 6 PM',
    inspectionRequired: true
  },

  moveInOut: {
    reservationRequired: true,
    advanceNotice: '48 hours minimum',
    depositRequired: true,
    depositAmount: '$500',
    hours: 'Monday to Saturday, 8 AM - 6 PM',
    elevatorReservation: true,
    commonAreaProtection: {
      required: true,
      materials: 'Protective coverings for corridors, walls, and elevator'
    },
    inspection: {
      before: true,
      after: true,
      depositRefundTimeline: '10 days after move-out if no damage'
    }
  },

  eviction: {
    grounds: [
      'Repeated rule violations',
      'Disturbances',
      'Noise violations',
      'Safety concerns',
      'Non-payment of fees'
    ],
    process: {
      noticesRequired: 1,
      noticeTypes: ['Written warning', 'Formal notice', 'TAL application'],
      gracePeriod: '1 month voluntary departure',
      TALApplication: true,
      timeline: '2-3 months for TAL hearing after application'
    },
    fines: {
      beforeEviction: true,
      amounts: ['$100 first violation', '$150 second violation', '$50 per additional notice']
    },
    coOwnerResponsibility: {
      liable: true,
      forTenants: true,
      forGuests: true
    }
  },

  waterDamage: {
    emergencyResponse: {
      immediateAction: [
        'Contact emergency plumber',
        'Stop water source',
        'Document damage with photos',
        'Contact management immediately'
      ],
      contactProcedures: [
        'Fill Monday.com incident form',
        'Notify project manager',
        'Contact emergency restoration company'
      ],
      emergencyPhone: '514-777-1731',
      guideLink: 'Water damage guide link available in Welcome Guide'
    },
    stepByStepProcess: {
      phase1_UrgentIntervention: {
        title: 'Urgent Intervention and Leak Control',
        steps: [
          'Handle the emergency of the disaster',
          'Dispatch of a post-disaster company',
          'Dispatch of the trade to stop the leak (plumber, etc.)',
          'Repair of the origin of the loss once the quotation is accepted by the Board'
        ],
        description: 'Immediate action is required to control water leaks and prevent further damage before proceeding with other steps.'
      },
      phase2_InsuranceDeclaration: {
        title: 'Documentation and Insurance Declaration',
        steps: [
          'Declaration to the insurance',
          'Declaration of the co-owner to his insurance',
          'Declaration of the syndicate to its insurance company',
          'Denunciation between the parties',
          'Co-owner: transmission of insurance file',
          'Syndicate: notice of commitment sent to the private unit that caused the loss',
          'If the loss comes from common equipment belonging to the syndicate, the latter will assume full responsibility'
        ],
        description: 'Thorough documentation of the damage and prompt declaration to insurers are essential for a smooth claims process.'
      },
      phase3_DamageAssessment: {
        title: 'Damage Assessment',
        steps: [
          'The claims experts appointed by the insurance companies will determine the work to be done',
          'Any leasehold improvements, i.e., cosmetic additions or embellishments to the private unit are covered only by the owner\'s insurance',
          'Estimate of the work by one of two contractors'
        ],
        description: 'Experts assess the extent of the damage, obtain syndicate approval, and initiate necessary repairs to restore the property.'
      },
      phase4_QuoteApproval: {
        title: 'Approval of Quotes',
        steps: [
          'Approval required by the Board of Directors',
          'Approval required by claim adjusters'
        ],
        description: 'Both Board and insurance adjusters must approve quotes before work begins.'
      },
      phase5_WorkLaunch: {
        title: 'Launch of Work',
        steps: [
          'Work schedule',
          'Move-in/Move-out organization (if required)'
        ],
        description: 'Work begins according to approved schedule, with temporary relocation if necessary.'
      },
      phase6_WorkAcceptance: {
        title: 'Acceptance of the Work',
        steps: [
          'Final inspection to confirm repairs',
          'Letter of re-invoicing (liability)',
          'Request reimbursement from the unit that generated the claim',
          'Expenses requested: emergency work, repairs, management fees, other justifiable expenses related to the disaster'
        ],
        description: 'The process ends with a final inspection to confirm repairs, billing the responsible party, and issuing last reminders.'
      }
    },
    insurance: {
      syndicateCovers: [
        'Standard restoration to original condition',
        'Common area damage',
        'Structural repairs'
      ],
      coOwnerCovers: [
        'Personal belongings',
        'Improvements beyond standard',
        'Additional living expenses if unit uninhabitable'
      ],
      coordination: 'Both insurances work together, co-owner must declare to personal insurance'
    },
    responsibility: {
      sourceDetermination: 'Syndicate plumber intervention = syndicate responsibility',
      syndicateResponsible: [
        'Standard restoration',
        'Repairs to original condition',
        'Common area damage',
        'If loss comes from common equipment belonging to the syndicate, the syndicate assumes full responsibility'
      ],
      coOwnerResponsible: [
        'Personal belongings',
        'Improvements',
        'Additional living expenses',
        'Leasehold improvements (cosmetic additions or embellishments)'
      ]
    },
    reconstruction: {
      standardRestoration: [
        'Drywall repair',
        'Base paint',
        'Standard flooring replacement',
        'Basic finishes'
      ],
      improvementsCoverage: 'Co-owner insurance covers difference between standard and improvements'
    },
    tenantCommunication: 'Important to pass water damage guide document to tenants if unit is rented, so they are aware of procedures to follow in case of water leak'
  },

  commonAreas: {
    usage: {
      allowed: [
        'Normal transit',
        'Reserved activities with approval'
      ],
      prohibited: [
        'Storage',
        'Obstruction',
        'Commercial use',
        'Smoking'
      ],
      reservationRequired: ['Party room', 'Gym', 'Other facilities']
    }
  },

  boardApproval: {
    requiredFor: [
      'Major renovations',
      'Structural modifications',
      'Expensive purchases',
      'Vendor payments over threshold',
      'Special assessments',
      'Major repairs'
    ],
    process: 'Conseil d\'Administration review and vote',
    timeline: 'Varies by urgency',
    quorum: 'As specified in declaration',
    votingRules: 'Majority vote required'
  },

  insurance: {
    coOwnerMinimum: '2 million $ liability for syndicates of 13+ units (Article 1064.1 C.c.Q.)',
    syndicateCoverage: [
      'Building structure',
      'Common areas',
      'Standard unit restoration',
      'Liability'
    ]
  },

  legal: {
    declarationSections: {
      'Article 1064.1 C.c.Q.': 'Insurance requirements for co-owners',
      'Article 1068.1 C.c.Q.': 'Attestation du syndicat sur l\'état de la copropriété (Law 16 certificate)',
      'Article 1070 C.c.Q.': 'Records required to be kept by syndicate',
      'Article 1894 C.c.Q.': 'Tenant must receive building regulations before lease signing',
      'Law 16': 'Condominium certificate for unit sales'
    },
    applicableLaws: [
      'Civil Code of Quebec',
      'Law 16 (Condominium Act)',
      'Quebec Building Code',
      'Municipal bylaws'
    ]
  },

  notaryCertificate: {
    syndicateRegistration: {
      registered: true,
      registrationNumber: '1177579019',
      annualDeclarationFiled: true
    },
    records: {
      keptAsRequired: true // Article 1070 C.c.Q.
    },
    attestation: {
      provided: false, // Will be provided if requested
      administrativeFee: '$225'
    },
    reserveFund: {
      totalAmount: '$146,158.84' // Updated from financial statements as of May 31, 2025
    },
    selfInsuranceFund: {
      totalAmount: '$47,853.21' // Updated from financial statements as of May 31, 2025
    },
    legalProceedings: {
      exists: false,
      details: ''
    },
    majorRepairs: {
      commitments: false,
      details: ''
    },
    insurance: {
      broker: {
        name: 'BFL Canada inc.',
        address: '2001, av. McGill College, bureau 220, Montreal, QC, H3A1G1',
        phone: '514-843-3632',
        fax: '514-843-3842'
      },
      company: 'Assurance groupe (voir liste d\'assureur sur la copie de la couverture d\'assurance)',
      policyNumber: 'BFL04MTL02210',
      coverageAmount: 'Voir sur la copie de la couverture d\'assurance',
      highestDeductible: '$50,000'
    },
    unitInfo: {
      unitNumber: '', // To be filled per request
      condoFees: '', // To be filled per request
      nextPaymentDate: '', // To be filled per request
      amountDue: '' // To be filled per request
    },
    standardQuestions: {
      monthlyCharges: {
        question: 'Quel est le montant des charges communes mensuelles afférentes à l\'immeuble pour la partie privative vendue mentionnée ci-dessus?',
        answerFormat: 'Amount in $ (e.g., $274.90). Note: If assessment notice not sent, use current budget amount.',
        defaultAnswer: 'L\'avis de cotisation ne semble pas avoir été envoyé par la dernière compagnie de gestion. Je vais vérifier cela avec eux. Pour le moment, le montant des frais de condo ci-dessus correspond au budget actuel.'
      },
      lastPayment: {
        question: 'Quelle est la date à laquelle les dernières charges communes ont été payées et quelle est la période couverte par ce paiement?',
        answerFormat: 'Date and period covered (e.g., "1er octobre, couvre octobre")',
        defaultAnswer: '1er octobre, couvre octobre'
      },
      nextPaymentDue: {
        question: 'Quelle est la prochaine date d\'exigibilité des charges communes?',
        answerFormat: 'Date (e.g., "1er novembre")',
        defaultAnswer: '1er novembre'
      },
      arrears: {
        question: 'Existe-t-il des arrérages impayés de charges mensuelles affectant la fraction qui fait l\'objet de la vente et, si oui, quels en sont les montants, en capital et intérêts?',
        answerFormat: 'Yes/No. If yes, provide amounts in capital and interest.',
        defaultAnswer: 'Non'
      },
      interestRate: {
        question: 'Ces arrérages, s\'il en est, portent-ils intérêts et, si oui, à quel taux?',
        answerFormat: 'N/A if no arrears, otherwise provide interest rate',
        defaultAnswer: 'N/A'
      },
      specialAssessment: {
        current: {
          question: 'Existe-t-il une cotisation spéciale relative à la fraction pour l\'exercice financier en cours ou une telle cotisation est-elle à prévoir?',
          answerFormat: 'Yes/No. If yes, provide details.',
          defaultAnswer: 'N/A'
        },
        votedNotYetDue: {
          question: 'Existe-t-il des cotisations spéciales qui sont votées mais non encore exigibles?',
          answerFormat: 'Yes/No. If yes, provide details.',
          defaultAnswer: 'N/A'
        }
      },
      reserveFund: {
        question: 'Quel est le montant accumulé dans le fonds de prévoyance?',
        answerFormat: 'Amount in $ (e.g., $159,825.52)',
        defaultAnswer: '159 825,52 $'
      },
      fiscalYear: {
        question: 'Quelle est la période couverte par l\'exercice financier en cours?',
        answerFormat: 'Start date - End date (e.g., "1er Avril 2025 – 31 mars 2026")',
        defaultAnswer: '1er Avril 2025 – 31 mars 2026'
      },
      operatingDeficit: {
        question: 'L\'exercice en cours laisse-t-il prévoir un déficit d\'opération pour l\'année courante?',
        answerFormat: 'Yes/No. If yes, provide details.',
        defaultAnswer: 'Non'
      },
      operatingSurplus: {
        question: 'Un surplus pour la même période est-il à prévoir?',
        answerFormat: 'Yes/No/To be determined. Provide details if applicable.',
        defaultAnswer: 'À voir, oui théoriquement.'
      },
      legalProceedings: {
        question: 'Avez-vous eu connaissance d\'une procédure judiciaire, de médiation ou d\'arbitrage actuellement pendante, ou sur le point d\'être intentée, contre le syndicat, ou par lui, contre un tiers ou un copropriétaire? Si oui, veuillez nous fournir quelques explications.',
        answerFormat: 'Yes/No. If yes, provide explanations and details.',
        defaultAnswer: 'Dossier de la class action lawsuit pour la connexion de la climatisation qui est par étages, nous avons trouvé des solutions pour diminuer les problèmes chez les clients, mais on va en parler pour la class action lawsuit afin de récupérer un montant ou de changer le système en soi.'
      },
      judgments: {
        question: 'Un jugement a-t-il été rendu contre le syndicat? Si, tel était le cas, pourriez-vous nous indiquer le moment où la cause d\'action a pris naissance, la somme d\'argent due en vertu dudit jugement et si celle-ci a été payée?',
        answerFormat: 'Yes/No. If yes, provide: date of action, amount due, payment status.',
        defaultAnswer: 'Non'
      },
      insurancePremiums: {
        question: 'Les primes d\'assurance font-elles l\'objet d\'une cotisation particulière?',
        answerFormat: 'Yes/No',
        defaultAnswer: 'Non'
      },
      insuranceIndemnities: {
        question: 'Existe-t-il des indemnités d\'assurance payables à la partie qui fait l\'objet de la vente? Si oui, veuillez nous fournir les détails.',
        answerFormat: 'Yes/No. If yes, provide details.',
        defaultAnswer: 'Non'
      },
      insuranceTrustee: {
        question: 'Le syndicat a-t-il nommé un fiduciaire d\'assurances? Si oui, veuillez nous fournir ses coordonnées.',
        answerFormat: 'Yes/No. If yes, provide: broker name, address, phone, fax, policy number, coverage amount, highest deductible.',
        defaultAnswer: 'Nom du courtier d\'assurance: BFL Canada inc.\nAdresse: 2001, av. McGill College, bureau 220, Montreal, QC, H3A1G1\nTéléphone: 514-843-3632\nTélécopieur: 514-843-3842\nNuméro de police: BFL04MTL02210\nMontant de la couverture: voir sur la copie de la couverture d\'assurance ci-joint.\nQuel est le montant de la plus haute franchise prévue par les assurances du syndicat? 50 000 $'
      },
      registration: {
        question: 'Le syndicat a-t-il été dûment immatriculé? Si oui, veuillez nous indiquer sous quel nom ou nous fournir une copie de la déclaration d\'immatriculation.',
        answerFormat: 'Yes/No. If yes, provide NEQ number (e.g., "NEQ : 1177579019")',
        defaultAnswer: 'NEQ : 1177579019'
      },
      exclusiveCommonAreas: {
        question: 'Quels sont les espaces communs à usage exclusif dont dispose le vendeur (espaces de stationnement, casiers de rangement, etc.)? S\'il vous plaît, nous indiquer les numéros de stationnement et de casier de rangement, le cas échéant.',
        answerFormat: 'List parking spaces and locker numbers, or "N/A - Aucun stationnement, aucun rangement"',
        defaultAnswer: 'N/A – Aucun stationnement, aucun rangement.'
      },
      restrictedCommonAreaFees: {
        question: 'Le propriétaire de la fraction qui fait l\'objet de la vente doit-il payer au syndicat des frais additionnels pour une partie commune à usage restreint dont il est l\'utilisateur? Si oui, quel est le montant de ces frais additionnels?',
        answerFormat: 'Yes/No. If yes, provide amount. Otherwise "N/A"',
        defaultAnswer: 'N/A'
      },
      videotronFees: {
        question: 'S\'il y a lieu, quel est le montant des frais concernant Vidéotron, quel est le paiement fait par le vendeur et pour quelle période? (S\'il-vous-plaît, nous indiquer si ces frais seront remboursés au vendeur ou si nous devons faire des répartitions entre le vendeur et l\'acquéreur?)',
        answerFormat: 'Amount, payment period, and whether reimbursed to seller or split between seller and buyer. Note: "Au frais du coproprio. Peux-importe la marque de son internet"',
        defaultAnswer: 'Au frais du coproprio. Peux-importe la marque de son internet'
      },
      additionalRegulations: {
        question: 'Y a-t-il des règlements adoptés et consignés aux registres de la copropriété qui n\'apparaissent pas à la déclaration de copropriété?',
        answerFormat: 'Yes/No. If yes, "Voir ci-joint une copie des règlements d\'immeuble"',
        defaultAnswer: 'Voir ci-joint une copie des règlements d\'immeuble'
      },
      pendingRegulations: {
        question: 'Y a-t-il des projets de règlement ou de modification à la déclaration de copropriété qui doivent être adoptés prochainement par le syndicat ou qui l\'ont été récemment?',
        answerFormat: 'Yes/No. If yes, provide details.',
        defaultAnswer: 'Non'
      },
      lastAGM: {
        question: 'À quelle date a été tenue la dernière assemblée générale des copropriétaires?',
        answerFormat: 'Date (e.g., "Jeudi 6 mars 2025")',
        defaultAnswer: 'Jeudi 6 mars 2025'
      },
      extraordinaryDecisions: {
        question: 'Veuillez nous indiquer les décisions extraordinaires qui auraient été prises ou qui doivent être prises par l\'assemblée de copropriétaires.',
        answerFormat: 'List decisions or "N/A"',
        defaultAnswer: 'N/A'
      },
      sellerWorks: {
        question: 'Le vendeur a-t-il, à votre connaissance, effectué des travaux dans sa partie privative ayant pu affecter les parties communes? Si oui, lesquels?',
        answerFormat: 'Yes/No. If yes, provide details.',
        defaultAnswer: 'Non'
      },
      sellerViolations: {
        question: 'Le vendeur a-t-il, à votre connaissance, posé certains gestes en contravention de la déclaration de copropriété, lesquels gestes pourraient avoir des répercussions pour notre client acheteur?',
        answerFormat: 'Yes/No. If yes, provide details.',
        defaultAnswer: 'Non'
      },
      valueFactors: {
        question: 'Y a-t-il, à votre connaissance, un facteur se rapportant à l\'immeuble susceptible, de façon significative, d\'en diminuer la valeur ou d\'en augmenter les dépenses?',
        answerFormat: 'Yes/No. If yes, provide details.',
        defaultAnswer: 'Non'
      },
      timeShare: {
        question: 'Si votre copropriété est antérieure à 1994, y a-t-il, dans votre copropriété, des personnes qui ont, sur une fraction, des droits de jouissance périodiques et successifs (temps partagé)?',
        answerFormat: 'Yes/No/N/A (if building post-1994). If yes, provide details.',
        defaultAnswer: 'N/A'
      }
    }
  },

  welcomeGuide: {
    moveInOut: {
      advanceNotice: '7 days',
      elevatorFee: '$250',
      damageDeposit: '$100',
      confirmationRequired: true
    },
    accessoryPricing: {
      chipFob: '$50',
      garageController: '$100'
    },
    paymentMethods: {
      PPA: {
        formRequired: true,
        voidChequeRequired: true,
        paymentDate: '1st of each month'
      },
      cheque: {
        postDatedRequired: true,
        numberOfCheques: 12,
        payableTo: 'SDC Entity',
        mailingAddress: 'Velora Immobilier Inc. – 3181 Mont Saint-Hubert, Saint-Hubert, Québec, J3Y 4J4'
      }
    },
    coOwnerRegistration: {
      requiredInformation: {
        email: true,
        phoneNumber: true,
        possessionDate: true
      },
      requiredDocuments: {
        voidCheque: true,
        homeInsurance: true,
        reason: 'Required for condo fees payment setup and insurance compliance'
      },
      rentalDeclaration: {
        required: true,
        ifRenting: {
          minimumLeaseDuration: '31 days',
          requiredDocuments: [
            'Lease copy',
            'Tenant insurance',
            'Building regulation signed by tenant',
            'Building regulation signed by co-owner'
          ],
          signatories: ['Tenant', 'Co-owner']
        }
      },
      setupProcedures: {
        intercom: true,
        expedibox: true,
        moveIn: true,
        additionalFob: true
      }
    },
    tenantRequirements: {
      requiredDocuments: [
        'First and last name',
        'Email',
        'Phone',
        'Lease (minimum 31 days)',
        'Tenant insurance',
        'Building regulation signed by tenant',
        'Building regulation signed by co-owner'
      ],
      ownerResponsibility: 'Co-owners are jointly and severally liable for tenant violations of building bylaws and co-ownership declaration',
      minimumLeaseDuration: '31 days'
    },
    unitAccess: {
      keyCopyRequired: true,
      reason: 'Required for emergency access by management or emergency services'
    },
    intercom: {
      canadianNumberRequired: true,
      nameFormat: 'Initial of first name + Last name',
      unlockCode: '9',
      maxContacts: 1 // Some systems don't allow two contacts
    },
    expedibox: {
      exclusiveForParcels: true,
      noStorage: true, // No keys or personal items
      monitored: true, // Security camera
      finesForMisuse: true,
      timeLimit: 'To be specified'
    },
    maintenance: {
      garageCleaning: {
        schedule: 'As communicated by email',
        vehicleMoveRequired: true
      },
      windowCleaning: {
        annual: true,
        season: 'Late spring or early summer',
        ownerPatioResponsibility: true // Owners responsible for patio-door window and interior balcony
      },
      carpetCleaning: {
        frequency: '4 times per year',
        stainReporting: 'info@gestionvelora.com'
      }
    },
    pool: {
      hours: '8:00 AM - 9:00 PM daily',
      rules: [
        'Shower mandatory before swimming',
        'No glass containers',
        'No music/stereos',
        'No smoking, cigarettes, or vaping',
        'No alcohol or drugs',
        'No eating',
        'Maximum 2 visitors per resident',
        'Children under 18 must be accompanied by adult',
        'No animals',
        'Clean up garbage',
        'Do not move furniture'
      ],
      guestLimit: 2,
      ageRestriction: 'Children under 16 must always be accompanied by adult'
    },
    rooftop: {
      accessControl: true,
      security: true,
      hygiene: true,
      guestLimit: 2,
      qrCodeRegistration: true
    },
    gym: {
      hours: '5:00 AM - 11:00 PM',
      rules: [
        'No access outside opening hours without written board authorization',
        'No shirtless or barefoot',
        'No pets',
        'No commercial activities or services',
        'Pick up trash before leaving',
        'No disruptive behavior',
        'No noise/music devices (unless with headphones)',
        'No alcoholic beverages, food, or glass containers'
      ],
      guestLimit: 1,
      prohibited: [
        'Shirtless or barefoot',
        'Pets',
        'Commercial activities',
        'Noise/music without headphones',
        'Alcohol, food, glass containers'
      ]
    },
    emergency: {
      phoneNumber: '514-777-1731',
      email: 'info@gestionvelora.com',
      afterHours: {
        phoneNumber: '514-777-1731',
        conditions: ['Water damage', 'Fire', 'Theft']
      }
    },
    management: {
      company: 'Gestion Velora',
      email: 'info@gestionvelora.com',
      phone: '514-777-1731',
      address: '3181 Mnt Saint-Hubert, Saint-Hubert J3Y 4J4',
      website: 'www.gestionvelora.com',
      hours: '9:00 AM – 5:00 PM'
    }
  },

  financialStatements: {
    balanceSheet: {
      asOfDate: '2025-05-31',
      assets: {
        accountsReceivableCoOwners: '$53,954.41',
        accountsReceivableOther: '$5,505.79',
        operatingAccount: '$251,373.71',
        reserveFundAccount: '$78,560.40',
        selfInsuranceAccount: '$51,506.23',
        prepaidExpenses: '$23,060.82',
        dueFromReserveFund: '$67,598.44',
        dueToSelfInsurance: '$3,653.02',
        totalAssets: '$535,212.82'
      },
      liabilities: {
        accountsPayable: '$26,742.16',
        accruedExpenses: '$16,364.95',
        dueToOperatingFund: '$71,251.46',
        collectionFees: '$120.00',
        totalLiabilities: '$114,478.57'
      },
      equity: {
        operatingFunds: '$204,481.44',
        reserveFund: '$146,158.84',
        selfInsuranceFund: '$47,853.21',
        excessRevenue: '$22,240.76',
        totalEquity: '$420,734.25'
      }
    },
    incomeStatement: {
      period: '2025-04-01 to 2025-05-31',
      revenues: {
        commonCharges: '$113,360.00',
        parkingCharges: '$2,400.00',
        interestReserveFund: '$275.00',
        interestSelfInsurance: '$180.00',
        miscellaneous: '$86.00',
        totalRevenues: '$116,301.00'
      },
      expenses: {
        landscaping: '$2,404.00',
        janitorial: '$13,086.00',
        snowRemoval: '$0.00',
        electrical: '$0.00',
        security: '$7,926.00',
        alarmSystem: '$0.00',
        transactionFees: '$0.00',
        wasteManagement: '$0.00',
        officeSupplies: '$0.00',
        locksmith: '$563.00',
        garageMaintenance: '$3,651.00',
        carpetMaintenance: '$0.00',
        managementFees: '$0.00',
        professionalFees: '$10,946.00',
        hvacPrivate: '$2,517.00',
        pestControl: '$540.00',
        hvacCommon: '$1,667.00',
        windowCleaning: '$2,800.00',
        minorRepairs: '$1,573.00',
        garageDoors: '$250.00',
        elevators: '$16,198.00',
        drainsPumps: '$270.00',
        waterHeaters: '$360.00',
        plumbing: '$417.00',
        fireSafety: '$1,333.00',
        totalExpenses: '$64,441.00' // Approximate, needs verification
      },
      netIncome: '$51,860.00' // Approximate
    },
    budgets: {
      annual: {
        revenues: '$454,470.00',
        expenses: '$454,470.00' // Budgeted expenses
      },
      previousYear: {
        revenues: '$694,560.00',
        expenses: '$680,160.00'
      }
    }
  },

  agm: {
    year: '2024-2025',
    convocationDate: 'To be specified',
    meetingDate: 'To be specified',
    location: 'To be specified',
    agenda: [
      'Financial statements review',
      'Budget approval',
      'Board of directors election',
      'Reserve fund study',
      'Special assessments',
      'Building maintenance updates'
    ],
    documents: [
      'Financial statements',
      'Budget proposal',
      'Reserve fund study',
      'Meeting minutes from previous AGM'
    ],
    quorum: 'As specified in declaration',
    votingRules: 'Majority vote required'
  },

  coOwnershipGuide: {
    syndicate: {
      definition: 'A legal entity representing all co-owners of a building subject to divided co-ownership regime',
      legalStatus: 'Legal person governed by Civil Code of Quebec (C.c.Q.)',
      purpose: 'Conservation of building, maintenance and administration of common areas, safeguarding rights, and all operations of common interest (Article 1039 C.c.Q.)',
      decisionMakingBodies: ['Board of Directors', 'General Assembly of Co-owners'],
      fiscalStatus: {
        quebec: 'Enterprise (Loi sur les impôts du Québec)',
        canada: 'Non-profit organization (Income Tax Act)',
        annualFiling: 'Must file annual tax returns within 6 months of fiscal year end'
      }
    },
    boardOfDirectors: {
      role: 'Manages syndicate affairs and exercises all powers necessary to execute its duties',
      powers: [
        'Conservation and maintenance of common areas',
        'Administration of syndicate',
        'Enforcement of declaration and regulations',
        'Financial management',
        'Contract management'
      ],
      responsibilities: [
        'Ensure conservation of common areas',
        'Maintain building register',
        'Prepare financial statements',
        'Call general assemblies',
        'Execute assembly decisions'
      ]
    },
    generalAssembly: {
      role: 'Supreme decision-making body of the syndicate',
      types: ['Ordinary General Assembly (AGO)', 'Extraordinary General Assembly (AGE)', 'Extraordinary Transition Assembly (AGET)'],
      powers: [
        'Elect board of directors',
        'Approve budgets',
        'Approve special assessments',
        'Modify declaration',
        'Approve major works',
        'Amend regulations'
      ]
    },
    areas: {
      private: {
        definition: 'Parts of building reserved for exclusive use of a co-owner',
        ownership: 'Owned individually by each co-owner'
      },
      common: {
        definition: 'Parts of building used by all co-owners',
        ownership: 'Owned indivisibly by all co-owners according to their share',
        maintenance: 'Syndicate has absolute duty to ensure conservation of common areas'
      },
      restrictedCommon: {
        definition: 'Common areas reserved for exclusive use of one or more co-owners',
        examples: ['Balconies', 'Roof terraces', 'Storage lockers', 'Parking spaces']
      }
    },
    contributions: {
      generalCharges: 'Charges shared by all co-owners for common areas maintenance and administration',
      particularCharges: 'Charges allocated to specific co-owners based on usage or benefit',
      reserveFund: 'Fund for major repairs and replacements (mandatory study required)',
      selfInsuranceFund: 'Fund for insurance deductibles and self-insurance'
    },
    insurance: {
      coOwnerRequirements: 'Co-owners must maintain liability insurance (minimum 2 million $ for syndicates of 13+ units - Article 1064.1 C.c.Q.)',
      liabilityCoverage: 'Covers damages caused to others, common areas, and other units',
      whatToInsure: [
        'Personal belongings',
        'Improvements to unit',
        'Liability coverage',
        'Additional living expenses if unit uninhabitable'
      ]
    },
    renovations: {
      noAuthorizationRequired: [
        'Cosmetic changes (paint, wallpaper)',
        'Replacement of fixtures',
        'Minor repairs',
        'Interior modifications that do not affect structure or common areas'
      ],
      authorizationRequired: [
        'Works affecting structure',
        'Works affecting common areas',
        'Works affecting soundproofing',
        'Works requiring permits',
        'Works affecting building systems',
        'Encroachment on common areas',
        'Transformation of common areas'
      ],
      syndicateWorksInPrivate: {
        allowed: true,
        noticeRequired: true,
        keyCopyRequired: true,
        emergencyAccess: 'Syndicate can access private areas for urgent works with or without notice (Article 1066 C.c.Q.)'
      }
    },
    rental: {
      legalRequirements: {
        regulationDelivery: 'Landlord must provide building regulation to tenant before lease signing (Article 1894 C.c.Q.)',
        notificationToSyndicate: 'Co-owner must notify syndicate of rental with tenant name, lease duration, and regulation delivery date (Article 1065 C.c.Q.)',
        registerMaintenance: 'Syndicate must maintain register of co-owners (Article 1070 C.c.Q.)',
        leaseTermination: 'Syndicate can request lease termination if tenant causes serious prejudice (Article 1079 C.c.Q.)'
      },
      restrictions: {
        shortTerm: 'Short-term rentals require written authorization from syndicate (Ministry of Tourism regulation)',
        roomingHouse: 'Transformation into rooming house may be prohibited by declaration'
      },
      ownerResponsibilities: [
        'Remains responsible for tenant violations',
        'Must pay common charges',
        'Retains voting rights',
        'Liable for tenant damages'
      ]
    },
    importantDocuments: {
      declaration: {
        initial: 'Original declaration creating the co-ownership',
        concomitant: 'Declaration modifying the original declaration'
      },
      buildingRegulation: 'Rules governing use, enjoyment, and maintenance of units and common areas (part of lease - Article 1894 C.c.Q.)'
    }
  },

  buildingRegulation: {
    year: '2024',
    sections: {
      // To be populated from the actual 2024 Règlement d'immeuble PDF
      general: {
        title: 'General Rules',
        rules: [
          'Respect for neighbors',
          'Quiet enjoyment',
          'Compliance with declaration',
          'Maintenance obligations'
        ]
      }
    },
    generalRules: [
      'All residents must respect building regulations',
      'Common areas must be kept clean',
      'Noise must be kept to reasonable levels',
      'Smoking restrictions apply',
      'Pet regulations must be followed'
    ],
    specificProhibitions: [
      'Smoking in units and common areas',
      'Excessive noise',
      'Unauthorized modifications',
      'Storage in common areas',
      'Short-term rentals without authorization'
    ],
    fines: {
      structure: 'First violation: $100, Second violation: $150, Additional violations: $50 per notice, Continuous violations: $50 per day',
      amounts: {
        firstViolation: '$100',
        secondViolation: '$150',
        additionalViolations: '$50',
        continuousViolations: '$50 per day'
      }
    }
  },

  administrativeFees: {
    information: {
      commonChargesStatus: '$225.00 per event',
      syndicateInformation: '$225.00 per event',
      attestation: '$225.00 per event',
      recordConsultation: '$50.00 per hour'
    },
    coOwnerResponsibility: {
      managementFee: '$150.00 per hour (minimum 3 hours per event)',
      conciergeIntervention: '$100.00 per hour',
      cleaningFee: '$100.00 per hour'
    },
    moveInOut: {
      supervisionFee: '$250.00 per event'
    },
    replacements: {
      fob: '$20.00',
      garageController: '$30.00'
    },
    billing: {
      chargedTo: [
        'Co-owner-cedant (selling co-owner) - default',
        'Promettant-acheteur (buyer) - if buyer or notary requests',
        'Co-owner requesting information'
      ],
      exceptions: 'Written agreement with board of directors can change billing arrangement'
    }
  },

  fileManagement: {
    administration: {
      communication: ['Emails', 'Notices', 'Newsletters', 'Announcements'],
      declarationRegulations: ['Declaration of co-ownership', 'Building regulations', 'Amendments'],
      coOwnerTenantInfo: ['Co-owner register', 'Tenant register', 'Contact information'],
      notarySales: ['Law 16 certificates', 'Attestations', 'Notary documents', 'Sales documents'],
      managementContract: ['Management agreement', 'Service contracts', 'Renewals'],
      airbnb: ['Short-term rental authorizations', 'Violations', 'Complaints'],
      welcomeGuide: ['Welcome package', 'New owner guide', 'Resident manual'],
      followUp: ['Payment reminders', 'Violation notices', 'Follow-up letters'],
      parkingLocker: ['Parking assignments', 'Locker assignments', 'Access codes']
    },
    conciergerie: {
      concierge: ['Concierge schedules', 'Reports', 'Incidents'],
      superintendence: ['Superintendent reports', 'Maintenance logs', 'Inspections']
    },
    wasteRecycling: ['Waste management contracts', 'Recycling schedules', 'Violations'],
    buildingMaintenance: {
      ventilation: ['HVAC maintenance', 'Ventilation system', 'Repairs'],
      fireAlarm: ['Fire alarm system', 'Inspections', 'Maintenance contracts'],
      windows: ['Window cleaning', 'Window repairs', 'Schedules'],
      carpets: ['Carpet cleaning', 'Stain reports', 'Schedules'],
      intercom: ['Intercom setup', 'Repairs', 'Access codes']
    },
    professionalFees: {
      lawyer: ['Legal opinions', 'Contracts', 'Litigation documents'],
      notary: ['Notary documents', 'Sales', 'Legal documents'],
      inspector: ['Inspection reports', 'Deficiency reports', 'Technical reports'],
      evaluator: ['Property evaluations', 'Insurance evaluations', 'Reserve fund studies']
    },
    energy: {
      electricity: ['Hydro bills', 'Electrical maintenance', 'Consumption reports'],
      naturalGas: ['Gas bills', 'Gas maintenance', 'Consumption reports']
    },
    banking: {
      bankReconciliation: ['Monthly reconciliations', 'Bank statements', 'Account reconciliations'],
      ppaReturn: ['PPA returns', 'Payment issues', 'Banking errors']
    },
    taxes: {
      revenueCanada: ['Federal tax returns', 'T4s', 'Tax documents'],
      revenueQuebec: ['Provincial tax returns', 'Tax documents', 'Filing confirmations']
    },
    otonomSolution: ['Otonom platform', 'Vendor payments', 'Payment processing'],
    registraire: ['Annual declarations', 'Registration updates', 'Corporate documents'],
    financialInformation: {
      financialStatements: ['Monthly statements', 'Annual statements', 'Audited statements'],
      budget: ['Annual budgets', 'Budget proposals', 'Budget approvals'],
      balanceSheet: ['Balance sheets', 'Financial reports', 'Equity statements']
    },
    insurance: ['Insurance policies', 'Claims', 'Renewals', 'Coverage documents'],
    agm: {
      convocationNotice: ['AGM notices', 'Convocation letters', 'Meeting announcements'],
      proxy: ['Proxy forms', 'Proxy authorizations', 'Voting proxies'],
      agendaAddition: ['Agenda requests', 'Item additions', 'Owner proposals'],
      minutes: ['Meeting minutes', 'AGM minutes', 'Approved minutes'],
      newsletter: ['AGM newsletters', 'Meeting summaries', 'Communications'],
      presentation: ['PowerPoint presentations', 'Meeting slides', 'Visual materials'],
      budget: ['Budget presentations', 'Budget proposals for AGM'],
      balanceSheet: ['Balance sheet presentations', 'Financial overview'],
      financialStatements: ['Financial statement presentations', 'Annual reports'],
      insurance: ['Insurance presentations', 'Coverage updates'],
      referenceUnit: ['Unit reference documents', 'Unit information'],
      proptyReport: ['Propty reports', 'Property management reports'],
      videoChat: ['Video conference links', 'Online meeting information'],
      votingResults: ['Vote tallies', 'Election results', 'Resolution results'],
      elections: ['Election documents', 'Candidate information', 'Election results']
    },
    boardMeeting: {
      agenda: ['CA agendas', 'Board meeting agendas', 'Meeting items'],
      minutes: ['CA minutes', 'Board meeting minutes', 'Approved minutes']
    },
    claims: ['Insurance claims', 'Water damage claims', 'Claim documentation'],
    litigation: ['Legal proceedings', 'Court documents', 'Settlement agreements'],
    deficiencies: {
      commonAreasReception: ['Deficiency reports', 'Reception reports', 'Common area issues'],
      reserveFundStudy: ['Reserve fund studies', 'Study reports', 'Funding plans'],
      maintenanceLog: ['Maintenance logs', 'Equipment logs', 'Preventive maintenance'],
      selfInsurance: ['Self-insurance fund', 'Fund management', 'Claims'],
      reconstructionCost: ['Reconstruction cost studies', 'Replacement cost evaluations'],
      warranty: ['Warranty documents', 'Guarantee certificates', 'Warranty claims'],
      plans: ['Building plans', 'Technical plans', 'Architectural plans'],
      complianceCertificate: ['Compliance certificates', 'Building permits', 'Certificates']
    },
    schedule: {
      technicalFileCalendar: ['Maintenance calendar', 'Inspection schedule', 'Work schedule']
    },
    monday: {
      syndicateInfo: ['Syndicate information', 'General information', 'Reference documents'],
      syndicateProtocol: ['Protocols', 'Procedures', 'Standard operating procedures'],
      complaintsRequests: ['Complaints', 'Service requests', 'Owner requests'],
      violations: ['Regulation violations', 'Violation notices', 'Fines'],
      technical: ['Technical issues', 'Maintenance requests', 'Repair requests'],
      claims: ['Insurance claims', 'Damage claims', 'Claim tracking'],
      weeklyInspection: ['Weekly inspection reports', 'Building inspections', 'Inspection logs'],
      boardAdministrativeFollowUp: ['CA follow-up', 'Administrative tasks', 'Board actions']
    }
  },

  protocols: {
    administrativeFees: {
      commonChargesStatus: {
        amount: '$225.00 per event',
        billedTo: 'Co-owner-cedant (selling co-owner)',
        exception: 'Written agreement with board of directors'
      },
      syndicateInformation: {
        amount: '$210.00 + taxes per event',
        billedTo: [
          'Co-owner-cedant (default)',
          'Promettant-acheteur (buyer) or notary if they request'
        ],
        exception: 'Written agreement with board of directors'
      },
      attestation: {
        amount: '$225.00 per event',
        billedTo: 'Co-owner-cedant',
        exception: 'Written agreement with board of directors'
      },
      coOwnerResponsibility: {
        managementFee: '$150.00 per hour (minimum 3 hours per event)',
        conciergeIntervention: '$100.00 per hour',
        cleaningFee: '$100.00 per hour'
      },
      damageDeposit: '$500.00 per event',
      recordConsultation: '$50.00 per hour',
      moveSupervision: '$250.00 per event',
      fobReplacement: '$20.00',
      garageControllerReplacement: '$30.00'
    },
    security: {
      guardHours: '1:00 PM - 9:00 PM',
      contact: 'Security guard available on-site during these hours'
    },
    cleaning: {
      requestEmail: 'administration@ascentiaimmobilier.com',
      process: 'Email administration to notify concierge as quickly as possible'
    },
    tenantSetup: {
      intercomExpedibox: {
        requiredDocuments: ['Lease', 'Proof of insurance', 'Signed building regulation'],
        email: 'administration@ascentiaimmobilier.com'
      }
    },
    telecommunications: {
      videotronBell: {
        technicianAccess: 'Technician must call Ascentia upon arrival for code and location',
        codeLocation: 'Telecommunications room',
        keyReturn: 'Technician must return key',
        responsibility: 'Technician responsible for finding room if not notified in advance'
      }
    },
    warranty: {
      ovenDishwasher: {
        company: 'Distinctive Appliances',
        phone: '1-800-361-0799',
        email: 'commercial@distinctive-online.com'
      },
      washerDryer: {
        company: 'Whirlpool',
        phone: '1-800-807-6777'
      },
      developer: {
        name: 'Nadia - Omnia Technologies',
        email: 'nkanem@omniatechnologies.com',
        services: ['After-sales service', 'Warranty questions']
      }
    },
    maintenance: {
      hotWaterPressure: {
        process: 'Send photo of unit valves to administration',
        valveLocation: 'Find valves in unit and open fully for water pressure',
        contact: 'administration@ascentiaimmobilier.com'
      },
      airConditioning: {
        hydroPayment: {
          billing: 'Billing for air conditioning electricity is processed through Hydro payments, ensuring accurate tracking of usage',
          process: 'Billing for air conditioning electricity is processed through Hydro payments'
        },
        breakerRules: {
          critical: 'Never turn off your unit\'s circuit breaker',
          reason: 'Turning off the circuit breaker can cause electrical faults and maintain safe operation of air conditioning units',
          compliance: 'Users must follow breaker rules to prevent electrical faults and maintain safe operation of air conditioning units'
        },
        powerManagement: {
          guidelines: 'Effective air conditioning use requires managing power consumption to avoid overloads and ensure efficiency',
          privateUnitResponsibility: 'Each unit owner is responsible for their air conditioning unit and related electrical consumption'
        },
        errorCodeManual: 'Refer to error code manual provided by email',
        privateUnitResponsibility: 'If problem is private and only affects unit, co-owner responsible to call specialist',
        contact: 'administration@ascentiaimmobilier.com',
        manualAppLinks: 'Manual and app links available in Welcome Guide for A/C operation and troubleshooting'
      }
    },
    renovations: {
      section13_3_1_1: 'Co-owners cannot modify limits of contiguous private areas without CA and mortgage creditors agreement. Relative value must not be affected. Syndicate must modify declaration at co-owners expense (Article 1100 C.c.Q.)',
      section13_3_1_2: 'Major works in private area must be approved by CA 30 days before start, with layout plans. No work, including demolition, without authorization',
      section13_3_1_3: 'CA must approve works unless they cause damage or decrease construction quality, including soundproofing, insulation, or architectural harmony',
      section13_3_1_4: 'Co-owners cannot execute works with significant impact without assembly approval. Works involving building structures require engineer report',
      section13_3_1_5: 'Works with significant impact on common areas require assembly approval',
      section13_3_2_1: 'Approved works must be executed by licensed contractors with insurance coverage of at least $2,000,000',
      section13_3_2_2: 'If works can cause damage, CA can mandate expert to supervise works at co-owner expense',
      section13_3_2_3: 'Co-owner must allow access to private area to verify works are correctly executed',
      section13_3_2_4: 'CA can establish directives for work execution, including material delivery, debris disposal, and cleaning',
      section13_3_3_1: 'Major works on restricted common areas must conform to section 13.3.1.5',
      section13_3_3_2: 'No co-owner can obstruct works necessary for building conservation. Indemnity may be obtained in case of prejudice',
      section13_3_3_3: 'Syndicate must give notice to tenants or occupants for works necessary for building conservation',
      section13_3_3_4: 'Major plumbing or electrical works must be approved by CA, with proof of license and insurance from professional',
      section13_3_3_5: 'Section 13.3 provisions not applicable to Declarant for completion of co-ownership'
    },
    pool: {
      hours: '8:00 AM - 8:00 PM daily',
      access: 'ENTICY residents only',
      rules: [
        'Fill pool register',
        'Shower mandatory before swimming',
        'No glass containers',
        'No stereos or music',
        'No smoking, cigarettes, or vaping',
        'No alcohol or drugs',
        'No eating in pool area',
        'Maximum 2 visitors per resident',
        'Children under 18 must be accompanied by adult',
        'No animals',
        'Do not leave garbage',
        'Do not move furniture'
      ],
      security: [
        'Children under 18 must be accompanied by adult at all times',
        'Animals prohibited',
        'Swimming while impaired prohibited',
        'Residents must fill register at pool entrance'
      ],
      hygiene: [
        'Shower before entering pool',
        'Appropriate bathing suit required'
      ],
      liability: 'Co-owners responsible for damages or injuries related to pool use',
      guests: {
        limit: 2,
        accompaniment: true,
        responsibility: 'Co-owner responsible for guest actions and resident actions'
      },
      capacity: {
        rooftop: 30
      },
      registration: true
    },
    gym: {
      hours: '5:00 AM - 11:00 PM',
      capacity: 8,
      rules: [
        'No access outside opening hours without written CA authorization',
        'No shirtless or barefoot',
        'No pets',
        'No commercial activities or services',
        'Pick up trash before leaving',
        'No disruptive behavior',
        'No noise/music devices (unless with headphones)',
        'No alcohol, food, or glass containers'
      ],
      prohibited: [
        'Shirtless or barefoot',
        'Pets',
        'Commercial activities',
        'Noise/music without headphones',
        'Alcohol, food, glass containers'
      ],
      guests: {
        limit: 1,
        note: 'Limit maintained even if more than one person legally resides in unit'
      }
    },
    mailKey: {
      replacement: 'Contact Canada Post or locksmith if mail key is lost'
    },
    fobRequest: {
      email: 'administration@ascentiaimmobilier.com',
      paymentPlatform: 'Square Up',
      process: [
        'Request fob by email',
        'Fees charged via Square Up platform',
        'Once payment accepted, fob prepared',
        'Notification sent when ready for pickup at office'
      ]
    },
    notarySales: {
      email: 'administration@ascentiaimmobilier.com',
      fee: '$210.00 + taxes',
      paymentPlatform: 'Square Up',
      process: [
        'Send DRCOP or notary sale document to administration email',
        'Fees charged via Square Up platform',
        'Once payment received, request processed',
        'Document sent directly to notary or broker'
      ],
      timeline: '2 weeks processing time (multiple sales often received simultaneously)'
    }
  },

  waterDamageManagement: {
    workflow: {
      stages: [
        'New Incidents',
        'Investigation & Declaration',
        'Quotes & Approvals',
        'Repairs in Progress',
        'Invoicing & Reimbursement',
        'Closed Incidents'
      ],
      statuses: {
        new: ['New'],
        investigation: ['Source Investigation', 'Insurance Declared'],
        quotes: ['Awaiting Quotes', 'Deductible Paid', 'Repairs Scheduled'],
        repairs: ['Repairs In Progress'],
        invoicing: ['Repairs Completed', 'Awaiting Reimbursement', 'Reimbursement Received'],
        closed: ['Case Closed']
      }
    },
    mainItemColumns: {
      itemName: {
        format: 'SDC xxx - Brief Description',
        example: 'SDC 123 - Pipe burst common area'
      },
      projectManager: 'Chef de projet (People)',
      teamMembers: 'Collaborateurs Velora (People)',
      incidentDate: 'Date du sinistre (Date)',
      source: {
        type: 'Status/Dropdown',
        options: [
          'Pipe Burst',
          'Roof Leak',
          'Appliance Malfunction',
          'Sewer Backup',
          'Unknown - To Investigate'
        ]
      },
      insurance: {
        policyNumber: 'POLICE ASSURANCE SYNDICAT (Text)',
        reportDate: 'DATE DE REPORT À L\'ASSURANCE SYNDICAT (Date)'
      },
      damageScope: 'Portée des dommages (Long Text)',
      overallStatus: {
        type: 'Status',
        options: [
          'New',
          'Source Investigation',
          'Insurance Declared',
          'Awaiting Quotes',
          'Deductible Paid',
          'Repairs Scheduled',
          'Repairs In Progress',
          'Repairs Completed',
          'Awaiting Reimbursement',
          'Reimbursement Received',
          'Case Closed'
        ]
      },
      emergencyCompany: {
        name: 'Emergency Co. Name (Text)',
        contact: 'Emergency Co. Contact (Text) - Nom, cell, email'
      },
      reconstructionCompany: {
        name: 'Reconstruction Co. Name (Text)',
        contact: 'Reconstruction Co. Contact (Text) - Nom, cell, email'
      },
      syndicateAdjuster: {
        name: 'Syndicate Adjuster Name (Text)',
        contact: 'Syndicate Adjuster Contact (Text) - Nom, cell, email'
      },
      syndicateContact: {
        name: 'Syndicate Contact Name (Text)',
        details: 'Syndicate Contact Details (Text) - Phone, email'
      },
      appraiser: {
        name: 'Évaluateur Nom (Text) - if required',
        contact: 'Évaluateur Contact (Text) - if required',
        dossierNumber: 'Évaluateur #Dossier (Text) - if required'
      },
      deductible: 'FRANCHISE À DÉBOURSER (Numbers) - with $ symbol',
      documents: 'Autres documents (Files) - reports, photos, quotes, etc.',
      closedDate: 'Dossier clôs le (Date)',
      nextStepDueDate: 'Next Step Due Date (Date) - for reminders/automation',
      lastUpdate: 'Last Update (Last Updated) - automatic column'
    },
    subItems: {
      purpose: 'Each sub-item represents one affected unit or common area',
      columns: {
        subItemName: 'Sub-Item Name (Text) - e.g., "Unité #XXX" or "Corridor 4e étage"',
        unitStatus: 'Statut de l\'Unité (Status) - Assessment, Repairs In Progress, Repairs Completed',
        damageDetails: 'Détails des Dommages / Actions (Long Text) - e.g., "Refaire le plancher et le mur sud"',
        coOwnerAdjuster: {
          name: 'Expert Sinistre (Copropriétaire) - Nom (Text)',
          dossierNumber: 'Expert Sinistre (Copropriétaire) - #Dossier (Text)'
        }
      }
    }
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get rule information for email response generation
 */
export function getDeclarationRule(ruleType: keyof DeclarationRules): any {
  return ENTICY_DECLARATION_RULES[ruleType] || null;
}

/**
 * Get specific violation rule
 */
export function getViolationRule(violationType: keyof DeclarationRules['violations']): ViolationRule | NoiseRule | PetRule | ParkingRule | null {
  return ENTICY_DECLARATION_RULES.violations?.[violationType] || null;
}

/**
 * Get fine amount for violation
 */
export function getFineAmount(violationType: string, violationNumber: number = 1): string {
  const violation = ENTICY_DECLARATION_RULES.violations?.[violationType as keyof typeof ENTICY_DECLARATION_RULES.violations];
  
  if (!violation || typeof violation !== 'object' || !('fineAmount' in violation)) {
    return ENTICY_DECLARATION_RULES.violations?.general?.fineAmount || '$100';
  }

  const rule = violation as ViolationRule;
  
  if (violationNumber === 1) {
    return rule.fineAmount;
  } else if (violationNumber === 2 && rule.escalation?.secondViolation) {
    return rule.escalation.secondViolation;
  } else if (violationNumber >= 3 && rule.escalation?.thirdViolation) {
    return rule.escalation.thirdViolation;
  }
  
  return rule.fineAmount;
}

/**
 * Check if a specific rule applies
 */
export function checkRule(ruleType: keyof DeclarationRules, condition: string): boolean {
  const rule = ENTICY_DECLARATION_RULES[ruleType];
  if (!rule) return false;
  
  switch (ruleType) {
    case 'violations':
      // Check if violation type matches
      const violationType = condition.toLowerCase();
      if (violationType.includes('smoking') || violationType.includes('fumer')) {
        return (ENTICY_DECLARATION_RULES.violations?.smoking?.prohibited === true);
      }
      return true;
    default:
      return false;
  }
}

/**
 * Get board approval requirement for an action
 */
export function requiresBoardApproval(action: string): boolean {
  const boardApproval = ENTICY_DECLARATION_RULES.boardApproval;
  if (!boardApproval) return false;
  
  const actionLower = action.toLowerCase();
  return boardApproval.requiredFor.some(req => 
    actionLower.includes(req.toLowerCase())
  );
}

/**
 * Get move-in/out deposit information
 */
export function getMoveDepositInfo(): { amount: string; refundTimeline: string } {
  const moveRule = ENTICY_DECLARATION_RULES.moveInOut;
  return {
    amount: moveRule?.depositAmount || '$500',
    refundTimeline: moveRule?.inspection?.depositRefundTimeline || '10 days'
  };
}

/**
 * Get renovation approval requirements
 */
export function getRenovationRequirements(): {
  documents: string[];
  deposit: boolean;
  boardApproval: boolean;
} {
  const renovation = ENTICY_DECLARATION_RULES.renovation;
  return {
    documents: renovation?.requiredDocuments || [],
    deposit: renovation?.depositRequired || false,
    boardApproval: renovation?.approvalRequired || true
  };
}

/**
 * Get eviction process information
 */
export function getEvictionProcess(): {
  noticesRequired: number;
  gracePeriod: string;
  TALTimeline: string;
} {
  const eviction = ENTICY_DECLARATION_RULES.eviction;
  return {
    noticesRequired: eviction?.process.noticesRequired || 1,
    gracePeriod: eviction?.process.gracePeriod || '1 month',
    TALTimeline: eviction?.process.timeline || '2-3 months'
  };
}

/**
 * Get notary certificate information (Law 16)
 */
export function getNotaryCertificateInfo(): NotaryCertificateInfo | null {
  return ENTICY_DECLARATION_RULES.notaryCertificate || null;
}

/**
 * Get welcome guide information
 */
export function getWelcomeGuideInfo(): WelcomeGuideInfo | null {
  return ENTICY_DECLARATION_RULES.welcomeGuide || null;
}

/**
 * Get move-in/out fees from welcome guide
 */
export function getMoveInOutFees(): { elevatorFee: string; damageDeposit: string; advanceNotice: string } {
  const guide = getWelcomeGuideInfo();
  return {
    elevatorFee: guide?.moveInOut.elevatorFee || '$250',
    damageDeposit: guide?.moveInOut.damageDeposit || '$100',
    advanceNotice: guide?.moveInOut.advanceNotice || '7 days'
  };
}

/**
 * Get accessory pricing
 */
export function getAccessoryPricing(): { chipFob: string; garageController: string } {
  const guide = getWelcomeGuideInfo();
  return {
    chipFob: guide?.accessoryPricing.chipFob || '$50',
    garageController: guide?.accessoryPricing.garageController || '$100'
  };
}

/**
 * Get pool rules
 */
export function getPoolRules(): { hours: string; rules: string[]; guestLimit: number } | null {
  const guide = getWelcomeGuideInfo();
  if (!guide?.pool) return null;
  return {
    hours: guide.pool.hours,
    rules: guide.pool.rules,
    guestLimit: guide.pool.guestLimit
  };
}

/**
 * Get gym rules
 */
export function getGymRules(): { hours: string; rules: string[]; guestLimit: number } | null {
  const guide = getWelcomeGuideInfo();
  if (!guide?.gym) return null;
  return {
    hours: guide.gym.hours,
    rules: guide.gym.rules,
    guestLimit: guide.gym.guestLimit
  };
}

/**
 * Get management contact information
 */
export function getManagementContact(): {
  company: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  hours: string;
  emergencyPhone: string;
} | null {
  const guide = getWelcomeGuideInfo();
  if (!guide?.management) return null;
  return {
    ...guide.management,
    emergencyPhone: guide.emergency.phoneNumber
  };
}

/**
 * Get financial statements information
 */
export function getFinancialStatements(): FinancialStatements | null {
  return ENTICY_DECLARATION_RULES.financialStatements || null;
}

/**
 * Get reserve fund information
 */
export function getReserveFundInfo(): { totalAmount: string; accountBalance: string } | null {
  const statements = getFinancialStatements();
  if (!statements) return null;
  return {
    totalAmount: statements.balanceSheet.equity.reserveFund,
    accountBalance: statements.balanceSheet.assets.reserveFundAccount
  };
}

/**
 * Get self-insurance fund information
 */
export function getSelfInsuranceFundInfo(): { totalAmount: string; accountBalance: string } | null {
  const statements = getFinancialStatements();
  if (!statements) return null;
  return {
    totalAmount: statements.balanceSheet.equity.selfInsuranceFund,
    accountBalance: statements.balanceSheet.assets.selfInsuranceAccount
  };
}

/**
 * Get accounts receivable from co-owners
 */
export function getAccountsReceivableCoOwners(): string | null {
  const statements = getFinancialStatements();
  return statements?.balanceSheet.assets.accountsReceivableCoOwners || null;
}

/**
 * Get AGM information
 */
export function getAGMInfo(): AGMInfo | null {
  return ENTICY_DECLARATION_RULES.agm || null;
}

/**
 * Get co-ownership guide information
 */
export function getCoOwnershipGuideInfo(): CoOwnershipGuideInfo | null {
  return ENTICY_DECLARATION_RULES.coOwnershipGuide || null;
}

/**
 * Get building regulation information
 */
export function getBuildingRegulationInfo(): BuildingRegulationInfo | null {
  return ENTICY_DECLARATION_RULES.buildingRegulation || null;
}

/**
 * Get renovation authorization requirements
 */
export function getRenovationAuthorizationRequirements(): {
  noAuthorizationRequired: string[];
  authorizationRequired: string[];
} | null {
  const guide = getCoOwnershipGuideInfo();
  if (!guide?.renovations) return null;
  return {
    noAuthorizationRequired: guide.renovations.noAuthorizationRequired,
    authorizationRequired: guide.renovations.authorizationRequired
  };
}

/**
 * Get rental legal requirements
 */
export function getRentalLegalRequirements(): {
  regulationDelivery: string;
  notificationToSyndicate: string;
  registerMaintenance: string;
  leaseTermination: string;
} | null {
  const guide = getCoOwnershipGuideInfo();
  if (!guide?.rental) return null;
  return guide.rental.legalRequirements;
}

/**
 * Get administrative fees
 */
export function getAdministrativeFees(): AdministrativeFees | null {
  return ENTICY_DECLARATION_RULES.administrativeFees || null;
}

/**
 * Get Law 16 certificate fee
 */
export function getAttestationFee(): string {
  const fees = getAdministrativeFees();
  return fees?.information.attestation || '$225.00';
}

/**
 * Get move-in/out supervision fee
 */
export function getMoveSupervisionFee(): string {
  const fees = getAdministrativeFees();
  return fees?.moveInOut.supervisionFee || '$250.00';
}

/**
 * Get replacement fees
 */
export function getReplacementFees(): { fob: string; garageController: string } | null {
  const fees = getAdministrativeFees();
  if (!fees) return null;
  return {
    fob: fees.replacements.fob,
    garageController: fees.replacements.garageController
  };
}

/**
 * Get co-owner responsibility fees
 */
export function getCoOwnerResponsibilityFees(): {
  managementFee: string;
  conciergeIntervention: string;
  cleaningFee: string;
} | null {
  const fees = getAdministrativeFees();
  if (!fees) return null;
  return fees.coOwnerResponsibility;
}

/**
 * Get file management structure
 */
export function getFileManagementStructure(): FileManagementStructure | null {
  return ENTICY_DECLARATION_RULES.fileManagement || null;
}

/**
 * Get file category for a given topic
 */
export function getFileCategory(topic: string): string | null {
  const structure = getFileManagementStructure();
  if (!structure) return null;
  
  const topicLower = topic.toLowerCase();
  
  // Check each category
  if (topicLower.includes('agm') || topicLower.includes('assemblée') || topicLower.includes('general assembly')) {
    return 'AGM';
  }
  if (topicLower.includes('ca') || topicLower.includes('conseil') || topicLower.includes('board')) {
    return 'Board Meeting';
  }
  if (topicLower.includes('sinistre') || topicLower.includes('claim') || topicLower.includes('damage')) {
    return 'Claims';
  }
  if (topicLower.includes('contentieux') || topicLower.includes('litigation') || topicLower.includes('legal')) {
    return 'Litigation';
  }
  if (topicLower.includes('financier') || topicLower.includes('financial') || topicLower.includes('budget')) {
    return 'Financial Information';
  }
  if (topicLower.includes('assurance') || topicLower.includes('insurance')) {
    return 'Insurance';
  }
  if (topicLower.includes('notaire') || topicLower.includes('notary') || topicLower.includes('vente') || topicLower.includes('sale')) {
    return 'Administration - Notary Sales';
  }
  if (topicLower.includes('déficience') || topicLower.includes('deficiency')) {
    return 'Deficiencies';
  }
  if (topicLower.includes('entretien') || topicLower.includes('maintenance')) {
    return 'Building Maintenance';
  }
  
  return 'Administration';
}

/**
 * Get co-ownership protocols
 */
export function getCoOwnershipProtocols(): CoOwnershipProtocols | null {
  return ENTICY_DECLARATION_RULES.protocols || null;
}

/**
 * Get renovation protocol by section
 */
export function getRenovationProtocol(section: string): string | null {
  const protocols = getCoOwnershipProtocols();
  if (!protocols?.renovations) return null;
  
  const sectionKey = section.replace(/\./g, '_') as keyof typeof protocols.renovations;
  return protocols.renovations[sectionKey] || null;
}

/**
 * Get pool protocol information
 */
export function getPoolProtocol(): {
  hours: string;
  rules: string[];
  guests: { limit: number; accompaniment: boolean };
} | null {
  const protocols = getCoOwnershipProtocols();
  if (!protocols?.pool) return null;
  return {
    hours: protocols.pool.hours,
    rules: protocols.pool.rules,
    guests: protocols.pool.guests
  };
}

/**
 * Get gym protocol information
 */
export function getGymProtocol(): {
  hours: string;
  capacity: number;
  rules: string[];
  guests: { limit: number };
} | null {
  const protocols = getCoOwnershipProtocols();
  if (!protocols?.gym) return null;
  return {
    hours: protocols.gym.hours,
    capacity: protocols.gym.capacity,
    rules: protocols.gym.rules,
    guests: protocols.gym.guests
  };
}

/**
 * Get warranty information
 */
export function getWarrantyInfo(): {
  ovenDishwasher: { company: string; phone: string; email: string };
  washerDryer: { company: string; phone: string };
  developer: { name: string; email: string; services: string[] };
} | null {
  const protocols = getCoOwnershipProtocols();
  return protocols?.warranty || null;
}

/**
 * Get fob request protocol
 */
export function getFobRequestProtocol(): {
  email: string;
  paymentPlatform: string;
  process: string[];
} | null {
  const protocols = getCoOwnershipProtocols();
  return protocols?.fobRequest || null;
}

/**
 * Get notary sales protocol
 */
export function getNotarySalesProtocol(): {
  email: string;
  fee: string;
  paymentPlatform: string;
  process: string[];
  timeline: string;
} | null {
  const protocols = getCoOwnershipProtocols();
  return protocols?.notarySales || null;
}

/**
 * Get new co-owner registration requirements
 */
export function getNewCoOwnerRequirements(): {
  requiredInformation: {
    email: boolean;
    phoneNumber: boolean;
    possessionDate: boolean;
  };
  requiredDocuments: {
    voidCheque: boolean;
    homeInsurance: boolean;
    reason: string;
  };
  rentalDeclaration: {
    required: boolean;
    ifRenting: {
      minimumLeaseDuration: string;
      requiredDocuments: string[];
      signatories: string[];
    };
  };
  setupProcedures: {
    intercom: boolean;
    expedibox: boolean;
    moveIn: boolean;
    additionalFob: boolean;
  };
} | null {
  const guide = getWelcomeGuideInfo();
  return guide?.coOwnerRegistration || null;
}

/**
 * Format new co-owner welcome message with requirements
 */
export function formatNewCoOwnerWelcomeMessage(
  unitNumber?: string,
  possessionDate?: string
): string {
  const requirements = getNewCoOwnerRequirements();
  const protocols = getCoOwnershipProtocols();
  
  if (!requirements) {
    return 'Welcome! Please contact administration for registration requirements.';
  }

  return `Bonjour et bienvenue dans votre nouvelle copropriété${unitNumber ? ` - Unité ${unitNumber}` : ''}!

Pour compléter votre enregistrement en tant que nouveau copropriétaire, nous avons besoin des informations suivantes :

INFORMATIONS REQUISES :
- Adresse e-mail
- Numéro de téléphone
- Date de prise de possession de l'unité${possessionDate ? ` : ${possessionDate}` : ''}

DOCUMENTS REQUIS :
- Chèque spécimen (void cheque) pour les frais de condo
- Copie de votre assurance habitation copropriétaire

Ces documents sont nécessaires pour :
- Configurer le paiement préautorisé (PPA) des frais de condo
- Vérifier la conformité de votre assurance (minimum 2 millions $ de responsabilité civile pour les syndicats de 13+ unités - Article 1064.1 C.c.Q.)

LOCATION DE VOTRE UNITÉ :
${requirements.rentalDeclaration.required ? `Si vous prévoyez louer votre unité, veuillez nous informer. Pour les locations de ${requirements.rentalDeclaration.ifRenting.minimumLeaseDuration} et plus, nous devons recevoir :
- Copie du bail
- Assurance du locataire
- Règlement d'immeuble signé par le locataire ET le copropriétaire

Conformément à l'article 1894 du C.c.Q., le règlement d'immeuble doit être remis au locataire avant la signature du bail et fait partie intégrante du bail.` : ''}

PROCÉDURES DE CONFIGURATION :
Une fois vos informations et documents reçus, nous procéderons à :
- Configuration de l'intercom/buzzer
- Enregistrement dans le système Expedibox (casiers à colis)
- Organisation de votre déménagement/emménagement
- Émission de puces d'accès supplémentaires si nécessaire

Veuillez nous faire parvenir ces informations et documents à administration@ascentiaimmobilier.com${unitNumber ? ` en mentionnant l'unité ${unitNumber}` : ''}.

Nous sommes là pour vous accompagner dans cette transition. N'hésitez pas à nous contacter si vous avez des questions.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

/**
 * Get water damage incident management structure
 */
export function getWaterDamageManagement(): WaterDamageIncidentManagement | null {
  return ENTICY_DECLARATION_RULES.waterDamageManagement || null;
}

/**
 * Get water damage workflow stages
 */
export function getWaterDamageWorkflowStages(): string[] {
  const management = getWaterDamageManagement();
  return management?.workflow.stages || [];
}

/**
 * Get water damage status options for a given stage
 */
export function getWaterDamageStatuses(stage: string): string[] {
  const management = getWaterDamageManagement();
  if (!management) return [];
  
  const stageLower = stage.toLowerCase();
  if (stageLower.includes('new')) return management.workflow.statuses.new;
  if (stageLower.includes('investigation') || stageLower.includes('declaration')) return management.workflow.statuses.investigation;
  if (stageLower.includes('quote') || stageLower.includes('approval')) return management.workflow.statuses.quotes;
  if (stageLower.includes('repair') || stageLower.includes('progress')) return management.workflow.statuses.repairs;
  if (stageLower.includes('invoice') || stageLower.includes('reimbursement')) return management.workflow.statuses.invoicing;
  if (stageLower.includes('close')) return management.workflow.statuses.closed;
  
  return [];
}

/**
 * Get water damage source options
 */
export function getWaterDamageSources(): string[] {
  const management = getWaterDamageManagement();
  return management?.mainItemColumns.source.options || [];
}

/**
 * Format notary certificate response with unit-specific information
 */
export function formatNotaryCertificateResponse(
  unitNumber?: string,
  condoFees?: string,
  nextPaymentDate?: string,
  amountDue?: string,
  includeStandardQuestions: boolean = true
): string {
  const cert = getNotaryCertificateInfo();
  if (!cert) {
    return 'Information non disponible. Veuillez contacter la gestion.';
  }

  // Update unit-specific info if provided
  const unitInfo = {
    unitNumber: unitNumber || cert.unitInfo.unitNumber || '[Numéro d\'unité]',
    condoFees: condoFees || cert.unitInfo.condoFees || '[Montant des frais de condo]',
    nextPaymentDate: nextPaymentDate || cert.unitInfo.nextPaymentDate || '[Date du prochain paiement]',
    amountDue: amountDue || cert.unitInfo.amountDue || '[Montant dû]'
  };

  let response = `INFORMATION POUR CERTIFICAT DE COPROPRIÉTÉ (LOI 16)

Est-ce que votre syndicat a été immatriculé auprès du Registraire des entreprises?
oui: ✓
non: 
Si oui, son numéro de matricule est: ${cert.syndicateRegistration.registrationNumber}

Est-ce que votre syndicat a produit au Registraire des entreprises la déclaration annuelle pour l'année en cours?
oui: ✓
non: 

Tenez-vous les registres exigés par la loi (1070 C.c.Q.)?
oui: ✓
non: 

L'Acheteur a-t-il reçu l'Attestation du syndicat sur l'état de la copropriété, tel qu'exigé par l'article 1068.1 C.c.Q.?
oui: (veuillez nous transmettre une copie et ne pas répondre aux questions suivantes)
non: ✓ (veuillez répondre aux questions suivantes)

- Montant total du fonds de prévoyance: ${cert.reserveFund.totalAmount}

- Montant total du fonds d'auto-assurance: ${cert.selfInsuranceFund.totalAmount}

- Est-ce qu'il existe des poursuites judiciaires contre votre syndicat?
oui: ${cert.legalProceedings.exists ? '✓' : ''}
non: ${cert.legalProceedings.exists ? '' : '✓'}
${cert.legalProceedings.exists && cert.legalProceedings.details ? `Si oui, veuillez nous donner les détails: ${cert.legalProceedings.details}` : ''}

- Est-ce qu'il existe des engagements en cours pour réparations ou rénovations sur la copropriété autres que d'entretien général?
oui: ${cert.majorRepairs.commitments ? '✓' : ''}
non: ${cert.majorRepairs.commitments ? '' : '✓'}
${cert.majorRepairs.commitments && cert.majorRepairs.details ? `Si oui, veuillez nous donner les détails: ${cert.majorRepairs.details}` : ''}

ASSURANCE DE LA COPROPRIÉTÉ:

Nom du courtier d'assurance: ${cert.insurance.broker.name}
Adresse: ${cert.insurance.broker.address}
Téléphone: ${cert.insurance.broker.phone}
Télécopieur: ${cert.insurance.broker.fax}
Compagnie d'assurance: ${cert.insurance.company}
Numéro de police: ${cert.insurance.policyNumber}
Montant de la couverture: ${cert.insurance.coverageAmount}

Quel est le montant de la plus haute franchise prévue par les assurances du syndicat? ${cert.insurance.highestDeductible}

Veuillez nous fournir copie de la couverture d'assurance pour l'ensemble de l'immeuble.

INFORMATION SPÉCIFIQUE À L'UNITÉ:

Numéro de lot/Unité: ${unitInfo.unitNumber}
Frais de condo mensuels: ${unitInfo.condoFees}
Date du prochain paiement: ${unitInfo.nextPaymentDate}
Montant dû au compte: ${unitInfo.amountDue}`;

  // Add standard questions if requested
  if (includeStandardQuestions && cert.standardQuestions) {
    const q = cert.standardQuestions;
    response += `\n\nQUESTIONS STANDARD:\n\n`;
    response += `1. ${q.monthlyCharges.question}\n${q.monthlyCharges.defaultAnswer || '[À remplir]'}\n\n`;
    response += `2. ${q.lastPayment.question}\n${q.lastPayment.defaultAnswer || '[À remplir]'}\n\n`;
    response += `3. ${q.nextPaymentDue.question}\n${q.nextPaymentDue.defaultAnswer || '[À remplir]'}\n\n`;
    response += `4. ${q.arrears.question}\n${q.arrears.defaultAnswer || '[À remplir]'}\n\n`;
    response += `5. ${q.interestRate.question}\n${q.interestRate.defaultAnswer || '[À remplir]'}\n\n`;
    response += `6. ${q.specialAssessment.current.question}\n${q.specialAssessment.current.defaultAnswer || '[À remplir]'}\n\n`;
    response += `7. ${q.specialAssessment.votedNotYetDue.question}\n${q.specialAssessment.votedNotYetDue.defaultAnswer || '[À remplir]'}\n\n`;
    response += `8. ${q.fiscalYear.question}\n${q.fiscalYear.defaultAnswer || '[À remplir]'}\n\n`;
    response += `9. ${q.reserveFund.question}\n${q.reserveFund.defaultAnswer || '[À remplir]'}\n\n`;
    response += `10. ${q.operatingDeficit.question}\n${q.operatingDeficit.defaultAnswer || '[À remplir]'}\n\n`;
    response += `11. ${q.operatingSurplus.question}\n${q.operatingSurplus.defaultAnswer || '[À remplir]'}\n\n`;
    response += `12. ${q.legalProceedings.question}\n${q.legalProceedings.defaultAnswer || '[À remplir]'}\n\n`;
    response += `13. ${q.judgments.question}\n${q.judgments.defaultAnswer || '[À remplir]'}\n\n`;
    response += `14. ${q.insurancePremiums.question}\n${q.insurancePremiums.defaultAnswer || '[À remplir]'}\n\n`;
    response += `15. ${q.insuranceIndemnities.question}\n${q.insuranceIndemnities.defaultAnswer || '[À remplir]'}\n\n`;
    response += `16. ${q.insuranceTrustee.question}\n${q.insuranceTrustee.defaultAnswer || '[À remplir]'}\n\n`;
    response += `17. ${q.registration.question}\n${q.registration.defaultAnswer || '[À remplir]'}\n\n`;
    response += `18. ${q.exclusiveCommonAreas.question}\n${q.exclusiveCommonAreas.defaultAnswer || '[À remplir]'}\n\n`;
    response += `19. ${q.restrictedCommonAreaFees.question}\n${q.restrictedCommonAreaFees.defaultAnswer || '[À remplir]'}\n\n`;
    response += `20. ${q.videotronFees.question}\n${q.videotronFees.defaultAnswer || '[À remplir]'}\n\n`;
    response += `21. ${q.additionalRegulations.question}\n${q.additionalRegulations.defaultAnswer || '[À remplir]'}\n\n`;
    response += `22. ${q.pendingRegulations.question}\n${q.pendingRegulations.defaultAnswer || '[À remplir]'}\n\n`;
    response += `23. ${q.lastAGM.question}\n${q.lastAGM.defaultAnswer || '[À remplir]'}\n\n`;
    response += `24. ${q.extraordinaryDecisions.question}\n${q.extraordinaryDecisions.defaultAnswer || '[À remplir]'}\n\n`;
    response += `25. ${q.sellerWorks.question}\n${q.sellerWorks.defaultAnswer || '[À remplir]'}\n\n`;
    response += `26. ${q.sellerViolations.question}\n${q.sellerViolations.defaultAnswer || '[À remplir]'}\n\n`;
    response += `27. ${q.valueFactors.question}\n${q.valueFactors.defaultAnswer || '[À remplir]'}\n\n`;
    response += `28. ${q.timeShare.question}\n${q.timeShare.defaultAnswer || '[À remplir]'}\n\n`;
  }

  response += `\nJe, soussigné, étant l'un des administrateurs du syndicat des copropriétaires, certifie que les renseignements fournis sont exacts.

SIGNÉ à Saint-Hubert ce ${new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}

Arnaud Bellemare
Président | Gestion Velora
Phone: 514-777-1731
Email: info@gestionvelora.com
Hours of Operation: 9:00 AM – 5:00 PM
After-Hours Emergency Line (any urgent building-related issues): 514-777-1731
3181 Mnt Saint-Hubert, Saint-Hubert J3Y 4J4 | Gestion Velora Website`;

  return response;
}

/**
 * Get standard notary question answer
 */
export function getNotaryQuestionAnswer(questionNumber: number): { question: string; answer: string } | null {
  const cert = getNotaryCertificateInfo();
  if (!cert?.standardQuestions) return null;
  
  const q = cert.standardQuestions;
  const questions = [
    { question: q.monthlyCharges.question, answer: q.monthlyCharges.defaultAnswer || '' },
    { question: q.lastPayment.question, answer: q.lastPayment.defaultAnswer || '' },
    { question: q.nextPaymentDue.question, answer: q.nextPaymentDue.defaultAnswer || '' },
    { question: q.arrears.question, answer: q.arrears.defaultAnswer || '' },
    { question: q.interestRate.question, answer: q.interestRate.defaultAnswer || '' },
    { question: q.specialAssessment.current.question, answer: q.specialAssessment.current.defaultAnswer || '' },
    { question: q.specialAssessment.votedNotYetDue.question, answer: q.specialAssessment.votedNotYetDue.defaultAnswer || '' },
    { question: q.fiscalYear.question, answer: q.fiscalYear.defaultAnswer || '' },
    { question: q.reserveFund.question, answer: q.reserveFund.defaultAnswer || '' },
    { question: q.operatingDeficit.question, answer: q.operatingDeficit.defaultAnswer || '' },
    { question: q.operatingSurplus.question, answer: q.operatingSurplus.defaultAnswer || '' },
    { question: q.legalProceedings.question, answer: q.legalProceedings.defaultAnswer || '' },
    { question: q.judgments.question, answer: q.judgments.defaultAnswer || '' },
    { question: q.insurancePremiums.question, answer: q.insurancePremiums.defaultAnswer || '' },
    { question: q.insuranceIndemnities.question, answer: q.insuranceIndemnities.defaultAnswer || '' },
    { question: q.insuranceTrustee.question, answer: q.insuranceTrustee.defaultAnswer || '' },
    { question: q.registration.question, answer: q.registration.defaultAnswer || '' },
    { question: q.exclusiveCommonAreas.question, answer: q.exclusiveCommonAreas.defaultAnswer || '' },
    { question: q.restrictedCommonAreaFees.question, answer: q.restrictedCommonAreaFees.defaultAnswer || '' },
    { question: q.videotronFees.question, answer: q.videotronFees.defaultAnswer || '' },
    { question: q.additionalRegulations.question, answer: q.additionalRegulations.defaultAnswer || '' },
    { question: q.pendingRegulations.question, answer: q.pendingRegulations.defaultAnswer || '' },
    { question: q.lastAGM.question, answer: q.lastAGM.defaultAnswer || '' },
    { question: q.extraordinaryDecisions.question, answer: q.extraordinaryDecisions.defaultAnswer || '' },
    { question: q.sellerWorks.question, answer: q.sellerWorks.defaultAnswer || '' },
    { question: q.sellerViolations.question, answer: q.sellerViolations.defaultAnswer || '' },
    { question: q.valueFactors.question, answer: q.valueFactors.defaultAnswer || '' },
    { question: q.timeShare.question, answer: q.timeShare.defaultAnswer || '' }
  ];
  
  if (questionNumber < 1 || questionNumber > questions.length) return null;
  return questions[questionNumber - 1];
}
