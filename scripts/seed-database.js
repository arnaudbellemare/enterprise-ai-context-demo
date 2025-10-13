/**
 * Seed Database with Sample Data
 * Populates Supabase with financial, real estate, and workflow data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample Financial Entities
const financialEntities = [
  {
    type: 'company',
    name: 'Apple Inc.',
    properties: { ticker: 'AAPL', sector: 'Technology', market_cap: '2.8T' },
    user_id: 'seed-user'
  },
  {
    type: 'company',
    name: 'Microsoft Corporation',
    properties: { ticker: 'MSFT', sector: 'Technology', market_cap: '2.4T' },
    user_id: 'seed-user'
  },
  {
    type: 'concept',
    name: 'Artificial Intelligence',
    properties: { category: 'Technology', growth_rate: 'High' },
    user_id: 'seed-user'
  },
  {
    type: 'metric',
    name: 'P/E Ratio',
    properties: { description: 'Price-to-Earnings Ratio', typical_range: '15-25' },
    user_id: 'seed-user'
  },
  {
    type: 'location',
    name: 'Miami, FL',
    properties: { market: 'real_estate', median_price: '$550,000', growth: '8.2%' },
    user_id: 'seed-user'
  }
];

// Sample Real Estate Properties
const realEstateData = [
  {
    type: 'property',
    name: 'Brickell Avenue Condo',
    properties: {
      location: 'Miami, FL',
      price: '$650,000',
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1200,
      year_built: 2020,
      roi_estimate: '6.5%'
    },
    user_id: 'seed-user'
  },
  {
    type: 'property',
    name: 'Coral Gables Estate',
    properties: {
      location: 'Miami, FL',
      price: '$1,200,000',
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2800,
      year_built: 2015,
      roi_estimate: '5.2%'
    },
    user_id: 'seed-user'
  }
];

// Sample Workflow Memories
const workflowMemories = [
  {
    workflow_name: 'Real Estate Investment Analysis',
    user_id: 'seed-user',
    success: true,
    execution_time: 12300,
    nodes_executed: 5,
    metadata: {
      domain: 'real_estate',
      complexity: 'medium',
      cost: 0.023,
      accuracy: 0.89
    }
  },
  {
    workflow_name: 'Financial Market Research',
    user_id: 'seed-user',
    success: true,
    execution_time: 8900,
    nodes_executed: 4,
    metadata: {
      domain: 'financial',
      complexity: 'low',
      cost: 0.015,
      accuracy: 0.92
    }
  }
];

// Sample Learned Concepts (ArcMemo)
const learnedConcepts = [
  {
    concept: 'Miami real estate markets show strong Q4 performance with 8.2% YoY growth',
    domain: 'real_estate',
    confidence: 0.92,
    success_rate: 0.88,
    usage_count: 3,
    user_id: 'seed-user'
  },
  {
    concept: 'Tech stock valuations remain elevated but showing stabilization patterns',
    domain: 'financial',
    confidence: 0.87,
    success_rate: 0.91,
    usage_count: 5,
    user_id: 'seed-user'
  },
  {
    concept: 'GEPA optimization improves financial analysis accuracy by 12-15%',
    domain: 'optimization',
    confidence: 0.95,
    success_rate: 0.94,
    usage_count: 8,
    user_id: 'seed-user'
  }
];

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...\n');

  try {
    // 1. Seed Financial Entities
    console.log('📊 Seeding financial entities...');
    const { data: entitiesData, error: entitiesError } = await supabase
      .from('entities')
      .insert(financialEntities)
      .select();

    if (entitiesError) {
      console.warn('⚠️  Entities table might not exist:', entitiesError.message);
    } else {
      console.log(`✅ Inserted ${entitiesData.length} financial entities`);
    }

    // 2. Seed Real Estate Properties
    console.log('🏠 Seeding real estate properties...');
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('entities')
      .insert(realEstateData)
      .select();

    if (propertiesError) {
      console.warn('⚠️  Could not insert properties:', propertiesError.message);
    } else {
      console.log(`✅ Inserted ${propertiesData.length} real estate properties`);
    }

    // 3. Seed Workflow Memories
    console.log('💾 Seeding workflow memories...');
    const { data: memoriesData, error: memoriesError } = await supabase
      .from('workflow_executions')
      .insert(workflowMemories)
      .select();

    if (memoriesError) {
      console.warn('⚠️  Workflow executions table might not exist:', memoriesError.message);
    } else {
      console.log(`✅ Inserted ${memoriesData.length} workflow memories`);
    }

    // 4. Seed Learned Concepts (ArcMemo)
    console.log('🧠 Seeding learned concepts...');
    const { data: conceptsData, error: conceptsError} = await supabase
      .from('learned_concepts')
      .insert(learnedConcepts)
      .select();

    if (conceptsError) {
      console.warn('⚠️  Learned concepts table might not exist:', conceptsError.message);
    } else {
      console.log(`✅ Inserted ${conceptsData.length} learned concepts`);
    }

    console.log('\n🎉 Database seeding complete!');
    console.log('\nTest your data:');
    console.log('  npm run test:supabase');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();

