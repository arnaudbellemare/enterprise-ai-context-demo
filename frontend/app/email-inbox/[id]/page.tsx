'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
}

export default function EmailDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailId = params.id as string;
  const accountId = searchParams.get('accountId');

  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [autoResponse, setAutoResponse] = useState<any>(null);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [learningInsights, setLearningInsights] = useState<any>(null);
  const [aiLearningInsights, setAiLearningInsights] = useState<any>(null);

  const generateAutoResponse = async (emailData: Email, accountId: string) => {
    setGeneratingResponse(true);
    try {
      // First classify the email
      const emailText = `${emailData.subject || ''}\n\n${emailData.body || emailData.html || ''}`;
      
      // Generate response
      const res = await fetch('/api/email/classify-and-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: emailData.from,
          to: emailData.to,
          subject: emailData.subject || '',
          body: emailData.body || emailData.html || ''
        })
      });

      const data = await res.json();
      if (data.generatedResponse) {
        setAutoResponse({
          subject: data.generatedResponse.subject,
          body: data.generatedResponse.body,
          requiresHumanReview: data.generatedResponse.requiresHumanReview,
          classification: {
            template: data.classification.template.name,
            confidence: data.classification.confidence
          }
        });

        // Load learning insights for this specific email
        loadLearningInsights(emailData, accountId, data.classification);
        
        // Load AI learning insights (ax-llm, ACE, GEPA, DSPy)
        loadAILearningInsights(emailData, accountId, data.classification, data.generatedResponse);
      }
    } catch (error: any) {
      console.error('Failed to generate auto-response:', error);
    } finally {
      setGeneratingResponse(false);
    }
  };

  const loadLearningInsights = async (emailData: Email, accountId: string, classification: any) => {
    try {
      // Get insights specific to this email's pattern and template
      const res = await fetch(`/api/email-accounts/learning-insights?accountId=${accountId}&days=30`);
      const data = await res.json();
      
      if (data.success) {
        // Filter insights relevant to this email
        const relevantInsights = {
          emailClassification: {
            template: classification.template.name,
            templateId: classification.template.id,
            confidence: classification.confidence
          },
          similarPatterns: data.insights?.filter((insight: any) => 
            insight.template === classification.template.name
          ).slice(0, 5) || [],
          templateStats: data.stats?.templateDistribution || {},
          averageConfidence: data.stats?.averageConfidence || 0
        };
        
        setLearningInsights(relevantInsights);
      }
    } catch (error) {
      console.error('Failed to load learning insights:', error);
    }
  };

  const loadAILearningInsights = async (
    emailData: Email,
    accountId: string,
    classification: any,
    generatedResponse: any
  ) => {
    try {
      const res = await fetch('/api/email-ai-learning-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: emailData.id,
          accountId,
          emailContent: emailData.body || emailData.html || emailData.snippet,
          classification: {
            template: classification.template.name,
            templateId: classification.template.id,
            confidence: classification.confidence
          },
          generatedResponse
        })
      });

      const data = await res.json();
      if (data.success) {
        setAiLearningInsights(data);
      }
    } catch (error) {
      console.error('Failed to load AI learning insights:', error);
    }
  };

  useEffect(() => {
    if (emailId && accountId) {
      // First try to get email from sessionStorage (faster, no API call needed)
      const storedData = sessionStorage.getItem('emailDetail');
      if (storedData) {
        try {
          const { email: storedEmail, accountId: storedAccountId } = JSON.parse(storedData);
          const decodedEmailId = decodeURIComponent(emailId);
          
          if (storedEmail.id === decodedEmailId && storedAccountId === accountId) {
            console.log('[Email Detail] Using cached email from sessionStorage');
            setEmail(storedEmail);
            setLoading(false);
            // Auto-generate response for this email
            generateAutoResponse(storedEmail, accountId);
            // Clear sessionStorage after using it
            sessionStorage.removeItem('emailDetail');
            return;
          }
        } catch (e) {
          console.warn('[Email Detail] Failed to parse sessionStorage data:', e);
        }
      }
      
      // If not in sessionStorage, fetch from API
      loadEmail();
    }
  }, [emailId, accountId]);

  const loadEmail = async () => {
    if (!accountId) {
      setError('Account ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Decode email ID in case it's URL encoded
      const decodedEmailId = decodeURIComponent(emailId);
      console.log('[Email Detail] Looking for email ID:', decodedEmailId);
      console.log('[Email Detail] Account ID:', accountId);

      // Fetch emails and find the one with matching ID
      const res = await fetch('/api/email-accounts/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          maxResults: 200, // Get more emails to find the one we need
          autoClassify: false // Don't need classification for detail view
        })
      });

      const data = await res.json();
      if (data.success) {
        console.log('[Email Detail] Fetched', data.emails.length, 'emails');
        console.log('[Email Detail] First few email IDs:', data.emails.slice(0, 3).map((e: Email) => e.id));
        
        // Try exact match first
        let foundEmail = data.emails.find((e: Email) => e.id === decodedEmailId);
        
        // If not found, try URL decoding the stored IDs
        if (!foundEmail) {
          foundEmail = data.emails.find((e: Email) => decodeURIComponent(e.id) === decodedEmailId);
        }
        
        // If still not found, try partial match (in case ID format changed)
        if (!foundEmail) {
          foundEmail = data.emails.find((e: Email) => 
            e.id.includes(decodedEmailId) || decodedEmailId.includes(e.id)
          );
        }
        
        if (foundEmail) {
          console.log('[Email Detail] Found email:', foundEmail.subject);
          setEmail(foundEmail);
          // Auto-generate response for this email
          generateAutoResponse(foundEmail, accountId);
        } else {
          console.error('[Email Detail] Email not found. Searched', data.emails.length, 'emails');
          console.error('[Email Detail] Looking for:', decodedEmailId);
          console.error('[Email Detail] Available IDs:', data.emails.map((e: Email) => e.id).slice(0, 10));
          
          // Show error with helpful message
          setError(`Email not found. Searched ${data.emails.length} emails. The email may have been deleted or is outside the fetch range.`);
        }
      } else {
        setError(data.error || 'Failed to load email');
      }
    } catch (err: any) {
      console.error('[Email Detail] Error:', err);
      setError('Error loading email: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email...</p>
        </div>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/email-inbox" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Inbox
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error || 'Email not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/email-inbox" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Inbox
          </Link>
        </div>

        {/* Email Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Email Header */}
          <div className="p-6 border-b">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {email.subject || '(No Subject)'}
                </h1>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">From:</span> {email.from}
                  </div>
                  <div>
                    <span className="font-medium">To:</span> {email.to || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {new Date(email.date).toLocaleString()}
                  </div>
                </div>
              </div>
              {email.isUnread && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  Unread
                </span>
              )}
            </div>

            {/* Classification */}
            {email.classification && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Classification:</span>
                  <span className={`px-2 py-1 text-xs rounded font-medium ${
                    email.classification.confidence > 0.8
                      ? 'bg-green-100 text-green-800'
                      : email.classification.confidence > 0.6
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {email.classification.template} ({Math.round(email.classification.confidence * 100)}%)
                  </span>
                </div>
                {email.classification.reasoning && (
                  <p className="text-sm text-gray-600 mt-2">{email.classification.reasoning}</p>
                )}
              </div>
            )}
          </div>

          {/* Email Body */}
          <div className="p-6">
            {email.html ? (
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: email.html }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-gray-900">
                {email.body || email.snippet || 'No content available'}
              </div>
            )}
          </div>

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="p-6 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Attachments</h3>
              <div className="space-y-2">
                {email.attachments.map((attachment, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">{attachment.filename}</span>
                    <span className="text-xs text-gray-500">
                      {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Auto-Generated Response */}
        {generatingResponse && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Generating auto-response...</p>
            </div>
          </div>
        )}

        {autoResponse && (
          <div className="mt-6 bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Auto-Generated Response</h2>
              {autoResponse.requiresHumanReview && (
                <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-sm text-orange-800 font-semibold">⚠ Requires Human Review</p>
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject:</label>
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  {autoResponse.subject}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body:</label>
                <div className="p-4 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap text-gray-900">
                  {autoResponse.body}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    // Copy response to clipboard
                    navigator.clipboard.writeText(`Subject: ${autoResponse.subject}\n\n${autoResponse.body}`);
                    alert('Response copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Copy Response
                </button>
                <button
                  onClick={() => {
                    // Regenerate response
                    if (email && accountId) {
                      generateAutoResponse(email, accountId);
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Learning Insights */}
        {learningInsights && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Learning Insights</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">This Email</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Template</div>
                  <div className="text-lg font-bold text-blue-900">{learningInsights.emailClassification.template}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Confidence</div>
                  <div className="text-lg font-bold text-purple-900">
                    {(learningInsights.emailClassification.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {learningInsights.similarPatterns && learningInsights.similarPatterns.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Similar Patterns</h3>
                <div className="space-y-2">
                  {learningInsights.similarPatterns.map((pattern: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">{pattern.pattern}</div>
                        <div className="text-sm text-gray-600">Used {pattern.usageCount} times</div>
                      </div>
                      <div className="text-sm font-semibold text-blue-600">
                        {(pattern.confidence * 100).toFixed(0)}% confidence
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {learningInsights.templateStats && Object.keys(learningInsights.templateStats).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Template Usage</h3>
                <div className="text-sm text-gray-600">
                  This template has been used {learningInsights.templateStats[learningInsights.emailClassification.template] || 0} times
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

