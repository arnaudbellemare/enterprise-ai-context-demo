/**
 * Playbook Viewer with Feedback
 * 
 * Displays ACE playbook bullets with user feedback UI
 * Integrates with Arena for real-time bullet rating
 */

'use client';

import React, { useState, useEffect } from 'react';
import { BulletFeedback, BulletFeedbackCompact } from './bullet-feedback';
import { BookOpenIcon, StarIcon, TrendingUpIcon } from 'lucide-react';

export interface PlaybookBullet {
  id: string;
  content: string;
  section: string;
  helpful_count: number;
  harmful_count: number;
  created_at: number;
  last_updated: number;
}

export interface PlaybookViewerProps {
  bullets: PlaybookBullet[];
  title?: string;
  showStats?: boolean;
  compact?: boolean;
  onFeedbackSubmitted?: () => void;
}

export function PlaybookViewerWithFeedback({
  bullets,
  title = 'ACE Playbook',
  showStats = true,
  compact = false,
  onFeedbackSubmitted
}: PlaybookViewerProps) {
  const [sortBy, setSortBy] = useState<'quality' | 'recent' | 'usage'>('quality');
  const [filterSection, setFilterSection] = useState<string>('all');

  // Calculate stats
  const totalBullets = bullets.length;
  const totalFeedback = bullets.reduce((sum, b) => sum + b.helpful_count + b.harmful_count, 0);
  const avgQuality = bullets.length > 0
    ? bullets.reduce((sum, b) => {
        const total = b.helpful_count + b.harmful_count;
        return sum + (total > 0 ? b.helpful_count / total : 0);
      }, 0) / bullets.length * 100
    : 0;

  // Get sections
  const sections = ['all', ...new Set(bullets.map(b => b.section))];

  // Filter bullets
  let filteredBullets = bullets;
  if (filterSection !== 'all') {
    filteredBullets = bullets.filter(b => b.section === filterSection);
  }

  // Sort bullets
  const sortedBullets = [...filteredBullets].sort((a, b) => {
    if (sortBy === 'quality') {
      const qualityA = a.helpful_count + a.harmful_count > 0
        ? a.helpful_count / (a.helpful_count + a.harmful_count)
        : 0;
      const qualityB = b.helpful_count + b.harmful_count > 0
        ? b.helpful_count / (b.helpful_count + b.harmful_count)
        : 0;
      return qualityB - qualityA;
    } else if (sortBy === 'recent') {
      return b.last_updated - a.last_updated;
    } else { // usage
      return (b.helpful_count + b.harmful_count) - (a.helpful_count + a.harmful_count);
    }
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpenIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        
        {showStats && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Bullets:</span>
              <span className="font-semibold text-gray-900">{totalBullets}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Feedback:</span>
              <span className="font-semibold text-gray-900">{totalFeedback}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Quality:</span>
              <span className={`font-semibold ${
                avgQuality >= 70 ? 'text-green-600'
                : avgQuality >= 40 ? 'text-yellow-600'
                : 'text-red-600'
              }`}>
                {avgQuality.toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-4">
        {/* Section Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Section:</span>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {sections.map(section => (
              <option key={section} value={section}>
                {section === 'all' ? 'All Sections' : section.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="quality">Quality (Highest First)</option>
            <option value="recent">Recently Updated</option>
            <option value="usage">Most Feedback</option>
          </select>
        </div>
      </div>

      {/* Bullets List */}
      <div className="space-y-3">
        {sortedBullets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No bullets found. Execute tasks to generate playbook content.
          </div>
        ) : (
          sortedBullets.map((bullet) => (
            <div key={bullet.id}>
              {compact ? (
                <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {bullet.section.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{bullet.content}</p>
                  </div>
                  <BulletFeedbackCompact
                    bullet_id={bullet.id}
                    bullet_content={bullet.content}
                    initial_helpful_count={bullet.helpful_count}
                    initial_harmful_count={bullet.harmful_count}
                  />
                </div>
              ) : (
                <div>
                  <div className="mb-2">
                    <span className="inline-block text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {bullet.section.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <BulletFeedback
                    bullet_id={bullet.id}
                    bullet_content={bullet.content}
                    initial_helpful_count={bullet.helpful_count}
                    initial_harmful_count={bullet.harmful_count}
                    context={{ section: bullet.section }}
                    onFeedbackSubmitted={onFeedbackSubmitted}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <StarIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Help Train Our AI Judge!</h3>
            <p className="text-sm text-blue-700">
              Your feedback helps us train an LLM-as-judge that will make the system better for everyone. 
              Mark bullets as helpful or not helpful to contribute to the Human → Judge → Student pipeline.
            </p>
            <div className="mt-2 text-xs text-blue-600">
              💡 Collected feedback: {totalFeedback} ratings • Quality score: {avgQuality.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Feedback Summary Dashboard
 */
export function FeedbackSummary() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/feedback');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch feedback stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500">Loading feedback statistics...</p>
      </div>
    );
  }

  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500">No feedback collected yet. Start rating bullets!</p>
      </div>
    );
  }

  const totalBullets = Object.keys(stats).length;
  const totalFeedback = Object.values(stats).reduce(
    (sum: number, stat: any) => sum + stat.total,
    0
  );
  const avgQuality = Object.values(stats).reduce(
    (sum: number, stat: any) => sum + (stat.helpful / stat.total),
    0
  ) / totalBullets * 100;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <TrendingUpIcon className="w-6 h-6 text-indigo-600" />
        <h3 className="text-xl font-bold text-gray-900">Feedback Summary</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{totalBullets}</div>
          <div className="text-sm text-gray-500">Rated Bullets</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{totalFeedback}</div>
          <div className="text-sm text-gray-500">Total Ratings</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{avgQuality.toFixed(0)}%</div>
          <div className="text-sm text-gray-500">Avg Quality</div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        🎯 <strong>{totalFeedback}</strong> ratings collected for judge training!
      </div>
    </div>
  );
}

export default PlaybookViewerWithFeedback;

