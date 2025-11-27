# Declaration of Co-ownership Knowledge Base

## Overview

This knowledge base extracts and classifies all rules, regulations, and procedures from the Declaration of Co-ownership (DDC_Enticy_v2.pdf) for use in email classification and automated response generation.

## Structure

The knowledge base is organized into the following categories:

### 1. Violations (`violations`)

Rules governing prohibited activities and their penalties:

- **Smoking**: Prohibited locations, fine structure, escalation
- **Noise**: Quiet hours, prohibited activities, fines
- **Pets**: Allowed types, registration requirements, deposits
- **Parking**: Assigned spaces, visitor rules, towing conditions
- **General**: Default violation rules and escalation

### 2. Financial (`financial`)

Financial obligations and payment procedures:

- **Condo Fees**: Payment methods, due dates, late fees
- **PPA (Pre-authorized Payment)**: Setup process, requirements
- **Special Assessments**: Approval requirements, thresholds
- **Deposits**: Move-in/out deposits, renovation deposits

### 3. Access Control (`accessControl`)

Building access and security:

- **Fob**: Issuance process, replacement fees
- **Intercom**: Setup process, display name format, unlock code
- **Keys**: Common area access
- **Elevator**: Reservation requirements, hours, capacity restrictions

### 4. Renovation (`renovation`)

Renovation approval and requirements:

- **Approval Required**: Board approval thresholds
- **Required Documents**: Plans, licenses, insurance, permits
- **Deposit**: Amount and conditions
- **Contractor Requirements**: License, insurance minimums
- **Work Hours**: Permitted hours
- **Inspection**: Post-work inspection requirements

### 5. Move-In/Out (`moveInOut`)

Moving procedures:

- **Reservation**: Advance notice requirements
- **Deposit**: Amount and refund timeline
- **Hours**: Permitted move-in hours
- **Elevator**: Reservation requirements
- **Common Area Protection**: Required materials
- **Inspection**: Before/after inspection process

### 6. Eviction (`eviction`)

Eviction process and legal procedures:

- **Grounds**: Valid reasons for eviction
- **Process**: Notices required, grace period, TAL application
- **Fines**: Fine structure before eviction
- **Co-Owner Responsibility**: Liability for tenants and guests

### 7. Water Damage (`waterDamage`)

Water damage procedures and insurance:

- **Emergency Response**: Immediate actions, contact procedures
- **Insurance**: Syndicate vs co-owner coverage
- **Responsibility**: Source determination, who covers what
- **Reconstruction**: Standard restoration vs improvements

### 8. Common Areas (`commonAreas`)

Common area usage rules:

- **Usage**: Allowed and prohibited activities
- **Reservation**: Facilities requiring reservation
- **Hours**: Operating hours
- **Fees**: Usage fees if applicable

### 9. Board Approval (`boardApproval`)

Board approval requirements:

- **Required For**: Actions requiring CA approval
- **Process**: Review and voting procedures
- **Timeline**: Typical approval timeline
- **Quorum**: Voting quorum requirements

### 10. Insurance (`insurance`)

Insurance requirements:

- **Co-Owner Minimum**: Minimum liability coverage
- **Syndicate Coverage**: What the syndicate insurance covers

### 11. Legal (`legal`)

Legal references and applicable laws:

- **Declaration Sections**: Key article references
- **Applicable Laws**: Civil Code, Law 16, municipal bylaws

## Usage in Email Responses

The knowledge base is integrated into email response generation:

```typescript
import { 
  getViolationRule, 
  getFineAmount,
  getEvictionProcess,
  getMoveDepositInfo,
  getRenovationRequirements,
  requiresBoardApproval
} from '@/lib/declaration-knowledge';

// Get fine amount for violation
const firstFine = getFineAmount('smoking', 1); // Returns '$100'
const secondFine = getFineAmount('smoking', 2); // Returns '$150'

// Get eviction process info
const evictionProcess = getEvictionProcess();
// Returns: { noticesRequired: 1, gracePeriod: '1 month', TALTimeline: '2-3 months' }

// Check if board approval needed
const needsApproval = requiresBoardApproval('major renovation'); // Returns true

// Get move-in deposit info
const depositInfo = getMoveDepositInfo();
// Returns: { amount: '$500', refundTimeline: '10 days' }
```

## Populating from PDF

To extract actual rules from DDC_Enticy_v2.pdf:

1. **Identify Sections**: Locate Partie II (Règlement de l'immeuble) in the PDF
2. **Extract Rules**: For each rule category:
   - Copy the exact text
   - Identify fine amounts, timelines, requirements
   - Note any section/article references
3. **Update Constants**: Update `ENTICY_DECLARATION_RULES` in `frontend/lib/declaration-knowledge.ts`
4. **Test Responses**: Verify email responses reflect accurate information

## Key Sections to Extract

### Violations Section
- Smoking prohibition (location, fines)
- Noise rules (quiet hours, fines)
- Pet regulations
- Parking rules
- General violation fines and escalation

### Financial Section
- Condo fee payment methods and due dates
- PPA setup requirements
- Late fees and interest rates
- Deposit amounts (move-in, renovation, etc.)

### Access Control Section
- Fob issuance and replacement
- Intercom setup and operation
- Elevator reservation rules
- Key distribution

### Renovation Section
- Approval requirements
- Required documents
- Deposit amounts
- Contractor requirements
- Work hours
- Inspection procedures

### Move-In/Out Section
- Reservation requirements
- Deposit amounts and refund timeline
- Permitted hours
- Common area protection requirements

### Eviction Section
- Valid grounds for eviction
- Notice requirements
- TAL application process
- Co-owner responsibility

### Water Damage Section
- Emergency response procedures
- Insurance coverage (syndicate vs co-owner)
- Responsibility determination
- Reconstruction standards

## Current Status

**Extracted from Emails/Context:**
- ✅ Smoking violations and fines
- ✅ General violation fine structure
- ✅ Move-in/out deposit ($500)
- ✅ Eviction process (TAL, grace period)
- ✅ Renovation approval requirements
- ✅ Water damage insurance coordination
- ✅ Access control (intercom, fob)

**To Be Extracted from PDF:**
- ⏳ Exact fine amounts (may differ from current values)
- ⏳ Quiet hours (currently estimated as 10 PM - 7 AM)
- ⏳ Pet restrictions (if any)
- ⏳ Parking rules details
- ⏳ Condo fee due dates and late fees
- ⏳ PPA setup details
- ⏳ Renovation deposit calculation
- ⏳ Board approval quorum and voting rules
- ⏳ Legal article references
- ⏳ Common area usage rules

## Maintenance

When updating the knowledge base:

1. **Verify Accuracy**: Cross-reference with actual declaration document
2. **Update Email Responses**: Ensure response generators use updated values
3. **Test Classification**: Verify email classification still works correctly
4. **Document Changes**: Note any changes in this file

## Integration Points

The knowledge base is used in:

- `frontend/lib/declaration-knowledge.ts` - Main knowledge base
- `frontend/app/api/email/classify-and-respond/route.ts` - Email response generation
- `frontend/lib/email-template-classifier.ts` - Email classification (indirectly)

## Future Enhancements

- PDF parsing automation to extract rules automatically
- Version control for declaration updates
- Multi-language support (English/French)
- Rule change notifications
- Historical rule tracking

