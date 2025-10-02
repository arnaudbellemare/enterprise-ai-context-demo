'use client'

import { User } from '@supabase/supabase-js'
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline'

interface HeaderProps {
  user: User
}

export default function Header({ user }: HeaderProps) {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Enterprise AI Context
          </h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            GEPA Active
          </span>
        </div>
        
        {/* User Profile & Controls */}
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center space-x-2">
            <UserCircleIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {user.email}
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}
