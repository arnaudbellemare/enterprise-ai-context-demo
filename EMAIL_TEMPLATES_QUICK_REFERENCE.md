# Email Classification Templates - Quick Reference

## All 15 Email Templates

### 🔴 Priority 10 - CRITICAL (Highest Urgency)

| ID | Name | When to Use |
|---|---|---|
| `tenant-safety-complaint` | **TENANT SAFETY COMPLAINT** | Safety incidents, eviction requests, police involvement, tenant fear |

---

### 🟠 Priority 9 - HIGH PRIORITY

| ID | Name | When to Use |
|---|---|---|
| `board-meeting-followup` | **BOARD MEETING FOLLOW-UP** | Board meeting action items, numbered task lists, administrative follow-ups |
| `legal-document-request` | **LEGAL DOCUMENT REQUEST** | Law 16 attestation, condominium certificates, legal document requests |
| `work-building` | **WORK NEEDING TO BE DONE IN THE BUILDING** | Maintenance, repairs, HVAC issues, building work |

---

### 🟡 Priority 8 - HIGH PRIORITY

| ID | Name | When to Use |
|---|---|---|
| `move-in-out-request` | **MOVE-IN/MOVE-OUT REQUEST** | New residents moving in, move-out requests, elevator reservations, fob setup |
| `access-control-request` | **ACCESS CONTROL REQUEST** | Buzzer/intercom setup, key/fob requests, access card requests |
| `protocol-discussion` | **PROTOCOL DISCUSSION** | Rules, procedures, training, protocol enforcement |
| `report-request` | **REPORT REQUEST** | Missing reports, report inquiries, weekend/night shift reports |
| `notary-document` | **NOTARY DOCUMENT ANSWER** | Notary document requests, legal paperwork, signature requests |
| `financial-report` | **FINANCIAL REPORT** | Financial statements, invoices, payments, budgets |

---

### 🟢 Priority 7 - MEDIUM-HIGH PRIORITY

| ID | Name | When to Use |
|---|---|---|
| `customer-request` | **CUSTOMER REQUEST** | General questions, FAQs, information requests, inquiries |
| `meeting-request` | **MEETING REQUEST** | Meeting scheduling, availability coordination, appointment requests |
| `schedule-request` | **SCHEDULE REQUEST** | Guard schedules, shift information, timetable requests |

---

### 🔵 Priority 6 - MEDIUM PRIORITY

| ID | Name | When to Use |
|---|---|---|
| `upcoming-tasks` | **THINGS TO BE DONE IN THE COMING WEEKS** | Upcoming tasks, scheduled events, future planning |

---

### ⚪ Priority 5 - LOW-MEDIUM PRIORITY

| ID | Name | When to Use |
|---|---|---|
| `mensual-report` | **MENSUAL REPORT** | Monthly reports, periodic summaries, regular updates |

---

## Template Details

### 1. TENANT SAFETY COMPLAINT (Priority 10)
- **Keywords**: safety, security, eviction, police, disturbance, pepper spray, TAL
- **Example**: "Tenants afraid to leave apartment, need eviction for unit 2303"

### 2. BOARD MEETING FOLLOW-UP (Priority 9)
- **Keywords**: board meeting, follow-up, action items, meeting minutes, tasks
- **Example**: "1. Unit 2303 – Eviction... 2. HVAC Lawsuit... 3. Credit Card"

### 3. LEGAL DOCUMENT REQUEST (Priority 9)
- **Keywords**: law 16, attestation, certificate, co-ownership, $225
- **Example**: "Request law 16 attestation for unit 701, $225 fee"

### 4. WORK NEEDING TO BE DONE IN THE BUILDING (Priority 9)
- **Keywords**: repair, maintenance, HVAC, heating, technician, service call
- **Example**: "Heating not working in unit 2405, need technician"

### 5. MOVE-IN/MOVE-OUT REQUEST (Priority 8)
- **Keywords**: move-in, move-out, moving, elevator reservation, fob, deed of sale
- **Example**: "Signing deed of sale for unit 1609, need fobs and intercom"

### 6. ACCESS CONTROL REQUEST (Priority 8)
- **Keywords**: buzzer, intercom, puce, chip, access card, phone number
- **Example**: "Need buzzer connected for condo 2402, phone 514-237-3369"

### 7. PROTOCOL DISCUSSION (Priority 8)
- **Keywords**: protocol, procedure, rules, regulations, training
- **Example**: "Guards need to follow protocol for cell phone usage"

### 8. REPORT REQUEST (Priority 8)
- **Keywords**: report, missing report, weekend report, night shift
- **Example**: "Not receiving weekend reports for midnight to 6 am shifts"

### 9. NOTARY DOCUMENT ANSWER (Priority 8)
- **Keywords**: notary, notarized, document, signature, witness
- **Example**: "Need lease document notarized, schedule appointment"

### 10. FINANCIAL REPORT (Priority 8)
- **Keywords**: financial, invoice, payment, budget, expense, revenue
- **Example**: "Monthly financial report for March 2024, revenue $45,000"

### 11. CUSTOMER REQUEST (Priority 7)
- **Keywords**: request, inquiry, question, information, explain, what, why, how
- **Example**: "What is the reason for management change? How will this affect fees?"

### 12. MEETING REQUEST (Priority 7)
- **Keywords**: meeting, schedule, appointment, available, réunion
- **Example**: "Can we schedule meeting for Monday, November 17, after 3 PM?"

### 13. SCHEDULE REQUEST (Priority 7)
- **Keywords**: schedule, shift, timetable, guards, security, horaire
- **Example**: "Send current schedule of security guards with assigned times"

### 14. THINGS TO BE DONE IN THE COMING WEEKS (Priority 6)
- **Keywords**: upcoming, scheduled, planned, next week, coming weeks
- **Example**: "Things to be done: pool painting, window washing"

### 15. MENSUAL REPORT (Priority 5)
- **Keywords**: monthly, report, summary, update, mensual
- **Example**: "Monthly report for November 2025"

---

## How to Modify Templates

### File Location
`frontend/lib/email-template-classifier.ts`

### Template Structure
```typescript
{
  id: 'template-id',           // Unique identifier (lowercase, hyphens)
  name: 'TEMPLATE NAME',       // Display name (uppercase)
  description: 'Description',   // What this template is for
  keywords: ['word1', 'word2'], // Keywords that trigger classification
  patterns: [                  // Regex patterns for detection
    /\b(pattern1|pattern2)\b/gi
  ],
  priority: 8                   // 5-10, higher = more urgent
}
```

### Adding Keywords
Add to the `keywords` array:
```typescript
keywords: ['existing', 'new keyword', 'another keyword']
```

### Adding Patterns
Add regex patterns:
```typescript
patterns: [
  /\b(existing|pattern)\b/gi,
  /\b(new.*pattern)\b/gi
]
```

### Changing Priority
Modify the `priority` number (5-10):
- 10 = Critical/urgent
- 9 = High priority
- 8 = Important
- 7 = Standard
- 6 = Medium
- 5 = Low

---

## Testing Your Changes

1. Modify template in `frontend/lib/email-template-classifier.ts`
2. Restart dev server: `npm run dev`
3. Test at `http://localhost:3000/email-testing`
4. Use batch processing with sample emails
5. Review classifications and adjust as needed

---

## Current Status

✅ **15 Templates** configured
✅ **French & English** support
✅ **Entity extraction** (dates, amounts, locations, people, documents, phone numbers)
✅ **Auto-learning** from high-confidence classifications
✅ **Batch processing** for multiple emails

