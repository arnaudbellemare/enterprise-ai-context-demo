/**
 * Expert Playbook Editor Component
 * 
 * Allows domain experts to directly edit the ACE contextual playbook
 * Implements the ACE paper's vision: "Domain experts can directly shape what the AI knows"
 */

'use client';

import React, { useState, useEffect } from 'react';
import { BookOpenIcon, EditIcon, TrashIcon, CheckIcon, XIcon, AlertTriangleIcon, StarIcon } from 'lucide-react';

export interface ExpertBullet {
  id: string;
  content: string;
  domain: string;
  confidence: number;
  helpful_count: number;
  harmful_count: number;
  created_at: string;
  metadata: {
    expert_type?: string;
    expert_credentials?: string;
    reasoning?: string;
    priority?: string;
    tags?: string[];
    regulation_reference?: string;
    jurisdiction?: string;
  };
}

export interface ExpertPlaybookEditorProps {
  domain: string;
  expert_type: 'lawyer' | 'analyst' | 'doctor' | 'compliance' | 'other';
  expert_credentials: string;
  onEditComplete?: () => void;
}

export function ExpertPlaybookEditor({
  domain,
  expert_type,
  expert_credentials,
  onEditComplete
}: ExpertPlaybookEditorProps) {
  const [bullets, setBullets] = useState<ExpertBullet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBullet, setEditingBullet] = useState<string | null>(null);
  const [newBulletContent, setNewBulletContent] = useState('');
  const [newBulletReasoning, setNewBulletReasoning] = useState('');
  const [newBulletPriority, setNewBulletPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newBulletTags, setNewBulletTags] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'needs_review' | 'low_confidence' | 'contradictory'>('all');

  useEffect(() => {
    loadPlaybook();
  }, [domain, expert_type]);

  const loadPlaybook = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/playbook/expert-edit?domain=${domain}&expert_type=${expert_type}&limit=100`);
      const data = await response.json();
      
      if (data.success) {
        setBullets(data.bullets || []);
      } else {
        console.error('Failed to load playbook:', data.message);
      }
    } catch (error) {
      console.error('Error loading playbook:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBullet = async () => {
    if (!newBulletContent.trim()) return;

    try {
      const response = await fetch('/api/playbook/expert-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          content: newBulletContent,
          domain: domain,
          expert_type: expert_type,
          expert_credentials: expert_credentials,
          reasoning: newBulletReasoning,
          priority: newBulletPriority,
          tags: newBulletTags
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setNewBulletContent('');
        setNewBulletReasoning('');
        setNewBulletTags([]);
        setShowAddForm(false);
        loadPlaybook();
        onEditComplete?.();
      } else {
        alert(`Failed to add bullet: ${data.message}`);
      }
    } catch (error) {
      console.error('Error adding bullet:', error);
      alert('Failed to add bullet');
    }
  };

  const handleEditBullet = async (bulletId: string, newContent: string) => {
    try {
      const response = await fetch('/api/playbook/expert-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          bullet_id: bulletId,
          content: newContent,
          domain: domain,
          expert_type: expert_type,
          expert_credentials: expert_credentials,
          reasoning: 'Expert edit for improved accuracy'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setEditingBullet(null);
        loadPlaybook();
        onEditComplete?.();
      } else {
        alert(`Failed to edit bullet: ${data.message}`);
      }
    } catch (error) {
      console.error('Error editing bullet:', error);
      alert('Failed to edit bullet');
    }
  };

  const handleDeleteBullet = async (bulletId: string) => {
    if (!confirm('Are you sure you want to delete this bullet? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/playbook/expert-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          bullet_id: bulletId,
          domain: domain,
          expert_type: expert_type,
          expert_credentials: expert_credentials,
          reasoning: 'Expert deletion due to inaccuracy or obsolescence'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        loadPlaybook();
        onEditComplete?.();
      } else {
        alert(`Failed to delete bullet: ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting bullet:', error);
      alert('Failed to delete bullet');
    }
  };

  const handleApproveBullet = async (bulletId: string) => {
    try {
      const response = await fetch('/api/playbook/expert-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          bullet_id: bulletId,
          domain: domain,
          expert_type: expert_type,
          expert_credentials: expert_credentials,
          reasoning: 'Expert approval for accuracy and relevance'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        loadPlaybook();
        onEditComplete?.();
      } else {
        alert(`Failed to approve bullet: ${data.message}`);
      }
    } catch (error) {
      console.error('Error approving bullet:', error);
      alert('Failed to approve bullet');
    }
  };

  const handleRejectBullet = async (bulletId: string) => {
    try {
      const response = await fetch('/api/playbook/expert-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          bullet_id: bulletId,
          domain: domain,
          expert_type: expert_type,
          expert_credentials: expert_credentials,
          reasoning: 'Expert rejection due to inaccuracy or irrelevance'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        loadPlaybook();
        onEditComplete?.();
      } else {
        alert(`Failed to reject bullet: ${data.message}`);
      }
    } catch (error) {
      console.error('Error rejecting bullet:', error);
      alert('Failed to reject bullet');
    }
  };

  // Filter bullets based on current filter
  const filteredBullets = bullets.filter(bullet => {
    switch (filter) {
      case 'needs_review':
        return bullet.confidence < 0.8 || !(bullet.metadata as any)?.expert_reviewed;
      case 'low_confidence':
        return bullet.confidence < 0.6;
      case 'contradictory':
        return bullet.helpful_count > 0 && bullet.harmful_count > 0;
      default:
        return true;
    }
  });

  const getExpertIcon = (type: string) => {
    switch (type) {
      case 'lawyer': return '⚖️';
      case 'analyst': return '📊';
      case 'doctor': return '🩺';
      case 'compliance': return '✅';
      default: return '👨‍💼';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpenIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {getExpertIcon(expert_type)} Expert Playbook Editor
            </h2>
            <p className="text-sm text-gray-600">
              {expert_type.charAt(0).toUpperCase() + expert_type.slice(1)} editing {domain} domain knowledge
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add New Bullet
        </button>
      </div>

      {/* Add New Bullet Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Add New Expert Bullet</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                value={newBulletContent}
                onChange={(e) => setNewBulletContent(e.target.value)}
                placeholder="Enter the expert guidance or knowledge..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reasoning
              </label>
              <textarea
                value={newBulletReasoning}
                onChange={(e) => setNewBulletReasoning(e.target.value)}
                placeholder="Why is this guidance important? (Optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newBulletPriority}
                  onChange={(e) => setNewBulletPriority(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleAddBullet}
                disabled={!newBulletContent.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Bullet
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-gray-600">Filter:</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Bullets</option>
          <option value="needs_review">Needs Review</option>
          <option value="low_confidence">Low Confidence</option>
          <option value="contradictory">Contradictory</option>
        </select>
        
        <div className="text-sm text-gray-500">
          Showing {filteredBullets.length} of {bullets.length} bullets
        </div>
      </div>

      {/* Bullets List */}
      <div className="space-y-4">
        {filteredBullets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No bullets found matching the current filter.
          </div>
        ) : (
          filteredBullets.map((bullet) => (
            <div key={bullet.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Bullet Content */}
                  {editingBullet === bullet.id ? (
                    <div className="mb-3">
                      <textarea
                        defaultValue={bullet.content}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            handleEditBullet(bullet.id, e.currentTarget.value);
                          }
                          if (e.key === 'Escape') {
                            setEditingBullet(null);
                          }
                        }}
                      />
                      <div className="mt-2 text-xs text-gray-500">
                        Press Ctrl+Enter to save, Escape to cancel
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <p className="text-sm text-gray-700">{bullet.content}</p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded ${getPriorityColor(bullet.metadata?.priority || 'medium')}`}>
                      {bullet.metadata?.priority || 'medium'}
                    </span>
                    <span>Confidence: {(bullet.confidence * 100).toFixed(0)}%</span>
                    <span>Helpful: {bullet.helpful_count}</span>
                    <span>Harmful: {bullet.harmful_count}</span>
                    {bullet.metadata?.tags && bullet.metadata.tags.length > 0 && (
                      <span>Tags: {bullet.metadata.tags.join(', ')}</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  {editingBullet === bullet.id ? (
                    <>
                      <button
                        onClick={() => {
                          const textarea = document.querySelector(`textarea[defaultValue="${bullet.content}"]`) as HTMLTextAreaElement;
                          if (textarea) {
                            handleEditBullet(bullet.id, textarea.value);
                          }
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Save changes"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingBullet(null)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                        title="Cancel editing"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingBullet(bullet.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit bullet"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleApproveBullet(bullet.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Approve bullet"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRejectBullet(bullet.id)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                        title="Reject bullet"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBullet(bullet.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete bullet"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <StarIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Expert Playbook Editing</h3>
            <p className="text-sm text-blue-700">
              As a {expert_type}, you can directly shape what the AI knows by editing this contextual playbook. 
              Your changes will immediately improve the AI's responses for all users in the {domain} domain.
            </p>
            <div className="mt-2 text-xs text-blue-600">
              💡 Your edits are logged for audit purposes and help train the AI judge system.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpertPlaybookEditor;
