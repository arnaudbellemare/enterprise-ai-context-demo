# Email Workflow Quick Start

## 5-Minute Setup

### Step 1: Start the Server

```bash
cd frontend
npm run dev
```

Visit: `http://localhost:3000`

### Step 2: Label Your First Emails

1. Go to: `http://localhost:3000/email-testing`
2. Paste a real email from your inbox
3. Select classification method: **Hybrid** (recommended)
4. Click "Classify Email"
5. Review the result
6. If correct, click "Save as Labeled Example"
7. Repeat with 10-20 emails

**Why this matters:** These labeled examples train the system to understand your specific email style and property management context.

### Step 3: Test Response Generation

1. Go to: `http://localhost:3000/email-workflow`
2. Paste an incoming email
3. Click "Analyze & Generate Response"
4. Review:
   - Classification (should match your template)
   - Extracted entities (unit numbers, amounts, dates)
   - Generated response
5. Copy or edit the response as needed

## What You Get

### Automatic Classification

The system automatically identifies:
- **Email type**: Legal document request, safety complaint, maintenance, etc.
- **Confidence**: How sure it is (0-100%)
- **Urgency**: Critical, High, Medium, Low

### Context Understanding

Extracts automatically:
- Unit numbers (e.g., "unit 701")
- Amounts (e.g., "$225")
- Dates (e.g., "November 26, 2025")
- People names
- Documents (e.g., "Law 16 certificate")
- Phone numbers

### Response Generation

Creates professional responses that:
- Address all questions in the original email
- Include specific details (unit numbers, amounts, dates)
- Use appropriate tone (professional, helpful)
- Match the language (French/English)
- Suggest next actions

## Real Example

**Input Email:**
```
Hi,
I need Law 16 certificate for unit 701. The fee is $225.
Thanks,
Kai Liu
```

**System Analysis:**
- **Template**: LEGAL DOCUMENT REQUEST
- **Confidence**: 92%
- **Urgency**: High
- **Extracted**: Unit 701, Amount $225, Name Kai Liu

**Generated Response:**
```
Bonjour Kai Liu,

Nous confirmons votre demande de certificat (Loi 16) pour l'unité 701.

Conformément à la Déclaration de copropriété, section 10.3.7.32, nous sommes tenus de fournir ce document dans les 15 jours suivant votre demande.

Frais administratifs applicables :
- Montant : $225 par événement (section 14.6.5.3)

Nous préparerons et enverrons le certificat dès que possible. La facture des frais administratifs vous sera envoyée pour paiement.

Merci.

Cordialement,
Gestion Velora
```

## Next Steps

1. **Label more emails** (20-30 total) for better accuracy
2. **Customize response templates** in `frontend/lib/email-response-generator.ts`
3. **Connect your email** (Gmail/Outlook) for automatic processing
4. **Set up automation** to auto-respond to low-priority emails

## Common Questions

**Q: How many emails do I need to label?**
A: Start with 20-30. More = better accuracy, but 20 is enough to get started.

**Q: What if classification is wrong?**
A: Label it correctly - the system learns from corrections. Also check if you need to add keywords/patterns to the template.

**Q: Can I customize responses?**
A: Yes! Edit `frontend/lib/email-response-generator.ts` to customize response templates.

**Q: Does it work in French?**
A: Yes! The system detects language and responds in the same language as the original email.

**Q: Can I connect my Gmail?**
A: Yes! See `EMAIL_CONNECTION_SETUP.md` for Gmail OAuth setup.

## Need Help?

- **Full Guide**: `EMAIL_WORKFLOW_BUILDING_GUIDE.md`
- **Template Reference**: `EMAIL_TEMPLATES_REFERENCE.md`
- **Testing Guide**: `EMAIL_WORKFLOW_TESTING_GUIDE.md`

