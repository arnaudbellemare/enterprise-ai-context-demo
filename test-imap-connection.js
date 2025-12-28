/**
 * Test IMAP Connection to info@gestionvelora.com
 * Verifies IMAP credentials and fetches recent emails
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');

// Load environment variables
require('dotenv').config({ path: './frontend/.env.local' });

const IMAP_USER = process.env.IMAP_USER;
const IMAP_PASSWORD = process.env.IMAP_PASSWORD;
const IMAP_HOST = process.env.IMAP_HOST || 'outlook.office365.com';
const IMAP_PORT = parseInt(process.env.IMAP_PORT || '993');
const IMAP_TLS = process.env.IMAP_TLS === 'true';

console.log('🔌 Testing IMAP Connection...\n');
console.log(`📧 Email: ${IMAP_USER}`);
console.log(`🏠 Host: ${IMAP_HOST}:${IMAP_PORT}`);
console.log(`🔒 TLS: ${IMAP_TLS ? 'Enabled' : 'Disabled'}\n`);

if (!IMAP_USER || !IMAP_PASSWORD) {
  console.error('❌ ERROR: IMAP credentials not found in .env.local');
  console.error('Required variables: IMAP_USER, IMAP_PASSWORD');
  process.exit(1);
}

const imap = new Imap({
  user: IMAP_USER,
  password: IMAP_PASSWORD,
  host: IMAP_HOST,
  port: IMAP_PORT,
  tls: IMAP_TLS,
  tlsOptions: { rejectUnauthorized: false }
});

const emails = [];

imap.once('ready', () => {
  console.log('✅ IMAP connection established!\n');
  console.log('📂 Opening INBOX...');

  imap.openBox('INBOX', true, (err, box) => {
    if (err) {
      console.error('❌ Failed to open INBOX:', err.message);
      imap.end();
      process.exit(1);
    }

    console.log(`✅ INBOX opened successfully!`);
    console.log(`📨 Total messages in INBOX: ${box.messages.total}\n`);

    if (box.messages.total === 0) {
      console.log('ℹ️  No messages found in INBOX');
      imap.end();
      return;
    }

    // Fetch last 5 messages
    const maxMessages = Math.min(5, box.messages.total);
    const start = Math.max(1, box.messages.total - maxMessages + 1);
    const fetchRange = `${start}:${box.messages.total}`;

    console.log(`📥 Fetching last ${maxMessages} messages (${fetchRange})...\n`);

    const fetch = imap.seq.fetch(fetchRange, {
      bodies: '',
      struct: true
    });

    let messageCount = 0;

    fetch.on('message', (msg, seqno) => {
      msg.on('body', (stream) => {
        simpleParser(stream, (err, parsed) => {
          if (err) {
            console.error(`❌ Parse error for message ${seqno}:`, err.message);
            return;
          }

          messageCount++;
          console.log(`📧 Message ${messageCount}/${maxMessages}:`);
          console.log(`   Subject: ${parsed.subject || '(No Subject)'}`);
          console.log(`   From: ${parsed.from?.text || 'Unknown'}`);
          console.log(`   Date: ${parsed.date ? parsed.date.toLocaleString() : 'Unknown'}`);
          console.log(`   Preview: ${(parsed.text || parsed.html || '').substring(0, 100)}...`);
          console.log('');

          emails.push({
            subject: parsed.subject,
            from: parsed.from?.text,
            date: parsed.date,
            snippet: (parsed.text || parsed.html || '').substring(0, 200)
          });
        });
      });
    });

    fetch.once('error', (err) => {
      console.error('❌ Fetch error:', err.message);
      imap.end();
      process.exit(1);
    });

    fetch.once('end', () => {
      console.log('✅ Fetch complete!');
      imap.end();
    });
  });
});

imap.once('error', (err) => {
  console.error('❌ IMAP connection error:', err.message);
  process.exit(1);
});

imap.once('end', () => {
  console.log('\n🎉 SUCCESS! IMAP connection is working!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Fetched ${emails.length} emails`);
  console.log(`   - Email account: ${IMAP_USER}`);
  console.log(`\n✅ Your AI can now fetch emails from Outlook via IMAP!`);
  console.log(`\n📋 Next Steps:`);
  console.log(`   1. Go to http://localhost:3000/email-responder`);
  console.log(`   2. Click "Fetch Emails (IMAP)" button`);
  console.log(`   3. AI will fetch and classify your emails automatically`);
});

console.log('🔄 Connecting to IMAP server...\n');
imap.connect();
