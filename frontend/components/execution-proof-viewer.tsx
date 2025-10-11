/**
 * Execution Proof Viewer - Shows verifiable evidence of task completion
 */

'use client';

import React, { useState } from 'react';

interface ExecutionProof {
  sessionId?: string;
  screenshots?: Array<{
    index: number;
    data: string;
    timestamp: string;
  }>;
  extractedData?: any;
  verification?: {
    taskDescription: string;
    targetUrl: string;
    dataPoints: number;
    timestamp: string;
    sessionId: string;
  };
  logs: string[];
  result: string;
  isReal: boolean;
  proofOfExecution?: boolean;
}

interface Props {
  proof: ExecutionProof;
  provider: string;
}

export default function ExecutionProofViewer({ proof, provider }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'screenshots' | 'data' | 'logs'>('overview');
  const [selectedScreenshot, setSelectedScreenshot] = useState<number>(0);

  if (!proof || !proof.proofOfExecution) {
    return null;
  }

  return (
    <div className="mt-4 border-t-2 border-green-200 pt-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">✅</span>
        <h4 className="text-lg font-semibold text-green-800" style={{ fontFamily: 'monospace' }}>
          Verified Execution Proof
        </h4>
        <span className="ml-auto px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          {proof.isReal ? '🔒 REAL EXECUTION' : '⚠️ SIMULATED'}
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        {(['overview', 'screenshots', 'data', 'logs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === tab
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{ fontFamily: 'monospace' }}
          >
            {tab === 'overview' && '📋 Overview'}
            {tab === 'screenshots' && '📸 Screenshots'}
            {tab === 'data' && '📊 Extracted Data'}
            {tab === 'logs' && '📝 Execution Logs'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border-2 border-green-200 p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold text-sm text-gray-700 mb-2">Verification Details:</h5>
              <div className="bg-gray-50 rounded p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Session ID:</span>
                  <code className="bg-gray-200 px-2 py-1 rounded">{proof.verification?.sessionId}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Target URL:</span>
                  <a 
                    href={proof.verification?.targetUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {proof.verification?.targetUrl}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Points Extracted:</span>
                  <span className="font-semibold">{proof.verification?.dataPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Execution Time:</span>
                  <span className="font-semibold">{proof.verification?.timestamp}</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-sm text-gray-700 mb-2">Task Completion:</h5>
              <div className="bg-green-50 rounded p-3 text-sm text-green-800 whitespace-pre-wrap">
                {proof.result}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => downloadProofReport(proof, provider)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                style={{ fontFamily: 'monospace' }}
              >
                📥 Download Full Report
              </button>
              <button
                onClick={() => verifyWithBrowserbase(proof.verification?.sessionId)}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                style={{ fontFamily: 'monospace' }}
              >
                🔍 Verify on Browserbase
              </button>
            </div>
          </div>
        )}

        {activeTab === 'screenshots' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-2">
              Real screenshots captured during execution as proof of task completion:
            </p>
            
            {proof.screenshots && proof.screenshots.length > 0 ? (
              <>
                <div className="flex gap-2 mb-2">
                  {proof.screenshots.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedScreenshot(index)}
                      className={`px-3 py-1 rounded ${
                        selectedScreenshot === index
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Screenshot {index + 1}
                    </button>
                  ))}
                </div>
                
                <div className="border-2 border-gray-300 rounded overflow-hidden">
                  <img
                    src={proof.screenshots[selectedScreenshot].data}
                    alt={`Screenshot ${selectedScreenshot + 1}`}
                    className="w-full h-auto"
                  />
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  Captured at: {proof.screenshots[selectedScreenshot].timestamp}
                </p>

                <button
                  onClick={() => downloadScreenshot(proof.screenshots![selectedScreenshot], provider)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  💾 Download Screenshot {selectedScreenshot + 1}
                </button>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">No screenshots available</p>
            )}
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-2">
              Data extracted from the live web page:
            </p>
            
            {proof.extractedData && Object.keys(proof.extractedData).length > 0 ? (
              <>
                <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 text-gray-700">Field</th>
                        <th className="text-left py-2 px-2 text-gray-700">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(proof.extractedData).map(([key, value]) => (
                        <tr key={key} className="border-b">
                          <td className="py-2 px-2 font-semibold text-gray-700">{key}</td>
                          <td className="py-2 px-2 text-gray-600">
                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => downloadData(proof.extractedData, provider)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  📥 Download as JSON
                </button>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">No data extracted</p>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-2">
              Complete execution trace:
            </p>
            
            <div className="bg-gray-900 text-green-400 rounded p-4 max-h-96 overflow-y-auto font-mono text-sm">
              {proof.logs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-500">[{index + 1}]</span> {log}
                </div>
              ))}
            </div>

            <button
              onClick={() => downloadLogs(proof.logs, provider)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              📥 Download Logs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function downloadProofReport(proof: ExecutionProof, provider: string) {
  const report = {
    provider,
    timestamp: new Date().toISOString(),
    verification: proof.verification,
    result: proof.result,
    extractedData: proof.extractedData,
    logs: proof.logs,
    screenshotCount: proof.screenshots?.length || 0,
    isReal: proof.isReal
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `execution-proof-${provider}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadScreenshot(screenshot: { data: string; timestamp: string }, provider: string) {
  const a = document.createElement('a');
  a.href = screenshot.data;
  a.download = `screenshot-${provider}-${Date.now()}.png`;
  a.click();
}

function downloadData(data: any, provider: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `extracted-data-${provider}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadLogs(logs: string[], provider: string) {
  const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `execution-logs-${provider}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function verifyWithBrowserbase(sessionId?: string) {
  if (sessionId) {
    window.open(`https://www.browserbase.com/sessions/${sessionId}`, '_blank');
  } else {
    alert('Session ID not available');
  }
}
