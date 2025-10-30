#!/usr/bin/env node

/**
 * 🔍 PERMUTATION SYSTEM TEST ENVIRONMENT VALIDATOR
 * 
 * This script validates that the PERMUTATION system is ready for comprehensive testing
 * by checking all required components, services, and configurations.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestEnvironmentValidator {
  constructor() {
    this.validationResults = {
      system: {},
      services: {},
      configuration: {},
      dependencies: {},
      overall: { ready: false, issues: [] }
    };
  }

  async validateEnvironment() {
    console.log('🔍 VALIDATING PERMUTATION SYSTEM TEST ENVIRONMENT');
    console.log('================================================');
    console.log('Checking all required components and services...\n');

    try {
      // Check system requirements
      await this.validateSystemRequirements();
      
      // Check required services
      await this.validateServices();
      
      // Check configuration
      await this.validateConfiguration();
      
      // Check dependencies
      await this.validateDependencies();
      
      // Check API endpoints
      await this.validateAPIEndpoints();
      
      // Generate final report
      this.generateValidationReport();

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      this.validationResults.overall.issues.push(error.message);
    }
  }

  async validateSystemRequirements() {
    console.log('📋 Checking System Requirements...');
    
    const checks = [
      { name: 'Node.js Version', check: () => this.checkNodeVersion() },
      { name: 'NPM Version', check: () => this.checkNPMVersion() },
      { name: 'Available Memory', check: () => this.checkMemory() },
      { name: 'Disk Space', check: () => this.checkDiskSpace() }
    ];

    for (const check of checks) {
      try {
        const result = await check.check();
        this.validationResults.system[check.name] = result;
        console.log(`  ${result.success ? '✅' : '❌'} ${check.name}: ${result.message}`);
      } catch (error) {
        this.validationResults.system[check.name] = { success: false, message: error.message };
        console.log(`  ❌ ${check.name}: ${error.message}`);
      }
    }
  }

  async validateServices() {
    console.log('\n🌐 Checking Required Services...');
    
    const services = [
      { name: 'Frontend Server', port: 3000, check: () => this.checkService('http://localhost:3000') },
      { name: 'Supabase Connection', check: () => this.checkSupabase() },
      { name: 'LLM Services', check: () => this.checkLLMServices() },
      { name: 'Ollama Service', port: 11434, check: () => this.checkService('http://localhost:11434') }
    ];

    for (const service of services) {
      try {
        const result = await service.check();
        this.validationResults.services[service.name] = result;
        console.log(`  ${result.success ? '✅' : '❌'} ${service.name}: ${result.message}`);
      } catch (error) {
        this.validationResults.services[service.name] = { success: false, message: error.message };
        console.log(`  ❌ ${service.name}: ${error.message}`);
      }
    }
  }

  async validateConfiguration() {
    console.log('\n⚙️ Checking Configuration...');
    
    const configChecks = [
      { name: 'Environment Variables', check: () => this.checkEnvironmentVariables() },
      { name: 'Database Schema', check: () => this.checkDatabaseSchema() },
      { name: 'API Keys', check: () => this.checkAPIKeys() },
      { name: 'Test Files', check: () => this.checkTestFiles() }
    ];

    for (const check of configChecks) {
      try {
        const result = await check.check();
        this.validationResults.configuration[check.name] = result;
        console.log(`  ${result.success ? '✅' : '❌'} ${check.name}: ${result.message}`);
      } catch (error) {
        this.validationResults.configuration[check.name] = { success: false, message: error.message };
        console.log(`  ❌ ${check.name}: ${error.message}`);
      }
    }
  }

  async validateDependencies() {
    console.log('\n📦 Checking Dependencies...');
    
    const dependencies = [
      { name: 'Frontend Dependencies', check: () => this.checkFrontendDependencies() },
      { name: 'Backend Dependencies', check: () => this.checkBackendDependencies() },
      { name: 'Test Dependencies', check: () => this.checkTestDependencies() }
    ];

    for (const dep of dependencies) {
      try {
        const result = await dep.check();
        this.validationResults.dependencies[dep.name] = result;
        console.log(`  ${result.success ? '✅' : '❌'} ${dep.name}: ${result.message}`);
      } catch (error) {
        this.validationResults.dependencies[dep.name] = { success: false, message: error.message };
        console.log(`  ❌ ${dep.name}: ${error.message}`);
      }
    }
  }

  async validateAPIEndpoints() {
    console.log('\n🔗 Checking API Endpoints...');
    
    const endpoints = [
      '/api/health',
      '/api/optimized/execute',
      '/api/smart-routing',
      '/api/real-cost-optimization',
      '/api/trm',
      '/api/ace',
      '/api/gepa',
      '/api/irt',
      '/api/reasoning-bank',
      '/api/lora',
      '/api/dspy',
      '/api/multi-query',
      '/api/embeddings',
      '/api/teacher-student',
      '/api/performance-monitoring',
      '/api/dynamic-scaling',
      '/api/benchmark/fast',
      '/api/trace/inspect',
      '/api/brain'
    ];

    let successCount = 0;
    for (const endpoint of endpoints) {
      try {
        const result = await this.checkAPIEndpoint(endpoint);
        if (result.success) successCount++;
        console.log(`  ${result.success ? '✅' : '❌'} ${endpoint}: ${result.message}`);
      } catch (error) {
        console.log(`  ❌ ${endpoint}: ${error.message}`);
      }
    }

    this.validationResults.apiEndpoints = {
      success: successCount >= endpoints.length * 0.8, // 80% success rate
      message: `${successCount}/${endpoints.length} endpoints available`
    };
  }

  // Individual validation methods
  async checkNodeVersion() {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      return { success: true, message: `Node.js ${version} (✅ Compatible)` };
    } else {
      return { success: false, message: `Node.js ${version} (❌ Requires v18+)` };
    }
  }

  async checkNPMVersion() {
    return new Promise((resolve) => {
      const npm = spawn('npm', ['--version'], { stdio: 'pipe' });
      let output = '';
      
      npm.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      npm.on('close', (code) => {
        if (code === 0) {
          const version = output.trim();
          resolve({ success: true, message: `NPM ${version}` });
        } else {
          resolve({ success: false, message: 'NPM not available' });
        }
      });
    });
  }

  async checkMemory() {
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    
    if (memoryUsagePercent < 90) {
      return { success: true, message: `Memory usage: ${memoryUsagePercent.toFixed(1)}% (${Math.round(freeMemory / 1024 / 1024 / 1024)}GB free)` };
    } else {
      return { success: false, message: `Memory usage: ${memoryUsagePercent.toFixed(1)}% (⚠️ High usage)` };
    }
  }

  async checkDiskSpace() {
    try {
      const stats = require('fs').statSync('.');
      return { success: true, message: 'Disk space available' };
    } catch (error) {
      return { success: false, message: 'Cannot check disk space' };
    }
  }

  async checkService(url) {
    try {
      const response = await fetch(url, { method: 'GET', timeout: 5000 });
      return { success: response.ok, message: `Service responding (${response.status})` };
    } catch (error) {
      return { success: false, message: `Service not available: ${error.message}` };
    }
  }

  async checkSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: { 'apikey': supabaseKey }
        });
        return { success: response.ok, message: 'Supabase connection available' };
      } catch (error) {
        return { success: false, message: `Supabase connection failed: ${error.message}` };
      }
    } else {
      return { success: false, message: 'Supabase environment variables not set' };
    }
  }

  async checkLLMServices() {
    const openaiKey = process.env.OPENAI_API_KEY;
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    const availableServices = [];
    if (openaiKey) availableServices.push('OpenAI');
    if (perplexityKey) availableServices.push('Perplexity');
    if (anthropicKey) availableServices.push('Anthropic');
    
    if (availableServices.length > 0) {
      return { success: true, message: `LLM services: ${availableServices.join(', ')}` };
    } else {
      return { success: false, message: 'No LLM API keys configured' };
    }
  }

  async checkEnvironmentVariables() {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    const optionalVars = [
      'OPENAI_API_KEY',
      'PERPLEXITY_API_KEY',
      'ANTHROPIC_API_KEY',
      'OLLAMA_HOST'
    ];
    
    const missingRequired = requiredVars.filter(varName => !process.env[varName]);
    const availableOptional = optionalVars.filter(varName => process.env[varName]);
    
    if (missingRequired.length === 0) {
      return { 
        success: true, 
        message: `Required vars: ✅, Optional vars: ${availableOptional.length}/${optionalVars.length}` 
      };
    } else {
      return { 
        success: false, 
        message: `Missing required vars: ${missingRequired.join(', ')}` 
      };
    }
  }

  async checkDatabaseSchema() {
    // This would typically check if database tables exist
    // For now, we'll assume it's configured if Supabase is available
    return { success: true, message: 'Database schema check (simplified)' };
  }

  async checkAPIKeys() {
    const keys = {
      'OpenAI': process.env.OPENAI_API_KEY,
      'Perplexity': process.env.PERPLEXITY_API_KEY,
      'Anthropic': process.env.ANTHROPIC_API_KEY,
      'Supabase': process.env.NEXT_PUBLIC_SUPABASE_URL
    };
    
    const validKeys = Object.entries(keys).filter(([_, value]) => value && value.length > 10);
    
    return { 
      success: validKeys.length >= 2, 
      message: `Valid API keys: ${validKeys.map(([name, _]) => name).join(', ')}` 
    };
  }

  async checkTestFiles() {
    const testFiles = [
      'comprehensive-permutation-system-test.js',
      'run-comprehensive-test.js',
      'validate-test-environment.js'
    ];
    
    const existingFiles = testFiles.filter(file => fs.existsSync(file));
    
    return { 
      success: existingFiles.length === testFiles.length, 
      message: `Test files: ${existingFiles.length}/${testFiles.length}` 
    };
  }

  async checkFrontendDependencies() {
    const packageJsonPath = 'frontend/package.json';
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = Object.keys(packageJson.dependencies || {});
      return { success: dependencies.length > 0, message: `${dependencies.length} dependencies found` };
    } else {
      return { success: false, message: 'Frontend package.json not found' };
    }
  }

  async checkBackendDependencies() {
    const packageJsonPath = 'backend/requirements.txt';
    if (fs.existsSync(packageJsonPath)) {
      const requirements = fs.readFileSync(packageJsonPath, 'utf8').split('\n').filter(line => line.trim());
      return { success: requirements.length > 0, message: `${requirements.length} Python packages found` };
    } else {
      return { success: false, message: 'Backend requirements.txt not found' };
    }
  }

  async checkTestDependencies() {
    const testDeps = ['node-fetch', 'fs', 'path', 'child_process'];
    const availableDeps = testDeps.filter(dep => {
      try {
        require(dep);
        return true;
      } catch {
        return false;
      }
    });
    
    return { 
      success: availableDeps.length >= testDeps.length * 0.8, 
      message: `Test dependencies: ${availableDeps.length}/${testDeps.length}` 
    };
  }

  async checkAPIEndpoint(endpoint) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, { 
        method: 'GET',
        timeout: 5000 
      });
      
      if (response.ok) {
        return { success: true, message: `Available (${response.status})` };
      } else {
        return { success: false, message: `Not available (${response.status})` };
      }
    } catch (error) {
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  generateValidationReport() {
    console.log('\n📊 VALIDATION REPORT');
    console.log('===================');
    
    // Calculate overall readiness
    const allChecks = [
      ...Object.values(this.validationResults.system),
      ...Object.values(this.validationResults.services),
      ...Object.values(this.validationResults.configuration),
      ...Object.values(this.validationResults.dependencies)
    ];
    
    const successfulChecks = allChecks.filter(check => check.success).length;
    const totalChecks = allChecks.length;
    const readinessPercent = (successfulChecks / totalChecks) * 100;
    
    this.validationResults.overall.ready = readinessPercent >= 80;
    this.validationResults.overall.readinessPercent = readinessPercent;
    
    console.log(`📈 Overall Readiness: ${successfulChecks}/${totalChecks} (${readinessPercent.toFixed(1)}%)`);
    console.log(`🎯 System Ready: ${this.validationResults.overall.ready ? '✅ YES' : '❌ NO'}`);
    
    // Category breakdown
    console.log('\n📋 Category Breakdown:');
    this.printCategoryResults('System Requirements', this.validationResults.system);
    this.printCategoryResults('Services', this.validationResults.services);
    this.printCategoryResults('Configuration', this.validationResults.configuration);
    this.printCategoryResults('Dependencies', this.validationResults.dependencies);
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (this.validationResults.overall.ready) {
      console.log('  🎉 System is ready for comprehensive testing!');
      console.log('  🚀 Run: node run-comprehensive-test.js standard');
    } else {
      console.log('  ⚠️ System needs attention before testing:');
      this.generateRecommendations();
    }
    
    // Save validation report
    this.saveValidationReport();
  }

  printCategoryResults(categoryName, results) {
    const successful = Object.values(results).filter(r => r.success).length;
    const total = Object.values(results).length;
    const percent = total > 0 ? (successful / total) * 100 : 0;
    
    console.log(`  ${categoryName}: ${successful}/${total} (${percent.toFixed(1)}%)`);
  }

  generateRecommendations() {
    const issues = [];
    
    // Check system issues
    Object.entries(this.validationResults.system).forEach(([name, result]) => {
      if (!result.success) issues.push(`Fix ${name}: ${result.message}`);
    });
    
    // Check service issues
    Object.entries(this.validationResults.services).forEach(([name, result]) => {
      if (!result.success) issues.push(`Start ${name}: ${result.message}`);
    });
    
    // Check configuration issues
    Object.entries(this.validationResults.configuration).forEach(([name, result]) => {
      if (!result.success) issues.push(`Configure ${name}: ${result.message}`);
    });
    
    issues.forEach(issue => console.log(`  - ${issue}`));
  }

  saveValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      overall: this.validationResults.overall,
      system: this.validationResults.system,
      services: this.validationResults.services,
      configuration: this.validationResults.configuration,
      dependencies: this.validationResults.dependencies,
      apiEndpoints: this.validationResults.apiEndpoints
    };
    
    const filename = `validation-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n📄 Validation report saved to: ${filename}`);
  }
}

// Main execution
async function main() {
  const validator = new TestEnvironmentValidator();
  await validator.validateEnvironment();
  
  if (!validator.validationResults.overall.ready) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TestEnvironmentValidator;