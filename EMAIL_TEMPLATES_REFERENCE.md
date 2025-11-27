# Email Classification Templates - Complete Reference

## Overview

The email classification system uses **23 pre-built templates** to categorize property management emails. Each template has:
- **ID**: Unique identifier
- **Name**: Display name
- **Priority**: 5-10 (higher = more urgent)
- **Keywords**: Words that trigger classification
- **Patterns**: Regex patterns for detection

---

## Template List (Sorted by Priority)

### Priority 10 - Critical/Urgent

#### 1. WATER DAMAGE INCIDENT
- **ID**: `water-damage-incident`
- **Priority**: 10 (Highest)
- **Description**: Water damage incidents, insurance claims, emergency interventions, reconstruction work, or water-related property damage
- **Keywords**: water damage, dégât d'eau, sinistre, water leak, flood, inondation, flooding, burst pipe, pipe burst, plumbing leak, roof leak, ceiling leak, insurance claim, déclaration de sinistre, assurance, emergency, urgence, reconstruction, drying, assèchement, deductible, franchise, expert, évaluateur, compagnie d'urgence, emergency company, after-sinister, après-sinistre, affected units, unités affectées, monday.com, water damage incident
- **When to use**: Water leaks, floods, burst pipes, insurance claims for water damage, emergency water damage interventions, reconstruction after water damage
- **Example**: "Water damage discovered in unit 2305, water leaking from ceiling. Need emergency company immediately."

#### 2. TENANT SAFETY COMPLAINT
- **ID**: `tenant-safety-complaint`
- **Priority**: 10 (Highest)
- **Description**: Urgent tenant complaints about safety, security, disturbances, eviction requests, or police involvement
- **Keywords**: safety, security, tenant, complaint, eviction, expulsion, police, disturbance, pepper spray, unsafe, fear, TAL, tribunal, locataire, sécurité
- **When to use**: Safety incidents, eviction requests, police involvement, tenant fear/unsafety
- **Example**: "Tenants afraid to leave apartment due to disturbances from unit 2303"

---

### Priority 9 - High Priority

#### 3. EVICTION REQUEST
- **ID**: `eviction-request`
- **Priority**: 9
- **Description**: Eviction requests, TAL proceedings, tenant removal requests, formal eviction notices, co-owner responsibility for tenant violations, or eviction-related board decisions
- **Keywords**: eviction, expulsion, expulsé, TAL, tribunal administratif du logement, remove tenant, expulser locataire, eviction order, ordre d'expulsion, formal notice, avis formel, eviction process, processus d'expulsion, co-owner responsibility, responsabilité copropriétaire, lease termination, résiliation bail, voluntary departure, départ volontaire, grace period, délai de grâce, eviction application, demande d'expulsion, board decision, décision conseil, police called, police unit
- **When to use**: Eviction requests, TAL proceedings, tenant removal, formal eviction notices, eviction follow-ups, co-owner liability discussions, board decisions on evictions, police involvement in eviction cases, grace periods and voluntary departure negotiations
- **Example**: "Unit 2303 - Tenant eviction. Multiple violations, fines applied to co-owner account. TAL application filed. Tenant given 1-month grace period for voluntary departure."

#### 4. BOARD MEETING FOLLOW-UP
- **ID**: `board-meeting-followup`
- **Priority**: 9
- **Description**: Board meeting follow-ups, action items, task lists, legal case updates, or administrative follow-up requests
- **Keywords**: board meeting, follow-up, follow up, action items, tasks, meeting minutes, procès-verbal, board, conseil, syndicate, syndicat, update, status, timeline, lawsuit, legal action, law firm, dossier, file
- **When to use**: Numbered action items, board meeting minutes, administrative task lists, legal case updates
- **Example**: "1. Unit 2303 – Eviction... 2. Unit 1907 – Safety concerns... 3. HVAC Lawsuit"

#### 5. LEGAL DOCUMENT REQUEST
- **ID**: `legal-document-request`
- **Priority**: 9
- **Description**: Requests for legal documents, certificates, attestations, or official condominium documents (Law 16, certificates, etc.)
- **Keywords**: law 16, attestation, certificate, certificat, legal document, condominium certificate, co-ownership, declaration, administrative fees
- **When to use**: Law 16 attestation requests, condominium certificates, legal document requests
- **Example**: "I would like to request the law 16 attestation for unit 701"

#### 6. WORK NEEDING TO BE DONE IN THE BUILDING
- **ID**: `work-building`
- **Priority**: 9
- **Description**: Maintenance requests, repairs, construction, HVAC issues, or building work needed
- **Keywords**: repair, maintenance, fix, broken, leak, plumbing, electrical, heating, construction, work, hvac, air conditioning, thermostat, heat, technician, service call, inspect, inspection
- **When to use**: Maintenance requests, HVAC issues, repairs, building work
- **Example**: "The heating in unit 2405 is not working, please send a technician"

---

### Priority 8 - High Priority

#### 7. RENOVATION REQUEST
- **ID**: `renovation-request`
- **Priority**: 8
- **Description**: Renovation requests, unit modifications, construction projects, renovation approvals, or building modification requests
- **Keywords**: renovation, rénovation, modification, renovate, construction, remodel, renovation request, demande de rénovation, modifications d'unités, unit modifications, renovation project, projet de rénovation, approval, approbation, dépôt de garantie, deposit, guarantee deposit, permits, permis, municipal permit, permis municipal, contractor, entrepreneur, insurance, assurance, plans, plans détaillés, detailed plans, conseil d'administration, board approval, CA
- **When to use**: Renovation requests, unit modification requests, construction project approvals, renovation deposits, permit requests
- **Example**: "I would like to request approval for renovations to my unit. I have detailed plans and contractor insurance ready."

#### 8. REGULATION VIOLATION
- **ID**: `regulation-violation`
- **Priority**: 8
- **Description**: Regulation violations, bylaw infractions, rule violations, warnings, fines, or compliance issues
- **Keywords**: violation, infraction, règlement, regulation, bylaw, non-compliance, non-conformité, warning, avertissement, fine, amende, penalty, pénalité, infraction aux règlements, regulation violation, rule violation, violation des règles, noise, bruit, excessive noise, bruit excessif, parking violation, stationnement illégal, unauthorized, non autorisé, animal, animaux, pet violation, violation animal
- **When to use**: Bylaw violations, noise complaints, parking violations, unauthorized activities, warning letters, fine notifications
- **Example**: "This is a formal warning regarding excessive noise from unit 1205 during prohibited hours."

#### 9. PURCHASE REQUEST
- **ID**: `purchase-request`
- **Priority**: 8
- **Description**: Purchase requests for equipment, furniture, signage, gym equipment, or facility improvements
- **Keywords**: purchase, achat, buy, acheter, equipment, équipement, gym purchase, achat gym, signage, panneau, holder, A4 holder, plastic holder, furniture, meubles, facility purchase, achat équipement
- **When to use**: Equipment purchases, gym equipment, signage requests, facility improvements, furniture purchases
- **Example**: "Gym purchase - Club piscine. Need approval for A4 holders for UBER/Food Delivery signage."

#### 10. VENDOR PAYMENT REQUEST
- **ID**: `vendor-payment-request`
- **Priority**: 8
- **Description**: Vendor payment requests, supplier payments, payment processing for contractors or service providers
- **Keywords**: vendor payment, paiement fournisseur, supplier payment, paiement fournisseurs, Otonom, Otonom Solution, pay vendor, payer fournisseur, vendor invoice, facture fournisseur, contractor payment, paiement entrepreneur
- **When to use**: Vendor payment processing, supplier invoices, contractor payments, payment approvals
- **Example**: "Otonom Solution - Paiement fournisseurs. Need to process vendor payment."

#### 11. BANKING REQUEST
- **ID**: `banking-request`
- **Priority**: 8
- **Description**: Bank account access requests, credit card requests, banking setup, or financial account management
- **Keywords**: bank account, compte de banque, compte bancaire, credit card, carte de crédit, banking, banque, account access, accès compte, bank card, carte bancaire, financial account, compte financier
- **When to use**: Bank account setup, credit card requests, banking access, account management
- **Example**: "Accès compte de banque - demande de carte de crédit"

#### 12. MOVE-IN/MOVE-OUT REQUEST
- **ID**: `move-in-out-request`
- **Priority**: 8
- **Description**: Move-in/move-out requests, moving fees, elevator reservations, fob requests, or new resident setup
- **Keywords**: move-in, move-out, moving, déménagement, emménagement, elevator reservation, fob, puce, chip, deed of sale, acte de vente, possession, new resident, nouveau résident
- **When to use**: New residents moving in, move-out requests, elevator reservations, fob setup
- **Example**: "We are signing the deed of sale for unit 1609, need fobs and intercom setup"

#### 13. ACCESS CONTROL REQUEST
- **ID**: `access-control-request`
- **Priority**: 8
- **Description**: Requests for buzzer/intercom setup, access cards, keys, elevator access, or building access configuration
- **Keywords**: buzzer, intercom, sonnerie, puce, chip, access card, key, clé, elevator, ascenseur, door, porte, access, accès, phone number, numéro de téléphone
- **When to use**: Buzzer setup, intercom configuration, key/fob requests, access card requests
- **Example**: "I need the buzzer connected for condo 2402, phone number 514-237-3369"

#### 14. PROTOCOL DISCUSSION
- **ID**: `protocol-discussion`
- **Priority**: 8
- **Description**: Discussions about protocols, procedures, rules, regulations, or training
- **Keywords**: protocol, procedure, rules, regulations, training, protocol, procédure, règles
- **When to use**: Rule discussions, procedure updates, training requests, protocol enforcement
- **Example**: "Guards need to follow protocol regarding cell phone usage and desk tidiness"

#### 15. REPORT REQUEST
- **ID**: `report-request`
- **Priority**: 8
- **Description**: Requests for reports, missing reports, or report-related inquiries
- **Keywords**: report, reports, missing, rapport, rapports, weekend, night, shift
- **When to use**: Missing reports, report inquiries, weekend/night shift reports
- **Example**: "We have not been receiving weekend reports for midnight to 6 am shifts"

#### 16. NOTARY DOCUMENT ANSWER
- **ID**: `notary-document`
- **Priority**: 8
- **Description**: Emails related to notary documents, legal paperwork, or official document requests
- **Keywords**: notary, notarized, document, legal, signature, witness, certified, affidavit, power of attorney
- **When to use**: Notary document requests, legal paperwork, signature requests
- **Example**: "I need my lease document notarized, can you schedule an appointment?"

#### 17. FINANCIAL REPORT
- **ID**: `financial-report`
- **Priority**: 8
- **Description**: Financial statements, invoices, payments, budgets, or accounting-related emails
- **Keywords**: financial, invoice, payment, budget, expense, revenue, accounting, money, cost
- **When to use**: Financial statements, invoices, payment inquiries, budget discussions
- **Example**: "Here is the monthly financial report for March 2024. Total revenue: $45,000"

---

### Priority 7 - Medium-High Priority

#### 18. OPERATIONS TASK
- **ID**: `operations-task`
- **Priority**: 7
- **Description**: Operational tasks, follow-ups, staff management, welcome emails, security follow-ups, or administrative operations
- **Keywords**: operations, opérations, task, tâche, follow-up, suivi, follow up, welcome email, courriel de bienvenue, security follow-up, suivi sécurité, janitor, concierge, staff, personnel, operational, opérationnel
- **When to use**: Operational follow-ups, staff management, welcome emails, security follow-ups, janitor tasks, administrative operations
- **Example**: "Security - follow up. Welcome email to residents. See with janitor tasks well done."

#### 19. CUSTOMER REQUEST
- **ID**: `customer-request`
- **Priority**: 7
- **Description**: Customer inquiries, requests, complaints, general questions, FAQs, or information requests
- **Keywords**: request, inquiry, question, complaint, issue, problem, help, need, customer, tenant, question, questions, questionnement, information, explain, understand, why, what, how, who, when
- **When to use**: General questions, FAQs, information requests, inquiries about fees/processes
- **Example**: "What is the reason for the management change? How will this affect condo fees?"

#### 20. MEETING REQUEST
- **ID**: `meeting-request`
- **Priority**: 7
- **Description**: Emails requesting meetings, scheduling appointments, or coordinating availability
- **Keywords**: meeting, schedule, appointment, available, availability, coordinate, réunion, disponible, horaire
- **When to use**: Meeting scheduling, availability coordination, appointment requests
- **Example**: "Can we schedule a meeting for Monday, November 17, after 3:00 PM?"

#### 21. SCHEDULE REQUEST
- **ID**: `schedule-request`
- **Priority**: 7
- **Description**: Requests for schedules, timetables, shift information, or guard schedules
- **Keywords**: schedule, shift, timetable, horaire, schedule, guards, security, shifts
- **When to use**: Guard schedule requests, shift information, timetable requests
- **Example**: "Can you send us the current schedule of the security guards, including their assigned times?"

---

### Priority 6 - Medium Priority

#### 22. THINGS TO BE DONE IN THE COMING WEEKS
- **ID**: `upcoming-tasks`
- **Priority**: 6
- **Description**: Scheduled tasks, upcoming events, or planned activities
- **Keywords**: upcoming, scheduled, planned, next week, coming weeks, future, calendar, appointment, action items
- **When to use**: Upcoming tasks, scheduled events, future planning
- **Example**: "Things to be done in the coming weeks: pool painting, window washing"

---

### Priority 5 - Low-Medium Priority

#### 23. MENSUAL REPORT
- **ID**: `mensual-report`
- **Priority**: 5
- **Description**: Monthly reports, summaries, or periodic updates
- **Keywords**: monthly, report, summary, update, mensual, period, review
- **When to use**: Monthly reports, periodic summaries, regular updates
- **Example**: "Here is the monthly report for November 2025"

---

## Entity Extraction

The system extracts the following entities from emails:

- **Dates**: Various formats (MM/DD/YYYY, YYYY-MM-DD, written dates)
- **Amounts**: Currency ($250, $50/hour, etc.)
- **Locations**: Units, addresses, floors, parking spaces
- **People**: Names, tenants, contractors, guards, co-owners
- **Documents**: Legal documents, certificates, reports, contracts
- **Phone Numbers**: Contact numbers (514-777-1731 format)

---

## How to Modify Templates

### Adding a New Template

Edit `frontend/lib/email-template-classifier.ts`:

```typescript
{
  id: 'your-template-id',
  name: 'YOUR TEMPLATE NAME',
  description: 'Description of what this template is for',
  keywords: ['keyword1', 'keyword2', 'keyword3'],
  patterns: [
    /\b(pattern1|pattern2)\b/gi,
    /\b(specific.*pattern)\b/gi
  ],
  priority: 8 // 5-10, higher = more urgent
}
```

### Modifying Existing Template

1. Find the template in `EMAIL_TEMPLATES` array
2. Update keywords, patterns, or priority
3. Test with sample emails

### Adjusting Priority

- **Priority 10**: Critical safety/urgent issues
- **Priority 9**: High priority administrative tasks
- **Priority 8**: Important requests (legal, maintenance, access)
- **Priority 7**: Standard requests (meetings, schedules, inquiries)
- **Priority 6**: Medium priority (upcoming tasks)
- **Priority 5**: Low priority (reports, summaries)

---

## Testing Templates

Use the batch processing interface:
1. Go to `http://localhost:3000/email-testing`
2. Click "Show Batch Processing"
3. Paste test emails
4. Review classifications
5. Label incorrect ones to improve accuracy

---

## Current Template Count: 23 Templates

The system can classify emails into these 23 categories automatically, with continuous learning from labeled examples.

