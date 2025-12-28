'use client';

import { useState, useEffect } from 'react';

interface Account {
  id: string;
  provider: 'gmail' | 'outlook' | 'imap';
  email: string;
  connected: boolean;
  lastSync?: string;
  connectedAt?: string;
}

interface DebugInfo {
  account: {
    id: string;
    email: string;
    provider: string;
    userId: string;
    connectedAt: string;
    lastSync: string | null;
    isActive: boolean;
  };
  tokenStatus: {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    tokenExpiry: string | null;
    isExpired: boolean | null;
    expiresIn: number | null;
    validTokenTest: string;
    validTokenPrefix?: string;
    validTokenError?: string;
  };
  apiTest: {
    status: number;
    statusText: string;
    ok: boolean;
    error?: string;
    userEmail?: string;
  } | null;
}

export default function EmailDebugPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      loadDebugInfo(selectedAccountId);
    }
  }, [selectedAccountId]);

  const loadAccounts = async () => {
    try {
      // Try the regular endpoint first
      const res = await fetch('/api/email-accounts/connect');
      const data = await res.json();
      
      if (data.success && data.accounts && data.accounts.length > 0) {
        setAccounts(data.accounts);
        if (!selectedAccountId) {
          setSelectedAccountId(data.accounts[0].id);
        }
      } else {
        // If no accounts found, try the diagnostic endpoint
        const diagRes = await fetch('/api/email-accounts/list-all');
        const diagData = await diagRes.json();
        
        if (diagData.success && diagData.accounts && diagData.accounts.length > 0) {
          // Convert database format to UI format
          const convertedAccounts = diagData.accounts.map((acc: any) => ({
            id: acc.id,
            provider: acc.provider,
            email: acc.email,
            connected: acc.is_active,
            lastSync: acc.last_sync,
            connectedAt: acc.connected_at
          }));
          setAccounts(convertedAccounts);
          if (!selectedAccountId) {
            setSelectedAccountId(convertedAccounts[0].id);
          }
          setError(`Found ${diagData.count} account(s) but with different userId. Using diagnostic mode.`);
        } else if (diagData.success) {
          setError('No accounts found in database. Please connect an account first.');
        } else {
          setError('Failed to load accounts: ' + (diagData.error || data.error || 'Unknown error'));
        }
      }
    } catch (err: any) {
      setError('Failed to load accounts: ' + err.message);
    }
  };

  const loadDebugInfo = async (accountId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/email-accounts/debug?accountId=${accountId}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setDebugInfo(null);
      } else {
        setDebugInfo(data);
      }
    } catch (err: any) {
      setError('Failed to load debug info: ' + err.message);
      setDebugInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshDebug = () => {
    if (selectedAccountId) {
      loadDebugInfo(selectedAccountId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Email Account Debug</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Account Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Account</h2>
          {accounts.length === 0 ? (
            <p className="text-gray-500">No accounts found. Connect an account first.</p>
          ) : (
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.email} ({account.provider})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Debug Info */}
        {selectedAccountId && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Debug Information</h2>
              <button
                onClick={refreshDebug}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {loading && !debugInfo ? (
              <div className="text-center py-8 text-gray-500">Loading debug information...</div>
            ) : debugInfo ? (
              <div className="space-y-6">
                {/* Account Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Account Information</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-mono">{debugInfo.account.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Provider:</span>
                        <span className="ml-2">{debugInfo.account.provider}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Account ID:</span>
                        <span className="ml-2 font-mono text-sm">{debugInfo.account.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Active:</span>
                        <span className={`ml-2 ${debugInfo.account.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {debugInfo.account.isActive ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Connected At:</span>
                        <span className="ml-2">{new Date(debugInfo.account.connectedAt).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Sync:</span>
                        <span className="ml-2">
                          {debugInfo.account.lastSync ? new Date(debugInfo.account.lastSync).toLocaleString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Token Status */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Token Status</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Has Access Token:</span>
                        <span className={debugInfo.tokenStatus.hasAccessToken ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {debugInfo.tokenStatus.hasAccessToken ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Has Refresh Token:</span>
                        <span className={debugInfo.tokenStatus.hasRefreshToken ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {debugInfo.tokenStatus.hasRefreshToken ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Token Expiry:</span>
                        <span className={debugInfo.tokenStatus.isExpired ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                          {debugInfo.tokenStatus.tokenExpiry 
                            ? new Date(debugInfo.tokenStatus.tokenExpiry).toLocaleString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Expires In:</span>
                        <span className={debugInfo.tokenStatus.expiresIn !== null && debugInfo.tokenStatus.expiresIn < 300 ? 'text-yellow-600 font-semibold' : 'text-gray-900'}>
                          {debugInfo.tokenStatus.expiresIn !== null 
                            ? `${Math.floor(debugInfo.tokenStatus.expiresIn / 60)} minutes`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Token Valid Test:</span>
                        <span className={debugInfo.tokenStatus.validTokenTest === 'success' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {debugInfo.tokenStatus.validTokenTest === 'success' ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      {debugInfo.tokenStatus.validTokenPrefix && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Token Prefix:</span>
                          <span className="font-mono text-sm">{debugInfo.tokenStatus.validTokenPrefix}</span>
                        </div>
                      )}
                      {debugInfo.tokenStatus.validTokenError && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <span className="text-red-800 text-sm">{debugInfo.tokenStatus.validTokenError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* API Test */}
                {debugInfo.apiTest && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Microsoft Graph API Test</h3>
                    <div className={`p-4 rounded ${debugInfo.apiTest.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={debugInfo.apiTest.ok ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {debugInfo.apiTest.status} {debugInfo.apiTest.statusText}
                          </span>
                        </div>
                        {debugInfo.apiTest.userEmail && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">User Email:</span>
                            <span className="font-mono">{debugInfo.apiTest.userEmail}</span>
                          </div>
                        )}
                        {debugInfo.apiTest.error && (
                          <div className="mt-2 p-2 bg-red-100 rounded">
                            <span className="text-red-800 text-sm font-mono whitespace-pre-wrap">{debugInfo.apiTest.error}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No debug information available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

