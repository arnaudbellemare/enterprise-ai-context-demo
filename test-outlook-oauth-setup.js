/**
 * Test script for Outlook OAuth setup
 * Run this after:
 * 1. Running the database migration
 * 2. Setting up .env.local
 * 3. Starting the dev server
 */

const BASE_URL = 'http://localhost:3000';

async function testSetup() {
  console.log('🔍 Testing Outlook OAuth Setup...\n');

  // Test 1: Check if OAuth endpoint returns auth URL
  console.log('1️⃣ Testing OAuth URL generation...');
  try {
    const response = await fetch(`${BASE_URL}/api/email-oauth/outlook?action=auth`);
    const data = await response.json();

    if (data.authUrl) {
      console.log('✅ OAuth URL generated successfully');
      console.log(`   URL: ${data.authUrl.substring(0, 80)}...`);
    } else {
      console.log('❌ Failed to generate OAuth URL');
      console.log('   Response:', data);
    }
  } catch (error) {
    console.log('❌ Error calling OAuth endpoint:', error.message);
  }

  console.log('\n2️⃣ Next steps:');
  console.log('   - Open the auth URL in your browser');
  console.log('   - Complete Microsoft login and approve permissions');
  console.log('   - You\'ll be redirected back with account_id in the URL');
  console.log('   - Copy that account_id for the next test\n');

  console.log('3️⃣ After OAuth completion, test email fetch:');
  console.log('   node test-email-fetch.js <account_id>\n');
}

testSetup();
