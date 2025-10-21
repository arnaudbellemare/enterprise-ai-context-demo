'use client';

import React, { useState, useEffect } from 'react';
import { lancedb } from '../../lib/lancedb-integration';

interface SystemInsights {
  brain_queries: { count: number; error?: string };
  creative_patterns: { count: number; error?: string };
  multimodal_docs: { count: number; error?: string };
  sql_queries: { count: number; error?: string };
  evaluations: { count: number; error?: string };
}

interface TopQuery {
  id: string;
  content: string;
  quality_score: number;
  domain: string;
  timestamp: string;
}

export default function LanceDBAnalytics() {
  const [insights, setInsights] = useState<SystemInsights | null>(null);
  const [topQueries, setTopQueries] = useState<TopQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Initialize LanceDB
      await lancedb.initialize();
      
      // Get system insights
      const systemInsights = await lancedb.getSystemInsights();
      setInsights(systemInsights);
      
      // Get top performing queries
      const topPerforming = await lancedb.getTopPerformingQueries(10);
      setTopQueries(topPerforming);
      
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (count: number, error?: string) => {
    if (error) return 'text-red-600 bg-red-50';
    if (count > 0) return 'text-green-600 bg-green-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getStatusIcon = (count: number, error?: string) => {
    if (error) return '❌';
    if (count > 0) return '✅';
    return '⚠️';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LanceDB Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">LanceDB Connection Failed</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LanceDB Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Vector search insights and system performance</p>
            </div>
            <button
              onClick={loadAnalytics}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {insights && Object.entries(insights).map(([tableName, data]) => (
            <div key={tableName} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 capitalize">
                  {tableName.replace('_', ' ')}
                </h3>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(data.count, data.error)}`}>
                  {getStatusIcon(data.count, data.error)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Records:</span>
                  <span className="font-medium">{data.count.toLocaleString()}</span>
                </div>
                
                {data.error && (
                  <div className="text-red-600 text-sm">
                    Error: {data.error}
                  </div>
                )}
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((data.count / 1000) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Performing Queries */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Top Performing Queries</h2>
            <p className="text-gray-600 mt-1">Highest quality queries from your system</p>
          </div>
          
          <div className="p-6">
            {topQueries.length > 0 ? (
              <div className="space-y-4">
                {topQueries.map((query, index) => (
                  <div key={query.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            query.quality_score > 0.8 ? 'bg-green-100 text-green-800' :
                            query.quality_score > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {(query.quality_score * 100).toFixed(1)}% Quality
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {query.domain}
                          </span>
                        </div>
                        
                        <p className="text-gray-900 mb-2 line-clamp-2">
                          {query.content}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>ID: {query.id}</span>
                          <span>•</span>
                          <span>{new Date(query.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <p className="text-gray-600">No queries found. Start using the system to see analytics!</p>
              </div>
            )}
          </div>
        </div>

        {/* Vector Search Features */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 Vector Search Capabilities</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-green-600">✅</span>
                <span>Semantic query similarity</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600">✅</span>
                <span>Creative pattern matching</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600">✅</span>
                <span>Multimodal content search</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600">✅</span>
                <span>SQL query recommendations</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600">✅</span>
                <span>Quality-based ranking</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🚀 System Integration</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-blue-600">🧠</span>
                <span>Enhanced Brain System</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-purple-600">🎨</span>
                <span>Creative Reasoning</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600">📄</span>
                <span>Multimodal RAG</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-orange-600">🗄️</span>
                <span>SQL Editor</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-red-600">📊</span>
                <span>Evaluation System</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
