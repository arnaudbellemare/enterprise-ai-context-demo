# Property Management Features

This document describes the new property management features integrated into the email classification and response system.

## 1. Maintenance Schedule & Predictive Maintenance ✅

### Location
`frontend/lib/property-management-knowledge.ts`

### Features
- **Maintenance Schedule**: Structured schedule with categories (preventive, predictive, corrective, emergency)
- **Frequency Tracking**: Daily, weekly, monthly, quarterly, semi-annual, annual, as-needed
- **Cost Estimation**: Estimated costs for each maintenance item
- **Priority Levels**: Low, medium, high, critical
- **Responsible Party**: Management, concierge, contractor, co-owner, tenant
- **Predictive Maintenance**: System component tracking with expected lifespans and failure predictions

### Functions Available
- `getUpcomingMaintenance(days)` - Get maintenance items due in the next N days
- `getMaintenanceByPriority(priority)` - Filter maintenance by priority level
- `getPredictiveMaintenanceNeedingAttention()` - Get components needing attention within 6 months

### Data Structure
The `MAINTENANCE_SCHEDULE` array contains example items. **You need to populate this with your actual maintenance schedule data.**

Example:
```typescript
{
  id: 'monthly-hvac-filter',
  category: 'preventive',
  item: 'HVAC Filter Replacement',
  description: 'Replace HVAC filters in common areas',
  frequency: 'monthly',
  nextDue: '2025-02-01',
  estimatedCost: 150,
  priority: 'medium',
  responsibleParty: 'management',
  relatedSystems: ['HVAC']
}
```

## 2. Tenant Screening & Co-Owner Routing ✅

### Location
`frontend/lib/property-management-knowledge.ts` and `frontend/app/api/email/classify-and-respond/route.ts`

### Features
- **Resident Database**: Stores co-owners and tenants with relationships
- **Email Identification**: Checks if email belongs to tenant or co-owner
- **Automatic Routing**: Routes tenant requests to co-owner when appropriate
- **Bilingual Responses**: Supports English and French routing messages

### Functions Available
- `isTenantEmail(email)` - Check if email belongs to a tenant
- `isCoOwnerEmail(email)` - Check if email belongs to a co-owner
- `getResidentByEmail(email)` - Get full resident information
- `getCoOwnerForTenant(email)` - Get co-owner info for a tenant

### Request Types Routed to Co-Owner
When a tenant sends an email about:
- Financial reports / billing
- Legal documents
- Renovation requests
- Eviction matters
- Purchase requests

The system automatically responds telling them to contact their co-owner.

### Data Structure
The `RESIDENTS_LIST` array needs to be populated with your actual residents data:

```typescript
{
  email: 'tenant@example.com',
  name: 'Jane Smith',
  unit: '1002',
  type: 'tenant',
  coOwnerEmail: 'owner@example.com',
  coOwnerName: 'John Doe',
  moveInDate: '2024-01-01',
  leaseEndDate: '2025-12-31',
  status: 'active'
}
```

## 3. Revenue Management & Budget Tracking ✅

### Location
`frontend/lib/property-management-knowledge.ts`

### Features
- **Monthly Budgets**: Track budgeted vs actual amounts
- **Variance Calculation**: Automatic calculation of budget variance
- **Status Tracking**: On-track, over-budget, under-budget
- **Revenue Forecasting**: Projected revenue with confidence levels

### Functions Available
- `getMonthlyBudget(month)` - Get budget for specific month (YYYY-MM format)
- `compareBudgetVsActual(month)` - Compare actual vs budgeted with variance calculation
- `getRevenueForecast(months)` - Get revenue forecast for upcoming months

### Data Structure
The `MONTHLY_BUDGETS` array needs to be populated with your actual budget data:

```typescript
{
  month: '2025-01',
  totalBudgeted: 50000,
  totalActual: 52000,
  variance: 2000,
  variancePercentage: 4,
  status: 'over-budget',
  items: [
    {
      id: 'maintenance-2025-01',
      category: 'Maintenance',
      budgetedAmount: 10000,
      actualAmount: 12000,
      variance: 2000
    }
  ]
}
```

## 4. Document Automation ✅

### Location
`frontend/lib/property-management-knowledge.ts`

### Features
- **Template System**: Pre-defined templates for common documents
- **Placeholder Replacement**: Automatic replacement of {{placeholders}} with actual data
- **Multiple Formats**: PDF, HTML, DOCX, TXT support
- **Required Fields Validation**: Ensures all required fields are provided

### Document Types Available
- Late Payment Notice
- Violation Warning
- Move-In Approval Letter
- Monthly Financial Report

### Functions Available
- `generateDocument(templateId, data)` - Generate document from template with data

### Usage Example
```typescript
const document = generateDocument('late-payment-notice', {
  name: 'John Doe',
  unit: '1001',
  amount: '500',
  dueDate: '2025-01-15',
  daysOverdue: '10'
});
```

### Adding New Templates
Add to `DOCUMENT_TEMPLATES` array:

```typescript
{
  id: 'your-template-id',
  name: 'Your Template Name',
  type: 'notice' | 'invoice' | 'certificate' | 'report' | 'letter' | 'form',
  template: `Your template with {{placeholders}}`,
  requiredFields: ['field1', 'field2'],
  outputFormat: 'pdf',
  description: 'Description of the template'
}
```

## Integration with Email System

All features are integrated into the email classification and response system:

1. **Tenant Screening**: Automatically checks sender email and routes tenant requests appropriately
2. **Maintenance Queries**: Can be queried via email classification (future enhancement)
3. **Budget Queries**: Can be queried via email classification (future enhancement)
4. **Document Generation**: Can be triggered via email requests (future enhancement)

## Next Steps

To make these features fully operational:

1. **Populate Maintenance Schedule**: Add your actual maintenance items to `MAINTENANCE_SCHEDULE`
2. **Populate Residents List**: Add all co-owners and tenants to `RESIDENTS_LIST`
3. **Populate Budget Data**: Add monthly budget data to `MONTHLY_BUDGETS`
4. **Add Email Templates**: Create email classification templates for maintenance and budget queries
5. **Create API Endpoints**: (Optional) Create dedicated API endpoints for querying this data

## Data Sources

You mentioned you will provide:
- Maintenance schedule and predictive maintenance data
- Residents list (co-owners and tenants)
- Budget and revenue data month-over-month

Once you provide this data, it can be integrated into the `property-management-knowledge.ts` file.




