/**
 * Simple Arena Test Component
 * Minimal version to test tab switching
 */

'use client';

import React from 'react';

export default function ArenaTest() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-black mb-4" style={{ fontFamily: 'monospace' }}>
        🥊 Arena Test
      </h2>
      <p className="text-gray-600 mb-4" style={{ fontFamily: 'monospace' }}>
        This is a test of the Arena comparison tab. If you can see this, the tab switching is working!
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Browserbase Arena</h3>
          <p className="text-sm text-blue-700">Standard browser automation</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Our System + ACE</h3>
          <p className="text-sm text-green-700">ACE-enhanced workflow automation</p>
        </div>
      </div>
    </div>
  );
}
