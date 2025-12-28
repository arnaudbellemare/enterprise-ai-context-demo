# GET YOUR EMAILS WORKING NOW

Since OAuth is being difficult, here's the **fastest way** to get your AI reading emails:

## Option 1: Microsoft Graph Explorer (RECOMMENDED - 2 minutes)

### Step 1: Get a Fresh Access Token
1. Go to: **https://developer.microsoft.com/en-us/graph/graph-explorer**
2. Click "Sign in" → Use `info@gestionvelora.com`
3. Click "Access token" button (top right)
4. Copy the entire token (it's long!)

### Step 2: Test It Works
Open a new terminal and run:

```bash
curl -X POST http://localhost:3000/api/email-graph-direct \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "PASTE_YOUR_TOKEN_HERE",
    "maxResults": 10
  }'
```

You should see your emails in JSON format!

### Step 3: Save Token to .env.local
Update `frontend/.env.local` line 43:

```bash
MICROSOFT_GRAPH_ACCESS_TOKEN=PASTE_YOUR_NEW_TOKEN_HERE
```

### Step 4: Use It
Now you can fetch emails via:
- **API**: `POST /api/email-graph-direct` with your token
- **UI**: Go to http://localhost:3000/email-responder

---

## Option 2: Fix OAuth (If You Want to Debug)

The OAuth is failing because Microsoft is rejecting the client secret. Possible fixes:

### Fix 1: Check Azure App Registration
1. Go to Azure Portal → App registrations
2. Find "Email Automation" app
3. Go to "Certificates & secrets"
4. Delete the old secret
5. Create a NEW secret (copy the VALUE, not the Secret ID!)
6. Update `MICROSOFT_CLIENT_SECRET` in `.env.local`

### Fix 2: Verify Redirect URI
Make sure in Azure Portal:
- Redirect URI is EXACTLY: `http://localhost:3000/api/email-oauth/outlook/callback`
- Platform is "Web" (not SPA or Mobile)

### Fix 3: Check Permissions
In Azure Portal → API permissions, make sure you have:
- ✅ Mail.Read
- ✅ Mail.Send
- ✅ User.Read
- ✅ offline_access

Click "Grant admin consent" if needed.

---

## What's Working Now

✅ **Dev server running** on http://localhost:3000
✅ **Direct Graph API endpoint** at `/api/email-graph-direct`
✅ **Email responder UI** ready at `/email-responder`
✅ **AI classification** system ready to process emails

## What You Can Do

Once you have a working token:

1. **Fetch emails**: AI pulls latest emails from Outlook
2. **Auto-classify**: AI categorizes emails into templates
3. **Generate responses**: AI creates draft responses
4. **Review & send**: You approve before sending

---

## Quick Test

1. Get token from Graph Explorer
2. Run:
   ```bash
   curl -X POST http://localhost:3000/api/email-graph-direct \
     -H "Content-Type: application/json" \
     -d '{"accessToken": "YOUR_TOKEN", "maxResults": 5}'
   ```
3. See your emails fetched and ready for AI processing!

**Token expires in 1 hour**, but you can get a fresh one anytime from Graph Explorer.
