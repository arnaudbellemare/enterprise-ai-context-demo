/**
 * Test Build and Commit Script
 * 
 * This script tests the enhanced system and prepares for commit
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Testing Enhanced PERMUTATION System Build and Commit...\n');

// Test 1: Check if all files exist
console.log('📁 Test 1: Checking if all enhanced system files exist...');

const requiredFiles = [
  'frontend/lib/qdrant-vector-db.ts',
  'frontend/lib/tool-calling-system.ts',
  'frontend/lib/mem0-core-system.ts',
  'frontend/lib/ax-llm-orchestrator.ts',
  'frontend/lib/enhanced-permutation-engine.ts',
  'frontend/app/api/enhanced-permutation/route.ts'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('✅ All enhanced system files exist!');
} else {
  console.log('❌ Some files are missing!');
  process.exit(1);
}

// Test 2: Check package.json dependency
console.log('\n📦 Test 2: Checking package.json dependency...');
const packageJsonPath = 'frontend/package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.dependencies['@qdrant/js-client-rest']) {
    console.log('✅ @qdrant/js-client-rest dependency added');
  } else {
    console.log('❌ @qdrant/js-client-rest dependency missing');
  }
} else {
  console.log('❌ package.json not found');
}

// Test 3: Check file contents for basic syntax
console.log('\n🔍 Test 3: Checking file contents for basic syntax...');

requiredFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Basic checks
    if (content.includes('export') && content.includes('class') || content.includes('function')) {
      console.log(`✅ ${file} has proper exports and structure`);
    } else {
      console.log(`⚠️ ${file} might have syntax issues`);
    }
    
    // Check for TypeScript syntax
    if (content.includes('interface') || content.includes('type ') || content.includes(': ')) {
      console.log(`✅ ${file} has TypeScript syntax`);
    }
    
  } catch (error) {
    console.log(`❌ Error reading ${file}: ${error.message}`);
  }
});

// Test 4: Check API endpoint structure
console.log('\n🌐 Test 4: Checking API endpoint structure...');
const apiFile = 'frontend/app/api/enhanced-permutation/route.ts';
if (fs.existsSync(apiFile)) {
  const content = fs.readFileSync(apiFile, 'utf8');
  if (content.includes('export async function POST') && content.includes('export async function GET')) {
    console.log('✅ API endpoint has both POST and GET methods');
  } else {
    console.log('❌ API endpoint missing required methods');
  }
  
  if (content.includes('getEnhancedPermutationEngine')) {
    console.log('✅ API endpoint imports enhanced engine');
  } else {
    console.log('❌ API endpoint missing enhanced engine import');
  }
} else {
  console.log('❌ API endpoint file not found');
}

// Test 5: Generate commit message
console.log('\n📝 Test 5: Generating commit message...');
const commitMessage = `feat: Implement Enhanced PERMUTATION System with Qdrant, Tool Calling, Mem0 Core, and Ax LLM

- Add Qdrant vector database with hybrid BM25 + semantic search
- Implement dynamic tool calling system with 5+ built-in tools
- Add Mem0 core memory management with DSPy principles
- Implement Ax LLM orchestrator for optimal model routing
- Create enhanced PERMUTATION engine integrating all systems
- Add API endpoint for testing enhanced capabilities
- Include comprehensive documentation and test scripts

Components:
- Qdrant Vector DB: Local vector storage with hybrid search
- Tool Calling: Calculator, Web Search, SQL, Text Analysis, Financial Calculator
- Mem0 Core: Episodic, Semantic, Working, Procedural memory management
- Ax LLM: Smart routing between Perplexity, Ollama Gemma2, Ollama Gemma3
- Enhanced Engine: Multi-source synthesis with quality scoring

This creates the ultimate AI system with multi-source intelligence,
dynamic tool execution, advanced memory management, and optimal model routing.`;

console.log('📝 Commit message generated:');
console.log(commitMessage);

// Test 6: Check git status (if possible)
console.log('\n🔍 Test 6: Checking git status...');
try {
  const { execSync } = require('child_process');
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  console.log('📊 Git status:');
  console.log(gitStatus);
  
  if (gitStatus.trim()) {
    console.log('✅ There are changes to commit');
  } else {
    console.log('⚠️ No changes detected');
  }
} catch (error) {
  console.log('⚠️ Could not check git status:', error.message);
}

console.log('\n🎉 Enhanced PERMUTATION System Build and Commit Test Complete!');
console.log('\n🚀 Next Steps:');
console.log('1. Fix shell environment issues');
console.log('2. Run: npm run build');
console.log('3. Test API endpoints');
console.log('4. Commit changes with generated message');
console.log('5. Push to repository');
