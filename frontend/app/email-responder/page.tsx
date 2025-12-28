'use client';

import { useState, useEffect } from 'react';

interface ConnectedAccount {
  id: string;
  email: string;
  provider: string;
  isActive: boolean;
}

interface FetchedEmail {
  id: string;
  subject: string;
  from: string;
  fromName: string;
  date: string;
  snippet: string;
  body: string;
  isUnread: boolean;
  aiResponse?: ClassificationResult;
  loadingAI?: boolean;
}

interface ClassificationResult {
  classification: {
    template: {
      id: string;
      name: string;
      priority: number;
      description: string;
    };
    confidence: number;
    reasoning: string;
    extractedEntities: {
      dates?: string[];
      amounts?: string[];
      locations?: string[];
      people?: string[];
      documents?: string[];
      phoneNumbers?: string[];
    };
  };
  generatedResponse: {
    subject: string;
    body: string;
    priority: number;
    requiresHumanReview: boolean;
  };
  metadata: {
    processingTime: number;
    confidence: number;
    templateUsed: string;
    optimizationApplied?: string[];
  };
}

export default function EmailResponderPage() {
  const [emailText, setEmailText] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [fetchedEmails, setFetchedEmails] = useState<FetchedEmail[]>([]);
  const [showEmailFetch, setShowEmailFetch] = useState(false);

  useEffect(() => {
    loadConnectedAccounts();
    checkOAuthCallback();
    autoFetchEmails(); // Auto-fetch on page load
  }, []);

  const autoFetchEmails = async () => {
    setLoading(true);
    try {
      // Fetch emails using the token from .env.local
      const token = process.env.NEXT_PUBLIC_MICROSOFT_GRAPH_ACCESS_TOKEN ||
                    (await fetch('/api/email-connect').then(r => r.json()).then(d => d.token));

      const res = await fetch('/api/email-graph-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: token,
          maxResults: 20
        })
      });

      const data = await res.json();
      if (data.success) {
        setFetchedEmails(data.emails || []);
        setShowEmailFetch(true);

        // Auto-generate AI responses for each email
        (data.emails || []).forEach((email: FetchedEmail) => {
          generateAIResponse(email);
        });
      }
    } catch (err) {
      console.error('Auto-fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAIResponse = async (email: FetchedEmail) => {
    // Mark as loading
    setFetchedEmails(prev => prev.map(e =>
      e.id === email.id ? { ...e, loadingAI: true } : e
    ));

    try {
      const response = await fetch('/api/email/classify-and-respond?palimpzest=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: email.from,
          to: 'info@gestionvelora.com',
          subject: email.subject,
          body: email.body || email.snippet,
        }),
      });

      const data = await response.json();

      // Update email with AI response
      setFetchedEmails(prev => prev.map(e =>
        e.id === email.id ? { ...e, aiResponse: data, loadingAI: false } : e
      ));
    } catch (err) {
      console.error('AI response generation failed:', err);
      setFetchedEmails(prev => prev.map(e =>
        e.id === email.id ? { ...e, loadingAI: false } : e
      ));
    }
  };

  const checkOAuthCallback = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('outlook_connected') === 'true') {
      alert(`✅ Outlook connected: ${params.get('email')}`);
      window.history.replaceState({}, '', '/email-responder');
      loadConnectedAccounts();
    } else if (params.get('error')) {
      alert(`❌ Connection failed: ${params.get('error')}`);
      window.history.replaceState({}, '', '/email-responder');
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

  const connectOutlook = async () => {
    try {
      const res = await fetch('/api/email-oauth/outlook?action=auth');
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert('Outlook OAuth not configured. Please check environment variables.');
      }
    } catch (err: any) {
      alert('Failed to connect Outlook: ' + err.message);
    }
  };

  const fetchEmailsFromOutlook = async (accountId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/email-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          maxResults: 20,
          autoClassify: false
        })
      });

      const data = await res.json();
      if (data.success) {
        // Transform old format to new format
        const transformedEmails = (data.emails || []).map((email: any) => ({
          id: email.id,
          subject: email.subject,
          from: email.from?.emailAddress?.address || email.from,
          fromName: email.from?.emailAddress?.name || '',
          date: email.receivedDateTime || email.date,
          snippet: email.bodyPreview || email.snippet,
          body: email.body || email.bodyPreview || email.snippet,
          isUnread: email.isUnread || !email.isRead
        }));
        setFetchedEmails(transformedEmails);
        setShowEmailFetch(true);
        alert(`✅ Fetched ${data.count} emails from Outlook`);
      } else {
        alert('❌ Failed to fetch emails: ' + data.error);
      }
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const useEmail = (email: FetchedEmail) => {
    setEmailText(email.body || email.snippet);
    setFromEmail(email.from);
    setSubject(email.subject);
    if (email.aiResponse) {
      setResult(email.aiResponse);
    }
    setShowEmailFetch(false);
  };

  const handlePaste = async () => {
    if (!emailText.trim()) {
      setError('Please paste an email first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Try to extract from/subject from pasted text if not provided
      let extractedFrom = fromEmail;
      let extractedSubject = subject;

      if (!extractedFrom) {
        const fromMatch = emailText.match(/From:\s*(.+)/i) || 
                         emailText.match(/De:\s*(.+)/i) ||
                         emailText.match(/^(.+@.+\..+)/);
        extractedFrom = fromMatch ? fromMatch[1].trim() : 'unknown@example.com';
      }

      if (!extractedSubject) {
        const subjectMatch = emailText.match(/Subject:\s*(.+)/i) || 
                            emailText.match(/Objet:\s*(.+)/i) ||
                            emailText.match(/Sujet:\s*(.+)/i);
        extractedSubject = subjectMatch ? subjectMatch[1].trim() : 'No Subject';
      }

      const response = await fetch('/api/email/classify-and-respond?palimpzest=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: extractedFrom,
          to: 'info@gestionvelora.com',
          subject: extractedSubject,
          body: emailText,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          const text = await response.text();
          throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
        }
        throw new Error(errorData.error || errorData.message || 'Failed to process email');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Error processing email:', err);
      setError(err.message || 'An error occurred while processing the email');
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (result?.generatedResponse) {
      const fullResponse = `Subject: ${result.generatedResponse.subject}\n\n${result.generatedResponse.body}`;
      navigator.clipboard.writeText(fullResponse);
      alert('Response copied to clipboard!');
    }
  };

  const copyBodyOnly = () => {
    if (result?.generatedResponse) {
      navigator.clipboard.writeText(result.generatedResponse.body);
      alert('Response body copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* OUTLOOK CONNECTION SECTION */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            📧 Connect Your Outlook Account
          </h2>

          {connectedAccounts.length === 0 ? (
            <div className="space-y-3">
              <p className="text-gray-700">Connect info@gestionvelora.com to auto-fetch and process emails with AI</p>
              <button
                onClick={connectOutlook}
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                🔗 Connect Outlook Account
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white rounded-md p-4 border border-green-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-green-700">✅ Connected</div>
                    <div className="text-sm text-gray-600">{connectedAccounts[0]?.email}</div>
                  </div>
                  <button
                    onClick={() => fetchEmailsFromOutlook(connectedAccounts[0]?.id)}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {loading ? 'Fetching...' : '📨 Fetch Emails'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* EMAIL HISTORY WITH AI RESPONSES */}
        {showEmailFetch && fetchedEmails.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📬 Email History ({fetchedEmails.length}) - Auto AI Response Suggestions
            </h2>
            <div className="space-y-4">
              {fetchedEmails.map((email, idx) => (
                <div
                  key={email.id || idx}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  {/* Email Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-lg text-gray-900">{email.subject}</div>
                      <div className="text-sm text-gray-600">
                        From: <span className="font-medium">{email.fromName || email.from}</span> ({email.from})
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(email.date).toLocaleString()}
                      </div>
                    </div>
                    {email.isUnread && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Unread</span>
                    )}
                  </div>

                  {/* Email Preview */}
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md mb-3">
                    {email.snippet.substring(0, 150)}...
                  </div>

                  {/* AI Response Section */}
                  {email.loadingAI && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-center">
                      <div className="text-yellow-800">🤖 Generating AI response...</div>
                    </div>
                  )}

                  {email.aiResponse && !email.loadingAI && (
                    <div className="bg-green-50 border-2 border-green-300 rounded-md p-4 mt-3">
                      <div className="font-semibold text-green-900 mb-2">
                        ✨ AI Suggested Response
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="bg-white p-2 rounded">
                          <span className="text-gray-600">Template:</span>{' '}
                          <span className="font-medium">{email.aiResponse.classification.template.name}</span>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <span className="text-gray-600">Confidence:</span>{' '}
                          <span className="font-medium">{(email.aiResponse.classification.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-md p-3 mb-2">
                        <div className="text-xs font-medium text-gray-600 mb-1">Subject:</div>
                        <div className="text-sm font-semibold">{email.aiResponse.generatedResponse.subject}</div>
                      </div>
                      <div className="bg-white rounded-md p-3 mb-2">
                        <div className="text-xs font-medium text-gray-600 mb-1">Response:</div>
                        <div className="text-sm whitespace-pre-wrap font-mono">
                          {email.aiResponse.generatedResponse.body.substring(0, 200)}...
                        </div>
                      </div>
                      <button
                        onClick={() => useEmail(email)}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
                      >
                        📋 View Full Response & Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Email Auto-Responder
          </h1>
          <p className="text-gray-600 mb-6">
            Or paste an email manually below and get an automated response
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email (optional - will be extracted if not provided)
              </label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="tenant@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject (optional - will be extracted if not provided)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Content (paste full email here)
              </label>
              <textarea
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                placeholder="Paste the email content here...&#10;&#10;Example:&#10;From: tenant@example.com&#10;Subject: Dégât d'eau - Unité 1507&#10;&#10;Bonjour Arnaud,&#10;Je vous écris concernant..."
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>

          <button
            onClick={handlePaste}
            disabled={loading || !emailText.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : 'Generate Response'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-6">
            {/* Classification Results */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Classification Results
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-blue-50 rounded-md">
                  <div className="text-sm text-gray-600">Template</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {result.classification.template.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {result.classification.template.description}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-md">
                  <div className="text-sm text-gray-600">Confidence</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {(result.classification.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Priority: {result.classification.template.priority}/10
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Reasoning</div>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {result.classification.reasoning}
                </div>
              </div>

              {/* Extracted Entities */}
              {((result.classification.extractedEntities.locations && result.classification.extractedEntities.locations.length > 0) ||
                (result.classification.extractedEntities.dates && result.classification.extractedEntities.dates.length > 0) ||
                (result.classification.extractedEntities.people && result.classification.extractedEntities.people.length > 0)) && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Extracted Information</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    {(result.classification.extractedEntities.locations && result.classification.extractedEntities.locations.length > 0) && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-medium">Locations: </span>
                        {result.classification.extractedEntities.locations.join(', ')}
                      </div>
                    )}
                    {(result.classification.extractedEntities.dates && result.classification.extractedEntities.dates.length > 0) && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-medium">Dates: </span>
                        {result.classification.extractedEntities.dates.join(', ')}
                      </div>
                    )}
                    {(result.classification.extractedEntities.people && result.classification.extractedEntities.people.length > 0) && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-medium">People: </span>
                        {result.classification.extractedEntities.people.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Generated Response */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Generated Response
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={copyBodyOnly}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                  >
                    Copy Body
                  </button>
                  <button
                    onClick={copyResponse}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Copy Full Response
                  </button>
                </div>
              </div>

              {result.generatedResponse.requiresHumanReview && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <span className="text-yellow-800 font-medium">
                      ⚠️ Requires Human Review
                    </span>
                  </div>
                  <div className="text-sm text-yellow-700 mt-1">
                    This response should be reviewed before sending due to low confidence or high priority.
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Subject</div>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {result.generatedResponse.subject}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Body</div>
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-200 whitespace-pre-wrap font-mono text-sm">
                    {result.generatedResponse.body}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Processing time: {result.metadata.processingTime}ms | 
                Template: {result.metadata.templateUsed}
              </div>
              
              {result.metadata.optimizationApplied && result.metadata.optimizationApplied.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <div className="text-sm font-medium text-purple-800 mb-1">
                    ⚡ PALIMPZEST Optimizations Applied
                  </div>
                  <div className="text-xs text-purple-700 space-y-1">
                    {result.metadata.optimizationApplied.map((opt, idx) => (
                      <div key={idx}>• {opt}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

