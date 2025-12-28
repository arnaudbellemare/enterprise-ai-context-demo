/**
 * Test Outlook Connection for info@gestionvelora.com
 * This will verify your AI can connect and fetch emails
 */

const MICROSOFT_GRAPH_ACCESS_TOKEN = process.env.MICROSOFT_GRAPH_ACCESS_TOKEN;
const MICROSOFT_USER_EMAIL = process.env.MICROSOFT_USER_EMAIL;

async function testOutlookConnection() {
  console.log('🔌 Testing Outlook Connection for AI Email Processing...\n');
  console.log(`📧 Email: ${MICROSOFT_USER_EMAIL}`);
  console.log(`🔑 Token: ${MICROSOFT_GRAPH_ACCESS_TOKEN ? 'PRESENT' : 'MISSING'}\n`);

  if (!MICROSOFT_GRAPH_ACCESS_TOKEN) {
    console.error('❌ ERROR: MICROSOFT_GRAPH_ACCESS_TOKEN not found in .env.local');
    process.exit(1);
  }

  try {
    // Test 1: Verify token works
    console.log('📊 Test 1: Verifying Microsoft Graph API access...');
    const meResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${MICROSOFT_GRAPH_ACCESS_TOKEN}`
      }
    });

    if (!meResponse.ok) {
      const error = await meResponse.text();
      console.error('❌ Token validation failed:', error);
      console.log('\n💡 Your token might be expired. Reconnect via:');
      console.log('   http://localhost:3000/email-responder → "Connect Email Account"');
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
          'Authorization': `Bearer ${MICROSOFT_GRAPH_ACCESS_TOKEN}`
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

    console.log('🎉 SUCCESS! Your AI is connected to Outlook!');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to: http://localhost:3000/email-responder');
    console.log('2. Click "Fetch Emails"');
    console.log('3. AI will classify each email into templates');
    console.log('4. Review AI-generated responses');
    console.log('5. Send replies! 🚀');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testOutlookConnection();
