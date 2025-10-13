/**
 * User Feedback Demo Page
 * 
 * Demonstrates Phase 1 of Human → Judge → Student pipeline
 * Shows playbook bullets with feedback UI for collection
 */

'use client';

import React, { useState } from 'react';
import { PlaybookViewerWithFeedback, FeedbackSummary } from '../../components/playbook-viewer-with-feedback';
import { MessageCircleIcon, TrendingUpIcon, Users2Icon } from 'lucide-react';

// Mock ACE playbook bullets for demo
const mockBullets = [
  {
    id: 'strat-001',
    content: 'Always check API documentation (using apis.api_docs.show_api_doc) before calling any API to understand required parameters and return values.',
    section: 'strategies_and_hard_rules',
    helpful_count: 15,
    harmful_count: 2,
    created_at: Date.now() - 86400000 * 5,
    last_updated: Date.now() - 86400000 * 2
  },
  {
    id: 'api-042',
    content: 'When working with paginated APIs, always use `while True` loop with proper break condition instead of fixed range iterations.',
    section: 'apis_to_use',
    helpful_count: 23,
    harmful_count: 1,
    created_at: Date.now() - 86400000 * 10,
    last_updated: Date.now() - 86400000 * 3
  },
  {
    id: 'mistake-015',
    content: 'Common mistake: Using transaction descriptions to identify relationships. Always use Phone app\'s contact relationships instead.',
    section: 'common_mistakes',
    helpful_count: 18,
    harmful_count: 3,
    created_at: Date.now() - 86400000 * 7,
    last_updated: Date.now() - 86400000 * 1
  },
  {
    id: 'verify-008',
    content: 'Verification step: After creating payment requests, verify they were sent to the correct recipients by checking the response.',
    section: 'verification_checklist',
    helpful_count: 12,
    harmful_count: 5,
    created_at: Date.now() - 86400000 * 3,
    last_updated: Date.now() - 86400000 * 1
  },
  {
    id: 'insight-021',
    content: 'File operations: When compressing directories, delete the original after successful compression to save space.',
    section: 'general_insights',
    helpful_count: 9,
    harmful_count: 8,
    created_at: Date.now() - 86400000 * 15,
    last_updated: Date.now() - 86400000 * 5
  },
  {
    id: 'strat-002',
    content: 'For Venmo transactions, filter by specific contact emails/phone numbers from Phone app, not by parsing descriptions.',
    section: 'strategies_and_hard_rules',
    helpful_count: 20,
    harmful_count: 1,
    created_at: Date.now() - 86400000 * 8,
    last_updated: Date.now() - 86400000 * 2
  },
  {
    id: 'api-043',
    content: 'Use show_song() to get individual song durations before adding to playlist to calculate total playlist length.',
    section: 'apis_to_use',
    helpful_count: 7,
    harmful_count: 11,
    created_at: Date.now() - 86400000 * 12,
    last_updated: Date.now() - 86400000 * 4
  }
];

export default function FeedbackDemoPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFeedbackSubmitted = () => {
    // Refresh summary
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircleIcon className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              User Feedback System
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl">
            Phase 1 of the Human → Judge → Student pipeline. 
            Rate ACE playbook bullets to help train our LLM-as-judge!
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900">Phase 1</h3>
            </div>
            <p className="text-sm text-gray-600">
              Collect user feedback on ACE bullets. Thumbs up = helpful, thumbs down = not helpful.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold text-gray-900">Phase 2</h3>
            </div>
            <p className="text-sm text-gray-600">
              Train LLM-as-judge from collected feedback. Judge learns human preferences via GEPA.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="font-semibold text-gray-900">Phase 3</h3>
            </div>
            <p className="text-sm text-gray-600">
              Use trained judge to optimize Ollama student. Human-aligned AI system!
            </p>
          </div>
        </div>

        {/* Feedback Summary */}
        <div className="mb-8">
          <FeedbackSummary key={refreshKey} />
        </div>

        {/* Playbook Viewer */}
        <PlaybookViewerWithFeedback
          bullets={mockBullets}
          title="ACE Playbook - Rate These Bullets!"
          showStats={true}
          compact={false}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />

        {/* Technical Details */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔧 Technical Implementation
          </h3>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <strong className="text-gray-900">API Endpoint:</strong>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">POST /api/feedback</code>
            </div>
            <div>
              <strong className="text-gray-900">Database:</strong>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">user_feedback</code> table in Supabase
            </div>
            <div>
              <strong className="text-gray-900">Components:</strong>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">BulletFeedback.tsx</code>,{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">PlaybookViewerWithFeedback.tsx</code>
            </div>
            <div>
              <strong className="text-gray-900">Integration:</strong>{' '}
              UI → API → Database → ACE Curator (automatic)
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <strong className="text-blue-900">Status:</strong>{' '}
            <span className="text-blue-700">✅ Phase 1 Complete (User Feedback UI)</span>
            <br />
            <strong className="text-blue-900">Next:</strong>{' '}
            <span className="text-blue-700">Phase 2 - Train judge from collected feedback (3 days)</span>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💡 How This Enables Human → Judge → Student
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Collect Feedback (This Page!)</h4>
                <p className="text-sm text-gray-600">
                  Users rate ACE bullets as helpful/harmful. Stored in database for training.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Train Judge with GEPA</h4>
                <p className="text-sm text-gray-600">
                  Fine-tune GPT-3.5 or LoRA on human feedback. GEPA meta-optimizes judge prompts for 90%+ agreement.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Optimize Student with Judge</h4>
                <p className="text-sm text-gray-600">
                  Use trained judge to evaluate Ollama. GEPA optimizes Ollama to match human preferences!
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-indigo-600 font-semibold">
            Result: Human-aligned AI system trained from YOUR feedback! 🎯
          </div>
        </div>
      </div>
    </div>
  );
}

