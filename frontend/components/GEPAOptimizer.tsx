'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface OptimizationData {
  iterations: number
  improvement: number
  efficiency: number
  progress: number
  isActive: boolean
}

export default function GEPAOptimizer() {
  const [optimizationData, setOptimizationData] = useState<OptimizationData>({
    iterations: 0,
    improvement: 0,
    efficiency: 0,
    progress: 0,
    isActive: false
  })

  useEffect(() => {
    // Simulate real-time optimization data
    const interval = setInterval(() => {
      setOptimizationData(prev => ({
        iterations: prev.iterations + Math.random() * 0.1,
        improvement: Math.min(100, prev.improvement + Math.random() * 2),
        efficiency: Math.min(35, prev.efficiency + Math.random() * 0.5),
        progress: Math.min(100, prev.progress + Math.random() * 1),
        isActive: true
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">GEPA Optimization Engine</h3>
        {optimizationData.isActive && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-ai-pulse"></div>
            <span className="text-sm">Learning Active</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/20 rounded-lg p-3">
          <div className="text-sm opacity-90">Iterations</div>
          <div className="text-2xl font-bold">{optimizationData.iterations.toFixed(1)}</div>
        </div>
        <div className="bg-white/20 rounded-lg p-3">
          <div className="text-sm opacity-90">Performance</div>
          <div className="text-2xl font-bold">+{optimizationData.improvement.toFixed(1)}%</div>
        </div>
        <div className="bg-white/20 rounded-lg p-3">
          <div className="text-sm opacity-90">Efficiency</div>
          <div className="text-2xl font-bold">{optimizationData.efficiency.toFixed(1)}x</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Optimization Progress</span>
          <span>{optimizationData.progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${optimizationData.progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}
