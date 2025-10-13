/**
 * Bullet Feedback Component
 * 
 * Provides thumbs up/down UI for users to rate ACE bullets
 * Collects human preferences for judge training
 */

'use client';

import React, { useState } from 'react';
import { ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';

export interface BulletFeedbackProps {
  bullet_id: string;
  bullet_content: string;
  initial_helpful_count?: number;
  initial_harmful_count?: number;
  context?: any;
  onFeedbackSubmitted?: (is_helpful: boolean) => void;
}

export function BulletFeedback({
  bullet_id,
  bullet_content,
  initial_helpful_count = 0,
  initial_harmful_count = 0,
  context,
  onFeedbackSubmitted
}: BulletFeedbackProps) {
  const [helpfulCount, setHelpfulCount] = useState(initial_helpful_count);
  const [harmfulCount, setHarmfulCount] = useState(initial_harmful_count);
  const [userVote, setUserVote] = useState<'helpful' | 'harmful' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const handleFeedback = async (is_helpful: boolean) => {
    // Prevent duplicate votes
    if (userVote) {
      console.log('Already voted!');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet_id,
          is_helpful,
          user_id: 'anonymous', // TODO: Replace with actual user ID
          comment: comment || null,
          context: context || { bullet_content }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const data = await response.json();
      
      // Update local counts
      if (is_helpful) {
        setHelpfulCount(prev => prev + 1);
        setUserVote('helpful');
      } else {
        setHarmfulCount(prev => prev + 1);
        setUserVote('harmful');
      }

      // Clear comment
      setComment('');
      setShowComment(false);

      // Callback
      onFeedbackSubmitted?.(is_helpful);

      console.log('✅ Feedback submitted:', data);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quality = helpfulCount + harmfulCount > 0
    ? (helpfulCount / (helpfulCount + harmfulCount) * 100).toFixed(0)
    : 'N/A';

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      {/* Bullet Content */}
      <div className="mb-3">
        <p className="text-sm text-gray-700">{bullet_content}</p>
      </div>

      {/* Feedback Buttons */}
      <div className="flex items-center gap-3">
        {/* Helpful Button */}
        <button
          onClick={() => handleFeedback(true)}
          disabled={isSubmitting || userVote !== null}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
            transition-all duration-200
            ${userVote === 'helpful'
              ? 'bg-green-100 text-green-700 border-2 border-green-500'
              : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-600 border border-gray-300'
            }
            ${(isSubmitting || userVote !== null) && 'opacity-50 cursor-not-allowed'}
          `}
        >
          <ThumbsUpIcon className="w-4 h-4" />
          <span>Helpful</span>
          <span className="text-xs bg-white px-2 py-0.5 rounded-full">
            {helpfulCount}
          </span>
        </button>

        {/* Harmful Button */}
        <button
          onClick={() => handleFeedback(false)}
          disabled={isSubmitting || userVote !== null}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
            transition-all duration-200
            ${userVote === 'harmful'
              ? 'bg-red-100 text-red-700 border-2 border-red-500'
              : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-300'
            }
            ${(isSubmitting || userVote !== null) && 'opacity-50 cursor-not-allowed'}
          `}
        >
          <ThumbsDownIcon className="w-4 h-4" />
          <span>Not Helpful</span>
          <span className="text-xs bg-white px-2 py-0.5 rounded-full">
            {harmfulCount}
          </span>
        </button>

        {/* Quality Score */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">Quality:</span>
          <span className={`
            text-sm font-semibold px-2 py-1 rounded
            ${quality === 'N/A' ? 'text-gray-500 bg-gray-100'
              : parseFloat(quality) >= 70 ? 'text-green-700 bg-green-100'
              : parseFloat(quality) >= 40 ? 'text-yellow-700 bg-yellow-100'
              : 'text-red-700 bg-red-100'}
          `}>
            {quality === 'N/A' ? 'N/A' : `${quality}%`}
          </span>
        </div>

        {/* Comment Toggle */}
        <button
          onClick={() => setShowComment(!showComment)}
          disabled={userVote !== null}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          {showComment ? 'Hide' : 'Add'} comment
        </button>
      </div>

      {/* Comment Input */}
      {showComment && userVote === null && (
        <div className="mt-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional: Why is this helpful or not helpful?"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
        </div>
      )}

      {/* Status Messages */}
      {userVote && (
        <div className="mt-3 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
          ✅ Thank you for your feedback! This helps train our AI judge.
        </div>
      )}

      {isSubmitting && (
        <div className="mt-3 text-sm text-blue-600">
          Submitting feedback...
        </div>
      )}
    </div>
  );
}

/**
 * Compact Bullet Feedback (for inline display)
 */
export function BulletFeedbackCompact({
  bullet_id,
  bullet_content,
  initial_helpful_count = 0,
  initial_harmful_count = 0
}: BulletFeedbackProps) {
  const [helpfulCount, setHelpfulCount] = useState(initial_helpful_count);
  const [harmfulCount, setHarmfulCount] = useState(initial_harmful_count);
  const [userVote, setUserVote] = useState<'helpful' | 'harmful' | null>(null);

  const handleFeedback = async (is_helpful: boolean) => {
    if (userVote) return;

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet_id,
          is_helpful,
          context: { bullet_content }
        })
      });

      if (is_helpful) {
        setHelpfulCount(prev => prev + 1);
        setUserVote('helpful');
      } else {
        setHarmfulCount(prev => prev + 1);
        setUserVote('harmful');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={() => handleFeedback(true)}
        disabled={userVote !== null}
        className={`
          inline-flex items-center gap-1 px-2 py-1 rounded text-xs
          ${userVote === 'helpful' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-green-50'}
          ${userVote !== null && 'opacity-50 cursor-not-allowed'}
        `}
      >
        <ThumbsUpIcon className="w-3 h-3" />
        <span>{helpfulCount}</span>
      </button>

      <button
        onClick={() => handleFeedback(false)}
        disabled={userVote !== null}
        className={`
          inline-flex items-center gap-1 px-2 py-1 rounded text-xs
          ${userVote === 'harmful' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}
          ${userVote !== null && 'opacity-50 cursor-not-allowed'}
        `}
      >
        <ThumbsDownIcon className="w-3 h-3" />
        <span>{harmfulCount}</span>
      </button>
    </div>
  );
}

export default BulletFeedback;

