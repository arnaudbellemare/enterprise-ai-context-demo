'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface ContextSource {
  id: string
  name: string
  type: string
  status: 'connected' | 'disconnected' | 'error'
  lastUpdate: string
}

export default function ContextManager() {
  const [contexts, setContexts] = useState<ContextSource[]>([])
  const [activeContext, setActiveContext] = useState<string | null>(null)

  useEffect(() => {
    // Mock context sources - in production, fetch from Supabase
    const mockContexts: ContextSource[] = [
      {
        id: 'user_prefs',
        name: 'User Preferences',
        type: 'preferences',
        status: 'connected',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'conversation_history',
        name: 'Conversation History',
        type: 'history',
        status: 'connected',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'business_data',
        name: 'Business Data',
        type: 'data',
        status: 'connected',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'knowledge_base',
        name: 'Knowledge Base',
        type: 'knowledge',
        status: 'connected',
        lastUpdate: new Date().toISOString()
      }
    ]
    
    setContexts(mockContexts)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'disconnected':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Active Context Sources
        </h3>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {contexts.length} Connected
        </span>
      </div>
      
      <div className="space-y-3">
        {contexts.map((context) => (
          <div
            key={context.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
              activeContext === context.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setActiveContext(activeContext === context.id ? null : context.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {context.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {context.type} • Updated {new Date(context.lastUpdate).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(context.status)}`}>
                {context.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
