import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TableInfo {
  table_name: string;
  table_type: string;
  table_schema: string;
  table_comment?: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length?: number;
  numeric_precision?: number;
  numeric_scale?: number;
  ordinal_position: number;
  column_comment?: string;
}

interface IndexInfo {
  index_name: string;
  column_name: string;
  is_unique: boolean;
  index_type: string;
}

interface ForeignKeyInfo {
  constraint_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

interface DatabaseSchema {
  tables: TableInfo[];
  columns: { [tableName: string]: ColumnInfo[] };
  indexes: { [tableName: string]: IndexInfo[] };
  foreignKeys: { [tableName: string]: ForeignKeyInfo[] };
  views: TableInfo[];
  functions: any[];
  triggers: any[];
}

function createSupabaseClient(url?: string, key?: string) {
  const supabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key are required');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const connectionParams = {
      url: url.searchParams.get('url') || undefined,
      key: url.searchParams.get('key') || undefined
    };

    console.log('🔍 Fetching database schema...');

    const supabase = createSupabaseClient(connectionParams.url, connectionParams.key);
    const schema: DatabaseSchema = {
      tables: [],
      columns: {},
      indexes: {},
      foreignKeys: {},
      views: [],
      functions: [],
      triggers: []
    };

    try {
      // Get all tables
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_type, table_schema')
        .eq('table_schema', 'public')
        .order('table_name');

      if (tablesError) throw tablesError;

      schema.tables = (tables || []).filter(t => t.table_type === 'BASE TABLE');
      schema.views = (tables || []).filter(t => t.table_type === 'VIEW');

      console.log(`   📊 Found ${schema.tables.length} tables and ${schema.views.length} views`);

      // Get columns for each table
      for (const table of schema.tables) {
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select(`
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale,
            ordinal_position
          `)
          .eq('table_name', table.table_name)
          .eq('table_schema', 'public')
          .order('ordinal_position');

        if (columnsError) {
          console.warn(`   ⚠️ Error fetching columns for ${table.table_name}:`, columnsError.message);
          schema.columns[table.table_name] = [];
        } else {
          schema.columns[table.table_name] = columns || [];
        }
      }

      // Get indexes for each table
      for (const table of schema.tables) {
        try {
          const { data: indexes, error: indexesError } = await supabase
            .rpc('get_table_indexes', { table_name: table.table_name });

          if (indexesError) {
            // If the function doesn't exist, try a simpler query
            const { data: simpleIndexes } = await supabase
              .from('pg_indexes')
              .select('indexname, tablename')
              .eq('tablename', table.table_name);

            schema.indexes[table.table_name] = (simpleIndexes || []).map(idx => ({
              index_name: idx.indexname,
              column_name: 'unknown',
              is_unique: false,
              index_type: 'unknown'
            }));
          } else {
            schema.indexes[table.table_name] = indexes || [];
          }
        } catch (error) {
          schema.indexes[table.table_name] = [];
        }
      }

      // Get foreign keys for each table
      for (const table of schema.tables) {
        try {
          const { data: foreignKeys, error: fkError } = await supabase
            .rpc('get_table_foreign_keys', { table_name: table.table_name });

          if (fkError) {
            schema.foreignKeys[table.table_name] = [];
          } else {
            schema.foreignKeys[table.table_name] = foreignKeys || [];
          }
        } catch (error) {
          schema.foreignKeys[table.table_name] = [];
        }
      }

      // Get functions (if accessible)
      try {
        const { data: functions } = await supabase
          .from('information_schema.routines')
          .select('routine_name, routine_type, data_type')
          .eq('routine_schema', 'public')
          .limit(50);

        schema.functions = functions || [];
      } catch (error) {
        console.warn('   ⚠️ Could not fetch functions:', error);
        schema.functions = [];
      }

      console.log(`   ✅ Schema fetched successfully`);

      return NextResponse.json({
        success: true,
        schema
      });

    } catch (error: any) {
      console.error('   ❌ Error fetching schema:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Failed to fetch database schema'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Schema API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Get detailed information about a specific table
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, connectionParams } = body;

    if (!tableName) {
      return NextResponse.json(
        { success: false, error: 'Table name is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching details for table: ${tableName}`);

    const supabase = createSupabaseClient(connectionParams?.url, connectionParams?.key);

    try {
      // Get table details
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_name', tableName)
        .eq('table_schema', 'public')
        .single();

      if (tableError) throw tableError;

      // Get columns
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select(`
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          ordinal_position
        `)
        .eq('table_name', tableName)
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (columnsError) throw columnsError;

      // Get constraints
      const { data: constraints, error: constraintsError } = await supabase
        .from('information_schema.table_constraints')
        .select('constraint_name, constraint_type')
        .eq('table_name', tableName)
        .eq('table_schema', 'public');

      if (constraintsError) {
        console.warn('Could not fetch constraints:', constraintsError.message);
      }

      // Get sample data (first 10 rows)
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(10);

      if (sampleError) {
        console.warn('Could not fetch sample data:', sampleError.message);
      }

      // Get row count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.warn('Could not fetch row count:', countError.message);
      }

      console.log(`   ✅ Table details fetched for ${tableName}`);

      return NextResponse.json({
        success: true,
        table: {
          info: tableInfo,
          columns: columns || [],
          constraints: constraints || [],
          sampleData: sampleData || [],
          rowCount: count || 0
        }
      });

    } catch (error: any) {
      console.error(`   ❌ Error fetching table details:`, error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Failed to fetch table details'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Table Details API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
