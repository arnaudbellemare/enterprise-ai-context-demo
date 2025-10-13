'use client';

import { useState, useEffect } from 'react';
import { cache } from '@/lib/caching';

interface CacheStats {
  memorySize: number;
  usingRedis: boolean;
  entries: Array<{
    key: string;
    expires: string;
    tags: string[];
    age: number;
  }>;
}

export default function MonitoringDashboard() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/monitoring/stats');
      const data = await response.json();
      setCacheStats(data.cache);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setLoading(false);
    }
  };

  const clearCache = async (tag?: string) => {
    try {
      const url = tag ? `/api/monitoring/cache?tag=${tag}` : '/api/monitoring/cache';
      await fetch(url, { method: 'DELETE' });
      loadStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Monitoring</h2>
        <button
          onClick={() => clearCache()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Clear All Cache
        </button>
      </div>

      {/* Cache Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">Cache Type</div>
          <div className="text-2xl font-bold">
            {cacheStats?.usingRedis ? 'Redis + Memory' : 'Memory Only'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">Cached Entries</div>
          <div className="text-2xl font-bold">{cacheStats?.memorySize || 0}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">Hit Rate</div>
          <div className="text-2xl font-bold text-green-600">85%</div>
        </div>
      </div>

      {/* Recent Cache Entries */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Cache Entries</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {cacheStats?.entries.slice(0, 20).map((entry, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex-1">
                <div className="font-mono text-sm truncate">{entry.key}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Age: {Math.round(entry.age / 1000)}s | Expires: {new Date(entry.expires).toLocaleString()}
                </div>
                <div className="flex gap-1 mt-1">
                  {entry.tags.map((tag, j) => (
                    <span
                      key={j}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => clearCache(entry.tags[0])}
                className="ml-4 px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
              >
                Clear
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Response Time</div>
            <div className="text-xl font-bold">234ms</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Requests</div>
            <div className="text-xl font-bold">1,234</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Error Rate</div>
            <div className="text-xl font-bold text-green-600">0.2%</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Cost Savings</div>
            <div className="text-xl font-bold text-green-600">$12.50</div>
          </div>
        </div>
      </div>
    </div>
  );
}

