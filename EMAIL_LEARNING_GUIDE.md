# Email Learning Guide - How to Add Emails for Training

## Three Ways to Add Emails for Learning

### 1. **Automatic Learning (Recommended)**
**Just send emails through the classification API - the system learns automatically!**

When you classify an email through `/api/email/classify-and-respond`, the system automatically:

- **High confidence (>0.9)**: Auto-labeled and stored as training example
- **Medium confidence (0.5-0.9)**: Added to active learning queue for review
- **Low confidence (<0.5)**: Priority queue for human review

**API Endpoint:**
```bash
POST /api/email/classify-and-respond
Content-Type: application/json

{
  "from": "tenant@example.com",
  "to": "management@example.com",
  "subject": "Water leak in unit 2305",
  "body": "There's a water leak coming from the ceiling..."
}
```

**What happens:**
- Email is classified
- If confidence > 0.9 → automatically stored as labeled example
- If confidence 0.5-0.9 → added to active learning queue
- If confidence < 0.5 → added to priority queue

**No manual work needed!** The system learns from every email you classify.

---

### 2. **Manual Labeling (For Specific Examples)**
**Add labeled examples directly to the training set**

**API Endpoint:**
```bash
POST /api/email-label
Content-Type: application/json

{
  "email": "Water damage in unit 2305, need emergency help!",
  "templateId": "water-damage-incident",
  "confidence": 1.0,
  "userId": "user@example.com",
  "action": "add"
}
```

**Available Templates:**
- `water-damage-incident`
- `eviction-request`
- `regulation-violation`
- `renovation-request`
- `move-in-out-request`
- `customer-request`
- `work-building`
- `access-control-request`
- `vendor-payment-request`
- `financial-report`
- `legal-document-request`
- `notary-document`
- `late-payment-followup`
- `supplier-work-followup`
- `weekly-board-update`
- `mensual-report`

**Example:**
```bash
curl -X POST http://localhost:3000/api/email-label \
  -H "Content-Type: application/json" \
  -d '{
    "email": "There is a water leak in unit 2305. Please send someone immediately.",
    "templateId": "water-damage-incident",
    "confidence": 1.0,
    "userId": "admin@example.com"
  }'
```

---

### 3. **Active Learning Queue (Review Uncertain Emails)**
**Review emails the system is uncertain about**

**Step 1: Get candidates for review**
```bash
GET /api/email-label/active-learning?limit=10
```

**Response:**
```json
{
  "success": true,
  "candidates": [
    {
      "id": "uuid",
      "email_text": "Water damage in unit...",
      "predicted_template_name": "WATER DAMAGE INCIDENT",
      "confidence": 0.62,
      "uncertainty": 0.38,
      "diversity": 0.7,
      "priority": 0.508
    }
  ]
}
```

**Step 2: Label a candidate**
```bash
POST /api/email-label/active-learning
Content-Type: application/json

{
  "candidateId": "uuid",
  "labeledTemplateId": "water-damage-incident",
  "labeledTemplateName": "WATER DAMAGE INCIDENT",
  "labeledBy": "user@example.com",
  "emailText": "Water damage in unit 2305...",
  "confidence": 1.0
}
```

**Bulk labeling:**
```bash
PUT /api/email-label/active-learning
Content-Type: application/json

{
  "labeledBy": "user@example.com",
  "labels": [
    {
      "candidateId": "uuid1",
      "labeledTemplateId": "water-damage-incident",
      "labeledTemplateName": "WATER DAMAGE INCIDENT",
      "emailText": "..."
    },
    {
      "candidateId": "uuid2",
      "labeledTemplateId": "renovation-request",
      "labeledTemplateName": "RENOVATION REQUEST",
      "emailText": "..."
    }
  ]
}
```

---

## Workflow Recommendations

### For Production Use (Automatic Learning)
1. **Just use the system normally** - send emails to `/api/email/classify-and-respond`
2. **High-confidence emails** (>0.9) are automatically learned
3. **Review the active learning queue weekly** - label uncertain emails
4. **System improves automatically** over time

### For Initial Training (Manual Labeling)
1. **Collect 50-100 example emails** per template
2. **Label them manually** using `/api/email-label`
3. **System will use these** for few-shot learning
4. **Then switch to automatic learning** for ongoing improvement

### For Active Learning (Review Queue)
1. **Check queue daily**: `GET /api/email-label/active-learning?limit=20`
2. **Label top 10-20 candidates** (highest priority)
3. **System recalibrates** confidence scores automatically
4. **Accuracy improves** with each labeled example

---

## Monitoring Learning Progress

### Check Accuracy
```bash
GET /api/email-label/metrics?type=accuracy&daysBack=30
```

### Check Calibration
```bash
GET /api/email-label/metrics?type=calibration&templateId=water-damage-incident
```

### Check Queue Status
```bash
GET /api/email-label/active-learning?limit=100
```

---

## Quick Start Example

**1. Add a few labeled examples:**
```bash
curl -X POST http://localhost:3000/api/email-label \
  -H "Content-Type: application/json" \
  -d '{
    "email": "Water leak in unit 2305, ceiling is damaged",
    "templateId": "water-damage-incident",
    "confidence": 1.0
  }'
```

**2. Classify emails normally:**
```bash
curl -X POST http://localhost:3000/api/email/classify-and-respond \
  -H "Content-Type: application/json" \
  -d '{
    "from": "tenant@example.com",
    "subject": "Water damage",
    "body": "There is water coming from the ceiling..."
  }'
```

**3. Review uncertain emails:**
```bash
curl http://localhost:3000/api/email-label/active-learning?limit=10
```

**4. Label uncertain emails:**
```bash
curl -X POST http://localhost:3000/api/email-label/active-learning \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "uuid-from-queue",
    "labeledTemplateId": "water-damage-incident",
    "labeledTemplateName": "WATER DAMAGE INCIDENT",
    "labeledBy": "admin@example.com",
    "emailText": "Water damage..."
  }'
```

---

## Best Practices

1. **Start with 20-30 labeled examples per template** for initial training
2. **Use automatic learning** for production emails
3. **Review active learning queue weekly** - label top 20-30 candidates
4. **Monitor accuracy metrics** monthly to track improvement
5. **Add edge cases manually** if you notice consistent errors

---

## Expected Learning Curve

- **Week 1**: 70-80% accuracy (with initial labeled examples)
- **Week 2**: 85-90% accuracy (after auto-labeling high-confidence emails)
- **Week 3**: 90-92% accuracy (after reviewing active learning queue)
- **Week 4+**: 92-94% accuracy (with confidence calibration)

The system improves automatically as you use it!

