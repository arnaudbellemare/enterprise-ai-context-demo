/**
 * Modern Arena UI - Black & White with Hugeicons Duotone
 * Professional minimalist design for Arena comparison
 */

'use client';

import React, { useState } from 'react';
import { 
  CheckmarkBadge02Icon,
  Loading03Icon,
  AlertCircleIcon,
  ArrowRight01Icon,
  DollarCircleIcon,
  Clock01Icon,
  Target02Icon,
  ChartLineData01Icon,
  FireIcon,
  Bitcoin01Icon,
  News01Icon,
  Github01Icon
} from 'hugeicons-react';

interface ModernArenaProps {
  onRunTest: (provider: 'browserbase' | 'ace', task: string) => void;
  results: any;
  isRunning: boolean;
}

export function ModernTaskSelector({ onSelectTask, selectedTask }: any) {
  const tasks = [
    {
      id: 'liquidations',
      label: 'HARD',
      title: 'Crypto Liquidations',
      description: 'Real-time market data extraction',
      example: 'What are the actual crypto liquidations in the last 24 hours?',
      icon: FireIcon
    },
    {
      id: 'crypto',
      label: 'EASY',
      title: 'Crypto Prices',
      description: 'Current cryptocurrency pricing',
      example: 'Get current price of Bitcoin, Ethereum, and Solana',
      icon: Bitcoin01Icon
    },
    {
      id: 'hackernews',
      label: 'MEDIUM',
      title: 'Hacker News',
      description: 'Trending tech discussions',
      example: 'Find top 3 trending technology discussions',
      icon: News01Icon
    },
    {
      id: 'github',
      label: 'MEDIUM',
      title: 'GitHub Analysis',
      description: 'Repository and PR review',
      example: 'Review latest pull requests',
      icon: Github01Icon
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tasks.map((task) => {
        const Icon = task.icon;
        return (
          <button
            key={task.id}
            onClick={() => {
              console.log('🖱️ Button clicked:', task.id);
              onSelectTask(task.id, task.example);
            }}
            className={`group relative overflow-hidden border transition-all duration-300 ${
              selectedTask === task.id
                ? 'border-black bg-black text-white shadow-2xl scale-105'
                : 'border-gray-300 bg-white text-black hover:border-black hover:shadow-xl hover:-translate-y-1'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4 pr-8">
                <Icon 
                  size={32} 
                  className={selectedTask === task.id ? 'text-white' : 'text-black'}
                />
                <span className={`text-xs font-bold tracking-widest ${
                  selectedTask === task.id ? 'text-white' : 'text-gray-900'
                }`}>
                  {task.label}
                </span>
              </div>
              {selectedTask === task.id && (
                <div className="absolute top-2 right-2">
                  <CheckmarkBadge02Icon size={20}  className="text-white" />
                </div>
              )}
              <h3 className={`font-bold text-lg mb-2 ${
                selectedTask === task.id ? 'text-white' : 'text-black'
              }`}>
                {task.title}
              </h3>
              <p className={`text-sm ${
                selectedTask === task.id ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {task.description}
              </p>
            </div>
            
            <div className={`absolute bottom-0 left-0 right-0 h-1 transition-all duration-300 ${
              selectedTask === task.id ? 'bg-white' : 'bg-transparent group-hover:bg-black'
            }`}></div>
          </button>
        );
      })}
    </div>
  );
}

export function ModernExecutionButtons({ onRun, isRunning, disabled }: any) {
  return (
    <div className="space-y-6">
      {/* Run Both Button */}
      <div className="text-center">
        <button
          onClick={() => {
            onRun('browserbase');
            setTimeout(() => onRun('ourSystem'), 1000);
          }}
          disabled={disabled || isRunning}
          className="group relative border-2 border-gray-400 bg-gray-100 px-8 py-4 transition-all duration-300 hover:bg-black hover:text-white hover:border-black hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <ArrowRight01Icon size={20}  className="text-gray-600 group-hover:text-white" />
            <span className="font-bold text-lg tracking-wide">Run Both Systems</span>
          </div>
        </button>
      </div>

      {/* Individual System Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => onRun('browserbase')}
          disabled={disabled || isRunning}
          className="group relative border-2 border-gray-900 bg-white p-8 transition-all duration-300 hover:bg-black hover:text-white hover:shadow-2xl hover:-translate-y-1 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black disabled:hover:translate-y-0"
        >
          <div className="relative z-10">
            <div className="text-xs font-bold tracking-widest text-gray-500 group-hover:text-gray-300 mb-3">
              COMPETITOR
            </div>
            <div className="font-bold text-2xl mb-3">Browserbase Arena</div>
            <div className="text-sm text-gray-600 group-hover:text-gray-300">
              Standard browser automation
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 border-l-2 border-b-2 border-gray-200 group-hover:border-white transition-colors duration-300"></div>
        </button>

        <button
          onClick={() => onRun('ourSystem')}
          disabled={disabled || isRunning}
          className="group relative border-2 border-black bg-black p-8 text-white transition-all duration-300 hover:shadow-2xl hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="relative z-10">
            <div className="text-xs font-bold tracking-widest text-gray-400 mb-3">
              OUR SYSTEM
            </div>
            <div className="font-bold text-2xl mb-3">PERMUTATION</div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        </button>
      </div>
    </div>
  );
}

export function ModernResultsCard({ title, subtitle, result, isCompleted }: any) {
  const isRunning = result.status === 'running';
  const isError = result.status === 'error';
  const isOurSystem = title.includes('ACE');
  
  // Show loading state for idle or running
  if (!isCompleted || isRunning) {
    return (
      <div className="bg-white border-2 border-gray-200 p-8 opacity-40">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-400 mb-1">{title}</h3>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
        <div className="text-center py-12">
          <Loading03Icon size={64}  className="text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-400 font-medium">
            {isRunning ? 'Executing...' : 'Awaiting execution...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border-2 overflow-hidden transform transition-all duration-300 hover:shadow-2xl ${
      isOurSystem ? 'border-black' : 'border-gray-300'
    }`}>
      {/* Header */}
      <div className={`p-6 border-b-2 ${isOurSystem ? 'bg-black text-white border-white' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold mb-1">{title}</h3>
            <p className={`text-sm ${isOurSystem ? 'text-gray-300' : 'text-gray-600'}`}>{subtitle}</p>
          </div>
          <div className={`px-4 py-2 border-2 text-sm font-bold tracking-wide ${
            isError 
              ? 'border-gray-500 text-gray-500'
              : isOurSystem
                ? 'border-white text-white'
                : 'border-black text-black'
          }`}>
            {isError ? 'ERROR' : 'COMPLETED'}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-px bg-gray-200">
        {[
          { value: result.duration + 's', label: 'DURATION', icon: Clock01Icon },
          { value: '$' + result.cost, label: 'COST', icon: DollarCircleIcon },
          { value: result.accuracy + '%', label: 'ACCURACY', icon: Target02Icon },
          { value: result.logs?.length || 0, label: 'STEPS', icon: ArrowRight01Icon }
        ].map((metric, i) => {
          const MetricIcon = metric.icon;
          return (
            <div key={i} className="bg-white p-5 text-center">
              <MetricIcon size={20}  className="text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-black mb-1">{metric.value}</div>
              <div className="text-xs text-gray-600 font-semibold tracking-wider">{metric.label}</div>
            </div>
          );
        })}
      </div>

      {/* Result Content */}
      <div className="p-6 border-t-2 border-gray-200">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-bold tracking-widest text-black">EXECUTION RESULT</h4>
          {result.proofOfExecution && (
            <div className="flex items-center gap-2 px-3 py-1 bg-black text-white text-xs font-bold tracking-wide">
              <CheckmarkBadge02Icon size={16}  className="text-white" />
              VERIFIED
            </div>
          )}
        </div>
        <div className="bg-gray-50 border-2 border-gray-300 p-6 max-h-96 overflow-y-auto">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
            {result.result || 'No result available'}
          </pre>
        </div>
        
        {/* Show logs if available */}
        {result.logs && result.logs.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-bold tracking-wide text-gray-600 hover:text-black">
              VIEW EXECUTION LOGS ({result.logs.length} steps)
            </summary>
            <div className="mt-2 bg-gray-100 border border-gray-300 p-4 max-h-48 overflow-y-auto">
              {result.logs.map((log: string, i: number) => (
                <div key={i} className="text-xs text-gray-700 mb-1 font-mono">
                  {i + 1}. {log}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

export function ModernStatsComparison({ browserbaseResult, aceResult }: any) {
  if (!browserbaseResult || !aceResult || browserbaseResult.status !== 'completed' || aceResult.status !== 'completed') {
    return null;
  }

  const speedDiff = ((browserbaseResult.duration - aceResult.duration) / browserbaseResult.duration * 100).toFixed(1);
  const costReduction = ((browserbaseResult.cost - aceResult.cost) / browserbaseResult.cost * 100).toFixed(1);
  const accuracyGain = aceResult.accuracy - browserbaseResult.accuracy;
  
  const aceWins = parseFloat(costReduction) > 50 && accuracyGain >= 0;

  return (
    <div className="bg-black text-white p-12 mt-8 relative overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10">
        <h2 className="text-4xl font-bold mb-12 text-center tracking-tight">PERFORMANCE ANALYSIS</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center border-2 border-white p-8 transition-all duration-300 hover:bg-white hover:text-black group">
            <Clock01Icon size={48}  className="text-white group-hover:text-black mx-auto mb-4" />
            <div className="text-5xl font-bold mb-3">
              {parseFloat(speedDiff) > 0 ? '+' : ''}{speedDiff}%
            </div>
            <div className="text-sm font-bold tracking-widest mb-2">SPEED DIFFERENCE</div>
            <div className="text-xs opacity-75 font-mono">
              ACE: {aceResult.duration}s / BB: {browserbaseResult.duration}s
            </div>
          </div>

          <div className="text-center border-2 border-white p-8 bg-white text-black">
            <DollarCircleIcon size={48}  className="text-black mx-auto mb-4" />
            <div className="text-5xl font-bold mb-3">
              -{costReduction}%
            </div>
            <div className="text-sm font-bold tracking-widest mb-2">COST REDUCTION</div>
            <div className="text-xs opacity-75 font-mono">
              ACE: ${aceResult.cost} / BB: ${browserbaseResult.cost}
            </div>
          </div>

          <div className="text-center border-2 border-white p-8 transition-all duration-300 hover:bg-white hover:text-black group">
            <Target02Icon size={48}  className="text-white group-hover:text-black mx-auto mb-4" />
            <div className="text-5xl font-bold mb-3">
              {accuracyGain > 0 ? '+' : ''}{accuracyGain}%
            </div>
            <div className="text-sm font-bold tracking-widest mb-2">ACCURACY DIFFERENCE</div>
            <div className="text-xs opacity-75 font-mono">
              ACE: {aceResult.accuracy}% / BB: {browserbaseResult.accuracy}%
            </div>
          </div>
        </div>

        {/* Winner Statement */}
        <div className="text-center border-t-2 border-white pt-8">
          <div className="text-2xl font-bold tracking-tight">
            {aceWins ? (
              <>ACE SYSTEM: SUPERIOR PERFORMANCE & COST EFFICIENCY</>
            ) : (
              <>PERFORMANCE VARIES BY TASK COMPLEXITY</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModernBenchmarkButton({ onClick, isRunning }: any) {
  return (
    <button
      onClick={onClick}
      disabled={isRunning}
      className="group relative border-4 border-black bg-white p-10 text-black shadow-2xl transition-all duration-300 hover:bg-black hover:text-white hover:shadow-black/50 hover:scale-102 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white disabled:hover:text-black w-full"
    >
      <div className="relative z-10">
        <div className="font-bold text-3xl mb-4 tracking-tight">
          {isRunning ? 'RUNNING STATISTICAL BENCHMARK' : 'RUN STATISTICAL BENCHMARK'}
        </div>
        <div className="text-sm mb-6 font-medium">
          Prove superiority with McNemar's test & statistical significance (p &lt; 0.05)
        </div>
        {!isRunning && (
          <div className="flex items-center justify-center gap-6 text-xs font-bold tracking-wider">
            <span className="px-4 py-2 border-2 border-black group-hover:border-white">5 TEST CASES</span>
            <span className="px-4 py-2 border-2 border-black group-hover:border-white">2-5 MINUTES</span>
            <span className="px-4 py-2 border-2 border-black group-hover:border-white">PEER-REVIEWABLE</span>
          </div>
        )}
        {isRunning && (
          <div className="flex justify-center">
            <Loading03Icon size={48}  className="text-black group-hover:text-white animate-spin" />
          </div>
        )}
      </div>
    </button>
  );
}

export function ModernFeatureBadge({ icon, title, value, color = 'purple' }: any) {
  return (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-xl p-4 border border-${color}-200`}>
      <div className="flex items-center gap-3">
        <div className={`text-3xl w-12 h-12 rounded-lg bg-${color}-600 flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <div className={`text-2xl font-bold text-${color}-900`}>{value}</div>
          <div className="text-sm text-gray-700">{title}</div>
        </div>
      </div>
    </div>
  );
}

export function ModernLoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 border-2 border-gray-200 bg-white">
      <Loading03Icon size={96}  className="text-black mb-8 animate-spin" />
      <p className="text-black font-bold text-xl tracking-tight mb-2">{message}</p>
      <p className="text-gray-600 text-sm font-medium tracking-wide">Processing request...</p>
    </div>
  );
}

export function ModernAlertBox({ type, title, message }: any) {
  const styles = {
    success: {
      borderStyle: 'border-black',
      bgStyle: 'bg-white',
      icon: CheckmarkBadge02Icon
    },
    warning: {
      borderStyle: 'border-gray-600',
      bgStyle: 'bg-gray-50',
      icon: AlertCircleIcon
    },
    error: {
      borderStyle: 'border-gray-900',
      bgStyle: 'bg-gray-100',
      icon: AlertCircleIcon
    },
    info: {
      borderStyle: 'border-gray-400',
      bgStyle: 'bg-white',
      icon: ChartLineData01Icon
    }
  };

  const style = styles[type as keyof typeof styles] || styles.info;
  const Icon = style.icon;

  return (
    <div className={`border-l-4 ${style.borderStyle} ${style.bgStyle} border border-gray-300 p-6 mb-4`}>
      <div className="flex items-start gap-4">
        <Icon size={28}  className="text-black flex-shrink-0 mt-1" />
        <div className="flex-1">
          <div className="font-bold text-black text-lg tracking-tight mb-2">{title}</div>
          <div className="text-sm text-gray-700 leading-relaxed">{message}</div>
        </div>
      </div>
    </div>
  );
}
