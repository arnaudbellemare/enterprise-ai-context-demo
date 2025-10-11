/**
 * Modern Dashboard - Authentic shadcn/ui + Nuxt UI Design
 * Clean, minimal, and professional with proper spacing and typography
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                ACE Framework
              </h1>
              <p className="text-muted-foreground mt-1">
                Intelligent Orchestration v1.0
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="gap-1">
                  <CheckmarkBadge02Icon size={14} />
                  Router Active
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheckIcon size={14} />
                  Tests Ready
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <ZapIcon size={14} />
                  67% Optimized
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">System Status</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Core Capabilities */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Core Capabilities</h2>
            <p className="text-muted-foreground">Advanced AI orchestration and optimization</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Brain01Icon size={20} className="text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Learned Router</CardTitle>
                    <CardDescription>Adaptive Intelligence</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Self-improving routing that learns from execution feedback and adapts to new patterns automatically.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Target02Icon size={20} className="text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">ACE Framework</CardTitle>
                    <CardDescription>Context Engineering</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Comprehensive context adaptation with evolving playbooks that preserve domain insights.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <DollarCircleIcon size={20} className="text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">99% Cost Reduction</CardTitle>
                    <CardDescription>Hybrid Processing</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Intelligent routing between free local LLMs and paid cloud APIs for maximum efficiency.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <ChartLineData01Icon size={20} className="text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Statistical Validation</CardTitle>
                    <CardDescription>Scientific Proof</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  McNemar's test, paired t-tests, and Cohen's d for scientifically proven performance differences.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <NetworkIcon size={20} className="text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Hybrid AI Processing</CardTitle>
                    <CardDescription>Smart Model Selection</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dynamic routing between Ollama (local), Perplexity (web), and GPT-4 based on task complexity.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Database02Icon size={20} className="text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Knowledge Graph</CardTitle>
                    <CardDescription>Memory Network</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Entity/relationship tracking with confidence scores for instant, free answers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* ACE Framework Stats */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted">
                      <FlashIcon size={20} className="text-foreground" />
                    </div>
                    <div>
                      <CardTitle>ACE Framework Performance</CardTitle>
                      <CardDescription>Real-time metrics</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">Router Learning</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">+10.6%</div>
                    <div className="text-sm text-muted-foreground">Accuracy Gain</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">99%</div>
                    <div className="text-sm text-muted-foreground">Cost Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">86.9%</div>
                    <div className="text-sm text-muted-foreground">Latency Reduced</div>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
                <div className="text-sm text-muted-foreground mt-2">System Optimization Progress</div>
              </CardContent>
            </Card>
          </div>

          {/* Context Sources */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Context Sources</CardTitle>
                <Badge variant="secondary">3 Connected</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Brain01Icon size={16} className="text-foreground" />
                    <span className="text-sm font-medium">Learned Router</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">Connected</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Database02Icon size={16} className="text-foreground" />
                    <span className="text-sm font-medium">Knowledge Graph</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">Connected</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Globe02Icon size={16} className="text-foreground" />
                    <span className="text-sm font-medium">Perplexity AI</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">Connected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Metrics */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">System Metrics</h2>
            <p className="text-muted-foreground">Real-time performance indicators</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-md bg-muted">
                    <Target02Icon size={20} className="text-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Router Accuracy</div>
                    <div className="text-2xl font-bold">87%</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">+15% Adaptive Learning</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-md bg-muted">
                    <DollarCircleIcon size={20} className="text-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Average Cost</div>
                    <div className="text-2xl font-bold">$0.001</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">99% vs Browserbase</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-md bg-muted">
                    <ChartBarLineIcon size={20} className="text-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Free Queries</div>
                    <div className="text-2xl font-bold">75%</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">Local Ollama LLM</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-md bg-muted">
                    <Clock01Icon size={20} className="text-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Instant Answers</div>
                    <div className="text-2xl font-bold">&lt;100ms</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">Free Knowledge Graph</Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight mb-2">Ready to Experience ACE?</h2>
            <p className="text-muted-foreground">Start comparing or building with our framework</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => onNavigate('arena')}
              size="lg"
              className="gap-2"
            >
              <ArrowRight01Icon size={20} />
              Launch Arena Comparison
            </Button>
            <Button 
              variant="outline"
              onClick={() => onNavigate('workflow')}
              size="lg"
              className="gap-2"
            >
              <Settings02Icon size={20} />
              Build Custom Workflow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
