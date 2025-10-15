#!/usr/bin/env node

/**
 * PERMUTATION Welcome Script
 * Displays ASCII art and setup instructions
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function displayLogo() {
  const logoPath = path.join(__dirname, '..', 'LOGO.txt');
  
  console.log(colors.cyan);
  if (fs.existsSync(logoPath)) {
    const logo = fs.readFileSync(logoPath, 'utf8');
    console.log(logo);
  } else {
    // Fallback simple logo
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║                    PERMUTATION                            ║');
    console.log('║         Advanced AI Research Stack                        ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
  }
  console.log(colors.reset);
}

function displayWelcome() {
  console.log('\n' + colors.bright + colors.green + '🎉 Welcome to PERMUTATION!' + colors.reset + '\n');
  
  console.log(colors.bright + 'Quick Start (5 minutes):' + colors.reset);
  console.log('  1. ' + colors.yellow + 'Read QUICK_START.md' + colors.reset + ' for setup instructions');
  console.log('  2. ' + colors.yellow + 'Configure .env.local' + colors.reset + ' with your Supabase credentials');
  console.log('  3. ' + colors.yellow + 'Run database migration' + colors.reset + ' in Supabase SQL Editor');
  console.log('  4. ' + colors.yellow + 'npm run dev' + colors.reset + ' to start the server');
  console.log('  5. ' + colors.yellow + 'Visit http://localhost:3000' + colors.reset + '\n');
  
  console.log(colors.bright + 'Documentation:' + colors.reset);
  console.log('  📚 README.md          - Overview and features');
  console.log('  ⚡ QUICK_START.md     - 5-minute setup guide');
  console.log('  🏗️  ARCHITECTURE.md    - How it all works');
  console.log('  📊 BENCHMARKS.md      - Performance results');
  console.log('  🤝 CONTRIBUTING.md    - How to contribute\n');
  
  console.log(colors.bright + 'Examples:' + colors.reset);
  console.log('  💡 npm run example:basic       - Simple query');
  console.log('  💡 npm run example:multi-domain - Multi-domain analysis');
  console.log('  💡 npm run example:config       - Configuration options\n');
  
  console.log(colors.bright + colors.blue + '🚀 Your research journey starts here!' + colors.reset);
  console.log(colors.cyan + '   Fork it. Break it. Make it better.' + colors.reset + '\n');
}

// Main execution
displayLogo();
displayWelcome();

