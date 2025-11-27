'use client';

import { useState, useEffect } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
}

interface Classification {
  template: {
    id: string;
    name: string;
    description: string;
    priority: number;
  };
  confidence: number;
  reasoning: string;
  entities: {
    dates?: string[];
    amounts?: string[];
    locations?: string[];
    people?: string[];
    documents?: string[];
  };
}

interface ConnectedAccount {
  id: string;
  provider: string;
  email: string;
  connected: boolean;
  lastSync?: string;
}

interface FetchedEmail {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  classification?: {
    template: string;
    templateId: string;
    confidence: number;
  };
}

export default function EmailTestingPage() {
  const [emailText, setEmailText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [classification, setClassification] = useState<Classification | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [method, setMethod] = useState<'rule-based' | 'llm' | 'hybrid'>('hybrid');
  const [isLoading, setIsLoading] = useState(false);
  const [labeledExamples, setLabeledExamples] = useState<any[]>([]);
  const [showLabeling, setShowLabeling] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [fetchedEmails, setFetchedEmails] = useState<FetchedEmail[]>([]);
  const [showEmailConnection, setShowEmailConnection] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [batchEmails, setBatchEmails] = useState<string>('');
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [showBatchProcessing, setShowBatchProcessing] = useState(false);
  const [autoLearn, setAutoLearn] = useState(true);

  useEffect(() => {
    // Load templates
    fetch('/api/email-classify')
      .then(res => res.json())
      .then(data => {
        setTemplates(data.templates || []);
        if (data.templates && data.templates.length > 0) {
          setSelectedTemplate(data.templates[0].id);
        }
      })
      .catch(err => console.error('Failed to load templates:', err));

    // Load labeled examples
    loadLabeledExamples();

    // Load connected accounts
    loadConnectedAccounts();

    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail_connected') === 'true') {
      const email = params.get('email');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      if (email && accessToken) {
        connectGmailAccount(email, accessToken, refreshToken || '');
        // Clean URL
        window.history.replaceState({}, '', '/email-testing');
      }
    }
  }, []);

  const loadLabeledExamples = async () => {
    try {
      const res = await fetch('/api/email-label');
      const data = await res.json();
      setLabeledExamples(data.examples || []);
    } catch (err) {
      console.error('Failed to load examples:', err);
    }
  };

  const loadConnectedAccounts = async () => {
    try {
      const res = await fetch('/api/email-connect');
      const data = await res.json();
      setConnectedAccounts(data.accounts || []);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const connectGmail = async () => {
    try {
      const res = await fetch('/api/email-oauth/gmail?action=auth');
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert('Gmail OAuth not configured. Please set GMAIL_CLIENT_ID in environment variables.');
      }
    } catch (err: any) {
      alert('Failed to connect Gmail: ' + err.message);
    }
  };

  const connectGmailAccount = async (email: string, accessToken: string, refreshToken: string) => {
    try {
      const res = await fetch('/api/email-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gmail',
          email,
          config: {
            accessToken,
            refreshToken
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Gmail account connected successfully!');
        loadConnectedAccounts();
      }
    } catch (err: any) {
      alert('Failed to save account: ' + err.message);
    }
  };

  const fetchEmails = async () => {
    if (!selectedAccount) {
      alert('Please select an account first');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/email-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount,
          maxResults: 20,
          autoClassify: true
        })
      });

      const data = await res.json();
      if (data.success) {
        setFetchedEmails(data.emails || []);
        alert(`Fetched ${data.count} emails`);
      } else {
        alert('Failed to fetch emails: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const useFetchedEmail = (email: FetchedEmail) => {
    setEmailText(`${email.subject}\n\n${email.body}`);
    if (email.classification) {
      setSelectedTemplate(email.classification.templateId);
    }
  };

  const handleBatchClassify = async () => {
    if (!batchEmails.trim()) {
      alert('Please enter emails (one per line or separated by blank lines)');
      return;
    }

    // Parse emails (split by double newlines or detect email boundaries)
    const emailTexts = batchEmails
      .split(/\n\s*\n/) // Split by blank lines
      .map(e => e.trim())
      .filter(e => e.length > 10); // Filter out very short entries

    if (emailTexts.length === 0) {
      alert('No valid emails found. Separate emails with blank lines.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/email-classify-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: emailTexts.map((text, idx) => ({ text, id: `batch-${idx}` })),
          method,
          useFewShot: true,
          autoLearn,
          minConfidenceForLearning: 0.8
        })
      });

      const data = await res.json();
      if (data.success) {
        setBatchResults(data.classifications || []);
        const stats = data.stats || {};
        const message = data.metadata?.partial 
          ? `Partially classified ${stats.total} emails (some failed). ${stats.learned || 0} high-confidence emails learned.`
          : `Classified ${stats.total} emails. ${stats.learned || 0} high-confidence emails learned automatically!`;
        alert(message);
        loadLabeledExamples(); // Refresh examples count
      } else {
        const errorMsg = data.error || 'Unknown error';
        const details = data.details ? `\n\nDetails: ${data.details}` : '';
        alert('Batch classification failed: ' + errorMsg + details);
        console.error('Batch classification error:', data);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassify = async () => {
    if (!emailText.trim()) {
      alert('Please enter email text');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/email-classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailText,
          method,
          useFewShot: true
        })
      });

      const data = await res.json();
      if (data.success) {
        setClassification(data.classification);
      } else {
        alert('Classification failed: ' + data.error);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLabel = async () => {
    if (!emailText.trim() || !selectedTemplate) {
      alert('Please enter email text and select a template');
      return;
    }

    try {
      const res = await fetch('/api/email-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailText,
          templateId: selectedTemplate,
          confidence: 1.0,
          action: 'add'
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Labeled successfully! Total examples: ${data.totalExamples}`);
        loadLabeledExamples();
        setEmailText(''); // Clear for next email
      } else {
        alert('Labeling failed: ' + data.error);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const sampleEmails = [
    {
      text: 'Hi, I need to get my lease document notarized. Can you help me schedule an appointment?',
      template: 'notary-document'
    },
    {
      text: 'The faucet in apartment 3B is leaking. Please send a plumber as soon as possible.',
      template: 'work-building'
    },
    {
      text: 'I have a question about my rent payment. Can you clarify the amount due?',
      template: 'customer-request'
    },
    {
      text: 'Here is the monthly financial report for March 2024. Total revenue: $45,000.',
      template: 'financial-report'
    }
  ];

  const loadSample = (sample: typeof sampleEmails[0]) => {
    setEmailText(sample.text);
    setSelectedTemplate(sample.template);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Email Template Testing & Labeling</h1>

        {/* Method Selection */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium mb-2">Classification Method:</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="rule-based"
                checked={method === 'rule-based'}
                onChange={(e) => setMethod(e.target.value as any)}
                className="mr-2"
              />
              Rule-Based (Fast)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="llm"
                checked={method === 'llm'}
                onChange={(e) => setMethod(e.target.value as any)}
                className="mr-2"
              />
              LLM (Accurate)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="hybrid"
                checked={method === 'hybrid'}
                onChange={(e) => setMethod(e.target.value as any)}
                className="mr-2"
              />
              Hybrid (Recommended)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Email Input */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Email Input</h2>
            
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Paste email text here..."
              className="w-full h-48 p-3 border rounded-lg mb-4"
            />

            {/* Sample Emails */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Sample Emails:</label>
              <div className="space-y-2">
                {sampleEmails.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadSample(sample)}
                    className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  >
                    {sample.text.substring(0, 60)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={handleClassify}
                disabled={isLoading || !emailText.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Classifying...' : 'Classify Email'}
              </button>
              <button
                onClick={() => setShowLabeling(!showLabeling)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {showLabeling ? 'Hide' : 'Show'} Labeling
              </button>
            </div>

            {/* Batch Processing Toggle */}
            <button
              onClick={() => setShowBatchProcessing(!showBatchProcessing)}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mb-2"
            >
              {showBatchProcessing ? 'Hide' : 'Show'} Batch Processing (Multiple Emails)
            </button>

            {/* Batch Processing Section */}
            {showBatchProcessing && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <h3 className="font-semibold mb-2">Batch Email Classification</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Paste multiple emails (separate with blank lines). The system will learn from high-confidence classifications automatically.
                </p>
                
                <textarea
                  value={batchEmails}
                  onChange={(e) => setBatchEmails(e.target.value)}
                  placeholder="Email 1 text here...&#10;&#10;Email 2 text here...&#10;&#10;Email 3 text here..."
                  className="w-full h-48 p-3 border rounded-lg mb-3"
                />

                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={autoLearn}
                    onChange={(e) => setAutoLearn(e.target.checked)}
                    className="mr-2"
                    id="autoLearn"
                  />
                  <label htmlFor="autoLearn" className="text-sm">
                    Auto-learn from high-confidence classifications (≥80%)
                  </label>
                </div>

                <button
                  onClick={handleBatchClassify}
                  disabled={isLoading || !batchEmails.trim()}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : `Classify ${batchEmails.split(/\n\s*\n/).filter(e => e.trim().length > 10).length} Emails`}
                </button>
              </div>
            )}

            {/* Batch Results */}
            {batchResults.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Batch Results ({batchResults.length} emails)</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {batchResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white rounded border text-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{result.template.name}</div>
                          <div className="text-xs text-gray-600">{result.emailPreview}</div>
                          <div className="mt-1">
                            <span className={`text-xs px-2 py-1 rounded ${
                              result.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                              result.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {(result.confidence * 100).toFixed(0)}% confidence
                            </span>
                            {result.learned && (
                              <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                ✓ Learned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Labeling Section */}
            {showLabeling && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <label className="block text-sm font-medium mb-2">Select Template:</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleLabel}
                  disabled={!emailText.trim() || !selectedTemplate}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Label Email
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Classification Results</h2>

            {classification ? (
              <div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Template:</span>
                    <span className="text-blue-600">{classification.template.name}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Confidence:</span>
                    <span className={`font-bold ${
                      classification.confidence > 0.7 ? 'text-green-600' :
                      classification.confidence > 0.5 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {(classification.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Reasoning:</span>
                    <p className="text-sm text-gray-600 mt-1">{classification.reasoning}</p>
                  </div>
                </div>

                {/* Extracted Entities */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Extracted Entities:</h3>
                  {Object.entries(classification.entities).map(([key, values]) => {
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
            ) : (
              <p className="text-gray-500">No classification yet. Enter an email and click "Classify Email".</p>
            )}

            {/* Labeled Examples Count */}
            <div className="mt-6 border-t pt-4">
              <h3 className="font-semibold mb-2">Labeled Examples:</h3>
              <p className="text-sm text-gray-600">{labeledExamples.length} examples stored</p>
              {labeledExamples.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto">
                  {labeledExamples.slice(0, 5).map((ex, idx) => (
                    <div key={idx} className="text-xs bg-gray-100 p-2 rounded mb-1">
                      <span className="font-medium">{ex.template}:</span> {ex.email.substring(0, 50)}...
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

