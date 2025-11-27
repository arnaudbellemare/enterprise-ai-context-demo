# Email Auto-Response System Setup Guide

## Overview

The email auto-response system automatically:
1. Receives emails (via webhook or manual submission)
2. Classifies them using the 23 email templates
3. Generates context-aware responses based on classification
4. Sends automated replies (or flags for human review)

## API Endpoints

### 1. Classify and Generate Response
**POST** `/api/email/classify-and-respond`

Receives an email and returns classification + generated response.

**Request:**
```json
{
  "from": "tenant@example.com",
  "to": "info@gestionvelora.com",
  "subject": "Dégât d'eau - Unité 1507",
  "body": "Bonjour, je vous écris concernant...",
  "html": "<p>Bonjour...</p>",
  "attachments": []
}
```

**Response:**
```json
{
  "classification": {
    "template": {
      "id": "water-damage-incident",
      "name": "WATER DAMAGE INCIDENT",
      "priority": 10
    },
    "confidence": 0.89,
    "reasoning": "Matched keywords...",
    "extractedEntities": {
      "dates": ["il y a deux ans"],
      "locations": ["unité 1507"],
      "people": ["Arnaud"]
    }
  },
  "generatedResponse": {
    "subject": "Re: Dégât d'eau - Unité 1507 - Suivi du dossier",
    "body": "Bonjour,\n\nNous avons bien reçu...",
    "priority": 10,
    "requiresHumanReview": false
  },
  "metadata": {
    "processingTime": 245,
    "confidence": 0.89,
    "templateUsed": "WATER DAMAGE INCIDENT"
  }
}
```

### 2. Send Email
**POST** `/api/email/send`

Sends an email using SMTP.

**Request:**
```json
{
  "to": "tenant@example.com",
  "from": "info@gestionvelora.com",
  "subject": "Re: Dégât d'eau - Unité 1507",
  "body": "Bonjour...",
  "html": "<p>Bonjour...</p>",
  "replyTo": "info@gestionvelora.com"
}
```

### 3. Email Webhook
**POST** `/api/email/webhook`

Receives emails from email service providers (SendGrid, Mailgun, etc.) and auto-responds.

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd frontend
npm install nodemailer @types/nodemailer
```

### Step 2: Configure Environment Variables

Add to `.env.local`:

```bash
# SMTP Configuration (for sending emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Email Settings
EMAIL_FROM=info@gestionvelora.com
EMAIL_WEBHOOK_SECRET=your-secret-key-here

# Optional: Use email service providers instead
# RESEND_API_KEY=re_xxxxx
# SENDGRID_API_KEY=SG.xxxxx
# MAILGUN_API_KEY=xxxxx
```

### Step 3: Configure Email Service Provider

#### Option A: Gmail SMTP

1. Enable 2-factor authentication on Gmail
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASSWORD`

#### Option B: SendGrid

1. Sign up at https://sendgrid.com
2. Get API key from dashboard
3. Set `SENDGRID_API_KEY` in environment
4. Update `/api/email/send/route.ts` to use SendGrid SDK

#### Option C: Resend (Recommended)

1. Sign up at https://resend.com
2. Get API key
3. Set `RESEND_API_KEY` in environment
4. Update send route to use Resend SDK

### Step 4: Set Up Webhook (Optional)

#### For SendGrid:
1. Go to Settings > Mail Settings > Inbound Parse
2. Add webhook URL: `https://your-domain.com/api/email/webhook`
3. Set authentication header: `Bearer ${EMAIL_WEBHOOK_SECRET}`

#### For Mailgun:
1. Go to Receiving > Routes
2. Add route: `catch_all()` -> `https://your-domain.com/api/email/webhook`
3. Set webhook secret in route settings

### Step 5: Test the System

```bash
# Test classification and response generation
curl -X POST http://localhost:3000/api/email/classify-and-respond \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "info@gestionvelora.com",
    "subject": "Dégât d'eau - Unité 1507",
    "body": "Bonjour, je vous écris concernant un dégât d'eau dans mon unité."
  }'
```

## Response Templates

The system generates responses based on email classification:

- **WATER DAMAGE INCIDENT**: Acknowledges receipt, mentions photo review, insurance coordination
- **EVICTION REQUEST**: Flags for human review (always)
- **REGULATION VIOLATION**: Acknowledges complaint, mentions follow-up
- **RENOVATION REQUEST**: Confirms receipt, mentions approval process
- **MOVE-IN/MOVE-OUT**: Confirms dates and procedures
- **CUSTOMER REQUEST**: Generic acknowledgment
- **WORK BUILDING**: Mentions maintenance team review

## Human Review Flags

Responses are flagged for human review when:
- Confidence < 0.7 (for most templates)
- Confidence < 0.8 (for violations)
- Priority = 10 (critical issues)
- Contains financial amounts
- Eviction requests (always)

## Integration with Email Clients

### Manual Integration

You can integrate this with any email client by:
1. Forwarding emails to a special address
2. Using email forwarding rules to POST to `/api/email/webhook`
3. Using email automation tools (Zapier, Make.com, etc.)

### Example Zapier Integration

1. Trigger: New email in Gmail
2. Action: POST to `/api/email/classify-and-respond`
3. Action: Send email with generated response

## Monitoring

Check logs for:
- Classification accuracy
- Response generation time
- Human review rate
- Auto-response success rate

## Customization

To customize responses, edit the response generator functions in:
`frontend/app/api/email/classify-and-respond/route.ts`

Each template has its own generator function:
- `generateWaterDamageResponse()`
- `generateEvictionResponse()`
- `generateViolationResponse()`
- etc.

## Security

- Webhook authentication via `EMAIL_WEBHOOK_SECRET`
- Rate limiting (add middleware)
- Input validation
- SMTP credentials stored in environment variables

## Next Steps

1. Set up SMTP or email service provider
2. Configure webhook (if using email service)
3. Test with sample emails
4. Monitor and adjust response templates
5. Set up monitoring/alerts for human review queue

