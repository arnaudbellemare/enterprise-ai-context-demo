import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Enterprise AI Context Engineering
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              GEPA Active
            </span>
          </div>
        </div>
      </nav>

      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">GEPA Optimization Engine</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Learning Active</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/10 p-4 rounded-lg">
                    <p className="text-sm text-gray-200">Iterations</p>
                    <p className="text-2xl font-bold text-white">120</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <p className="text-sm text-gray-200">Performance</p>
                    <p className="text-2xl font-bold text-white">+10%</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <p className="text-sm text-gray-200">Efficiency</p>
                    <p className="text-2xl font-bold text-white">35x</p>
                  </div>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-white h-full rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Active Context Sources
                </h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  3 Connected
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border-blue-500 border">
                  <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full mr-3 bg-blue-500"></span>
                    <p className="font-medium text-blue-800">CRM Data</p>
                  </div>
                  <span className="text-sm text-blue-600">Connected</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border-gray-200 border">
                  <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full mr-3 bg-gray-400"></span>
                    <p className="font-medium text-gray-900">Document Repository</p>
                  </div>
                  <span className="text-sm text-gray-500">Connected</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border-gray-200 border">
                  <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full mr-3 bg-gray-400"></span>
                    <p className="font-medium text-gray-900">Product Database</p>
                  </div>
                  <span className="text-sm text-gray-500">Connected</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Platform Analytics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-500">Total Queries</h4>
                <p className="text-3xl font-bold text-gray-900 mb-2">1.2M</p>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-green-500">+12%</span>
                  <span className="ml-1 text-sm text-gray-500">since last month</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-500">Avg. Response Time</h4>
                <p className="text-3xl font-bold text-gray-900 mb-2">250ms</p>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-red-500">-5%</span>
                  <span className="ml-1 text-sm text-gray-500">since last month</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-500">GEPA Optimizations</h4>
                <p className="text-3xl font-bold text-gray-900 mb-2">500</p>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-green-500">+20%</span>
                  <span className="ml-1 text-sm text-gray-500">since last month</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-500">RAG Hit Rate</h4>
                <p className="text-3xl font-bold text-gray-900 mb-2">92%</p>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-green-500">+3%</span>
                  <span className="ml-1 text-sm text-gray-500">since last month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
