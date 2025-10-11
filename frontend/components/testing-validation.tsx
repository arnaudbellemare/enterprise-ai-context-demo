/**
 * Testing Validation Component - Shows real vs mock execution
 */

'use client';

import React, { useState, useEffect } from 'react';
import { validateConfig } from '@/lib/config';

interface ValidationStatus {
  browserbase: {
    configured: boolean;
    lastTest?: string;
    result?: 'success' | 'error' | 'pending';
  };
  ace: {
    configured: boolean;
    lastTest?: string;
    result?: 'success' | 'error' | 'pending';
  };
  overall: 'real' | 'partial' | 'mock';
}

export default function TestingValidation() {
  const [validation, setValidation] = useState<ValidationStatus>({
    browserbase: { configured: false },
    ace: { configured: false },
    overall: 'mock'
  });

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      // Check Browserbase configuration
      const browserbaseConfigured = await testBrowserbaseConnection();
      
      // Check ACE/LLM configuration  
      const aceConfigured = await testACEConnection();
      
      const overall = browserbaseConfigured && aceConfigured ? 'real' : 
                     browserbaseConfigured || aceConfigured ? 'partial' : 'mock';
      
      setValidation({
        browserbase: { 
          configured: browserbaseConfigured,
          lastTest: new Date().toLocaleTimeString(),
          result: browserbaseConfigured ? 'success' : 'error'
        },
        ace: { 
          configured: aceConfigured,
          lastTest: new Date().toLocaleTimeString(), 
          result: aceConfigured ? 'success' : 'error'
        },
        overall
      });
      
    } catch (error) {
      console.error('Configuration validation failed:', error);
    }
  };

  const testBrowserbaseConnection = async (): Promise<boolean> => {
    try {
      // Test Browserbase API connection
      const response = await fetch('/api/test-browserbase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      return response.ok;
    } catch {
      return false;
    }
  };

  const testACEConnection = async (): Promise<boolean> => {
    try {
      // Test LLM API connection
      const response = await fetch('/api/llm-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Test connection' })
      });
      
      return response.ok;
    } catch {
      return false;
    }
  };

  const getStatusIcon = (result?: 'success' | 'error' | 'pending') => {
    switch (result) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getStatusColor = (overall: string) => {
    switch (overall) {
      case 'real': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'mock': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ fontFamily: 'monospace' }}>
          🧪 Testing Configuration
        </h3>
        <button
          onClick={checkConfiguration}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          style={{ fontFamily: 'monospace' }}
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Browserbase Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌐</span>
            <span className="font-medium" style={{ fontFamily: 'monospace' }}>
              Browserbase API
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>{getStatusIcon(validation.browserbase.result)}</span>
            <span className="text-sm text-gray-600">
              {validation.browserbase.configured ? 'Real' : 'Mock'}
            </span>
          </div>
        </div>

        {/* ACE/LLM Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            <span className="font-medium" style={{ fontFamily: 'monospace' }}>
              ACE Framework
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>{getStatusIcon(validation.ace.result)}</span>
            <span className="text-sm text-gray-600">
              {validation.ace.configured ? 'Real' : 'Mock'}
            </span>
          </div>
        </div>
      </div>

      {/* Overall Status */}
      <div className="mt-4 p-3 rounded">
        <div className="flex items-center justify-between">
          <span className="font-medium" style={{ fontFamily: 'monospace' }}>
            Overall Testing Mode:
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(validation.overall)}`}>
            {validation.overall === 'real' && '🎯 REAL TESTING'}
            {validation.overall === 'partial' && '⚠️ PARTIAL TESTING'}
            {validation.overall === 'mock' && '🎭 MOCK TESTING'}
          </span>
        </div>
        
        {validation.overall === 'mock' && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <p className="text-yellow-800">
              <strong>Note:</strong> Currently using mock data for demonstration. 
              Configure API keys in <code>.env.local</code> for real testing.
            </p>
          </div>
        )}
        
        {validation.overall === 'real' && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
            <p className="text-green-800">
              <strong>✅ Real Testing Active:</strong> All executions use actual APIs and provide real performance metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
