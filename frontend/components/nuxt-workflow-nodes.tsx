/**
 * Nuxt UI-Inspired Workflow Nodes
 * Clean, modern, icon-based design for workflow builder
 */

'use client';

import React from 'react';
import {
  Database02Icon,
  Globe02Icon,
  PackageIcon,
  Rocket01Icon,
  UserCircleIcon,
  CheckmarkCircle01Icon,
  ChartLineData01Icon,
  Home01Icon,
  DollarCircleIcon,
  Settings02Icon
} from 'hugeicons-react';

// Icon map for dynamic rendering
const ICON_MAP: Record<string, any> = {
  Database02: Database02Icon,
  Globe02: Globe02Icon,
  Package: PackageIcon,
  Rocket01: Rocket01Icon,
  UserCircle: UserCircleIcon,
  CheckmarkCircle01: CheckmarkCircle01Icon,
  ChartLineData01: ChartLineData01Icon,
  Home01: Home01Icon,
  DollarCircle: DollarCircleIcon,
  Settings02: Settings02Icon,
  // Fallback for AiNetworkIcon (doesn't exist in hugeicons)
  AiNetworkIcon: Settings02Icon,  // Use Settings as AI/router icon
  // Letter fallbacks (show as text in colored box)
  F: null,  // Financial (will show "F")
  I: null,  // Investment (will show "I")
  D: null,  // Data (will show "D")
  S: null,  // Search/Struct (will show "S")
  M: null,  // Market (will show "M")
  R: null,  // Real Estate (will show "R")
  L: null,  // LangStruct (will show "L")
};

// Nuxt UI color palette mapping
const COLOR_CLASSES: Record<string, string> = {
  indigo: 'bg-indigo-500 text-white border-indigo-600',
  blue: 'bg-blue-500 text-white border-blue-600',
  purple: 'bg-purple-500 text-white border-purple-600',
  emerald: 'bg-emerald-500 text-white border-emerald-600',
  violet: 'bg-violet-500 text-white border-violet-600',
  slate: 'bg-slate-500 text-white border-slate-600',
  cyan: 'bg-cyan-500 text-white border-cyan-600',
  green: 'bg-green-500 text-white border-green-600',
  yellow: 'bg-yellow-500 text-white border-yellow-600',
  red: 'bg-red-500 text-white border-red-600',
  gray: 'bg-gray-500 text-white border-gray-600',
};

interface NuxtNodeIconProps {
  iconName: string;
  color: string;
  size?: number;
}

export function NuxtNodeIcon({ iconName, color, size = 20 }: NuxtNodeIconProps) {
  const IconComponent = ICON_MAP[iconName];
  const colorClass = COLOR_CLASSES[color] || COLOR_CLASSES.gray;
  
  if (!IconComponent) {
    // Fallback for unmapped icons
    return (
      <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center font-bold text-sm`}>
        {iconName.charAt(0)}
      </div>
    );
  }
  
  return (
    <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center shadow-sm`}>
      <IconComponent size={size} className="text-white" />
    </div>
  );
}

interface NuxtNodeCardProps {
  label: string;
  description: string;
  iconName: string;
  color: string;
  onClick: () => void;
  badge?: string;
}

export function NuxtNodeCard({ label, description, iconName, color, onClick, badge }: NuxtNodeCardProps) {
  const colorClass = COLOR_CLASSES[color] || COLOR_CLASSES.gray;
  const bgColor = colorClass.split(' ')[0]; // Extract bg-* class
  
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-gray-900 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <NuxtNodeIcon iconName={iconName} color={color} size={20} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 text-sm group-hover:text-black transition-colors">
              {label}
            </h4>
            {badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

interface NuxtNodeLibraryProps {
  nodes: Array<{
    id: string;
    label: string;
    description: string;
    icon: string;
    iconColor: string;
  }>;
  onNodeClick: (nodeType: any) => void;
}

export function NuxtNodeLibrary({ nodes, onNodeClick }: NuxtNodeLibraryProps) {
  // Group nodes by category
  const categories = {
    'Data Sources': nodes.filter(n => 
      ['memorySearch', 'webSearch'].includes(n.id)
    ),
    'Processing': nodes.filter(n => 
      ['contextAssembly', 'modelRouter', 'gepaOptimize', 'langstruct'].includes(n.id)
    ),
    'Agents': nodes.filter(n => 
      ['customAgent', 'answer'].includes(n.id) || n.id.startsWith('dspy')
    ),
    'Advanced': nodes.filter(n => 
      ['cel', 'arcmemo', 'learningTracker'].includes(n.id)
    )
  };
  
  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Workflow Nodes</h2>
        <p className="text-xs text-gray-600">Click to add to canvas</p>
      </div>
      
      <div className="space-y-6">
        {Object.entries(categories).map(([category, categoryNodes]) => {
          if (categoryNodes.length === 0) return null;
          
          return (
            <div key={category}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryNodes.map(node => (
                  <NuxtNodeCard
                    key={node.id}
                    label={node.label}
                    description={node.description}
                    iconName={node.icon}
                    color={node.iconColor}
                    onClick={() => onNodeClick(node)}
                    badge={node.description.includes('FREE') ? 'FREE' : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface NuxtToolbarProps {
  onExecute: () => void;
  onLoadExample: () => void;
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
  isExecuting: boolean;
  nodeCount: number;
  edgeCount: number;
}

export function NuxtToolbar({ 
  onExecute, 
  onLoadExample, 
  onExport, 
  onImport, 
  onClear,
  isExecuting,
  nodeCount,
  edgeCount 
}: NuxtToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">Workflow Builder</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
              {nodeCount} nodes
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
              {edgeCount} connections
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onLoadExample}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Load Example
          </button>
          
          <button
            onClick={onImport}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Import
          </button>
          
          <button
            onClick={onExport}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Export
          </button>
          
          <button
            onClick={onClear}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            Clear
          </button>
          
          <button
            onClick={onExecute}
            disabled={isExecuting || nodeCount === 0}
            className="px-6 py-2 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          >
            {isExecuting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Executing...
              </span>
            ) : (
              'Execute Workflow'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface NuxtStatusPanelProps {
  status: 'idle' | 'running' | 'completed' | 'error';
  message?: string;
  logs?: string[];
  results?: any;
}

export function NuxtStatusPanel({ status, message, logs = [], results }: NuxtStatusPanelProps) {
  const statusConfig = {
    idle: {
      color: 'bg-gray-100 text-gray-700 border-gray-300',
      icon: '○',
      text: 'Ready'
    },
    running: {
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      icon: '◐',
      text: 'Running...'
    },
    completed: {
      color: 'bg-green-100 text-green-700 border-green-300',
      icon: '✓',
      text: 'Completed'
    },
    error: {
      color: 'bg-red-100 text-red-700 border-red-300',
      icon: '✗',
      text: 'Error'
    }
  };
  
  const config = statusConfig[status];
  
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${config.color}`}>
            {config.icon} {config.text}
          </span>
          {message && (
            <span className="text-sm text-gray-600">{message}</span>
          )}
        </div>
      </div>
      
      {logs.length > 0 && (
        <div className="mt-3 bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-700 mb-2">Execution Logs</div>
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="text-xs text-gray-600 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {results && (
        <div className="mt-3 bg-green-50 rounded-lg p-3">
          <div className="text-xs font-semibold text-green-700 mb-2">Results</div>
          <div className="text-sm text-green-900 font-mono whitespace-pre-wrap">
            {typeof results === 'string' ? results : JSON.stringify(results, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}

interface NuxtNodePaletteItemProps {
  node: {
    id: string;
    label: string;
    description: string;
    icon: string;
    iconColor: string;
  };
  onClick: () => void;
}

export function NuxtNodePaletteItem({ node, onClick }: NuxtNodePaletteItemProps) {
  const IconComponent = ICON_MAP[node.icon];
  const isFree = node.description.toLowerCase().includes('free');
  
  return (
    <button
      onClick={onClick}
      className="group relative w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-900 hover:shadow-md transition-all duration-150"
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${COLOR_CLASSES[node.iconColor] || COLOR_CLASSES.gray} flex items-center justify-center shadow-sm flex-shrink-0`}>
          {IconComponent ? (
            <IconComponent size={16} className="text-white" />
          ) : (
            <span className="text-white text-xs font-bold">{node.icon}</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-medium text-gray-900 text-xs">
              {node.label}
            </div>
            {isFree && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded">
                FREE
              </span>
            )}
          </div>
          <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
            {node.description}
          </div>
        </div>
      </div>
      
      {/* Hover indicator */}
      <div className="absolute inset-0 border-2 border-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
}

