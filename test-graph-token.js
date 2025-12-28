/**
 * Test Microsoft Graph API Token
 * Checks if the existing access token works
 */

require('dotenv').config({ path: './frontend/.env.local' });

const ACCESS_TOKEN = process.env.MICROSOFT_GRAPH_ACCESS_TOKEN;
const USER_EMAIL = process.env.MICROSOFT_USER_EMAIL;

console.log('🔑 Testing Microsoft Graph API Token...\n');
console.log(`📧 Email: ${USER_EMAIL}`);
console.log(`🎫 Token: ${ACCESS_TOKEN ? 'PRESENT' : 'MISSING'}\n`);

if (!ACCESS_TOKEN) {
  console.error('❌ ERROR: MICROSOFT_GRAPH_ACCESS_TOKEN not found in .env.local');
  process.exit(1);
}

async function testToken() {
  try {
    // Test 1: Verify token with /me endpoint
    console.log('📊 Test 1: Verifying token with /me endpoint...');
    const meResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });

    if (!meResponse.ok) {
      const error = await meResponse.text();
      console.error('❌ Token validation failed:', error);
      console.log('\n💡 Token might be expired. You need to reconnect via:');
      console.log('   http://localhost:3000/email-responder → "Connect Outlook"');
      process.exit(1);
    }

    const userData = await meResponse.json();
    console.log(`✅ Connected as: ${userData.displayName} (${userData.mail || userData.userPrincipalName})\n`);

    // Test 2: Fetch recent emails
    console.log('📨 Test 2: Fetching your recent emails...');
    const emailsResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me/messages?$top=5&$select=subject,from,receivedDateTime,bodyPreview',
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    if (!emailsResponse.ok) {
      const error = await emailsResponse.text();
      console.error('❌ Failed to fetch emails:', error);
      process.exit(1);
    }

    const emailsData = await emailsResponse.json();
    const emails = emailsData.value || [];

    console.log(`✅ Found ${emails.length} recent emails:\n`);

    emails.forEach((email, i) => {
      console.log(`${i + 1}. 📧 "${email.subject}"`);
      console.log(`   From: ${email.from?.emailAddress?.address || 'Unknown'}`);
      console.log(`   Date: ${new Date(email.receivedDateTime).toLocaleString()}`);
      console.log(`   Preview: ${email.bodyPreview?.substring(0, 100)}...`);
      console.log('');
    });

    console.log('🎉 SUCCESS! Your token is working!');
    console.log('\n📋 You can now fetch emails via:');
    console.log('   - API: POST /api/email-imap/fetch');
    console.log('   - UI: http://localhost:3000/email-responder');
    console.log('\n✅ AI can now read and respond to your Outlook emails!');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testToken();
