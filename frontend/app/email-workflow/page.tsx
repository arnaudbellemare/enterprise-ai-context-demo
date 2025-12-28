'use client';

import { useState } from 'react';

interface EmailAnalysis {
  classification: {
    template: {
      id: string;
      name: string;
      priority: number;
    };
    confidence: number;
    reasoning: string;
    entities: any;
  };
  context: {
    urgency: string;
    requiresResponseAction: boolean;
    suggestedActions: string[];
  };
}

interface GeneratedResponse {
  subject: string;
  body: string;
  suggestedActions: string[];
  priority: number;
  requiresHumanReview: boolean;
}

export default function EmailWorkflowPage() {
  const [emailInput, setEmailInput] = useState('');
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);
  const [response, setResponse] = useState<GeneratedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useLLM, setUseLLM] = useState(true);

  const handleAnalyze = async () => {
    if (!emailInput.trim()) {
      alert('Please enter email text');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/email-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: {
            from: 'sender@example.com',
            subject: 'Email Subject',
            body: emailInput
          },
          useLLM,
          generateResponse: true
        })
      });

      const data = await res.json();
      if (data.success) {
        setAnalysis(data.analysis);
        setResponse(data.response);
      } else {
        alert('Analysis failed: ' + data.error);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Email Workflow - Analyze & Respond</h1>

        {/* Configuration */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useLLM}
              onChange={(e) => setUseLLM(e.target.checked)}
              className="mr-2"
            />
            Use LLM for enhanced understanding and response generation
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Email Input */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Email Input</h2>
            
            <textarea
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Paste incoming email here..."
              className="w-full h-64 p-3 border rounded-lg mb-4"
            />

            <button
              onClick={handleAnalyze}
              disabled={isLoading || !emailInput.trim()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Analyzing...' : 'Analyze & Generate Response'}
            </button>
          </div>

          {/* Right: Analysis & Response */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Analysis & Response</h2>

            {analysis && (
              <div className="mb-6">
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Template:</span>
                    <span className="text-blue-600">{analysis.classification.template.name}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Confidence:</span>
                    <span className={`font-bold ${
                      analysis.classification.confidence > 0.7 ? 'text-green-600' :
                      analysis.classification.confidence > 0.5 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {(analysis.classification.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Urgency:</span>
                    <span className={`font-bold ${
                      analysis.context.urgency === 'critical' ? 'text-red-600' :
                      analysis.context.urgency === 'high' ? 'text-orange-600' :
                      analysis.context.urgency === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {analysis.context.urgency.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium">Reasoning:</span>
                    <p className="text-sm text-gray-600">{analysis.classification.reasoning}</p>
                  </div>
                </div>

                {/* Extracted Entities */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Extracted Information:</h3>
                  {Object.entries(analysis.classification.entities).map(([key, values]: [string, any]) => {
                    if (!values || values.length === 0) return null;
                    return (
                      <div key={key} className="mb-2">
                        <span className="text-sm font-medium capitalize">{key}:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {values.map((val: string, idx: number) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {val}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Generated Response */}
            {response && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Generated Response</h3>
                  {response.requiresHumanReview && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Requires Review
                    </span>
                  )}
                </div>
                
                <div className="mb-2">
                  <label className="text-sm font-medium">Subject:</label>
                  <input
                    type="text"
                    value={response.subject}
                    readOnly
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>

                <div className="mb-2">
                  <label className="text-sm font-medium">Body:</label>
                  <textarea
                    value={response.body}
                    readOnly
                    className="w-full h-64 p-2 border rounded text-sm font-mono"
                  />
                </div>

                {/* Suggested Actions */}
                {response.suggestedActions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Suggested Actions:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {response.suggestedActions.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(response.body)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Copy Response
                  </button>
                  <button
                    onClick={() => {
                      const mailtoLink = `mailto:?subject=${encodeURIComponent(response.subject)}&body=${encodeURIComponent(response.body)}`;
                      window.open(mailtoLink);
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Open in Email Client
                  </button>
                </div>
              </div>
            )}

            {!analysis && (
              <p className="text-gray-500">Enter an email and click "Analyze & Generate Response" to see results.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




