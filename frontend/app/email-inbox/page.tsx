'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EmailAccount {
  id: string;
  provider: 'gmail' | 'outlook' | 'imap';
  email: string;
  connected: boolean;
  lastSync?: string;
  connectedAt?: string;
}

interface Email {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  html?: string;
  snippet: string;
  isUnread: boolean;
  classification?: {
    template: string;
    templateId: string;
    confidence: number;
    reasoning?: string;
  };
}

export default function EmailInboxPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectProvider, setConnectProvider] = useState<'gmail' | 'outlook' | 'imap'>('outlook');
  const [imapConfig, setImapConfig] = useState({
    email: '',
    host: '',
    port: 993,
    username: '',
    password: '',
    tls: true
  });
  const [autoResponses, setAutoResponses] = useState<Record<string, any>>({});
  const [learningInsights, setLearningInsights] = useState<any>(null);
  const [generatingResponses, setGeneratingResponses] = useState(false);
  const [showOnlyWaiting, setShowOnlyWaiting] = useState(true); // Filter to show only emails waiting for response

  useEffect(() => {
    loadAccounts();
    
    // Check for OAuth callback success or errors
    const params = new URLSearchParams(window.location.search);
    
    // Handle success
    if (params.get('outlook_connected') === 'true') {
      const accountId = params.get('account_id');
      const email = params.get('email');
      if (accountId) {
        alert(`✅ Outlook account connected: ${email}`);
        // Clean up URL
        window.history.replaceState({}, '', '/email-inbox');
        loadAccounts();
        if (accountId) {
          setSelectedAccount(accountId);
        }
      }
    }
    
    // Handle errors
    const error = params.get('error');
    if (error) {
      alert(`❌ Connection failed: ${decodeURIComponent(error)}`);
      // Clean up URL
      window.history.replaceState({}, '', '/email-inbox');
    }
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchEmails();
    }
  }, [selectedAccount]);

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/email-accounts/connect');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts || []);
        if (data.accounts.length > 0 && !selectedAccount) {
          setSelectedAccount(data.accounts[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const fetchEmails = async () => {
    if (!selectedAccount) return;

    setLoading(true);
    try {
      // First fetch without classification for faster initial load
      const res = await fetch('/api/email-accounts/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount,
          maxResults: showOnlyWaiting ? 10000 : 100, // Fetch more initially
          fetchAll: showOnlyWaiting, // Fetch all emails when filtering
          autoClassify: false // Skip classification for faster load
        })
      });

      const data = await res.json();
      if (data.success) {
        let fetchedEmails = data.emails || [];
        
        // Filter to show only emails waiting for response
        if (showOnlyWaiting) {
          const account = accounts.find(a => a.id === selectedAccount);
          if (account) {
            fetchedEmails = fetchedEmails.filter((email: Email) => {
              return needsResponse(email, account.email);
            });
          }
        }
        
        setEmails(fetchedEmails);
      } else {
        const errorMsg = data.details 
          ? `${data.error}\n\nDetails: ${data.details}\n\n${data.suggestion || ''}`
          : data.error;
        console.error('Fetch error:', data);
        
        // If unauthorized and no refresh token, suggest reconnecting
        if (res.status === 401 && data.debug && !data.debug.hasRefreshToken) {
          const reconnect = confirm(
            'Your account needs to be reconnected to get a refresh token.\n\n' +
            'Would you like to disconnect and reconnect now?'
          );
          if (reconnect) {
            disconnectAccount(selectedAccount);
            setTimeout(() => {
              setShowConnectModal(true);
              setConnectProvider('outlook');
            }, 500);
          }
        } else {
          alert('Failed to fetch emails: ' + errorMsg);
        }
      }
    } catch (error: any) {
      console.error('Fetch exception:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const connectGmail = async () => {
    try {
      const res = await fetch('/api/email-oauth/gmail?action=auth');
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert('Gmail OAuth not configured');
      }
    } catch (error: any) {
      alert('Failed to connect Gmail: ' + error.message);
    }
  };

  const connectOutlook = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/email-oauth/outlook?action=auth');
      const data = await res.json();
      if (data.authUrl) {
        // Redirect to Microsoft OAuth
        window.location.href = data.authUrl;
      } else {
        alert('Outlook OAuth not configured. Please set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in environment variables.');
      }
    } catch (error: any) {
      alert('Failed to connect Outlook: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const connectIMAP = async () => {
    if (!imapConfig.email || !imapConfig.host || !imapConfig.password) {
      alert('Please fill in email, host, and password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/email-accounts/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'imap',
          email: imapConfig.email,
          host: imapConfig.host,
          port: imapConfig.port,
          username: imapConfig.username || imapConfig.email,
          password: imapConfig.password,
          tls: imapConfig.tls
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Email account connected successfully!');
        setShowConnectModal(false);
        loadAccounts();
      } else {
        alert('Failed to connect: ' + data.error);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Classify emails in background after initial display
  const classifyEmailsInBackground = async (emailsToClassify: Email[], accountId: string) => {
    try {
      const res = await fetch('/api/email-accounts/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          maxResults: emailsToClassify.length,
          fetchAll: false,
          autoClassify: true,
          emailIds: emailsToClassify.map(e => e.id) // Only classify these specific emails
        })
      });

      const data = await res.json();
      if (data.success && data.emails) {
        // Update emails with classifications
        setEmails(prevEmails => {
          const emailMap = new Map(data.emails.map((e: Email) => [e.id, e]));
          return prevEmails.map(email => {
            const classified = emailMap.get(email.id);
            return classified ? { ...email, classification: classified.classification } : email;
          });
        });
      }
    } catch (error) {
      console.error('Background classification failed:', error);
    }
  };

  // Helper function to check if email needs response
  const needsResponse = (email: Email, userEmail: string): boolean => {
    // Check if email is unread
    if (!email.isUnread) {
      return false;
    }

    // Check if last sender is NOT the user
    const fromEmail = email.from?.toLowerCase() || '';
    const userEmailLower = userEmail.toLowerCase();
    
    // If the email is FROM the user, it doesn't need a response
    if (fromEmail.includes(userEmailLower)) {
      return false;
    }

    // Check if email is TO the user (needs response)
    const toEmails = (email.to || '').toLowerCase();
    if (toEmails.includes(userEmailLower)) {
      return true;
    }

    // Default: if unread and not from user, it likely needs a response
    return true;
  };

  const disconnectAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;

    try {
      const res = await fetch(`/api/email-connect?accountId=${accountId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        loadAccounts();
        if (selectedAccount === accountId) {
          setSelectedAccount('');
          setEmails([]);
        }
      }
    } catch (error: any) {
      alert('Failed to disconnect: ' + error.message);
    }
  };

  const generateAutoResponses = async () => {
    if (!selectedAccount) return;

    setGeneratingResponses(true);
    try {
      const res = await fetch('/api/email-accounts/auto-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount,
          maxResults: 50,
          autoSend: false
        })
      });

      const data = await res.json();
      if (data.success) {
        // Store responses by email ID
        const responsesMap: Record<string, any> = {};
        data.results.forEach((result: any) => {
          responsesMap[result.emailId] = result;
        });
        setAutoResponses(responsesMap);
        setLearningInsights(data.learningInsights);
        alert(`Generated ${data.results.length} responses. ${data.summary.requiresHumanReview} require human review.`);
      } else {
        alert('Failed to generate responses: ' + data.error);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setGeneratingResponses(false);
    }
  };

  const loadLearningInsights = async () => {
    if (!selectedAccount) return;

    try {
      const res = await fetch(`/api/email-accounts/learning-insights?accountId=${selectedAccount}&days=30`);
      const data = await res.json();
      if (data.success) {
        setLearningInsights(data);
      }
    } catch (error) {
      console.error('Failed to load learning insights:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Email Inbox</h1>
              <p className="mt-2 text-gray-600">Connect and manage your email accounts</p>
            </div>
          </div>
        </div>

        {/* Account Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Connected Accounts</h2>
            <button
              onClick={() => setShowConnectModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Connect Account
            </button>
          </div>

          {accounts.length === 0 ? (
            <p className="text-gray-500">No accounts connected. Click "Connect Account" to get started.</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAccount === account.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAccount(account.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        account.connected ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium flex items-center space-x-2">
                          <span>{account.email}</span>
                          {account.provider === 'outlook' && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Outlook</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {account.provider.toUpperCase()} • {account.lastSync ? `Last sync: ${new Date(account.lastSync).toLocaleString()}` : 'Never synced'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        disconnectAccount(account.id);
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email List */}
        {selectedAccount && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">
                  {showOnlyWaiting ? 'Emails Waiting for Response' : 'All Emails'}
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyWaiting}
                    onChange={(e) => {
                      setShowOnlyWaiting(e.target.checked);
                      // Refetch emails with new filter
                      setTimeout(() => fetchEmails(), 100);
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-600">Show only waiting for response</span>
                </label>
              </div>
              <button
                onClick={fetchEmails}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {loading && emails.length === 0 ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading emails...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No emails found. Click Refresh to fetch emails.</div>
            ) : (
              <div className="divide-y">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => {
                      // Store email data in sessionStorage for the detail page
                      sessionStorage.setItem('emailDetail', JSON.stringify({
                        email,
                        accountId: selectedAccount
                      }));
                      window.location.href = `/email-inbox/${encodeURIComponent(email.id)}?accountId=${selectedAccount}`;
                    }}
                    className="block p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {email.isUnread && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                          <span className="font-medium text-gray-900 truncate">
                            {email.from}
                          </span>
                          {email.classification && (
                            <span className={`px-2 py-1 text-xs rounded ${
                              email.classification.confidence > 0.8
                                ? 'bg-green-100 text-green-800'
                                : email.classification.confidence > 0.6
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {email.classification.template} ({Math.round(email.classification.confidence * 100)}%)
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {email.subject || '(No Subject)'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {email.snippet}
                        </div>
                        {autoResponses[email.id] && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <div className="font-semibold text-blue-900 mb-1">Auto-Generated Response:</div>
                            <div className="text-blue-800 mb-1">{autoResponses[email.id].generatedResponse.subject}</div>
                            <div className="text-blue-700 line-clamp-2">{autoResponses[email.id].generatedResponse.body.substring(0, 150)}...</div>
                            {autoResponses[email.id].generatedResponse.requiresHumanReview && (
                              <div className="mt-1 text-orange-600 font-semibold">⚠ Requires Human Review</div>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(email.date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Connect Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">Connect Email Account</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Provider</label>
                  <select
                    value={connectProvider}
                    onChange={(e) => setConnectProvider(e.target.value as any)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="outlook">Outlook (OAuth) - Recommended</option>
                    <option value="gmail">Gmail (OAuth)</option>
                    <option value="imap">IMAP (Any Provider)</option>
                  </select>
                </div>

                {connectProvider === 'imap' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={imapConfig.email}
                        onChange={(e) => setImapConfig({ ...imapConfig, email: e.target.value })}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">IMAP Host</label>
                      <input
                        type="text"
                        value={imapConfig.host}
                        onChange={(e) => setImapConfig({ ...imapConfig, host: e.target.value })}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="imap.gmail.com or outlook.office365.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Port</label>
                        <input
                          type="number"
                          value={imapConfig.port}
                          onChange={(e) => setImapConfig({ ...imapConfig, port: parseInt(e.target.value) })}
                          className="w-full border rounded-md px-3 py-2"
                          placeholder="993"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={imapConfig.tls}
                            onChange={(e) => setImapConfig({ ...imapConfig, tls: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm">Use TLS/SSL</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Username (optional)</label>
                      <input
                        type="text"
                        value={imapConfig.username}
                        onChange={(e) => setImapConfig({ ...imapConfig, username: e.target.value })}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Leave empty to use email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Password / App Password</label>
                      <input
                        type="password"
                        value={imapConfig.password}
                        onChange={(e) => setImapConfig({ ...imapConfig, password: e.target.value })}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Use app password for Gmail/Outlook"
                      />
                    </div>
                    <button
                      onClick={connectIMAP}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {loading ? 'Connecting...' : 'Connect IMAP'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={connectProvider === 'gmail' ? connectGmail : connectOutlook}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loading ? 'Connecting...' : `Connect ${connectProvider === 'gmail' ? 'Gmail' : 'Outlook'}`}
                  </button>
                )}

                <button
                  onClick={() => setShowConnectModal(false)}
                  className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Learning Insights Panel */}
        {learningInsights && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Learning Insights</h2>
            
            {learningInsights.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Total Responses</div>
                  <div className="text-2xl font-bold text-blue-900">{learningInsights.stats.totalResponsesGenerated}</div>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Auto-Sent</div>
                  <div className="text-2xl font-bold text-green-900">{learningInsights.stats.responsesSent}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Needs Review</div>
                  <div className="text-2xl font-bold text-yellow-900">{learningInsights.stats.responsesRequiringReview}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Avg Confidence</div>
                  <div className="text-2xl font-bold text-purple-900">{(learningInsights.stats.averageConfidence * 100).toFixed(0)}%</div>
                </div>
              </div>
            )}

            {learningInsights.topPatterns && learningInsights.topPatterns.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Patterns Learned</h3>
                <div className="space-y-2">
                  {learningInsights.topPatterns.slice(0, 5).map((pattern: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">{pattern.pattern}</div>
                        <div className="text-sm text-gray-600">Template: {pattern.template}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Used {pattern.usageCount} times</div>
                        <div className="text-sm font-semibold text-blue-600">{(pattern.averageConfidence * 100).toFixed(0)}% confidence</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setLearningInsights(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Close Insights
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

