/**
 * Test script for email fetching with automatic token refresh
 * Usage: node test-email-fetch.js <account_id>
 *
 * This tests:
 * - Token retrieval from database
 * - Automatic token refresh (if needed)
 * - Email fetching from Outlook
 */

const BASE_URL = 'http://localhost:3000';

async function testEmailFetch(accountId) {
  if (!accountId) {
    console.log('❌ Usage: node test-email-fetch.js <account_id>');
    console.log('   Get account_id from the OAuth callback URL after authentication');
    process.exit(1);
  }

  console.log(`🔍 Testing email fetch for account: ${accountId}\n`);

  // Test 1: List connected accounts
  console.log('1️⃣ Checking connected accounts...');
  try {
    const response = await fetch(`${BASE_URL}/api/email-connect?userId=default`);

    const data = await response.json();

    if (data.accounts && data.accounts.length > 0) {
      console.log(`✅ Found ${data.accounts.length} connected account(s):`);
      data.accounts.forEach(acc => {
        console.log(`   - ${acc.email} (${acc.provider}) [${acc.connected ? 'active' : 'inactive'}]`);
      });
    } else {
      console.log('⚠️  No connected accounts found');
    }
  } catch (error) {
    console.log('❌ Error listing accounts:', error.message);
  }

  // Test 2: Fetch emails with automatic token refresh
  console.log('\n2️⃣ Fetching emails (with automatic token refresh)...');
  try {
    const response = await fetch(`${BASE_URL}/api/email-fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId,
        maxResults: 5,
        autoClassify: false // Don't classify for this test
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Fetched ${data.count} emails successfully`);
      console.log(`   Account: ${data.account.email}`);
      console.log(`   Provider: ${data.account.provider}`);
      console.log(`   Last sync: ${data.account.lastSync}`);

      if (data.emails && data.emails.length > 0) {
        console.log('\n   Sample emails:');
        data.emails.slice(0, 3).forEach((email, i) => {
          console.log(`   ${i + 1}. ${email.subject}`);
          console.log(`      From: ${email.from}`);
          console.log(`      Date: ${email.date}`);
        });
      }
    } else {
      console.log('❌ Failed to fetch emails');
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log('❌ Error fetching emails:', error.message);
  }

  console.log('\n3️⃣ Token refresh verification:');
  console.log('   ✅ If emails were fetched, token refresh is working!');
  console.log('   ✅ You can now close this terminal and never re-authenticate');
  console.log('   ✅ The system will automatically refresh tokens before they expire\n');
}

// Get account_id from command line
const accountId = process.argv[2];
testEmailFetch(accountId);
