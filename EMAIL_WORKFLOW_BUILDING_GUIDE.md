# Email Workflow Building Guide

## Overview

This guide explains how to build a complete email workflow system that:
1. **Receives** emails (from email providers or manual input)
2. **Classifies** them into predefined templates
3. **Understands** context (entities, urgency, priority)
4. **Generates** appropriate responses automatically
5. **Learns** from labeled examples to improve accuracy

## System Architecture

```
Email Input → Classification → Context Analysis → Response Generation → Output
     ↓              ↓                ↓                    ↓
  Email      Template Match    Entity Extraction    Template Fill
  Connector  + LLM Enhancement  + Urgency Detection  + LLM Enhancement
```

## Step-by-Step Building Process

### Step 1: Define Your Email Templates

**Location:** `frontend/lib/email-template-classifier.ts`

**What to do:**
1. Identify common email types in your property management workflow
2. Define templates with:
   - `id`: Unique identifier
   - `name`: Display name
   - `description`: What this template covers
   - `keywords`: Words that indicate this template
   - `patterns`: Regex patterns for matching
   - `priority`: Importance level (1-10)

**Example:**
```typescript
{
  id: 'legal-document-request',
  name: 'LEGAL DOCUMENT REQUEST',
  description: 'Requests for legal documents like Law 16 certificates',
  keywords: ['law 16', 'certificate', 'attestation', 'legal document'],
  patterns: [
    /\b(law\s*16|loi\s*16)\b/gi,
    /\b(certificate|certificat|attestation)\b/gi
  ],
  priority: 9
}
```

### Step 2: Build Response Templates

**Location:** `frontend/lib/email-response-generator.ts`

**What to do:**
1. Create response templates for each email type
2. Use placeholders like `{name}`, `{unit}`, `{amount}` for dynamic content
3. Define required and optional fields

**Example:**
```typescript
'legal-document-request': {
  greeting: 'Bonjour {name},\n\n',
  body: `Nous confirmons votre demande de certificat (Loi 16) pour l'unité {unit}.\n\n
Frais administratifs : {amount}\n\n
{additionalInfo}`,
  closing: '\n\nCordialement,\nGestion Velora',
  requiredFields: ['unit', 'name', 'amount'],
  optionalFields: ['additionalInfo']
}
```

### Step 3: Label Training Examples

**Location:** `http://localhost:3000/email-testing`

**What to do:**
1. Go to the email testing page
2. Paste real emails you receive
3. Classify them manually
4. Save as labeled examples (these train the LLM)

**Why this matters:**
- Few-shot learning: The system uses your labeled examples to understand your specific context
- Better accuracy: More examples = better classification
- Domain adaptation: Adapts to your property management style

### Step 4: Test Classification

**Location:** `http://localhost:3000/email-testing`

**What to do:**
1. Paste an email
2. Select classification method:
   - **Rule-based**: Fast, keyword matching
   - **LLM**: More accurate, understands context
   - **Hybrid**: Combines both (recommended)
3. Review the classification result
4. If incorrect, label it correctly to improve the system

### Step 5: Generate Responses

**Location:** `http://localhost:3000/email-workflow`

**What to do:**
1. Paste an incoming email
2. Click "Analyze & Generate Response"
3. Review:
   - Classification result
   - Extracted entities (dates, amounts, units, etc.)
   - Urgency level
   - Generated response
4. Edit if needed, then copy or send

## How the System Understands Context

### 1. Entity Extraction

The system automatically extracts:
- **Dates**: Move-in dates, meeting dates, deadlines
- **Amounts**: Fees, costs, payments
- **Locations**: Unit numbers, addresses, building areas
- **People**: Names, tenants, contractors
- **Documents**: Certificates, contracts, reports
- **Phone Numbers**: Contact information

**Example:**
```
Email: "I need Law 16 certificate for unit 701, fee is $225"
Extracted:
- Unit: 701
- Document: Law 16 certificate
- Amount: $225
```

### 2. Urgency Detection

The system determines urgency based on:
- Keywords: "urgent", "asap", "emergency", "safety"
- Template priority: High-priority templates = higher urgency
- Context: Safety complaints = critical urgency

**Urgency Levels:**
- **Critical**: Safety issues, emergencies
- **High**: Legal documents, urgent requests
- **Medium**: General requests, maintenance
- **Low**: Informational, reports

### 3. Context-Aware Responses

The system uses:
- **Template matching**: Finds the right response template
- **Entity filling**: Fills in `{name}`, `{unit}`, `{amount}` from extracted entities
- **LLM enhancement**: Adds specific details based on email content
- **Language detection**: Responds in French or English based on original email

## Building Your Labeling System

### Phase 1: Initial Setup (Week 1)

1. **Collect 20-30 real emails** from your inbox
2. **Manually classify** each one into templates
3. **Save as labeled examples** in the system
4. **Test classification** accuracy

### Phase 2: Refinement (Week 2-3)

1. **Identify misclassifications**:
   - Emails that don't fit existing templates → Create new templates
   - Emails classified incorrectly → Improve keywords/patterns
   - Low confidence classifications → Add more examples

2. **Improve templates**:
   - Add missing keywords
   - Refine regex patterns
   - Adjust priorities

3. **Build response templates**:
   - Create templates for each email type
   - Test response quality
   - Refine based on feedback

### Phase 3: Continuous Learning (Ongoing)

1. **Auto-learning**: Enable "Auto-learn" in batch processing
   - High-confidence classifications automatically become training examples
   - System improves over time

2. **Manual review**: Periodically review and correct classifications
   - Fix misclassifications
   - Add new examples for edge cases

3. **Template updates**: As your business evolves:
   - Add new templates for new email types
   - Update response templates
   - Adjust priorities

## Best Practices

### 1. Template Design

- **Be specific**: Each template should cover a distinct use case
- **Use keywords**: Include common terms tenants/contractors use
- **Set priorities**: Critical templates (safety, legal) should have priority 9-10
- **Test patterns**: Regex patterns should match real email content

### 2. Response Templates

- **Be professional**: Use formal, courteous language
- **Be specific**: Include relevant details from the email
- **Provide next steps**: Tell the recipient what happens next
- **Match language**: Respond in the same language as the original email

### 3. Labeling Strategy

- **Start with common cases**: Label the 20% of emails that represent 80% of volume
- **Label consistently**: Use the same template for similar emails
- **Review edge cases**: Pay attention to low-confidence classifications
- **Update regularly**: Add new examples as you encounter new email types

### 4. Quality Control

- **Human review**: Always review high-priority or low-confidence responses
- **Test before production**: Test with real emails before automating responses
- **Monitor accuracy**: Track classification confidence over time
- **Iterate**: Continuously improve based on real-world performance

## API Usage

### Analyze Email and Generate Response

```typescript
POST /api/email-respond
{
  "email": {
    "from": "tenant@example.com",
    "subject": "Law 16 certificate request",
    "body": "I need Law 16 certificate for unit 701..."
  },
  "useLLM": true,
  "generateResponse": true
}

Response:
{
  "success": true,
  "analysis": {
    "classification": {
      "template": {
        "id": "legal-document-request",
        "name": "LEGAL DOCUMENT REQUEST",
        "priority": 9
      },
      "confidence": 0.92,
      "entities": {
        "unit": ["701"],
        "amounts": ["$225"],
        "documents": ["Law 16 certificate"]
      }
    },
    "context": {
      "urgency": "high",
      "requiresResponseAction": true
    }
  },
  "response": {
    "subject": "Re: Certificat Loi 16 - Law 16 certificate request",
    "body": "Bonjour,\n\nNous confirmons votre demande...",
    "suggestedActions": [
      "Prepare certificate",
      "Calculate fees",
      "Send invoice"
    ],
    "requiresHumanReview": false
  }
}
```

## Integration with Email Providers

### Gmail Integration

1. **Setup OAuth**: Follow `EMAIL_CONNECTION_SETUP.md`
2. **Fetch emails**: Use `/api/email-fetch` endpoint
3. **Auto-classify**: Enable auto-classification when fetching
4. **Generate responses**: Use `/api/email-respond` for each email
5. **Send responses**: Use Gmail API to send generated responses

### Outlook Integration

Similar process to Gmail, using Microsoft Graph API.

### IMAP Integration

For generic email providers, use IMAP connector.

## Workflow Automation

### Option 1: Manual Review Workflow

1. Fetch emails → Classify → Generate responses
2. Human reviews all responses
3. Human sends approved responses

### Option 2: Auto-Response Workflow

1. Fetch emails → Classify → Generate responses
2. Auto-send high-confidence, low-priority responses
3. Flag high-priority or low-confidence for review

### Option 3: Hybrid Workflow

1. Fetch emails → Classify → Generate responses
2. Auto-send responses for:
   - Low-priority templates (reports, confirmations)
   - High-confidence classifications (>0.9)
   - Non-critical urgency
3. Queue for review:
   - High-priority templates (safety, legal)
   - Low-confidence classifications (<0.7)
   - Critical urgency

## Troubleshooting

### Low Classification Confidence

**Problem**: System returns low confidence (<0.5)

**Solutions**:
1. Add more labeled examples for this email type
2. Improve keywords/patterns in template
3. Check if email fits existing template or needs new one

### Incorrect Classification

**Problem**: Email classified into wrong template

**Solutions**:
1. Label the email correctly (adds to training data)
2. Review keywords - may need to add/remove keywords
3. Check regex patterns - may need refinement
4. Consider if email needs new template

### Poor Response Quality

**Problem**: Generated response doesn't make sense or is incomplete

**Solutions**:
1. Improve response template with better placeholders
2. Add more entity extraction patterns
3. Enable LLM enhancement for better context understanding
4. Review and refine response templates

### Missing Entities

**Problem**: System doesn't extract unit numbers, amounts, etc.

**Solutions**:
1. Improve entity extraction patterns in `extractPropertyManagementEntities`
2. Add regex patterns for your specific formats
3. Use LLM for better entity extraction

## Next Steps

1. **Start labeling**: Go to `/email-testing` and label 20-30 emails
2. **Test classification**: Verify accuracy with your real emails
3. **Build responses**: Create response templates for your most common emails
4. **Test workflow**: Use `/email-workflow` to test end-to-end
5. **Iterate**: Continuously improve based on real-world usage

## Resources

- **Email Templates Reference**: `EMAIL_TEMPLATES_REFERENCE.md`
- **Quick Reference**: `EMAIL_TEMPLATES_QUICK_REFERENCE.md`
- **Testing Guide**: `EMAIL_WORKFLOW_TESTING_GUIDE.md`
- **Connection Setup**: `EMAIL_CONNECTION_SETUP.md`




