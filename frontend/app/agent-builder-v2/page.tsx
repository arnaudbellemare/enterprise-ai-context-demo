'use client';

/**
 * Agent Builder V2 - Arena Comparison Interface
 * Clean version - only Arena comparison
 */

import React from 'react';
import ArenaSimple from '@/components/arena-simple';

export default function AgentBuilderV2() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-block px-6 py-2 bg-black text-white mb-6">
              <span className="text-xs font-bold tracking-widest">ENTERPRISE AI PLATFORM</span>
            </div>
            
            <h1 className="text-5xl font-bold text-black mb-4 tracking-tight" style={{ fontFamily: 'monospace' }}>
              ACE Framework vs Browserbase
            </h1>
            
            <p className="text-lg text-gray-600" style={{ fontFamily: 'monospace' }}>
              Comprehensive comparison of our application-level optimized system vs Arena's model-focused approach
            </p>
          </div>

          {/* Arena Comparison */}
          <ArenaSimple />
          
        </div>
      </div>
    </div>
  );
}

