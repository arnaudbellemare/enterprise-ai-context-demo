'use client';

import React, { useState } from 'react';
import { SQLTemplate, SQL_CATEGORIES, SQL_TEMPLATES, getTemplatesByCategory, searchTemplates, replaceTemplateParameters, validateTemplateParameters } from '../lib/sql-templates';

interface SQLTemplateSelectorProps {
  onSelectTemplate: (query: string) => void;
  onClose: () => void;
}

export default function SQLTemplateSelector({ onSelectTemplate, onClose }: SQLTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<SQLTemplate | null>(null);
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [showParameters, setShowParameters] = useState(false);

  const categories = ['All', ...SQL_CATEGORIES];

  const getFilteredTemplates = (): SQLTemplate[] => {
    let templates = selectedCategory === 'All' 
      ? SQL_TEMPLATES 
      : getTemplatesByCategory(selectedCategory);

    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    }

    return templates;
  };

  const handleTemplateSelect = (template: SQLTemplate) => {
    setSelectedTemplate(template);
    
    if (template.parameters && template.parameters.length > 0) {
      setShowParameters(true);
      // Initialize parameters with empty values
      const initialParams: Record<string, string> = {};
      template.parameters.forEach(param => {
        initialParams[param] = '';
      });
      setParameters(initialParams);
    } else {
      // No parameters needed, use template directly
      onSelectTemplate(template.query);
      onClose();
    }
  };

  const handleParameterChange = (param: string, value: string) => {
    setParameters(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    const validation = validateTemplateParameters(selectedTemplate, parameters);
    
    if (!validation.valid) {
      alert(`Please fill in all required parameters: ${validation.missing.join(', ')}`);
      return;
    }

    const finalQuery = replaceTemplateParameters(selectedTemplate, parameters);
    onSelectTemplate(finalQuery);
    onClose();
  };

  const filteredTemplates = getFilteredTemplates();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">SQL Template Selector</h2>
              <p className="text-gray-600 mt-1">Choose from pre-built SQL templates</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Categories</h3>
              <div className="space-y-1">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 text-sm rounded ${
                      selectedCategory === category
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4">
            {showParameters ? (
              /* Parameters Form */
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Configure Template: {selectedTemplate?.name}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {selectedTemplate?.description}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  {selectedTemplate?.parameters?.map(param => (
                    <div key={param}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      <input
                        type="text"
                        placeholder={`Enter ${param}...`}
                        value={parameters[param] || ''}
                        onChange={(e) => handleParameterChange(param, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowParameters(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUseTemplate}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ) : (
              /* Template List */
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedCategory === 'All' ? 'All Templates' : `${selectedCategory} Templates`}
                    <span className="text-gray-500 text-sm ml-2">({filteredTemplates.length})</span>
                  </h3>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredTemplates.map(template => (
                    <div
                      key={template.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <p className="text-gray-600 text-sm mt-1">{template.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {template.category}
                          </span>
                        </div>
                      </div>
                      
                      {template.parameters && template.parameters.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Parameters: {template.parameters.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No templates found matching your criteria.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
