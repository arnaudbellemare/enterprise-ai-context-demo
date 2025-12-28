/**
 * Property Management Knowledge Base
 * 
 * Extended knowledge base for:
 * - Maintenance schedules and predictive maintenance
 * - Tenant screening and co-owner identification
 * - Revenue management and budget tracking
 * - Document automation templates
 */

// ============================================================================
// MAINTENANCE SCHEDULE & PREDICTIVE MAINTENANCE
// ============================================================================

export interface MaintenanceSchedule {
  id: string;
  category: 'preventive' | 'predictive' | 'corrective' | 'emergency';
  item: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'as-needed';
  nextDue: string; // ISO date or relative date
  lastCompleted?: string; // ISO date
  estimatedCost?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  responsibleParty: 'management' | 'concierge' | 'contractor' | 'co-owner' | 'tenant';
  notes?: string;
  relatedSystems?: string[]; // HVAC, plumbing, electrical, etc.
}

export interface PredictiveMaintenance {
  system: string; // HVAC, plumbing, electrical, elevators, etc.
  component: string;
  expectedLifespan: number; // months
  installationDate?: string; // ISO date
  lastInspection?: string; // ISO date
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  predictedFailureDate?: string; // ISO date (calculated)
  recommendedActions: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export const MAINTENANCE_SCHEDULE: MaintenanceSchedule[] = [
  // Monthly maintenance
  {
    id: 'monthly-hvac-filter',
    category: 'preventive',
    item: 'HVAC Filter Replacement',
    description: 'Replace HVAC filters in common areas and check unit filters',
    frequency: 'monthly',
    nextDue: '2025-02-01',
    estimatedCost: 150,
    priority: 'medium',
    responsibleParty: 'management',
    relatedSystems: ['HVAC']
  },
  {
    id: 'monthly-garage-cleaning',
    category: 'preventive',
    item: 'Garage Deep Cleaning',
    description: 'Monthly garage cleaning and inspection',
    frequency: 'monthly',
    nextDue: '2025-02-01',
    estimatedCost: 200,
    priority: 'medium',
    responsibleParty: 'concierge',
    relatedSystems: ['garage']
  },
  // Quarterly maintenance
  {
    id: 'quarterly-window-cleaning',
    category: 'preventive',
    item: 'Window Cleaning',
    description: 'Professional window cleaning for all units',
    frequency: 'quarterly',
    nextDue: '2025-04-01',
    estimatedCost: 800,
    priority: 'medium',
    responsibleParty: 'contractor',
    relatedSystems: ['windows']
  },
  {
    id: 'quarterly-carpet-cleaning',
    category: 'preventive',
    item: 'Common Area Carpet Cleaning',
    description: 'Deep cleaning of carpets in hallways and common areas',
    frequency: 'quarterly',
    nextDue: '2025-04-01',
    estimatedCost: 500,
    priority: 'medium',
    responsibleParty: 'contractor',
    relatedSystems: ['carpets']
  },
  // Annual maintenance
  {
    id: 'annual-hvac-inspection',
    category: 'preventive',
    item: 'HVAC System Annual Inspection',
    description: 'Complete HVAC system inspection and maintenance',
    frequency: 'annual',
    nextDue: '2025-06-01',
    estimatedCost: 2500,
    priority: 'high',
    responsibleParty: 'contractor',
    relatedSystems: ['HVAC']
  },
  {
    id: 'annual-elevator-inspection',
    category: 'preventive',
    item: 'Elevator Annual Inspection',
    description: 'Required annual elevator safety inspection',
    frequency: 'annual',
    nextDue: '2025-07-01',
    estimatedCost: 1500,
    priority: 'critical',
    responsibleParty: 'contractor',
    relatedSystems: ['elevators']
  },
  {
    id: 'annual-fire-safety',
    category: 'preventive',
    item: 'Fire Safety System Inspection',
    description: 'Fire alarms, sprinklers, and extinguishers inspection',
    frequency: 'annual',
    nextDue: '2025-08-01',
    estimatedCost: 2000,
    priority: 'critical',
    responsibleParty: 'contractor',
    relatedSystems: ['fire-safety']
  },
  {
    id: 'annual-roof-inspection',
    category: 'preventive',
    item: 'Roof Inspection',
    description: 'Annual roof inspection and minor repairs',
    frequency: 'annual',
    nextDue: '2025-09-01',
    estimatedCost: 3000,
    priority: 'high',
    responsibleParty: 'contractor',
    relatedSystems: ['roof']
  }
];

export const PREDICTIVE_MAINTENANCE: PredictiveMaintenance[] = [
  {
    system: 'HVAC',
    component: 'Central Air Conditioning Unit',
    expectedLifespan: 120, // 10 years
    installationDate: '2018-05-15',
    lastInspection: '2024-06-01',
    condition: 'good',
    predictedFailureDate: '2028-05-15',
    recommendedActions: [
      'Schedule annual maintenance',
      'Monitor energy consumption',
      'Plan for replacement in 2028'
    ],
    urgency: 'low'
  },
  {
    system: 'plumbing',
    component: 'Main Water Pipes',
    expectedLifespan: 240, // 20 years
    installationDate: '2010-01-01',
    lastInspection: '2024-01-15',
    condition: 'fair',
    predictedFailureDate: '2030-01-01',
    recommendedActions: [
      'Increase inspection frequency',
      'Monitor for leaks',
      'Budget for replacement in 2029'
    ],
    urgency: 'medium'
  },
  {
    system: 'elevators',
    component: 'Elevator Motor',
    expectedLifespan: 180, // 15 years
    installationDate: '2012-03-01',
    lastInspection: '2024-07-01',
    condition: 'good',
    predictedFailureDate: '2027-03-01',
    recommendedActions: [
      'Continue annual inspections',
      'Monitor performance metrics',
      'Plan for replacement in 2026'
    ],
    urgency: 'medium'
  }
];

// ============================================================================
// TENANT SCREENING & RESIDENTS LIST
// ============================================================================

export interface Resident {
  email: string;
  name: string;
  unit: string;
  type: 'co-owner' | 'tenant';
  coOwnerEmail?: string; // If tenant, link to co-owner
  coOwnerName?: string;
  moveInDate?: string; // ISO date
  leaseEndDate?: string; // ISO date (for tenants)
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
}

export const RESIDENTS_LIST: Resident[] = [
  // Example structure - to be populated with actual data
  // {
  //   email: 'owner@example.com',
  //   name: 'John Doe',
  //   unit: '1001',
  //   type: 'co-owner',
  //   status: 'active'
  // },
  // {
  //   email: 'tenant@example.com',
  //   name: 'Jane Smith',
  //   unit: '1002',
  //   type: 'tenant',
  //   coOwnerEmail: 'owner@example.com',
  //   coOwnerName: 'John Doe',
  //   moveInDate: '2024-01-01',
  //   leaseEndDate: '2025-12-31',
  //   status: 'active'
  // }
];

/**
 * Check if email belongs to a tenant (not co-owner)
 */
export function isTenantEmail(email: string): boolean {
  const resident = RESIDENTS_LIST.find(r => r.email.toLowerCase() === email.toLowerCase());
  return resident?.type === 'tenant';
}

/**
 * Get co-owner information for a tenant
 */
export function getCoOwnerForTenant(email: string): Resident | null {
  const tenant = RESIDENTS_LIST.find(r => 
    r.email.toLowerCase() === email.toLowerCase() && r.type === 'tenant'
  );
  
  if (!tenant || !tenant.coOwnerEmail) {
    return null;
  }
  
  return RESIDENTS_LIST.find(r => 
    r.email.toLowerCase() === tenant.coOwnerEmail!.toLowerCase() && r.type === 'co-owner'
  ) || null;
}

/**
 * Get resident information by email
 */
export function getResidentByEmail(email: string): Resident | null {
  return RESIDENTS_LIST.find(r => r.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Check if email belongs to a co-owner
 */
export function isCoOwnerEmail(email: string): boolean {
  const resident = RESIDENTS_LIST.find(r => r.email.toLowerCase() === email.toLowerCase());
  return resident?.type === 'co-owner';
}

// ============================================================================
// REVENUE MANAGEMENT & BUDGET TRACKING
// ============================================================================

export interface BudgetItem {
  id: string;
  category: string;
  subcategory?: string;
  budgetedAmount: number;
  actualAmount?: number;
  variance?: number; // actualAmount - budgetedAmount
  month: string; // YYYY-MM format
  notes?: string;
}

export interface MonthlyBudget {
  month: string; // YYYY-MM format
  totalBudgeted: number;
  totalActual: number;
  variance: number;
  variancePercentage: number;
  items: BudgetItem[];
  status: 'on-track' | 'over-budget' | 'under-budget';
}

export interface RevenueForecast {
  month: string; // YYYY-MM format
  projectedRevenue: number;
  confidence: 'low' | 'medium' | 'high';
  factors: string[];
}

export const MONTHLY_BUDGETS: MonthlyBudget[] = [
  // Example structure - to be populated with actual budget data
  // {
  //   month: '2025-01',
  //   totalBudgeted: 50000,
  //   totalActual: 52000,
  //   variance: 2000,
  //   variancePercentage: 4,
  //   status: 'over-budget',
  //   items: [
  //     {
  //       id: 'maintenance-2025-01',
  //       category: 'Maintenance',
  //       budgetedAmount: 10000,
  //       actualAmount: 12000,
  //       variance: 2000
  //     }
  //   ]
  // }
];

/**
 * Get budget for a specific month
 */
export function getMonthlyBudget(month: string): MonthlyBudget | null {
  return MONTHLY_BUDGETS.find(b => b.month === month) || null;
}

/**
 * Compare actual vs budgeted amounts
 */
export function compareBudgetVsActual(month: string): {
  onTrack: boolean;
  overBudget: boolean;
  variance: number;
  variancePercentage: number;
} | null {
  const budget = getMonthlyBudget(month);
  if (!budget) return null;
  
  return {
    onTrack: budget.variancePercentage >= -5 && budget.variancePercentage <= 5,
    overBudget: budget.variancePercentage > 5,
    variance: budget.variance,
    variancePercentage: budget.variancePercentage
  };
}

/**
 * Get revenue forecast for upcoming months
 */
export function getRevenueForecast(months: number = 3): RevenueForecast[] {
  // This would typically use historical data and trends
  // For now, return empty array - to be implemented with actual forecasting logic
  return [];
}

// ============================================================================
// DOCUMENT AUTOMATION TEMPLATES
// ============================================================================

export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'notice' | 'invoice' | 'certificate' | 'report' | 'letter' | 'form';
  template: string; // Template string with placeholders like {{unit}}, {{name}}, etc.
  requiredFields: string[];
  outputFormat: 'pdf' | 'html' | 'docx' | 'txt';
  description: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'late-payment-notice',
    name: 'Late Payment Notice',
    type: 'notice',
    template: 'Dear {{name}},\n\nThis is a notice regarding your overdue condo fees for unit {{unit}}.\n\nAmount Due: ${{amount}}\nDue Date: {{dueDate}}\nDays Overdue: {{daysOverdue}}\n\nPlease remit payment immediately to avoid further action.\n\nThank you,\nManagement',
    requiredFields: ['name', 'unit', 'amount', 'dueDate', 'daysOverdue'],
    outputFormat: 'pdf',
    description: 'Notice for late condo fee payments'
  },
  {
    id: 'violation-warning',
    name: 'Violation Warning',
    type: 'notice',
    template: 'Dear {{name}},\n\nThis is a formal warning regarding a violation of the building regulations.\n\nUnit: {{unit}}\nViolation Type: {{violationType}}\nDate: {{date}}\nFine Amount: ${{fineAmount}}\n\n{{violationDetails}}\n\nPlease correct this violation immediately to avoid further fines.\n\nThank you,\nManagement',
    requiredFields: ['name', 'unit', 'violationType', 'date', 'fineAmount', 'violationDetails'],
    outputFormat: 'pdf',
    description: 'Warning notice for building regulation violations'
  },
  {
    id: 'move-in-approval',
    name: 'Move-In Approval Letter',
    type: 'letter',
    template: 'Dear {{name}},\n\nYour move-in request for unit {{unit}} has been approved.\n\nMove-In Date: {{moveInDate}}\nSupervision Fee: ${{supervisionFee}}\nDeposit: ${{deposit}}\n\nPlease ensure all required documents are submitted before the move-in date.\n\nThank you,\nManagement',
    requiredFields: ['name', 'unit', 'moveInDate', 'supervisionFee', 'deposit'],
    outputFormat: 'pdf',
    description: 'Approval letter for move-in requests'
  },
  {
    id: 'monthly-financial-report',
    name: 'Monthly Financial Report',
    type: 'report',
    template: 'MONTHLY FINANCIAL REPORT\nPeriod: {{month}}\n\nREVENUES\nTotal Condo Fees: ${{totalCondoFees}}\nOther Income: ${{otherIncome}}\nTotal Revenue: ${{totalRevenue}}\n\nEXPENSES\nMaintenance: ${{maintenanceExpenses}}\nUtilities: ${{utilitiesExpenses}}\nInsurance: ${{insuranceExpenses}}\nManagement Fees: ${{managementFees}}\nOther Expenses: ${{otherExpenses}}\nTotal Expenses: ${{totalExpenses}}\n\nNET INCOME: ${{netIncome}}\n\nRESERVE FUND\nBeginning Balance: ${{reserveFundBeginning}}\nContributions: ${{reserveFundContributions}}\nEnding Balance: ${{reserveFundEnding}}',
    requiredFields: ['month', 'totalCondoFees', 'totalRevenue', 'totalExpenses', 'netIncome'],
    outputFormat: 'pdf',
    description: 'Monthly financial report for board of directors'
  }
];

/**
 * Generate document from template
 */
export function generateDocument(
  templateId: string,
  data: Record<string, any>
): string | null {
  const template = DOCUMENT_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;
  
  // Check required fields
  const missingFields = template.requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Replace placeholders
  let document = template.template;
  Object.entries(data).forEach(([key, value]) => {
    document = document.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });
  
  return document;
}

/**
 * Get upcoming maintenance items
 */
export function getUpcomingMaintenance(days: number = 30): MaintenanceSchedule[] {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  return MAINTENANCE_SCHEDULE.filter(item => {
    const nextDue = new Date(item.nextDue);
    return nextDue >= today && nextDue <= futureDate;
  }).sort((a, b) => {
    const dateA = new Date(a.nextDue);
    const dateB = new Date(b.nextDue);
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Get maintenance items by priority
 */
export function getMaintenanceByPriority(priority: MaintenanceSchedule['priority']): MaintenanceSchedule[] {
  return MAINTENANCE_SCHEDULE.filter(item => item.priority === priority);
}

/**
 * Get predictive maintenance items requiring attention
 */
export function getPredictiveMaintenanceNeedingAttention(): PredictiveMaintenance[] {
  const today = new Date();
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(today.getMonth() + 6);
  
  return PREDICTIVE_MAINTENANCE.filter(item => {
    if (!item.predictedFailureDate) return false;
    const failureDate = new Date(item.predictedFailureDate);
    return failureDate <= sixMonthsFromNow && item.urgency !== 'low';
  }).sort((a, b) => {
    if (!a.predictedFailureDate || !b.predictedFailureDate) return 0;
    return new Date(a.predictedFailureDate).getTime() - new Date(b.predictedFailureDate).getTime();
  });
}

