'use client'

import { ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import Sidebar from './Sidebar'
import Header from './Header'

interface DashboardShellProps {
  children: ReactNode
  user: User
}

export default function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <Header user={user} />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
