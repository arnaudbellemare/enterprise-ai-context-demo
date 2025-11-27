'use client';

import { useState } from 'react';

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
  };
}

export default function EmailResponderPage() {
  const [emailText, setEmailText] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      const response = await fetch('/api/email/classify-and-respond', {
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process email');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
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
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Email Auto-Responder
          </h1>
          <p className="text-gray-600 mb-6">
            Paste an email below and get an automated response based on classification
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

