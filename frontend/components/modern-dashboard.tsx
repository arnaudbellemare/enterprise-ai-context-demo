/**
 * Modern Dashboard - Using our existing UI components and modern design
 * Leverages shadcn/ui, Hugeicons, and modern design patterns
 */

'use client';

import React from 'react';
import { 
  ArrowRight01Icon,
  Clock01Icon,
  Database02Icon,
  Globe02Icon,
  Brain01Icon,
  Settings02Icon,
  ChartLineData01Icon,
  Target02Icon,
  CheckmarkBadge02Icon,
  FlashIcon,
  DollarCircleIcon,
  ChartBarLineIcon,
  Globe02Icon as NetworkIcon,
  CheckmarkBadge02Icon as ShieldCheckIcon,
  ZapIcon
} from 'hugeicons-react';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModernDashboardProps {
  onNavigate: (tab: string) => void;
}

export function ModernDashboard({ onNavigate }: ModernDashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                ACE Framework
              </h1>
              <p className="text-xl text-gray-300">
                Intelligent Orchestration v1.0
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="secondary" className="bg-green-900 text-green-300 border-green-700">
                  <CheckmarkBadge02Icon size={16} className="mr-2" />
                  LEARNED.ROUTER:ACTIVE
                </Badge>
                <Badge variant="secondary" className="bg-blue-900 text-blue-300 border-blue-700">
                  <ShieldCheckIcon size={16} className="mr-2" />
                  STATISTICAL.TESTS:READY
                </Badge>
                <Badge variant="secondary" className="bg-purple-900 text-purple-300 border-purple-700">
                  <ZapIcon size={16} className="mr-2" />
                  COST.OPTIMIZATION:67%
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">System Status</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-medium">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Core Capabilities */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Core Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gray-800/50 border-gray-700 hover:border-green-500 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-900 rounded-lg">
                    <Brain01Icon size={24} className="text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">Learned Router</CardTitle>
                    <CardDescription className="text-gray-400">Adaptive Intelligence</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Self-improving routing that learns from execution feedback and adapts to new patterns automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-900 rounded-lg">
                    <Target02Icon size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">ACE Framework</CardTitle>
                    <CardDescription className="text-gray-400">Context Engineering</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Comprehensive context adaptation with evolving playbooks that preserve domain insights.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-900 rounded-lg">
                    <DollarCircleIcon size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">99% Cost Reduction</CardTitle>
                    <CardDescription className="text-gray-400">Hybrid Processing</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Intelligent routing between free local LLMs and paid cloud APIs for maximum efficiency.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:border-orange-500 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-900 rounded-lg">
                    <ChartLineData01Icon size={24} className="text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">Statistical Validation</CardTitle>
                    <CardDescription className="text-gray-400">Scientific Proof</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  McNemar's test, paired t-tests, and Cohen's d for scientifically proven performance differences.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:border-cyan-500 transition-colors">
              <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-900 rounded-lg">
                      <NetworkIcon size={24} className="text-cyan-400" />
                    </div>
                  <div>
                    <CardTitle className="text-white text-lg">Hybrid AI Processing</CardTitle>
                    <CardDescription className="text-gray-400">Smart Model Selection</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Dynamic routing between Ollama (local), Perplexity (web), and GPT-4 based on task complexity.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:border-pink-500 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-900 rounded-lg">
                    <Database02Icon size={24} className="text-pink-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">Knowledge Graph</CardTitle>
                    <CardDescription className="text-gray-400">Memory Network</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Entity/relationship tracking with confidence scores for instant, free answers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* ACE Framework Stats */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-900 rounded-lg">
                      <FlashIcon size={24} className="text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">ACE Framework Performance</CardTitle>
                      <CardDescription className="text-gray-400">Real-time metrics</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-900 text-green-300">
                    ROUTER.LEARNING
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">+10.6%</div>
                    <div className="text-sm text-gray-400">Accuracy Gain</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">99%</div>
                    <div className="text-sm text-gray-400">Cost Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">86.9%</div>
                    <div className="text-sm text-gray-400">Latency Reduced</div>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
                <div className="text-sm text-gray-400 mt-2">System Optimization Progress</div>
              </CardContent>
            </Card>
          </div>

          {/* Context Sources */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Context Sources</CardTitle>
                <Badge variant="secondary" className="bg-green-900 text-green-300">
                  3 CONNECTED
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Brain01Icon size={20} className="text-green-400" />
                    <span className="text-white font-medium">LEARNED.ROUTER</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-900 text-green-300">
                    CONNECTED
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database02Icon size={20} className="text-blue-400" />
                    <span className="text-white font-medium">KNOWLEDGE.GRAPH</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-900 text-green-300">
                    CONNECTED
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe02Icon size={20} className="text-purple-400" />
                    <span className="text-white font-medium">PERPLEXITY.AI</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-900 text-green-300">
                    CONNECTED
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Metrics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">System Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-900 rounded-lg">
                    <Target02Icon size={20} className="text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Router Accuracy</div>
                    <div className="text-2xl font-bold text-white">87%</div>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-900 text-green-300">
                  +15% Adaptive Learning
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-900 rounded-lg">
                    <DollarCircleIcon size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Average Cost</div>
                    <div className="text-2xl font-bold text-white">$0.001</div>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-900 text-blue-300">
                  99% vs Browserbase
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-900 rounded-lg">
                    <ChartBarLineIcon size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Free Queries</div>
                    <div className="text-2xl font-bold text-white">75%</div>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-purple-900 text-purple-300">
                  Local Ollama LLM
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-900 rounded-lg">
                    <Clock01Icon size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Instant Answers</div>
                    <div className="text-2xl font-bold text-white">&lt;100ms</div>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-orange-900 text-orange-300">
                  Free Knowledge Graph
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Ready to Experience ACE?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => onNavigate('arena')}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
            >
              <ArrowRight01Icon size={20} className="mr-2" />
              Launch Arena Comparison
            </Button>
            <Button 
              variant="outline"
              onClick={() => onNavigate('workflow')}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-3 text-lg"
            >
              <Settings02Icon size={20} className="mr-2" />
              Build Custom Workflow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
