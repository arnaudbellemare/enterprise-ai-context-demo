/**
 * Expert Playbook Editor Page
 * 
 * Main interface for domain experts to edit the ACE contextual playbook
 * Implements the ACE paper's vision: "Domain experts can directly shape what the AI knows"
 */

'use client';

import React, { useState } from 'react';
import { ExpertPlaybookEditor } from '../../components/expert-playbook-editor';
import { BookOpenIcon, UserIcon, ShieldIcon, AlertTriangleIcon } from 'lucide-react';

export default function ExpertPlaybookPage() {
  const [selectedDomain, setSelectedDomain] = useState<string>('legal');
  const [selectedExpertType, setSelectedExpertType] = useState<'lawyer' | 'analyst' | 'doctor' | 'compliance' | 'other'>('lawyer');
  const [expertCredentials, setExpertCredentials] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const domains = [
    { id: 'legal', name: 'Legal', description: 'Law, regulations, compliance' },
    { id: 'finance', name: 'Finance', description: 'Financial analysis, risk management' },
    { id: 'healthcare', name: 'Healthcare', description: 'Medical, patient care, HIPAA' },
    { id: 'compliance', name: 'Compliance', description: 'Regulatory, governance, policies' },
    { id: 'general', name: 'General', description: 'Cross-domain knowledge' }
  ];

  const expertTypes = [
    { id: 'lawyer', name: 'Lawyer', icon: '⚖️', description: 'Legal expertise and regulatory knowledge' },
    { id: 'analyst', name: 'Analyst', icon: '📊', description: 'Financial and business analysis' },
    { id: 'doctor', name: 'Doctor', icon: '🩺', description: 'Medical and healthcare expertise' },
    { id: 'compliance', name: 'Compliance Officer', icon: '✅', description: 'Regulatory and governance expertise' },
    { id: 'other', name: 'Other Expert', icon: '👨‍💼', description: 'Domain-specific expertise' }
  ];

  const handleAuthentication = () => {
    if (expertCredentials.trim()) {
      setIsAuthenticated(true);
    } else {
      alert('Please enter your expert credentials');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setExpertCredentials('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpenIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Expert Playbook Editor</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Domain experts can directly shape what the AI knows by editing its contextual playbook. 
              This implements the ACE framework's vision for expert-guided AI knowledge.
            </p>
          </div>

          {/* Authentication Form */}
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <ShieldIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-gray-900">Expert Authentication</h2>
              <p className="text-sm text-gray-600 mt-1">
                Please verify your expert credentials to access the playbook editor
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expert Type
                </label>
                <select
                  value={selectedExpertType}
                  onChange={(e) => setSelectedExpertType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {expertTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expert Credentials
                </label>
                <input
                  type="text"
                  value={expertCredentials}
                  onChange={(e) => setExpertCredentials(e.target.value)}
                  placeholder="Enter your professional credentials or license number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleAuthentication}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Access Playbook Editor
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Expert Access</h3>
                  <p className="text-sm text-blue-700">
                    This interface allows domain experts to directly edit the AI's contextual playbook. 
                    Your changes will immediately improve the AI's responses for all users.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Expert Types Overview */}
          <div className="max-w-4xl mx-auto mt-12">
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">
              Expert Types & Domains
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {expertTypes.map(type => (
                <div key={type.id} className="bg-white rounded-lg shadow p-4">
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <h4 className="font-semibold text-gray-900 mb-1">{type.name}</h4>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpenIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Expert Playbook Editor</h1>
              <p className="text-sm text-gray-600">
                {expertTypes.find(t => t.id === selectedExpertType)?.icon} {expertTypes.find(t => t.id === selectedExpertType)?.name} • {domains.find(d => d.id === selectedDomain)?.name} Domain
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Domain Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Domain:</span>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {domains.map(domain => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* User Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserIcon className="w-4 h-4" />
              <span>{expertCredentials}</span>
            </div>
            
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Domain Description */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-1">
            {domains.find(d => d.id === selectedDomain)?.name} Domain
          </h3>
          <p className="text-sm text-gray-600">
            {domains.find(d => d.id === selectedDomain)?.description}
          </p>
        </div>

        {/* Expert Playbook Editor */}
        <ExpertPlaybookEditor
          domain={selectedDomain}
          expert_type={selectedExpertType}
          expert_credentials={expertCredentials}
          onEditComplete={() => {
            console.log('Playbook edit completed');
          }}
        />

        {/* ACE Framework Info */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About ACE Framework</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Expert-Guided AI Knowledge</h4>
              <p className="text-sm text-gray-600">
                The ACE (Agentic Context Engineering) framework allows domain experts to directly shape 
                what the AI knows by editing its contextual playbook. This creates a feedback loop where 
                expert knowledge continuously improves AI responses.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Benefits</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Direct expert control over AI knowledge</li>
                <li>• Immediate impact on AI responses</li>
                <li>• Transparent and auditable changes</li>
                <li>• Continuous learning and improvement</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
