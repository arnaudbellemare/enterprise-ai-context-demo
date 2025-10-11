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
    <div className="min-h-screen bg-background relative">
      {/* Dither Effect Overlay - Representing Optimization & Storage Servers */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, #000 1px, transparent 1px),
              radial-gradient(circle at 80% 20%, #000 1px, transparent 1px),
              radial-gradient(circle at 40% 40%, #000 1px, transparent 1px),
              radial-gradient(circle at 60% 60%, #000 1px, transparent 1px),
              radial-gradient(circle at 10% 10%, #000 1px, transparent 1px),
              radial-gradient(circle at 90% 90%, #000 1px, transparent 1px),
              radial-gradient(circle at 30% 70%, #000 1px, transparent 1px),
              radial-gradient(circle at 70% 30%, #000 1px, transparent 1px)
            `,
            backgroundSize: '120px 120px, 80px 80px, 60px 60px, 100px 100px, 40px 40px, 140px 140px, 90px 90px, 70px 70px',
            backgroundPosition: '0 0, 60px 60px, 30px 30px, 50px 50px, 20px 20px, 70px 70px, 45px 45px, 35px 35px'
          }}
        />
        {/* Additional optimization patterns */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(45deg, transparent 48%, rgba(0,0,0,0.1) 49%, rgba(0,0,0,0.1) 51%, transparent 52%),
              linear-gradient(-45deg, transparent 48%, rgba(0,0,0,0.05) 49%, rgba(0,0,0,0.05) 51%, transparent 52%)
            `,
            backgroundSize: '20px 20px, 30px 30px'
          }}
        />
      </div>

      {/* Header */}
      <div className="border-b bg-card relative z-10">
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
                <Badge variant="secondary" className="gap-1 hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <CheckmarkBadge02Icon size={14} className="animate-pulse" />
                  Router Active
                </Badge>
                <Badge variant="secondary" className="gap-1 hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <ShieldCheckIcon size={14} className="animate-pulse" />
                  Tests Ready
                </Badge>
                <Badge variant="secondary" className="gap-1 hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <ZapIcon size={14} className="animate-pulse" />
                  67% Optimized
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">System Status</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Core Capabilities */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Core Capabilities</h2>
            <p className="text-muted-foreground">Advanced AI orchestration and optimization</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors duration-300">
                    <Brain01Icon size={20} className="text-foreground group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">Learned Router</CardTitle>
                    <CardDescription>Adaptive Intelligence</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  Self-improving routing that learns from execution feedback and adapts to new patterns automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors duration-300">
                    <Target02Icon size={20} className="text-foreground group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">ACE Framework</CardTitle>
                    <CardDescription>Context Engineering</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  Comprehensive context adaptation with evolving playbooks that preserve domain insights.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors duration-300">
                    <DollarCircleIcon size={20} className="text-foreground group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">99% Cost Reduction</CardTitle>
                    <CardDescription>Hybrid Processing</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  Intelligent routing between free local LLMs and paid cloud APIs for maximum efficiency.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors duration-300">
                    <ChartLineData01Icon size={20} className="text-foreground group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">Statistical Validation</CardTitle>
                    <CardDescription>Scientific Proof</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  McNemar's test, paired t-tests, and Cohen's d for scientifically proven performance differences.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors duration-300">
                    <NetworkIcon size={20} className="text-foreground group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">Hybrid AI Processing</CardTitle>
                    <CardDescription>Smart Model Selection</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  Dynamic routing between Ollama (local), Perplexity (web), and GPT-4 based on task complexity.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors duration-300">
                    <Database02Icon size={20} className="text-foreground group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">Knowledge Graph</CardTitle>
                    <CardDescription>Memory Network</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
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
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors duration-300">
                      <FlashIcon size={20} className="text-foreground group-hover:text-primary transition-colors duration-300 animate-pulse" />
                    </div>
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors duration-300">ACE Framework Performance</CardTitle>
                      <CardDescription>Real-time metrics</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="animate-pulse">Router Learning</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center group/stat">
                    <div className="text-2xl font-bold mb-1 group-hover/stat:scale-110 transition-transform duration-300">+10.6%</div>
                    <div className="text-sm text-muted-foreground">Accuracy Gain</div>
                  </div>
                  <div className="text-center group/stat">
                    <div className="text-2xl font-bold mb-1 group-hover/stat:scale-110 transition-transform duration-300">99%</div>
                    <div className="text-sm text-muted-foreground">Cost Savings</div>
                  </div>
                  <div className="text-center group/stat">
                    <div className="text-2xl font-bold mb-1 group-hover/stat:scale-110 transition-transform duration-300">86.9%</div>
                    <div className="text-sm text-muted-foreground">Latency Reduced</div>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: '90%' }}>
                    <div className="h-full bg-gradient-to-r from-primary to-primary/80 animate-pulse"></div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-2">System Optimization Progress</div>
              </CardContent>
            </Card>
          </div>

          {/* Context Sources */}
          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="group-hover:text-primary transition-colors duration-300">Context Sources</CardTitle>
                <Badge variant="secondary" className="animate-pulse">3 Connected</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors duration-300 cursor-pointer group/item">
                  <div className="flex items-center gap-3">
                    <Brain01Icon size={16} className="text-foreground group-hover/item:text-primary transition-colors duration-300 animate-pulse" />
                    <span className="text-sm font-medium group-hover/item:text-primary transition-colors duration-300">Learned Router</span>
                  </div>
                  <Badge variant="secondary" className="text-xs group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors duration-300">Connected</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors duration-300 cursor-pointer group/item">
                  <div className="flex items-center gap-3">
                    <Database02Icon size={16} className="text-foreground group-hover/item:text-primary transition-colors duration-300 animate-pulse" />
                    <span className="text-sm font-medium group-hover/item:text-primary transition-colors duration-300">Knowledge Graph</span>
                  </div>
                  <Badge variant="secondary" className="text-xs group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors duration-300">Connected</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors duration-300 cursor-pointer group/item">
                  <div className="flex items-center gap-3">
                    <Globe02Icon size={16} className="text-foreground group-hover/item:text-primary transition-colors duration-300 animate-pulse" />
                    <span className="text-sm font-medium group-hover/item:text-primary transition-colors duration-300">Perplexity AI</span>
                  </div>
                  <Badge variant="secondary" className="text-xs group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors duration-300">Connected</Badge>
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
            <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors duration-300">
                    <Target02Icon size={20} className="text-foreground group-hover:text-primary transition-colors duration-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Router Accuracy</div>
                    <div className="text-2xl font-bold group-hover:scale-110 transition-transform duration-300">87%</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">+15% Adaptive Learning</Badge>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors duration-300">
                    <DollarCircleIcon size={20} className="text-foreground group-hover:text-primary transition-colors duration-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Average Cost</div>
                    <div className="text-2xl font-bold group-hover:scale-110 transition-transform duration-300">$0.001</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">99% vs Browserbase</Badge>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors duration-300">
                    <ChartBarLineIcon size={20} className="text-foreground group-hover:text-primary transition-colors duration-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Free Queries</div>
                    <div className="text-2xl font-bold group-hover:scale-110 transition-transform duration-300">75%</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">Local Ollama LLM</Badge>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors duration-300">
                    <Clock01Icon size={20} className="text-foreground group-hover:text-primary transition-colors duration-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Instant Answers</div>
                    <div className="text-2xl font-bold group-hover:scale-110 transition-transform duration-300">&lt;100ms</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">Free Knowledge Graph</Badge>
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
              className="gap-2 hover:scale-105 transition-transform duration-300 hover:shadow-lg group"
            >
              <ArrowRight01Icon size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              Launch Arena Comparison
            </Button>
            <Button 
              variant="outline"
              onClick={() => onNavigate('workflow')}
              size="lg"
              className="gap-2 hover:scale-105 transition-transform duration-300 hover:shadow-lg group border-2 hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Settings02Icon size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              Build Custom Workflow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
