'use client'

import { useState, useEffect } from 'react'

interface MetricData {
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
}

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<MetricData[]>([])

  useEffect(() => {
    // Mock analytics data
    const mockMetrics: MetricData[] = [
      { name: 'AI Response Time', value: 1.2, change: -15, trend: 'up' },
      { name: 'Context Accuracy', value: 94.5, change: 8, trend: 'up' },
      { name: 'User Satisfaction', value: 87.3, change: 12, trend: 'up' },
      { name: 'System Uptime', value: 99.8, change: 0.2, trend: 'up' },
    ]
    setMetrics(mockMetrics)
  }, [])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Performance Analytics
        </h3>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Real-time
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.name} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.name}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}{metric.name.includes('Time') ? 's' : '%'}
                </p>
              </div>
              <div className={`flex items-center ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                <span className="text-sm font-medium">
                  {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}{metric.change}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
