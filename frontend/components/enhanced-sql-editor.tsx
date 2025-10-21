'use client';

import React, { useState, useEffect, useRef } from 'react';
import SQLTemplateSelector from './sql-template-selector';

interface SQLQueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  rowCount: number;
  executionTime: number;
  queryType: string;
  affectedRows?: number;
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: Date;
  executionTime: number;
  rowCount: number;
  success: boolean;
  queryType: string;
}

interface DatabaseConnection {
  name: string;
  url: string;
  key: string;
  active: boolean;
}

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
  'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT', 'COUNT', 'SUM',
  'AVG', 'MIN', 'MAX', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE',
  'TABLE', 'INDEX', 'VIEW', 'DROP', 'ALTER', 'ADD', 'MODIFY', 'COLUMN', 'PRIMARY KEY',
  'FOREIGN KEY', 'REFERENCES', 'UNIQUE', 'NOT NULL', 'DEFAULT', 'AUTO_INCREMENT',
  'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL',
  'UNION', 'INTERSECT', 'EXCEPT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AS', 'ASC', 'DESC'
];

export default function EnhancedSQLEditor() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SQLQueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<DatabaseConnection | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [autoCompleteOpen, setAutoCompleteOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load saved data on mount
  useEffect(() => {
    loadQueryHistory();
    loadConnections();
  }, []);

  const loadQueryHistory = () => {
    try {
      const saved = localStorage.getItem('sql-query-history');
      if (saved) {
        const history = JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setQueryHistory(history);
      }
    } catch (error) {
      console.error('Error loading query history:', error);
    }
  };

  const saveQueryHistory = (history: QueryHistory[]) => {
    try {
      localStorage.setItem('sql-query-history', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving query history:', error);
    }
  };

  const loadConnections = () => {
    try {
      const saved = localStorage.getItem('sql-connections');
      if (saved) {
        const conns = JSON.parse(saved);
        setConnections(conns);
        const active = conns.find((c: DatabaseConnection) => c.active);
        if (active) setActiveConnection(active);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const saveConnections = (conns: DatabaseConnection[]) => {
    try {
      localStorage.setItem('sql-connections', JSON.stringify(conns));
    } catch (error) {
      console.error('Error saving connections:', error);
    }
  };

  const addConnection = () => {
    const name = prompt('Connection name:');
    const url = prompt('Supabase URL:');
    const key = prompt('Supabase API Key:');
    
    if (name && url && key) {
      const newConnection: DatabaseConnection = {
        name,
        url,
        key,
        active: false
      };
      
      const updatedConnections = [...connections, newConnection];
      setConnections(updatedConnections);
      saveConnections(updatedConnections);
    }
  };

  const setConnectionActive = (connection: DatabaseConnection) => {
    const updatedConnections = connections.map(c => ({
      ...c,
      active: c.name === connection.name
    }));
    
    setConnections(updatedConnections);
    setActiveConnection(connection);
    saveConnections(updatedConnections);
  };

  const executeQuery = async () => {
    if (!query.trim() || !activeConnection) return;

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/sql/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          connectionParams: {
            url: activeConnection.url,
            key: activeConnection.key
          }
        })
      });

      const result: SQLQueryResult = await response.json();
      const executionTime = Date.now() - startTime;

      setResult(result);

      // Add to history
      const historyItem: QueryHistory = {
        id: Date.now().toString(),
        query: query,
        timestamp: new Date(),
        executionTime,
        rowCount: result.rowCount,
        success: result.success,
        queryType: result.queryType
      };

      const updatedHistory = [historyItem, ...queryHistory.slice(0, 99)]; // Keep last 100
      setQueryHistory(updatedHistory);
      saveQueryHistory(updatedHistory);

    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Network error',
        rowCount: 0,
        executionTime: Date.now() - startTime,
        queryType: 'OTHER'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      executeQuery();
    }
    
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newQuery = query.substring(0, start) + '  ' + query.substring(end);
        setQuery(newQuery);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    setCursorPosition(e.target.selectionStart);
    
    // Auto-complete logic
    const word = getCurrentWord(e.target.value, e.target.selectionStart);
    if (word.length > 2) {
      const matches = SQL_KEYWORDS.filter(keyword => 
        keyword.toLowerCase().startsWith(word.toLowerCase())
      );
      setSuggestions(matches);
      setAutoCompleteOpen(matches.length > 0);
    } else {
      setAutoCompleteOpen(false);
    }
  };

  const getCurrentWord = (text: string, cursorPos: number): string => {
    const beforeCursor = text.substring(0, cursorPos);
    const words = beforeCursor.split(/\s+/);
    return words[words.length - 1] || '';
  };

  const insertSuggestion = (suggestion: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentWord = getCurrentWord(query, start);
      const newQuery = query.substring(0, start - currentWord.length) + 
                      suggestion + ' ' + query.substring(end);
      setQuery(newQuery);
      setAutoCompleteOpen(false);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start - currentWord.length + suggestion.length + 1;
        textarea.focus();
      }, 0);
    }
  };

  const formatQuery = () => {
    let formatted = query
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*;\s*/g, ';')
      .replace(/\bSELECT\b/gi, 'SELECT')
      .replace(/\bFROM\b/gi, '\nFROM')
      .replace(/\bWHERE\b/gi, '\nWHERE')
      .replace(/\bJOIN\b/gi, '\nJOIN')
      .replace(/\bLEFT JOIN\b/gi, '\nLEFT JOIN')
      .replace(/\bRIGHT JOIN\b/gi, '\nRIGHT JOIN')
      .replace(/\bINNER JOIN\b/gi, '\nINNER JOIN')
      .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
      .replace(/\bORDER BY\b/gi, '\nORDER BY')
      .replace(/\bHAVING\b/gi, '\nHAVING')
      .replace(/\bLIMIT\b/gi, '\nLIMIT')
      .trim();
    
    setQuery(formatted);
  };

  const clearQuery = () => {
    setQuery('');
    setResult(null);
  };

  const loadQueryFromHistory = (historyItem: QueryHistory) => {
    setQuery(historyItem.query);
    setShowHistory(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enhanced SQL Editor</h1>
            <p className="text-gray-600 mt-1">Advanced SQL editor with syntax highlighting and auto-completion</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowConnections(!showConnections)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              🔗 {activeConnection ? activeConnection.name : 'No Connection'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 min-h-screen">
          {/* Connection Panel */}
          {showConnections && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Connections</h3>
                <button
                  onClick={addConnection}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {connections.map((conn) => (
                  <button
                    key={conn.name}
                    onClick={() => setConnectionActive(conn)}
                    className={`w-full text-left p-2 rounded text-sm ${
                      conn.active 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    🔗 {conn.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Query History */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Query History</h3>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                {showHistory ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showHistory && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {queryHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadQueryFromHistory(item)}
                    className={`w-full text-left p-2 rounded text-xs ${
                      item.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <div className="font-medium">
                      {item.success ? '✅' : '❌'} {item.timestamp.toLocaleTimeString()}
                    </div>
                    <div className="truncate mt-1">{item.query}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {item.rowCount} rows • {item.executionTime}ms • {item.queryType}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Query Editor */}
          <div className="flex-1 bg-white border-b border-gray-200">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">SQL Query</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowTemplateSelector(true)}
                    className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded"
                  >
                    📋 Templates
                  </button>
                  <button
                    onClick={formatQuery}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    🎨 Format
                  </button>
                  <button
                    onClick={clearQuery}
                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
                  >
                    🗑️ Clear
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your SQL query here..."
                  className="w-full h-64 p-4 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ tabSize: 2 }}
                />

                {/* Auto-complete suggestions */}
                {autoCompleteOpen && suggestions.length > 0 && (
                  <div className="absolute top-full left-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => insertSuggestion(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm font-mono"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Press Cmd/Ctrl + Enter to execute • Tab for indentation
                </div>
                <button
                  onClick={executeQuery}
                  disabled={isExecuting || !query.trim() || !activeConnection}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                >
                  {isExecuting ? '⏳ Executing...' : '▶️ Execute Query'}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="flex-1 bg-gray-50">
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
                      {result.rowCount} rows • {result.executionTime}ms • {result.queryType}
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
                  <div className="border rounded-lg overflow-hidden bg-white">
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
                            <tr key={index} className="hover:bg-gray-50">
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
            </div>
          )}
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <SQLTemplateSelector
          onSelectTemplate={(query) => {
            setQuery(query);
            setShowTemplateSelector(false);
          }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
}
