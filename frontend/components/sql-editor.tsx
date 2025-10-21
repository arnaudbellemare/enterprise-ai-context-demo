'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

interface SQLQueryResult {
  data: any[] | null;
  error: string | null;
  rowCount: number;
  executionTime: number;
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: Date;
  executionTime: number;
  rowCount: number;
  success: boolean;
}

interface DatabaseTable {
  table_name: string;
  table_type: string;
  schema_name: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

const SQL_QUERY_TEMPLATES = {
  'Select All': 'SELECT * FROM your_table_name LIMIT 100;',
  'Count Records': 'SELECT COUNT(*) as total_records FROM your_table_name;',
  'Insert Record': `INSERT INTO your_table_name (column1, column2, column3)
VALUES ('value1', 'value2', 'value3');`,
  'Update Record': `UPDATE your_table_name 
SET column1 = 'new_value'
WHERE id = 1;`,
  'Delete Record': 'DELETE FROM your_table_name WHERE id = 1;',
  'Create Table': `CREATE TABLE new_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);`,
  'Join Tables': `SELECT t1.*, t2.column_name
FROM table1 t1
JOIN table2 t2 ON t1.id = t2.table1_id
WHERE t1.condition = 'value';`,
  'Aggregate Functions': `SELECT 
  COUNT(*) as total,
  AVG(numeric_column) as average,
  MAX(numeric_column) as maximum,
  MIN(numeric_column) as minimum
FROM your_table_name;`,
  'Date Functions': `SELECT 
  DATE(created_at) as date_only,
  EXTRACT(YEAR FROM created_at) as year,
  EXTRACT(MONTH FROM created_at) as month
FROM your_table_name
WHERE created_at >= NOW() - INTERVAL '30 days';`,
  'Full Text Search': `SELECT * FROM your_table_name
WHERE to_tsvector('english', searchable_column) 
@@ to_tsquery('english', 'search terms');`
};

export default function SQLEditor() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SQLQueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableColumns, setTableColumns] = useState<ColumnInfo[]>([]);
  const [savedQueries, setSavedQueries] = useState<{ name: string; query: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'schema' | 'history'>('editor');
  const [showTemplates, setShowTemplates] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = useRef<any>(null);

  // Initialize Supabase connection
  useEffect(() => {
    const initSupabase = async () => {
      try {
        // You'll need to set these in your .env.local
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';
        
        if (supabaseUrl === 'your-supabase-url' || supabaseKey === 'your-supabase-key') {
          setConnectionStatus('error');
          return;
        }

        supabase.current = createClient(supabaseUrl, supabaseKey);
        
        // Test connection by fetching tables
        await loadTables();
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Failed to connect to Supabase:', error);
        setConnectionStatus('error');
      }
    };

    initSupabase();
    loadSavedQueries();
  }, []);

  const loadTables = async () => {
    try {
      const { data, error } = await supabase.current
        .from('information_schema.tables')
        .select('table_name, table_type, table_schema')
        .eq('table_schema', 'public')
        .order('table_name');

      if (error) throw error;
      
      setTables(data || []);
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const loadTableColumns = async (tableName: string) => {
    try {
      const { data, error } = await supabase.current
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', tableName)
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (error) throw error;
      setTableColumns(data || []);
    } catch (error) {
      console.error('Error loading table columns:', error);
    }
  };

  const executeQuery = async () => {
    if (!query.trim() || !supabase.current) return;

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.current.rpc('execute_sql', {
        sql_query: query
      });

      const executionTime = Date.now() - startTime;

      if (error) {
        setResult({
          data: null,
          error: error.message,
          rowCount: 0,
          executionTime
        });
      } else {
        const rowCount = Array.isArray(data) ? data.length : 0;
        setResult({
          data: data,
          error: null,
          rowCount,
          executionTime
        });
      }

      // Add to history
      const historyItem: QueryHistory = {
        id: Date.now().toString(),
        query: query,
        timestamp: new Date(),
        executionTime,
        rowCount: Array.isArray(data) ? data.length : 0,
        success: !error
      };

      setQueryHistory(prev => [historyItem, ...prev.slice(0, 49)]); // Keep last 50 queries

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      setResult({
        data: null,
        error: error.message || 'Unknown error occurred',
        rowCount: 0,
        executionTime
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const loadSavedQueries = () => {
    try {
      const saved = localStorage.getItem('sql-saved-queries');
      if (saved) {
        setSavedQueries(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved queries:', error);
    }
  };

  const saveQuery = () => {
    if (!query.trim()) return;
    
    const name = prompt('Enter a name for this query:');
    if (!name) return;

    const newSavedQueries = [...savedQueries, { name, query }];
    setSavedQueries(newSavedQueries);
    localStorage.setItem('sql-saved-queries', JSON.stringify(newSavedQueries));
  };

  const loadQuery = (savedQuery: { name: string; query: string }) => {
    setQuery(savedQuery.query);
    setActiveTab('editor');
  };

  const insertTemplate = (template: string) => {
    setQuery(template);
    setShowTemplates(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const formatQuery = () => {
    // Simple query formatting
    let formatted = query
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*;\s*/g, ';')
      .replace(/\bSELECT\b/gi, 'SELECT')
      .replace(/\bFROM\b/gi, '\nFROM')
      .replace(/\bWHERE\b/gi, '\nWHERE')
      .replace(/\bJOIN\b/gi, '\nJOIN')
      .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
      .replace(/\bORDER BY\b/gi, '\nORDER BY')
      .replace(/\bHAVING\b/gi, '\nHAVING')
      .trim();
    
    setQuery(formatted);
  };

  const clearQuery = () => {
    setQuery('');
    setResult(null);
  };

  const exportResults = (format: 'csv' | 'json') => {
    if (!result?.data) return;

    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'csv') {
      const headers = Object.keys(result.data[0] || {}).join(',');
      const rows = result.data.map(row => 
        Object.values(row).map(val => `"${val}"`).join(',')
      );
      content = [headers, ...rows].join('\n');
      filename = 'query_results.csv';
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(result.data, null, 2);
      filename = 'query_results.json';
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SQL Editor</h1>
              <p className="text-gray-600 mt-1">Execute SQL queries on your Supabase database</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                connectionStatus === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : connectionStatus === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {connectionStatus === 'connected' ? '🟢 Connected' : 
                 connectionStatus === 'error' ? '🔴 Connection Error' : '🟡 Connecting...'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Navigation Tabs */}
              <div className="border-b">
                <nav className="flex">
                  {[
                    { id: 'editor', label: 'Editor', icon: '✏️' },
                    { id: 'schema', label: 'Schema', icon: '🗂️' },
                    { id: 'history', label: 'History', icon: '🕒' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 px-4 py-3 text-sm font-medium ${
                        activeTab === tab.id
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'editor' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Templates</h3>
                      <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded text-sm text-blue-700"
                      >
                        📋 {showTemplates ? 'Hide' : 'Show'} Query Templates
                      </button>
                      {showTemplates && (
                        <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                          {Object.entries(SQL_QUERY_TEMPLATES).map(([name, template]) => (
                            <button
                              key={name}
                              onClick={() => insertTemplate(template)}
                              className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Saved Queries</h3>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {savedQueries.map((saved, index) => (
                          <button
                            key={index}
                            onClick={() => loadQuery(saved)}
                            className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded truncate"
                          >
                            💾 {saved.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'schema' && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Database Tables</h3>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {tables.map(table => (
                        <div key={table.table_name}>
                          <button
                            onClick={() => {
                              setSelectedTable(table.table_name);
                              loadTableColumns(table.table_name);
                            }}
                            className={`w-full text-left px-2 py-1 text-xs rounded ${
                              selectedTable === table.table_name
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            📊 {table.table_name}
                          </button>
                          {selectedTable === table.table_name && (
                            <div className="ml-4 mt-1 space-y-1">
                              {tableColumns.map(column => (
                                <div key={column.column_name} className="text-xs text-gray-500">
                                  • {column.column_name} ({column.data_type})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Query History</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {queryHistory.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setQuery(item.query)}
                          className={`w-full text-left p-2 text-xs rounded ${
                            item.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          <div className="font-medium">
                            {item.success ? '✅' : '❌'} {item.timestamp.toLocaleTimeString()}
                          </div>
                          <div className="truncate mt-1">{item.query}</div>
                          <div className="text-xs opacity-75 mt-1">
                            {item.rowCount} rows • {item.executionTime}ms
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Query Editor */}
              <div className="border-b p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">SQL Query</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={formatQuery}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      🎨 Format
                    </button>
                    <button
                      onClick={saveQuery}
                      className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded"
                    >
                      💾 Save
                    </button>
                    <button
                      onClick={clearQuery}
                      className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
                    >
                      🗑️ Clear
                    </button>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your SQL query here..."
                  className="w-full h-48 p-3 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      executeQuery();
                    }
                  }}
                />

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Press Cmd/Ctrl + Enter to execute
                  </div>
                  <button
                    onClick={executeQuery}
                    disabled={isExecuting || !query.trim() || connectionStatus !== 'connected'}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                  >
                    {isExecuting ? '⏳ Executing...' : '▶️ Execute Query'}
                  </button>
                </div>
              </div>

              {/* Results */}
              {result && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Results</h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        {result.error ? (
                          <span className="text-red-600">❌ Error</span>
                        ) : (
                          <span className="text-green-600">✅ Success</span>
                        )}
                        {' • '}
                        {result.rowCount} rows • {result.executionTime}ms
                      </div>
                      {result.data && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => exportResults('csv')}
                            className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded"
                          >
                            📊 Export CSV
                          </button>
                          <button
                            onClick={() => exportResults('json')}
                            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                          >
                            📋 Export JSON
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {result.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <pre className="text-red-700 text-sm whitespace-pre-wrap">{result.error}</pre>
                    </div>
                  ) : result.data && result.data.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {Object.keys(result.data[0]).map(key => (
                                <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {result.data.slice(0, 100).map((row, index) => (
                              <tr key={index}>
                                {Object.values(row).map((value, cellIndex) => (
                                  <td key={cellIndex} className="px-4 py-3 text-sm text-gray-900">
                                    {value === null ? (
                                      <span className="text-gray-400 italic">NULL</span>
                                    ) : (
                                      String(value)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {result.data.length > 100 && (
                          <div className="bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
                            Showing first 100 rows of {result.data.length} total rows
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-700">✅ Query executed successfully. No data returned.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
