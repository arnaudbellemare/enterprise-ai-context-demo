# Email Workflow Testing & Labeling Guide

## Overview

This guide explains how to test and label emails for the property management email classification system.

## Quick Start

### 1. Access the Testing Interface

Navigate to: `http://localhost:3000/email-testing`

### 2. Test Email Classification

1. **Enter Email Text**: Paste an email into the text area
2. **Select Method**:
   - **Rule-Based**: Fast, keyword-based classification
   - **LLM**: More accurate, uses AI models
   - **Hybrid** (Recommended): Combines both for best results
3. **Click "Classify Email"**: See the classification results

### 3. Label Emails for Training

1. **Enter Email Text**: Paste the email you want to label
2. **Click "Show Labeling"**: Opens the labeling panel
3. **Select Correct Template**: Choose from the dropdown
4. **Click "Label Email"**: Saves the labeled example

## API Endpoints

### Classify Email

```bash
POST /api/email-classify
Content-Type: application/json

{
  "email": "Email text here...",
  "method": "hybrid",  // "rule-based" | "llm" | "hybrid"
  "useFewShot": true
}
```

**Response:**
```json
{
  "success": true,
  "classification": {
    "template": {
      "id": "customer-request",
      "name": "CUSTOMER REQUEST",
      "description": "Customer inquiries...",
      "priority": 7
    },
    "confidence": 0.85,
    "reasoning": "Matched 3 keywords and 2 patterns...",
    "entities": {
      "dates": ["2024-03-15"],
      "amounts": ["$1,200"],
      "locations": ["Apartment 3B"],
      "people": ["John Smith"],
      "documents": []
    }
  }
}
```

### Label Email

```bash
POST /api/email-label
Content-Type: application/json

{
  "email": "Email text here...",
  "templateId": "customer-request",
  "confidence": 1.0,
  "action": "add"  // "add" | "update" | "delete"
}
```

### Get Labeled Examples

```bash
GET /api/email-label?userId=user123&templateId=customer-request&limit=50
```

### Export Examples

```bash
PUT /api/email-label
Content-Type: application/json

{
  "action": "export",
  "userId": "user123"  // optional
}
```

## Available Templates

1. **NOTARY DOCUMENT ANSWER**
   - Keywords: notary, notarized, document, legal, signature
   - Priority: 8 (High)

2. **CUSTOMER REQUEST**
   - Keywords: request, inquiry, question, complaint, customer
   - Priority: 7 (High)

3. **WORK NEEDING TO BE DONE IN THE BUILDING**
   - Keywords: repair, maintenance, fix, broken, leak
   - Priority: 9 (Very High - Urgent)

4. **THINGS TO BE DONE IN THE COMING WEEKS**
   - Keywords: upcoming, scheduled, planned, next week
   - Priority: 6 (Medium)

5. **MENSUAL REPORT**
   - Keywords: monthly, report, summary, update
   - Priority: 5 (Medium)

6. **FINANCIAL REPORT**
   - Keywords: financial, invoice, payment, budget, expense
   - Priority: 8 (High)

## Testing Workflow

### Step 1: Initial Testing (Rule-Based)

1. Start with **Rule-Based** method
2. Test with sample emails provided in the interface
3. Check if basic keyword matching works
4. Note any misclassifications

### Step 2: Label Misclassifications

1. For each misclassified email:
   - Enter the email text
   - Select the correct template
   - Click "Label Email"
2. This creates few-shot examples for LLM learning

### Step 3: Test with LLM Method

1. Switch to **LLM** or **Hybrid** method
2. Test the same emails again
3. The system should now use your labeled examples
4. Accuracy should improve

### Step 4: Iterate

1. Continue labeling misclassified emails
2. Test with new emails
3. Export examples periodically for backup
4. Monitor confidence scores

## Best Practices

### Labeling Guidelines

1. **Be Consistent**: Use the same template for similar emails
2. **Label Edge Cases**: Focus on emails that are hard to classify
3. **Quality over Quantity**: 20-30 well-labeled examples per template is better than 100 inconsistent ones
4. **Review Regularly**: Periodically review labeled examples for accuracy

### Testing Tips

1. **Start with Samples**: Use the provided sample emails first
2. **Test Real Emails**: Use actual property management emails when available
3. **Check Confidence**: Low confidence (<0.5) indicates the system is unsure
4. **Verify Entities**: Check that dates, amounts, locations are extracted correctly

### Performance Optimization

1. **Rule-Based First**: Use rule-based for simple, clear emails (fast)
2. **LLM for Complex**: Use LLM for ambiguous or complex emails
3. **Hybrid Recommended**: Combines speed and accuracy
4. **Few-Shot Learning**: More labeled examples = better accuracy

## Example Testing Session

```bash
# 1. Test classification
curl -X POST http://localhost:3000/api/email-classify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "The faucet in apartment 3B is leaking. Please send a plumber.",
    "method": "hybrid"
  }'

# 2. Label the email (if correct)
curl -X POST http://localhost:3000/api/email-label \
  -H "Content-Type: application/json" \
  -d '{
    "email": "The faucet in apartment 3B is leaking. Please send a plumber.",
    "templateId": "work-building",
    "confidence": 1.0,
    "action": "add"
  }'

# 3. Check labeled examples
curl http://localhost:3000/api/email-label?limit=10

# 4. Export for backup
curl -X PUT http://localhost:3000/api/email-label \
  -H "Content-Type: application/json" \
  -d '{"action": "export"}'
```

## Troubleshooting

### Low Confidence Scores

- **Cause**: Email doesn't match any template well
- **Solution**: Label more examples for that template type

### Wrong Classification

- **Cause**: Keywords overlap between templates
- **Solution**: Label the correct template, system will learn from context

### No Entities Extracted

- **Cause**: Email format doesn't match patterns
- **Solution**: Check email format, may need to add new regex patterns

### LLM Method Slow

- **Cause**: LLM inference takes time
- **Solution**: Use Hybrid method (rule-based first, LLM only if needed)

## Next Steps

1. **Collect Real Emails**: Gather actual property management emails
2. **Label Systematically**: Create 20-30 examples per template
3. **Test Regularly**: Run classification tests weekly
4. **Monitor Accuracy**: Track confidence scores over time
5. **Refine Templates**: Add keywords/patterns based on real usage

## Integration

Once testing is complete, integrate into your email workflow:

```typescript
import { classifyEmailHybrid } from '@/lib/email-template-classifier';

// In your email processing pipeline
const classification = await classifyEmailHybrid(emailText, fewShotExamples);

// Route based on template
switch (classification.template.id) {
  case 'work-building':
    // Route to maintenance team
    break;
  case 'customer-request':
    // Route to customer service
    break;
  // ... etc
}
```




