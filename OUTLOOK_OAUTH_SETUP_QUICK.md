# Quick Outlook OAuth Setup for info@gestionvelora.com

## Step 1: Azure App Registration (5 minutes)

1. Go to: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
2. Click **"New registration"**
3. Fill in:
   - **Name**: `Email Responder - Velora`
   - **Supported account types**: `Accounts in any organizational directory (Any Azure AD directory - Multitenant)`
   - **Redirect URI**:
     - Type: `Web`
     - URI: `http://localhost:3000/api/email-oauth/outlook/callback`
4. Click **"Register"**

## Step 2: Get Your Credentials

### Application (client) ID:
- Copy this from the "Essentials" section on the Overview page
- It looks like: `a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6`

### Client Secret:
1. Go to **"Certificates & secrets"** (left menu)
2. Click **"New client secret"**
3. Add description: `Email Responder Secret`
4. Expiration: `24 months`
5. Click **"Add"**
6. **COPY THE VALUE IMMEDIATELY** (you won't see it again!)

## Step 3: API Permissions

1. Go to **"API permissions"** (left menu)
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Search and add these permissions:
   - ✅ `Mail.Read`
   - ✅ `Mail.ReadWrite`
   - ✅ `Mail.Send` (if you want to auto-reply)
   - ✅ `offline_access`
6. Click **"Add permissions"**
7. Click **"Grant admin consent for..."** (if you're admin)

## Step 4: Add to .env.local

Add these lines to `frontend/.env.local`:

```bash
# Microsoft Outlook OAuth
OUTLOOK_CLIENT_ID=your-application-id-from-step2
OUTLOOK_CLIENT_SECRET=your-client-secret-from-step2
OUTLOOK_REDIRECT_URI=http://localhost:3000/api/email-oauth/outlook/callback
OUTLOOK_TENANT_ID=common
```

**Replace:**
- `your-application-id-from-step2` with the Application (client) ID
- `your-client-secret-from-step2` with the Client Secret value

## Step 5: Test Connection

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Go to: http://localhost:3000/email-responder

3. Click **"Connect Email Account"**

4. Click **"Outlook"**

5. Sign in with **info@gestionvelora.com**

6. Grant permissions when prompted

7. You'll be redirected back → Connected! ✅

## Troubleshooting

### Error: "AADSTS50011: The reply URL specified does not match"
- Solution: Make sure redirect URI in Azure exactly matches: `http://localhost:3000/api/email-oauth/outlook/callback`

### Error: "AADSTS65001: User consent required"
- Solution: Go back to API permissions and click "Grant admin consent"

### Error: "Invalid client secret"
- Solution: Create a new client secret in Azure (old one might be expired)

## Production Setup

For production (replace localhost with your domain):

1. Add production redirect URI in Azure:
   ```
   https://yourdomain.com/api/email-oauth/outlook/callback
   ```

2. Update .env (production):
   ```bash
   OUTLOOK_REDIRECT_URI=https://yourdomain.com/api/email-oauth/outlook/callback
   ```
